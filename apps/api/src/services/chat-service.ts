/**
 * Chat Service for Hybrid Match Flow (Section F)
 * Stateless server-side turn processor.
 * - Extracts structured patch with Groq LLM (or rules fallback)
 * - Validates with controlled schemas (never allows free-form LLM text to users)
 * - Composes assistant messages deterministically from templates and verified catalogue facts
 * - Strictly follows AGENTS.md: zero diagnosis, zero invented facts, no body logging
 */

import {
  MatchSessionState,
  ChatMessage,
  SessionPatch,
  SessionEvent,
  SelectNextQuestionResult,
  SessionLanguage,
  DEMO_CATALOGUE_SEED,
  matchSessionReducer,
  selectNext,
  extractPatchViaRules,
  tolerantParseLlmResponse,
  detectPrimaryCategory,
  getImplicationsForCategory,
  formatCategoryLabel,
  computeShortlist,
} from "@bodywise/shared";
import { callGroqChatCompletion } from "../llm/groqClient";
import { canMakeLlmCall, recordLlmCall } from "../llm/dailyCap";

export interface ChatServiceInput {
  state: MatchSessionState;
  message: string;
  history?: ChatMessage[];
  language?: SessionLanguage;
  requestId?: string;
}

export interface ChatServiceResponse {
  patch: SessionPatch;
  events: SessionEvent[];
  assistantMessage: string;
  quickReplies: Array<{ id: string; label: string; action: string; value: unknown }>;
  nextQuestion: SelectNextQuestionResult | null;
  candidateCount: number;
  sourceTag?: {
    source: string;
    verifiedAt: string;
    url?: string;
  };
  meta: {
    source: "llm" | "rules";
    fallbackReason?: string;
  };
}

const CHAT_INTENT_SYSTEM_PROMPT = `You are a shopping intent classifier for personal-care products.
Analyze the user's message in the context of their shopping session.
Output JSON only with this schema:
{
  "intent": "update" | "answer" | "product_question" | "off_topic" | "medical" | "greeting",
  "patch": {
    "product_type": string or null,
    "body_area": "face" | "body" | "scalp" | "hair" | "underarm" | null,
    "time_of_day": "morning" | "night" | "both" | "any" | null,
    "frequency": "daily" | "occasional" | "any" | null,
    "format": string or null,
    "fragrance_pref": "free_only" | "any" | null,
    "avoidances": string[] or null
  },
  "reply_language": "en" | "hi-latn",
  "product_mentions": string[]
}
Never diagnose diseases. Never recommend drugs. Output strictly JSON only.`;

function composeAcknowledgement(
  patch: SessionPatch,
  lang: SessionLanguage
): string {
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
    return parts.length > 0 ? parts.join(" ") : "Samajh gaya.";
  } else {
    if (patch.time_of_day) {
      parts.push(`Got it, noted for ${patch.time_of_day} use.`);
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
      parts.push("Applied fragrance-free preference.");
    }
    return parts.length > 0 ? parts.join(" ") : "Understood.";
  }
}

export async function processChatTurn(
  input: ChatServiceInput
): Promise<ChatServiceResponse> {
  const { state, message, history = [], language } = input;

  // 1. Check for Medical Caution words
  const isMedical = /\b(cure|treat|infection|fungal|eczema|psoriasis|severe acne|prescription|antibiotic|disease|rash)\b/i.test(
    message
  );

  // 1b. Deterministic Category Detection BEFORE LLM (Section B.2)
  const detectedCategory = detectPrimaryCategory(message);

  // 2. Check for Product Specific Questions (e.g. "aha body wash kya karta hai")
  const productMention = DEMO_CATALOGUE_SEED.find((p) => {
    const slugMatch = message.toLowerCase().includes(p.slug.replace(/-/g, " "));
    const nameWords = p.official_name.toLowerCase().split(" ").filter((w) => w.length > 3);
    const hasKeyWords = nameWords.length > 0 && nameWords.filter((w) => message.toLowerCase().includes(w)).length >= 2;
    return slugMatch || hasKeyWords;
  });

  // Attempt LLM structured intent extraction if enabled and quota available
  let source: "llm" | "rules" = "rules";
  let fallbackReason: string | undefined;
  let extractedPatch: SessionPatch = {};
  let detectedLang: SessionLanguage = language || state.language || "en";
  const patchEvidence: Record<string, string> = {};

  const useLlm = process.env.GROQ_API_KEY && canMakeLlmCall();

  if (useLlm && !isMedical && !productMention) {
    try {
      const recentHistory = history.slice(-6).map((h) => ({
        role: h.role === "system" ? ("assistant" as const) : h.role,
        content: h.content,
      }));

      const completion = await callGroqChatCompletion({
        messages: [
          { role: "system", content: CHAT_INTENT_SYSTEM_PROMPT },
          ...recentHistory,
          { role: "user", content: `<user_message>\n${message.slice(0, 500)}\n</user_message>` },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        timeoutMs: 10000,
      });

      const parsed = tolerantParseLlmResponse(completion.content);
      if (parsed.success) {
        extractedPatch = parsed.patch;
        source = "llm";
        recordLlmCall();
      } else {
        source = "rules";
        fallbackReason = "LLM output schema validation failed";
      }
    } catch (err: unknown) {
      source = "rules";
      fallbackReason = err instanceof Error ? err.message : "LLM call failed";
    }
  }

  // If LLM was not used or failed, run deterministic rules patcher
  if (source === "rules") {
    const rulesResult = extractPatchViaRules(message);
    extractedPatch = rulesResult.patch;
    detectedLang = rulesResult.detectedLanguage;
    Object.assign(patchEvidence, rulesResult.evidence);
  }

  // Authoritative Detector Override: If detector matched an explicit category, detector WINS (Section B.2)
  if (detectedCategory) {
    if (extractedPatch.product_type && extractedPatch.product_type !== detectedCategory.categoryId) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Dev Metric] Category disagreement: LLM guessed "${extractedPatch.product_type}", detector authoritative "${detectedCategory.categoryId}"`);
      }
    }
    extractedPatch.product_type = detectedCategory.categoryId;
    patchEvidence["product_type"] = detectedCategory.matchedText;

    // Apply implied slot derivations
    const catImplications = getImplicationsForCategory(detectedCategory.categoryId);
    if (catImplications?.derivedBodyArea) {
      extractedPatch.body_area = catImplications.derivedBodyArea;
      patchEvidence["body_area"] = "derived";
    }
  }

  // 3. Apply patch to state copy
  let updatedState = { ...state };
  const events: SessionEvent[] = [];

  const hasPatchData = Object.keys(extractedPatch).length > 0;
  if (hasPatchData) {
    const applyEvent: SessionEvent = {
      type: "APPLY_PATCH",
      source: "chat",
      status: "confirmed",
      patch: extractedPatch,
      evidence: patchEvidence,
      timestamp: Date.now(),
    };
    events.push(applyEvent);
    updatedState = matchSessionReducer(updatedState, applyEvent);
  }

  // 4. Compute next question and candidate count via single shared engine
  const nextQ = selectNext(updatedState, DEMO_CATALOGUE_SEED);
  const shortlist = computeShortlist(updatedState, DEMO_CATALOGUE_SEED);
  const candidateCount = shortlist.totalFamilies;

  // 5. Compose assistant message
  let assistantMessage = "";
  let sourceTag: { source: string; verifiedAt: string; url?: string } | undefined;
  const quickReplies: Array<{ id: string; label: string; action: string; value: unknown }> = [];

  if (isMedical) {
    const cautionText =
      detectedLang === "hi-latn"
        ? "Yadi aapko gambhir allergy, infection ya medical samasya hai, kripya kisi qualified dermatologist ya doctor se consult karein. Hum yahan cosmetic care matches shortlist kar rahe hain."
        : "If you have a significant skin reaction or medical concern, please discontinue use and consult a qualified health professional. We can continue finding cosmetic personal-care matches for your routine.";
    assistantMessage = `${cautionText} ${nextQ.question || ""}`.trim();
  } else if (productMention) {
    // Official description & verified facts only (Rule 3)
    const verifiedAt = productMention.last_verified_at || "Not verified yet";
    const desc = productMention.official_description || "Product designed for regular personal care.";
    const ingrSummary = productMention.ingredients ? `Ingredients include: ${productMention.ingredients.slice(0, 3).join(", ")}.` : "";

    assistantMessage = `${productMention.official_name}: ${desc} ${ingrSummary}`.trim();
    sourceTag = {
      source: productMention.price_source || "Official Store (bebodywise.com)",
      verifiedAt,
      url: productMention.source_url || undefined,
    };
  } else if (/\b(hello|hi|namaste|hey|help)\b/i.test(message) && !hasPatchData) {
    assistantMessage =
      detectedLang === "hi-latn"
        ? "Namaste! Main aapke liye sahi products dhoondhne me madad kar sakta hoon. " + (nextQ.question || "")
        : "Hello! I'm here to help narrow down your personal-care match. " + (nextQ.question || "");
  } else if (!hasPatchData && !nextQ.done) {
    assistantMessage =
      detectedLang === "hi-latn"
        ? `Maine aapka message dekha. ${nextQ.question || ""}`
        : `I noted your preference. ${nextQ.question || ""}`;
  } else {
    const ack = composeAcknowledgement(extractedPatch, detectedLang);
    if (nextQ.done) {
      assistantMessage =
        detectedLang === "hi-latn"
          ? `${ack} Aapka shortlist tayyar hai! Kul ${candidateCount} products aapke profile se match karte hain.`
          : `${ack} You're all set! We found ${candidateCount} products matching your criteria.`;
    } else {
      assistantMessage = `${ack} ${nextQ.question || ""}`.trim();
    }
  }

  // Populate quick replies from next question options
  if (nextQ && !nextQ.done && nextQ.options) {
    for (const opt of nextQ.options) {
      quickReplies.push({
        id: opt.id,
        label: opt.label,
        action: "ANSWER_QUESTION",
        value: opt.value,
      });
    }
  }

  return {
    patch: extractedPatch,
    events,
    assistantMessage,
    quickReplies,
    nextQuestion: nextQ.done ? null : nextQ,
    candidateCount,
    sourceTag,
    meta: {
      source,
      fallbackReason,
    },
  };
}
