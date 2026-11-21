/**
 * Unified Chat + Knowledge Pipeline for Bodywise Match
 * Single entrypoint `handleChatTurn` used by POST /v1/chat and all legacy wrappers.
 *
 * Implements:
 * 1. Sanitisation (max length, redact PII, neutralize injections) + Language Detection
 * 2. Deterministic pass: authoritative category detection, slot implications, evidence-consistency guard
 * 3. Retrieval pass: BM25 search over chunks with hard pre-filter (zero leakage)
 * 4. LLM pass: Groq / Mocked caller, fallback chain (digest -> hybrid -> retrieval -> rules)
 * 5. Validation: verify family existence, hard category match, verbatim evidence phrase check
 * 6. Shared reducer application + computeShortlist with bounded nomination bonus
 * 7. Template-based assistant message composition (medical disclaimers, product facts, comparisons, support)
 * 8. Structured actions & response contract
 */

import { z } from "zod";
import {
  MatchSessionState,
  ChatMessage,
  SessionPatch,
  SessionLanguage,
  DEMO_CATALOGUE_SEED,
  matchSessionReducer,
  selectNext,
  extractPatchViaRules,
  detectPrimaryCategory,
  getImplicationsForCategory,
  formatCategoryLabel,
  computeShortlist,
  ShortlistFamilyItem,
  ShortlistResult,
  SessionNeed,
  SlotStatus,
  EventSource,
  DIGEST_SEED,
  CHUNKS_SEED,
  search,
  FamilyDigestEntry,
  CatalogueCategoryId,
} from "@bodywise/shared";
import { callGroqChatCompletion, GroqClientError } from "../llm/groqClient";
import { canMakeLlmCall, recordLlmCall } from "../llm/dailyCap";
import {
  searchCatalogueProducts,
  getCatalogueProductBySlug,
  searchDeliverySupportKnowledge,
} from "../db/sqliteCatalogue";

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
  llmCaller?: (prompt: string, systemPrompt: string) => Promise<string>;
}

export interface StructuredAction {
  type: "apply_patch" | "show_results" | "open_product" | "add_to_compare" | "open_help_topic";
  payload: unknown;
}

export interface ChatPipelineResponse {
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

// Regex for PII sanitization (Rule 8)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

// Prompt injection neutralizer cues
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /jailbreak/gi,
  /override\s+rules/gi,
  /as\s+an\s+ai\s+assistant/gi,
];

// Zod schema for validated LLM turn response
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

export type LlmTurnOutput = z.infer<typeof LlmTurnOutputSchema>;

/**
 * Step 1: Input sanitization & Language Detection
 */
export function sanitizeChatInput(rawText: string): { sanitized: string; language: SessionLanguage } {
  let text = (rawText || "").slice(0, 500);

  // Strip PII
  text = text.replace(EMAIL_REGEX, "[redacted_email]");
  text = text.replace(PHONE_REGEX, "[redacted_phone]");
  text = text.replace(URL_REGEX, "[redacted_url]");

  // Neutralize prompt injection attempts
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "[filtered_instruction]");
  }

  text = text.replace(/\s+/g, " ").trim();

  // Detect Hinglish markers
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

/**
 * Step 7: Acknowledgment builder from templates
 */
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

/**
 * Step 5: Nomination Validator
 * Dropping rules:
 * 1. familyId must exist in the catalogue
 * 2. family category must match hard-filter category
 * 3. evidence_phrase must appear verbatim / normalised substring in family's digest/chunk text
 */
export function validateNominations(
  nominations: Array<{ familyId: string; needId?: string; evidence_phrase: string }>,
  hardCategory: string | null
): {
  valid: Array<{ familyId: string; needId?: string; evidence_phrase: string }>;
  droppedCount: number;
} {
  const valid: Array<{ familyId: string; needId?: string; evidence_phrase: string }> = [];
  let droppedCount = 0;

  for (const nom of nominations) {
    const fam = DIGEST_SEED.find((f) => f.familyId === nom.familyId);
    if (!fam) {
      droppedCount++;
      continue;
    }

    // Category hard filter check
    if (hardCategory && fam.category !== hardCategory) {
      droppedCount++;
      continue;
    }

    // Evidence phrase check in digest or chunks
    const phrase = (nom.evidence_phrase || "").trim().toLowerCase();
    if (!phrase || phrase.length < 3) {
      droppedCount++;
      continue;
    }

    const famChunks = CHUNKS_SEED.filter((c) => c.familyId === nom.familyId);
    const combinedText = (
      fam.name + " " + fam.summary + " " + famChunks.map((c) => c.text).join(" ")
    ).toLowerCase();

    if (!combinedText.includes(phrase)) {
      droppedCount++;
      continue;
    }

    valid.push(nom);
  }

  return { valid, droppedCount };
}

/**
 * SYSTEM PROMPT for LLM pass
 */
const UNIFIED_CHAT_SYSTEM_PROMPT = `You are the intelligent, helpful, and empathetic AI assistant for Bodywise Match (Be Bodywise personal care).
Your mission is to assist users with:
1. Product recommendations and comparisons based STRICTLY on verified packaging facts from the provided database products.
2. Explaining product descriptions, sizes/quantity, ingredients, allergens/cautions, and directions (how to use).
3. Providing clear delivery guidance (standard orders take 3-5 business days; courier AWB tracking links via SMS/email; official customer care).
4. Explaining what is on the user's active page.

CRITICAL NON-NEGOTIABLE SAFETY RULES:
1. OUT-OF-CONTEXT / IRRATIONAL / OFF-TOPIC QUERIES:
   If the user's input is completely irrational, nonsensical, gibberish (e.g. "asdfgh", "12345"), or completely out of context / unrelated to personal care, wellness, products, ingredients, orders, or delivery (e.g. asking about history, quantum physics, coding, recipes, outer space):
   You MUST set "intent": "off_topic" and output EXACTLY:
   "I couldn't understand that. Please can you try again? I can help you with product recommendations, ingredient details, usage directions, routine guidance, or delivery and order support."
   Do NOT attempt to invent answers for out-of-context queries.

2. PRODUCT RECOMMENDATIONS:
   When the user states a goal, concern, or need (e.g. "i want relief from dandruff", "need a body wash for rough bumps", "sunscreen for oily skin"):
   - Set "intent": "recommendation".
   - Recommend the best matching products from "retrieved_catalogue_products".
   - Ground all statements STRICTLY on verified packaging facts from the database.
   - For each recommended product, specify:
     • Official Name and Quantity / Size (e.g. 150ml or 250ml)
     • Description & why it fits based on active ingredients
     • How to use (label application directions)
     • Any cautions / patch test / allergen guidance
     • Price (in ₹)
   - Include the slugs of recommended products in "recommendedProductSlugs".
   - Include helpful action links in "suggestedActions" (e.g. { "label": "View [Product Name]", "url": "/products/[slug]" }).

3. DELIVERY, ORDER SUPPORT & COMPLAINTS:
   If the user asks about order status, delivery delay, tracking, damaged parcel, complaints (e.g. "mujhe complaint karni hai"), returns, refunds, or customer support:
   - Set "intent": "delivery_support".
   - You MUST NOT recommend products! Set "recommendedProductSlugs": [] and "suggestedActions": [].
   - Provide empathetic resolution:
     • Standard delivery timeframe is 3-5 business days.
     • Check courier AWB tracking link sent via SMS and registered email.
     • Provide official grievance / support contacts:
       Email: support@bebodywise.com | WhatsApp: +91 81286 88128 | Helpline: +91 81286 88128 (Mon-Sat 9AM-6PM).

4. ZERO MEDICAL DIAGNOSIS:
   Never diagnose medical conditions, evaluate clinical severity, or promise cures ("designed to help with...", "supports...", "may be relevant to your routine").

5. OUTPUT STRICT JSON ONLY:
   {
     "intent": "recommendation" | "product_question" | "delivery_support" | "compare_question" | "help_question" | "update" | "greeting" | "off_topic" | "medical",
     "assistantMessage": "Your helpful, well-formatted response to the user. Use clear paragraphs or bullet points.",
     "recommendedProductSlugs": ["slug-1", "slug-2"],
     "suggestedActions": [
       { "label": "View [Product Name]", "url": "/products/[slug]" }
     ],
     "quickReplies": ["Ask about ingredients", "How to use", "Compare options"],
     "patch": {
       "product_type": string or null,
       "body_area": "face" | "body" | "scalp" | "hair" | "underarm" | null,
       "time_of_day": "morning" | "night" | "both" | "any" | null,
       "frequency": "daily" | "occasional" | "any" | null,
       "format": string or null,
       "fragrance_pref": "free_only" | "any" | null,
       "avoidances": string[] or null,
       "needs": [{"concept_id": string, "phrase_from_user": string, "normalised_label": string}]
     },
     "nominated": [{"familyId": string, "needId": string, "evidence_phrase": string}],
     "product_mentions": string[],
     "reply_language": "en" | "hi-latn"
   }`;

/**
 * Core unified turn processor.
 */
export async function handleChatTurn(input: HandleChatTurnInput): Promise<ChatPipelineResponse> {
  const startTime = Date.now();
  const {
    state,
    message: rawMessage,
    pageContext,
    language: explicitLanguage,
    mode: requestedMode = (process.env.CHAT_MODE as "rules" | "retrieval" | "digest" | "hybrid") || "hybrid",
    llmCaller,
  } = input;

  // 1. Sanitisation & Language Detection
  const { sanitized, language: detectedLanguage } = sanitizeChatInput(rawMessage);
  const language = explicitLanguage || detectedLanguage;

  // 2. Deterministic Pass
  // Category detection (Authoritative longest match)
  const explicitCategory = detectPrimaryCategory(sanitized);
  const confirmedCategory = explicitCategory
    ? explicitCategory.categoryId
    : state.slots.product_type.value && state.slots.product_type.status === "confirmed"
    ? (state.slots.product_type.value as CatalogueCategoryId)
    : null;

  // Derive body area & format implications from authoritative category
  const implications = confirmedCategory ? getImplicationsForCategory(confirmedCategory) : null;
  const derivedArea = implications?.derivedBodyArea || null;
  const derivedFormat = implications?.derivedFormat || null;

  // Deterministic rules patch
  const rulesResult = extractPatchViaRules(sanitized);
  const rulesPatch: SessionPatch = { ...rulesResult.patch };
  if (confirmedCategory) {
    rulesPatch.product_type = confirmedCategory;
    if (derivedArea) rulesPatch.body_area = derivedArea;
    if (derivedFormat && !rulesPatch.format) rulesPatch.format = derivedFormat;
  }

  // 2b. Persistent SQLite Database Query Pass
  const sqliteProducts = searchCatalogueProducts(sanitized, {
    category: confirmedCategory || undefined,
    limit: 6,
  });

  const focusedProduct = pageContext?.focusFamilyId
    ? getCatalogueProductBySlug(pageContext.focusFamilyId)
    : null;

  const sqliteDeliverySupport = searchDeliverySupportKnowledge(sanitized, 3);

  // 3. Retrieval Pass (BM25 over chunks)
  const retrievalFilter = {
    category: confirmedCategory || undefined,
    fragrance: state.slots.fragrance_pref.value === "free_only" ? "free_only" : undefined,
  };

  const retrievedCandidates = search({
    query: sanitized,
    filters: retrievalFilter,
    collection: "products",
    k: 20,
  });

  // 4. LLM Pass with Fallback Chain
  let activeMode: "rules" | "retrieval" | "digest" | "hybrid" = requestedMode;
  let fallbackReason: string | undefined = undefined;
  let llmOutput: LlmTurnOutput | null = null;
  let tokenEstimate = 0;

  if (activeMode !== "rules") {
    // Check daily cap
    const capOk = canMakeLlmCall();
    if (!capOk) {
      activeMode = "rules";
      fallbackReason = "Daily LLM request budget cap reached. Basic rules mode active.";
    }
  }

  if (activeMode !== "rules") {
    try {
      // Build candidate digest subset based on mode
      let digestSubset: FamilyDigestEntry[] = DIGEST_SEED;

      if (activeMode === "hybrid") {
        if (retrievedCandidates.length > 0) {
          const candidateFamilyIds = new Set(retrievedCandidates.map((c) => c.familyId));
          digestSubset = DIGEST_SEED.filter((d) => candidateFamilyIds.has(d.familyId));
        } else if (confirmedCategory) {
          digestSubset = DIGEST_SEED.filter((d) => d.category === confirmedCategory);
        }
      }

      // Compact representation of digest lines for LLM context
      const digestContext = digestSubset.map((d) => ({
        familyId: d.familyId,
        name: d.name,
        category: d.category,
        area: d.area,
        format: d.format,
        concepts: d.concepts,
        summary: d.summary,
      }));

      const stateSummary = {
        category: confirmedCategory,
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
              ingredients: focusedProduct.ingredients.slice(0, 8),
              cautions: focusedProduct.cautions,
            }
          : null,
        retrieved_catalogue_products: sqliteProducts.map((p) => ({
          name: p.official_name,
          slug: p.slug,
          category: p.category,
          format: p.format,
          size: p.size,
          price: p.price_inr,
          description: p.official_description,
          how_to_use: p.label_directions,
          ingredients: p.ingredients.slice(0, 8),
          cautions: p.cautions,
        })),
        retrieved_delivery_support: sqliteDeliverySupport.map((s) => ({
          title: s.title,
          description: s.description,
          details: s.text,
          url: s.target_url,
        })),
        session_state: stateSummary,
        digest: digestContext,
      });

      tokenEstimate = Math.ceil((UNIFIED_CHAT_SYSTEM_PROMPT.length + userPrompt.length) / 4);

      let rawLlmResponse: string;

      if (llmCaller) {
        rawLlmResponse = await llmCaller(userPrompt, UNIFIED_CHAT_SYSTEM_PROMPT);
      } else {
        const groqRes = await callGroqChatCompletion({
          messages: [
            { role: "system", content: UNIFIED_CHAT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0,
          timeoutMs: 12000,
          response_format: { type: "json_object" },
        });
        rawLlmResponse = groqRes.content;
        recordLlmCall();
      }

      // Tolerant Parsing: strip markdown fences
      let cleanedJson = rawLlmResponse.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      }

      const parsedJson = JSON.parse(cleanedJson);
      const validated = LlmTurnOutputSchema.safeParse(parsedJson);

      if (validated.success) {
        llmOutput = validated.data;
      } else {
        // Repair attempt: extract patch via tolerant parser
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
  const mappedLlmNeeds: SessionNeed[] | undefined = llmOutput?.patch.needs?.map((n, idx) => ({
    id: `need_llm_${idx + 1}`,
    concept_id: n.concept_id,
    phrase_from_user: n.phrase_from_user || sanitized,
    normalised_label: n.normalised_label || n.concept_id,
    confidence: 0.85,
    status: "confirmed" as SlotStatus,
    source: "user_text" as EventSource,
    evidence_text: n.phrase_from_user || null,
  }));

  // 5. Merge Patch & Validate Nominations
  const finalPatch: SessionPatch = {
    ...rulesPatch,
    ...(llmOutput?.patch ? {
      ...llmOutput.patch,
      needs: mappedLlmNeeds || rulesPatch.needs,
    } : {}),
  };

  // Re-assert deterministic category if detected or confirmed
  if (confirmedCategory) {
    finalPatch.product_type = confirmedCategory;
    if (derivedArea) finalPatch.body_area = derivedArea;
  }

  // Validate nominations against hard filters and verbatim evidence
  const rawNominations = llmOutput?.nominated || [];
  const { valid: validNominations, droppedCount } = validateNominations(rawNominations, confirmedCategory);

  // 6. Apply Patch to Session State & Compute Shortlist
  const nextState = matchSessionReducer(state, {
    type: "APPLY_PATCH",
    source: "user_text",
    status: "confirmed",
    patch: finalPatch,
  });

  const shortlist: ShortlistResult = computeShortlist(nextState, DEMO_CATALOGUE_SEED, validNominations);

  // 7. Compose Assistant Message from LLM or SQLite Database
  let assistantMessage = "";
  const sources: Array<{ source: string; verifiedAt: string; url?: string }> = [];
  const intent = llmOutput?.intent || "update";

  const lowerText = sanitized.toLowerCase();
  const isGreeting =
    intent === "greeting" ||
    /^(hi|hello|hey|namaste|namaskar|good\s*(morning|afternoon|evening)|yo|hola|kaise\s*ho)\b/i.test(sanitized.trim());

  const isSupportOrComplaint =
    intent === "delivery_support" ||
    intent === "help_question" ||
    pageContext?.page === "help" ||
    lowerText.includes("complaint") ||
    lowerText.includes("shikayat") ||
    lowerText.includes("complain") ||
    lowerText.includes("problem") ||
    lowerText.includes("issue") ||
    lowerText.includes("order") ||
    lowerText.includes("delivery") ||
    lowerText.includes("courier") ||
    lowerText.includes("tracking") ||
    lowerText.includes("parcel") ||
    lowerText.includes("package") ||
    lowerText.includes("refund") ||
    lowerText.includes("return") ||
    lowerText.includes("exchange") ||
    lowerText.includes("cancel") ||
    lowerText.includes("damaged") ||
    lowerText.includes("broken") ||
    lowerText.includes("kharab") ||
    lowerText.includes("tuta") ||
    lowerText.includes("wrong product") ||
    lowerText.includes("wrong item") ||
    lowerText.includes("galat") ||
    lowerText.includes("late") ||
    lowerText.includes("delay") ||
    lowerText.includes("helpline") ||
    lowerText.includes("customer care") ||
    lowerText.includes("support");

  const hasProductInterest =
    !isSupportOrComplaint &&
    !isGreeting &&
    intent !== "off_topic" &&
    (
      intent === "recommendation" ||
      intent === "product_question" ||
      intent === "compare_question" ||
      Boolean(confirmedCategory) ||
      Boolean(rulesPatch.product_type) ||
      Boolean(rulesPatch.needs && rulesPatch.needs.length > 0) ||
      Boolean(llmOutput?.recommendedProductSlugs && llmOutput.recommendedProductSlugs.length > 0)
    );

  const isMedical =
    intent === "medical" ||
    lowerText.includes("cure") ||
    lowerText.includes("infection") ||
    lowerText.includes("eczema") ||
    lowerText.includes("psoriasis") ||
    lowerText.includes("prescription") ||
    lowerText.includes("dermatitis") ||
    lowerText.includes("fungal") ||
    lowerText.includes("hives") ||
    lowerText.includes("allergy") ||
    lowerText.includes("disease") ||
    lowerText.includes("remedy") ||
    lowerText.includes("medicine") ||
    lowerText.includes("doctor");

  if (intent === "off_topic") {
    assistantMessage =
      "I couldn't understand that. Please can you try again? I can help you with product recommendations, ingredient details, usage directions, routine guidance, or delivery and order support.";
  } else if (isSupportOrComplaint) {
    if (llmOutput?.assistantMessage && llmOutput.assistantMessage.trim().length > 0) {
      assistantMessage = llmOutput.assistantMessage.trim();
    } else {
      assistantMessage = language === "hi-latn"
        ? "Hum samajhte hain ki aapko complaint ya order ke sath dikkat hai. Standard delivery mein 3-5 business days lagte hain aur courier AWB tracking link aapke SMS/email par bheja gaya hai. Hamari official support team se turant madad ke liye:\n• Email: support@bebodywise.com\n• WhatsApp: +91 81286 88128\n• Helpline: +91 81286 88128 (Mon-Sat 9AM-6PM)"
        : "I understand you want to register a complaint or need assistance with your order. Standard delivery takes 3-5 business days, and real-time updates are sent via your courier AWB tracking link. For immediate support and complaint resolution, our team is available at:\n• Email: support@bebodywise.com\n• WhatsApp: +91 81286 88128\n• Helpline: +91 81286 88128 (Mon-Sat 9AM-6PM)";
    }
  } else if (isGreeting) {
    assistantMessage = language === "hi-latn"
      ? "Namaste! Batayein aapko kaunse skin, hair, ya body product ke liye help chahiye?"
      : "Hello! Tell me what body, hair, or skin care goal you're looking for, and I'll find matching options from our verified catalogue.";
  } else if (isMedical) {
    assistantMessage = language === "hi-latn"
      ? "Hum bimari ya doctori ilaaj nahi batate. Kisi gehre skin reaction ke liye qualified dermatologist se milein. Personal care catalogue se ye gentle options fit ho sakte hain:"
      : "We don't provide medical diagnosis or treatment plans. For persistent rashes or clinical skin concerns, please consult a qualified healthcare professional. Here are cosmetic options that fit your preferences:";
  } else if (hasProductInterest && llmOutput?.assistantMessage && llmOutput.assistantMessage.trim().length > 0) {
    // Rich response directly generated from SQLite product context by Groq LLM
    assistantMessage = llmOutput.assistantMessage.trim();
  } else if (hasProductInterest && sqliteProducts.length > 0) {
    // Deterministic SQLite recommendation fallback
    const top = sqliteProducts[0];
    assistantMessage = `Based on your request, here is a verified option from our catalogue:\n\n**${top.official_name}** (${top.size}) — ₹${top.price_inr ?? "N/A"}\n• Description: ${top.official_description}\n• How to use: ${top.label_directions}\n${top.cautions ? `• Caution: ${top.cautions.join("; ")}\n` : ""}• Key Ingredients: ${top.ingredients.slice(0, 4).join(", ")}`;
  } else if (hasProductInterest) {
    // Standard Update / Answer turn
    const ack = composeAcknowledgement(finalPatch, language);
    const nextQ = selectNext(nextState, DEMO_CATALOGUE_SEED);

    if (!nextQ.done && nextQ.question) {
      assistantMessage = `${ack} ${nextQ.question}`;
    } else {
      assistantMessage = `${ack} You're all set! We found ${shortlist.totalFamilies} matching options for your routine.`;
    }
  } else {
    assistantMessage = language === "hi-latn"
      ? "Main aapki kaise madad kar sakta hoon? Aap mujhse product recommendations, routine guidance, ya order/delivery ke baare mein pooch sakte hain."
      : "How can I help you today? You can ask me for personalized product recommendations, routine advice, or delivery and order support.";
  }

  // 8. Candidates Resolution (Grounding on SQLite Catalogue - ONLY if user is interested in products)
  const sqliteRecommended: ShortlistFamilyItem[] = [];

  if (hasProductInterest) {
    const targetSlugs =
      llmOutput?.recommendedProductSlugs && llmOutput.recommendedProductSlugs.length > 0
        ? llmOutput.recommendedProductSlugs
        : sqliteProducts.slice(0, 3).map((p) => p.slug);

    for (const slug of targetSlugs) {
      const p = getCatalogueProductBySlug(slug) || sqliteProducts.find((sp) => sp.slug === slug);
      if (p) {
        const catalogueProduct = DEMO_CATALOGUE_SEED.find((prod) => prod.slug === p.slug) || DEMO_CATALOGUE_SEED[0];
        sqliteRecommended.push({
          familyId: p.slug,
          canonical_name: p.official_name,
          name: p.official_name,
          category: p.category,
          categoryLabel: formatCategoryLabel(p.category as CatalogueCategoryId),
          format: p.format,
          priceInr: p.price_inr,
          price_inr: p.price_inr,
          imageUrl: p.image_url || catalogueProduct.image_url || null,
          image_url: p.image_url || catalogueProduct.image_url || null,
          rank: sqliteRecommended.length + 1,
          benefitsCovered: p.supported_goals,
          notSpecificallyDescribed: false,
          whyText: p.official_description,
          brandClaim: null,
          sourceText: "Official verified packaging",
          sourceUrl: p.source_url ?? "",
          primaryProduct: catalogueProduct,
          score: 1.0,
        });
        if (p.source_url) {
          sources.push({
            source: p.source_url,
            verifiedAt: "Official Packaging",
            url: p.source_url,
          });
        }
      }
    }
  }

  const finalCandidates: ShortlistFamilyItem[] = hasProductInterest
    ? (sqliteRecommended.length > 0 ? sqliteRecommended : shortlist.topFamilies)
    : [];

  // 9. Structured Actions & Quick Replies
  const actions: StructuredAction[] = [];
  if (Object.keys(finalPatch).length > 0 && !isSupportOrComplaint) {
    actions.push({ type: "apply_patch", payload: finalPatch });
  }
  if (hasProductInterest && (shortlist.totalFamilies > 0 || finalCandidates.length > 0)) {
    actions.push({
      type: "show_results",
      payload: { count: Math.max(shortlist.totalFamilies, finalCandidates.length), stateHash: shortlist.stateHash },
    });
  }
  if (hasProductInterest && llmOutput?.suggestedActions) {
    for (const act of llmOutput.suggestedActions) {
      actions.push({ type: "open_product", payload: act });
    }
  }

  // Quick replies
  const quickReplies: Array<{ id: string; label: string; action: string; value: unknown }> = [];
  if (isSupportOrComplaint) {
    if (llmOutput?.quickReplies && llmOutput.quickReplies.length > 0) {
      for (let i = 0; i < llmOutput.quickReplies.length; i++) {
        quickReplies.push({
          id: `qr_support_${i}`,
          label: llmOutput.quickReplies[i],
          action: "ask",
          value: llmOutput.quickReplies[i],
        });
      }
    } else {
      const defaultSupportPills = [
        "Delivery delay",
        "Damaged parcel",
        "Product issue",
        "Contact helpline",
      ];
      for (let i = 0; i < defaultSupportPills.length; i++) {
        quickReplies.push({
          id: `qr_sup_default_${i}`,
          label: defaultSupportPills[i],
          action: "ask",
          value: defaultSupportPills[i],
        });
      }
    }
  } else if (llmOutput?.quickReplies && llmOutput.quickReplies.length > 0) {
    for (let i = 0; i < llmOutput.quickReplies.length; i++) {
      quickReplies.push({
        id: `qr_llm_${i}`,
        label: llmOutput.quickReplies[i],
        action: "ask",
        value: llmOutput.quickReplies[i],
      });
    }
  } else {
    const nextQ = selectNext(nextState, DEMO_CATALOGUE_SEED);
    if (!nextQ.done && nextQ.options && nextQ.facet) {
      for (const opt of nextQ.options.slice(0, 3)) {
        quickReplies.push({
          id: opt.id,
          label: opt.label,
          action: "answer_facet",
          value: { facetId: nextQ.facet, value: opt.value },
        });
      }
    }
  }

  // Page-context specific quick replies
  if (pageContext?.page === "product_detail") {
    quickReplies.push({ id: "qr_ing", label: "What are the ingredients?", action: "ask", value: "ingredients" });
    quickReplies.push({ id: "qr_dir", label: "How do I use this?", action: "ask", value: "directions" });
  } else if (pageContext?.page === "help") {
    quickReplies.push({ id: "qr_track", label: "Where is my order?", action: "ask", value: "tracking" });
    quickReplies.push({ id: "qr_contact", label: "Contact helpline", action: "ask", value: "helpline" });
  }

  const latencyMs = Date.now() - startTime;

  return {
    patch: finalPatch,
    assistantMessage: assistantMessage.trim(),
    quickReplies,
    actions,
    candidates: finalCandidates,
    shortlist: {
      stateHash: shortlist.stateHash,
      count: finalCandidates.length,
      topFamilies: finalCandidates.slice(0, 3),
    },
    sources,
    meta: {
      mode: activeMode,
      fallbackReason,
      tokenEstimate,
      latencyMs,
      pageContextUsed: pageContext?.page,
      droppedNominations: droppedCount,
    },
  };
}
