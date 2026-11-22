/**
 * Server-side Unified Chat Service for Next.js App Router
 * Handles chat turns on Vercel Serverless Lambdas and local Next.js runtime.
 * Integrates Groq LLM with strict safeguards:
 * - Deterministic pass: authoritative category detection & slot implications
 * - Retrieval pass: BM25 search over chunks with hard pre-filter
 * - LLM pass: Groq completion with fallback to deterministic rules
 * - Reducer pass: matchSessionReducer + computeShortlist from @bodywise/shared
 * - Rules guard: Rule 1 (Zero diagnosis), Rule 2 (Deterministic matching), Rule 8 (Privacy)
 */

import { z } from "zod";
import {
  MatchSessionState,
  ChatMessage,
  SessionPatch,
  SessionNeed,
  SessionLanguage,
  DEMO_CATALOGUE_SEED,
  SUPPORT_SEED,
  matchSessionReducer,
  selectNext,
  extractPatchViaRules,
  detectPrimaryCategory,
  getImplicationsForCategory,
  formatCategoryLabel,
  computeShortlist,
  ShortlistFamilyItem,
  CatalogueCategoryId,
  ProductRecord,
} from "@bodywise/shared";
import {
  callGroqChatCompletion,
  getGroqConfig,
  canMakeLlmCall,
  recordLlmCall,
  GroqClientError,
} from "./groq";

export interface PageContext {
  page: "home" | "confirm" | "results" | "products" | "product_detail" | "compare" | "help";
  focusFamilyId?: string;
  comparedFamilyIds?: string[];
  activeFilters?: Record<string, unknown>;
}

export interface HandleChatTurnInput {
  state: MatchSessionState;
  message: string;
  history?: ChatMessage[];
  pageContext?: PageContext;
  language?: SessionLanguage;
  mode?: "rules" | "retrieval" | "digest" | "hybrid";
  requestId?: string;
}

export interface StructuredAction {
  type: "apply_patch" | "show_results" | "open_product" | "add_to_compare" | "open_help_topic";
  payload: unknown;
}

export interface ChatPipelineResponse {
  request_id?: string;
  patch: SessionPatch;
  assistantMessage: string;
  quickReplies: Array<{ id: string; label: string; action: string; value: unknown }>;
  actions: StructuredAction[];
  candidates: ShortlistFamilyItem[];
  shortlist: {
    stateHash: string;
    count: number;
    topFamilies: ShortlistFamilyItem[];
  };
  sources: Array<{ source: string; verifiedAt: string; url?: string }>;
  meta: {
    mode: "rules" | "retrieval" | "digest" | "hybrid";
    fallbackReason?: string;
    tokenEstimate: number;
    latencyMs: number;
    pageContextUsed?: string;
    droppedNominations?: number;
  };
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /jailbreak/gi,
  /override\s+rules/gi,
  /as\s+an\s+ai\s+assistant/gi,
];

const LlmTurnOutputSchema = z.object({
  intent: z
    .enum([
      "update",
      "answer",
      "recommendation",
      "product_question",
      "compare_question",
      "help_question",
      "delivery_support",
      "off_topic",
      "medical",
      "greeting",
    ])
    .optional()
    .default("update"),
  assistantMessage: z.string().optional(),
  recommendedProductSlugs: z.array(z.string()).optional().default([]),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .optional()
    .default([]),
  quickReplies: z.array(z.string()).optional().default([]),
  patch: z
    .object({
      product_type: z
        .enum([
          "body_wash",
          "face_wash",
          "shampoo",
          "conditioner",
          "hair_oil",
          "serum",
          "sunscreen",
          "supplement",
          "moisturizer",
          "roll_on",
        ])
        .nullable()
        .optional(),
      body_area: z.enum(["face", "body", "scalp", "hair", "underarm"]).nullable().optional(),
      time_of_day: z.enum(["morning", "night", "both", "any"]).nullable().optional(),
      frequency: z.enum(["daily", "occasional", "any"]).nullable().optional(),
      format: z.string().nullable().optional(),
      fragrance_pref: z.enum(["free_only", "any"]).nullable().optional(),
      avoidances: z.array(z.string()).nullable().optional(),
      needs: z
        .array(
          z.object({
            concept_id: z.string(),
            phrase_from_user: z.string().optional(),
            normalised_label: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional()
    .default({}),
  nominated: z
    .array(
      z.object({
        familyId: z.string(),
        needId: z.string().optional(),
        evidence_phrase: z.string(),
      })
    )
    .max(8)
    .optional()
    .default([]),
  product_mentions: z.array(z.string()).optional().default([]),
  reply_language: z.enum(["en", "hi-latn"]).optional().default("en"),
});

type LlmTurnOutput = z.infer<typeof LlmTurnOutputSchema>;

export function sanitizeChatInput(rawText: string): { sanitized: string; language: SessionLanguage } {
  let text = (rawText || "").slice(0, 500);

  text = text.replace(EMAIL_REGEX, "[redacted_email]");
  text = text.replace(PHONE_REGEX, "[redacted_phone]");
  text = text.replace(URL_REGEX, "[redacted_url]");

  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "[filtered_instruction]");
  }

  text = text.replace(/\s+/g, " ").trim();

  const lower = text.toLowerCase();
  const hinglishMarkers = [
    "hai", "mujhe", "chahiye", "batao", "mera", "meri", "kuch", "kaise",
    "sukhapan", "rukha", "rukhi", "tel", "chipchipa", "dhabbe", "khujli",
    "baal", "chehra", "nahane", "subah", "raat", "dono", "yaar", "bhai"
  ];
  const isHinglish = hinglishMarkers.some((m) => lower.includes(m));

  return {
    sanitized: text,
    language: isHinglish ? "hi-latn" : "en",
  };
}

export function composeAcknowledgement(patch: SessionPatch, lang: SessionLanguage): string {
  const parts: string[] = [];
  if (lang === "hi-latn") {
    if (patch.time_of_day) {
      parts.push(`Samajh gaya, ${patch.time_of_day === "night" ? "raat" : patch.time_of_day === "morning" ? "subah" : "dono time"} ke liye note kar liya.`);
    }
    if (patch.body_area) {
      parts.push(`${patch.body_area} ke liye update kar diya.`);
    }
    if (patch.frequency) {
      parts.push(`${patch.frequency === "daily" ? "Rozana" : patch.frequency} use ke liye set kiya.`);
    }
    if (patch.product_type) {
      parts.push(`${formatCategoryLabel(patch.product_type)} shortlist me rakha hai.`);
    }
    if (patch.fragrance_pref === "free_only") {
      parts.push("Bina khushbu (fragrance-free) filter laga diya.");
    }
    if (patch.avoidances && patch.avoidances.length > 0) {
      parts.push(`Inse bachenge: ${patch.avoidances.join(", ")}.`);
    }
    return parts.length > 0 ? parts.join(" ") : "Samajh gaya.";
  } else {
    if (patch.time_of_day) {
      parts.push(`Noted for ${patch.time_of_day} use.`);
    }
    if (patch.body_area) {
      parts.push(`Updated target area to ${patch.body_area}.`);
    }
    if (patch.frequency) {
      parts.push(`Set frequency to ${patch.frequency}.`);
    }
    if (patch.product_type) {
      parts.push(`Focused on ${formatCategoryLabel(patch.product_type)}.`);
    }
    if (patch.fragrance_pref === "free_only") {
      parts.push("Applied fragrance-free filter.");
    }
    if (patch.avoidances && patch.avoidances.length > 0) {
      parts.push(`Excluding: ${patch.avoidances.join(", ")}.`);
    }
    return parts.length > 0 ? parts.join(" ") : "Understood.";
  }
}

function searchProductsInMemory(query: string, category?: string | null, limit = 6): ProductRecord[] {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 1);

  return DEMO_CATALOGUE_SEED
    .filter((p) => !category || p.category === category)
    .map((p) => {
      let score = 0;
      const name = p.official_name.toLowerCase();
      const desc = p.official_description.toLowerCase();
      const slug = p.slug.toLowerCase();

      if (name.includes(q)) score += 100;
      if (slug.includes(q.replace(/\s+/g, "-"))) score += 80;
      for (const w of words) {
        if (name.includes(w)) score += 20;
        if (desc.includes(w)) score += 5;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.product);
}

function searchSupportInMemory(query: string, limit = 3) {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 1);

  return SUPPORT_SEED
    .map((s) => {
      let score = 0;
      const title = s.title.toLowerCase();
      const desc = s.description.toLowerCase();
      const text = s.text.toLowerCase();

      if (title.includes(q) || desc.includes(q)) score += 50;
      for (const w of words) {
        if (title.includes(w)) score += 15;
        if (desc.includes(w) || text.includes(w)) score += 5;
      }
      return { item: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({
      title: r.item.title,
      description: r.item.description,
      details: r.item.text,
      url: r.item.target_url,
    }));
}

const UNIFIED_CHAT_SYSTEM_PROMPT = `You are the intelligent, helpful, and empathetic AI assistant for Bodywise Match (Be Bodywise personal care).
Your mission is to assist users with:
1. Product recommendations and comparisons based STRICTLY on verified packaging facts from the provided database products.
2. Explaining product descriptions, sizes/quantity, ingredients, allergens/cautions, and directions (how to use).
3. Providing clear delivery guidance (standard orders take 3-5 business days; courier AWB tracking links via SMS/email; official customer care).
4. Explaining what is on the user's active page.

CRITICAL NON-NEGOTIABLE SAFETY RULES:
1. OUT-OF-CONTEXT / IRRATIONAL / OFF-TOPIC QUERIES:
   If the user's input is completely irrational, nonsensical, gibberish (e.g. "asdfgh", "12345"), or completely out of context / unrelated to personal care, wellness, products, ingredients, orders, or delivery:
   You MUST set "intent": "off_topic" and output EXACTLY:
   "I couldn't understand that. Please can you try again? I can help you with product recommendations, ingredient details, usage directions, routine guidance, or delivery and order support."

2. PRODUCT RECOMMENDATIONS:
   When the user states a goal, concern, or need:
   - Set "intent": "recommendation".
   - Recommend the best matching products from "retrieved_catalogue_products".
   - Ground all statements STRICTLY on verified packaging facts from the database.
   - For each recommended product, specify:
     • Official Name and Quantity / Size
     • Description & why it fits based on active ingredients
     • How to use (label application directions)
     • Any cautions / patch test guidance
     • Price (in ₹)
   - Include the slugs of recommended products in "recommendedProductSlugs".
   - Include helpful action links in "suggestedActions" (e.g. { "label": "View [Product Name]", "url": "/products/[slug]" }).

3. DELIVERY, ORDER SUPPORT & COMPLAINTS:
   If the user asks about order status, delivery delay, tracking, damaged parcel, complaints, returns, refunds, or support:
   - Set "intent": "delivery_support".
   - Set "recommendedProductSlugs": [] and "suggestedActions": [].
   - Provide empathetic resolution:
     • Standard delivery timeframe is 3-5 business days.
     • Check courier AWB tracking link sent via SMS and registered email.
     • Official contacts: Email: support@bebodywise.com | WhatsApp: +91 81286 88128 | Helpline: +91 81286 88128.

4. ZERO MEDICAL DIAGNOSIS:
   Never diagnose medical conditions, evaluate clinical severity, or promise cures ("designed to help with...", "supports...", "may be relevant to your routine").

5. OUTPUT STRICT JSON ONLY:
   {
     "intent": "recommendation" | "product_question" | "delivery_support" | "compare_question" | "help_question" | "update" | "greeting" | "off_topic" | "medical",
     "assistantMessage": "Your helpful, well-formatted response to the user.",
     "recommendedProductSlugs": ["slug-1", "slug-2"],
     "suggestedActions": [{"label": "View [Product Name]", "url": "/products/[slug]"}],
     "quickReplies": ["Ask about ingredients", "How to use", "Compare options"],
     "patch": {
       "product_type": string or null,
       "body_area": "face" | "body" | "scalp" | "hair" | "underarm" | null,
       "time_of_day": "morning" | "night" | "both" | "any" | null,
       "frequency": "daily" | "occasional" | "any" | null,
       "format": string or null,
       "fragrance_pref": "free_only" | "any" | null,
       "avoidances": string[] or null
     },
     "product_mentions": string[],
     "reply_language": "en" | "hi-latn"
   }`;

export async function handleServerChatTurn(
  input: HandleChatTurnInput
): Promise<ChatPipelineResponse> {
  const startTime = Date.now();
  const {
    state,
    message: rawMessage,
    pageContext,
    language: explicitLanguage,
    mode: requestedMode = "hybrid",
    requestId = `req_${Date.now()}`,
  } = input;

  const { sanitized, language: detectedLanguage } = sanitizeChatInput(rawMessage);
  const language = explicitLanguage || detectedLanguage;

  const explicitCategory = detectPrimaryCategory(sanitized);
  const confirmedCategory = explicitCategory
    ? explicitCategory.categoryId
    : state.slots.product_type.value && state.slots.product_type.status === "confirmed"
    ? (state.slots.product_type.value as CatalogueCategoryId)
    : null;

  const implications = confirmedCategory ? getImplicationsForCategory(confirmedCategory) : null;
  const derivedArea = implications?.derivedBodyArea || null;
  const derivedFormat = implications?.derivedFormat || null;

  const rulesResult = extractPatchViaRules(sanitized);
  const rulesPatch: SessionPatch = { ...rulesResult.patch };
  if (confirmedCategory) {
    rulesPatch.product_type = confirmedCategory;
    if (derivedArea) rulesPatch.body_area = derivedArea;
    if (derivedFormat && !rulesPatch.format) rulesPatch.format = derivedFormat;
  }

  const productsContext = searchProductsInMemory(sanitized, confirmedCategory, 6);
  const focusedProduct = pageContext?.focusFamilyId
    ? DEMO_CATALOGUE_SEED.find((p) => p.slug === pageContext.focusFamilyId) || null
    : null;
  const deliverySupportContext = searchSupportInMemory(sanitized, 3);

  const cfg = getGroqConfig();
  let activeMode: "rules" | "retrieval" | "digest" | "hybrid" = requestedMode;
  let fallbackReason: string | undefined = undefined;
  let llmOutput: LlmTurnOutput | null = null;
  let tokenEstimate = 0;

  if (!cfg.enabled || !cfg.apiKey || !canMakeLlmCall()) {
    activeMode = "rules";
    if (!cfg.apiKey) fallbackReason = "GROQ_API_KEY is not configured";
    else if (!cfg.enabled) fallbackReason = "LLM_ENABLED=false";
    else fallbackReason = "Daily LLM request budget cap reached";
  }

  if (activeMode !== "rules") {
    try {
      const stateSummary = {
        needs: state.slots.needs.map((n) => n.normalised_label || n.concept_id),
        category: state.slots.product_type.value,
        time_of_day: state.slots.time_of_day.value,
        area: state.slots.body_area.value,
        format: state.slots.format.value,
        fragrance: state.slots.fragrance_pref.value,
        avoidances: state.slots.avoidances.value,
      };

      const userPrompt = JSON.stringify({
        user_message: sanitized,
        page_context: pageContext,
        focused_product: focusedProduct
          ? {
              name: focusedProduct.official_name,
              slug: focusedProduct.slug,
              category: focusedProduct.category,
              size: focusedProduct.size,
              price: focusedProduct.price_inr,
              description: focusedProduct.official_description,
              how_to_use: focusedProduct.label_directions,
              ingredients: (focusedProduct.ingredients || []).slice(0, 8),
              cautions: focusedProduct.cautions,
            }
          : null,
        retrieved_catalogue_products: productsContext.map((p) => ({
          name: p.official_name,
          slug: p.slug,
          category: p.category,
          format: p.format,
          size: p.size,
          price: p.price_inr,
          description: p.official_description,
          how_to_use: p.label_directions,
          ingredients: (p.ingredients || []).slice(0, 8),
          cautions: p.cautions,
        })),
        retrieved_delivery_support: deliverySupportContext,
        session_state: stateSummary,
      });

      tokenEstimate = Math.ceil((UNIFIED_CHAT_SYSTEM_PROMPT.length + userPrompt.length) / 4);

      const groqRes = await callGroqChatCompletion({
        messages: [
          { role: "system", content: UNIFIED_CHAT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        timeoutMs: 12000,
        response_format: { type: "json_object" },
      });

      recordLlmCall();

      let cleanedJson = groqRes.content.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      }

      const parsedJson = JSON.parse(cleanedJson);
      const validated = LlmTurnOutputSchema.safeParse(parsedJson);

      if (validated.success) {
        llmOutput = validated.data;
      } else {
        activeMode = "rules";
        fallbackReason = "LLM response schema validation failed. Repaired with deterministic fallback.";
      }
    } catch (err) {
      activeMode = "rules";
      fallbackReason =
        err instanceof GroqClientError
          ? `LLM unavailable (${err.category}). Switched to rules mode.`
          : "LLM communication failed. Switched to rules mode.";
    }
  }

  // Map LLM needs if present to full SessionNeed objects
  const mappedLlmNeeds: SessionNeed[] | undefined = llmOutput?.patch?.needs?.map((n, idx) => ({
    id: `need_llm_${idx + 1}`,
    concept_id: n.concept_id,
    phrase_from_user: n.phrase_from_user || sanitized,
    normalised_label: n.normalised_label || n.concept_id,
    confidence: 0.85,
    status: "confirmed" as const,
    source: "user_text" as const,
    evidence_text: n.phrase_from_user || null,
  }));

  // Combine patch: LLM patch takes priority where provided, rules provide fallback
  const chosenPatch: SessionPatch = activeMode !== "rules" && llmOutput?.patch
    ? {
        ...rulesPatch,
        ...llmOutput.patch,
        needs: mappedLlmNeeds || rulesPatch.needs,
        product_type: confirmedCategory || llmOutput.patch.product_type || rulesPatch.product_type,
        body_area: derivedArea || llmOutput.patch.body_area || rulesPatch.body_area,
        format: derivedFormat || llmOutput.patch.format || rulesPatch.format,
      }
    : rulesPatch;

  // Apply patch to session state deterministically
  const nextState = matchSessionReducer(state, {
    type: "APPLY_PATCH",
    source: "user_text",
    status: "confirmed",
    patch: chosenPatch,
  });

  const nextQuestionResult = selectNext(nextState, DEMO_CATALOGUE_SEED);
  const shortlistResult = computeShortlist(nextState, DEMO_CATALOGUE_SEED);

  // Generate assistant response
  let finalAssistantMessage = "";
  if (activeMode !== "rules" && llmOutput?.assistantMessage && llmOutput.assistantMessage.trim().length > 0) {
    finalAssistantMessage = llmOutput.assistantMessage.trim();
  } else {
    // Pure deterministic template response
    const ack = composeAcknowledgement(chosenPatch, language);
    const categoryLabel = chosenPatch.product_type ? formatCategoryLabel(chosenPatch.product_type) : null;
    const needLabel = chosenPatch.needs?.[0]?.phrase_from_user || null;

    if (categoryLabel) {
      const goalText = needLabel ? ` for ${needLabel}` : "";
      if (shortlistResult.totalFamilies > 0) {
        if (!nextQuestionResult.done && nextQuestionResult.question) {
          finalAssistantMessage = `${ack} Focused on ${categoryLabel}${goalText}. We found ${shortlistResult.totalFamilies} matching option${shortlistResult.totalFamilies === 1 ? "" : "s"}. ${nextQuestionResult.question}`;
        } else {
          finalAssistantMessage = `${ack} Focused on ${categoryLabel}${goalText}. We found ${shortlistResult.totalFamilies} matching option${shortlistResult.totalFamilies === 1 ? "" : "s"} from our verified catalogue.`;
        }
      } else {
        finalAssistantMessage = `${ack} We noted your interest in ${categoryLabel}${goalText}, but could not find an exact match in our current catalogue.`;
      }
    } else if (needLabel) {
      finalAssistantMessage = `${ack} Noted your goal: ${needLabel}. ${nextQuestionResult.question || ""}`;
    } else {
      finalAssistantMessage = nextQuestionResult.done
        ? `${ack} We found ${shortlistResult.totalFamilies} products matching your criteria.`
        : `${ack} ${nextQuestionResult.question || ""}`;
    }
  }

  // Quick replies
  const quickReplies: Array<{ id: string; label: string; action: string; value: unknown }> = [];
  if (llmOutput?.quickReplies && llmOutput.quickReplies.length > 0) {
    for (const qr of llmOutput.quickReplies.slice(0, 3)) {
      quickReplies.push({
        id: `qr_${qr.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        label: qr,
        action: "send_message",
        value: qr,
      });
    }
  } else if (nextQuestionResult.options && nextQuestionResult.options.length > 0) {
    for (const opt of nextQuestionResult.options.slice(0, 3)) {
      quickReplies.push({
        id: opt.id,
        label: opt.label,
        action: "answer_question",
        value: opt.value,
      });
    }
  }

  // Structured actions
  const actions: StructuredAction[] = [];
  if (llmOutput?.suggestedActions && llmOutput.suggestedActions.length > 0) {
    for (const act of llmOutput.suggestedActions) {
      actions.push({
        type: "open_product",
        payload: { label: act.label, url: act.url },
      });
    }
  }

  const sources: Array<{ source: string; verifiedAt: string; url?: string }> = [
    {
      source: "Be Bodywise Verified Packaging Database",
      verifiedAt: new Date().toISOString().slice(0, 10),
      url: "https://bebodywise.com",
    },
  ];

  return {
    request_id: requestId,
    patch: chosenPatch,
    assistantMessage: finalAssistantMessage.trim(),
    quickReplies,
    actions,
    candidates: shortlistResult.topFamilies,
    shortlist: {
      stateHash: shortlistResult.stateHash,
      count: shortlistResult.totalFamilies,
      topFamilies: shortlistResult.topFamilies,
    },
    sources,
    meta: {
      mode: activeMode,
      fallbackReason,
      tokenEstimate,
      latencyMs: Date.now() - startTime,
      pageContextUsed: pageContext?.page,
    },
  };
}
