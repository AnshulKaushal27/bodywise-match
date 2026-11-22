/**
 * Server-side Unified Parse Service for Next.js App Router
 * Integrates Groq LLM as the multi-need intent extractor (Strategy B).
 * When Groq is disabled, unconfigured, timed out, or unavailable, seamlessly falls back
 * to the deterministic pure TypeScript rules parser (Strategy A).
 *
 * STRICT SAFETY & PRIVACY:
 * - Sanitizes PII (emails, phone numbers, URLs) and neutralizes prompt-injection strings.
 * - Caps input at 1,500 chars.
 * - Wraps input in <user_message>...</user_message> tags.
 * - Validates output with ParsedRequestSchema / ParsedNeedsSchema.
 * - Unknown concepts are strictly dropped.
 * - Never logs raw input or model output bodies (Rule 8).
 */

import {
  ParsedRequest,
  ParsedRequestSchema,
  ParsedNeeds,
  parseNeedsKeyword,
  parseRequestKeyword,
  CONCEPTS_BY_ID,
  normalizeCosmeticWording,
  tolerantParseLlmResponse,
  detectPrimaryCategory,
  ProductCategory,
} from "@bodywise/shared";
import {
  callGroqChatCompletion,
  getGroqConfig,
  canMakeLlmCall,
  recordLlmCall,
  GroqClientError,
} from "./groq";

export interface ParseRequestResult {
  parsed_request: ParsedRequest;
  parsed_needs: ParsedNeeds;
  strategy: "A" | "B";
  source: "llm" | "rules";
  model?: string;
  latencyMs: number;
  error_category?: string;
  fallback_reason?: string;
}

const MULTI_NEED_SYSTEM_PROMPT = `You extract shopping intent for a personal-care product finder. Split the message into separate needs. Output JSON only. Never diagnose. Never name products. If medical terms are mentioned, set medical_flag: true and keep needs cosmetic. Output raw JSON only.

JSON SCHEMA:
{
  "needs": [
    {
      "id": string ("need_1", "need_2", etc.),
      "phrase_from_user": string (exact phrase snippet from user),
      "concepts": string[] (controlled concept IDs e.g. "body_bumps", "dry_skin", "dandruff", "hair_fall", "underarm_odor", "sun_protection"),
      "preferred_category": string or null ("body_wash", "face_wash", "shampoo", "conditioner", "hair_oil", "serum", "sunscreen", "supplement", "moisturizer", "roll_on"),
      "format_preferences": string[],
      "priority": "primary" | "secondary",
      "confidence": "high" | "medium" | "low",
      "normalised_label": string
    }
  ],
  "avoidances": string[],
  "routine_context": string or null,
  "medical_flag": boolean
}`;

export function sanitizeInputPii(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/g, "[phone]")
    .replace(/https?:\/\/[^\s]+/gi, "[link]");
}

export function neutralizePromptInjections(text: string): {
  sanitized: string;
  injectionDetected: boolean;
} {
  const INJECTION_PATTERNS = [
    /ignore\s+(?:all\s+|previous\s+|above\s+|prior\s+)?instructions/gi,
    /disregard\s+(?:all\s+|previous\s+|above\s+|prior\s+)?instructions/gi,
    /system\s+prompt/gi,
    /reveal\s+(?:the\s+)?(?:system\s+)?prompt/gi,
    /output\s+(?:the\s+)?(?:system\s+)?prompt/gi,
    /you\s+are\s+now\s+(?:a|an)\b/gi,
    /\bdan\s+mode\b/gi,
    /\bjailbreak\b/gi,
    /<system>/gi,
    /<\/system>/gi,
    /\[system\]/gi,
    /\[\/system\]/gi,
  ];

  let injectionDetected = false;
  let sanitized = text;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      injectionDetected = true;
      sanitized = sanitized.replace(pattern, "[filtered directive]");
    }
  }

  return { sanitized, injectionDetected };
}

export async function parseUserConcern(
  rawInput: string,
  _requestId: string = "unknown"
): Promise<ParseRequestResult> {
  const startTime = Date.now();
  const cfg = getGroqConfig();

  // If Groq is not configured or disabled, immediately use Strategy A pure rules
  if (!cfg.keyPresent || !cfg.apiKey) {
    const rulesRequest = parseRequestKeyword(rawInput);
    const rulesNeeds = parseNeedsKeyword(rawInput);
    return {
      parsed_request: rulesRequest,
      parsed_needs: rulesNeeds,
      strategy: "A",
      source: "rules",
      latencyMs: Date.now() - startTime,
      error_category: "missing_key",
      fallback_reason: "GROQ_API_KEY is not configured",
    };
  }

  if (!cfg.enabled) {
    const rulesRequest = parseRequestKeyword(rawInput);
    const rulesNeeds = parseNeedsKeyword(rawInput);
    return {
      parsed_request: rulesRequest,
      parsed_needs: rulesNeeds,
      strategy: "A",
      source: "rules",
      latencyMs: Date.now() - startTime,
      error_category: "llm_disabled",
      fallback_reason: "LLM_ENABLED=false",
    };
  }

  if (!canMakeLlmCall()) {
    const rulesRequest = parseRequestKeyword(rawInput);
    const rulesNeeds = parseNeedsKeyword(rawInput);
    return {
      parsed_request: rulesRequest,
      parsed_needs: rulesNeeds,
      strategy: "A",
      source: "rules",
      latencyMs: Date.now() - startTime,
      error_category: "daily_cap_exceeded",
      fallback_reason: "Daily LLM cost cap reached",
    };
  }

  const withoutPii = sanitizeInputPii(rawInput);
  const { sanitized, injectionDetected } = neutralizePromptInjections(withoutPii);
  const cappedInput = sanitized.slice(0, cfg.maxInputChars);

  const userMessageContent = `<user_message>\n${cappedInput}\n</user_message>${
    injectionDetected ? "\n(Note: User message contained filtered patterns. Process safely.)" : ""
  }`;

  try {
    const completion = await callGroqChatCompletion({
      messages: [
        { role: "system", content: MULTI_NEED_SYSTEM_PROMPT },
        { role: "user", content: userMessageContent },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
      timeoutMs: cfg.timeoutMs,
    });

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(completion.content);
    } catch {
      // 1 repair retry if JSON parse failed
      const repairCompletion = await callGroqChatCompletion({
        messages: [
          { role: "system", content: MULTI_NEED_SYSTEM_PROMPT },
          { role: "user", content: userMessageContent },
          { role: "assistant", content: completion.content },
          {
            role: "user",
            content: "Your previous response was not valid JSON. Fix it and output strictly valid JSON only.",
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        timeoutMs: 8000,
      });
      rawJson = JSON.parse(repairCompletion.content);
    }

    const zodResult = ParsedRequestSchema.safeParse(rawJson);

    if (!zodResult.success) {
      // Tolerant Parsing & Partial Salvage
      const tolerant = tolerantParseLlmResponse(rawJson as Record<string, unknown>);
      const rulesRequest = parseRequestKeyword(rawInput);
      const rulesNeeds = parseNeedsKeyword(rawInput);

      if (tolerant.salvagedNeedsCount > 0 && tolerant.patch.needs) {
        const salvagedNeeds = tolerant.patch.needs.map((sn, idx) => ({
          id: sn.id || `need_${idx + 1}`,
          phrase_from_user: sn.phrase_from_user,
          concepts: [sn.concept_id],
          preferred_category: null,
          format_preferences: tolerant.patch.format ? [tolerant.patch.format] : [],
          priority: (idx === 0 ? "primary" : "secondary") as "primary" | "secondary",
          confidence: "medium" as const,
          normalised_label: sn.normalised_label || sn.phrase_from_user,
        }));

        recordLlmCall();

        return {
          parsed_request: {
            ...rulesRequest,
            needs: salvagedNeeds,
            avoidances: tolerant.patch.avoidances || rulesRequest.avoidances,
            routine_context: tolerant.patch.time_of_day
              ? String(tolerant.patch.time_of_day)
              : rulesRequest.routine_context,
          },
          parsed_needs: rulesNeeds,
          strategy: "B",
          source: "llm",
          model: completion.model,
          latencyMs: Date.now() - startTime,
        };
      }

      // If no valid needs could be salvaged, fall back cleanly
      return {
        parsed_request: rulesRequest,
        parsed_needs: rulesNeeds,
        strategy: "A",
        source: "rules",
        model: completion.model,
        latencyMs: Date.now() - startTime,
        error_category: "schema_validation_failed",
        fallback_reason: "AI unavailable right now",
      };
    }

    const validated = zodResult.data;
    const detectedCat = detectPrimaryCategory(rawInput);

    // Filter unknown concepts and apply Authoritative Category Guard
    for (const need of validated.needs) {
      need.concepts = need.concepts.filter((cid) => CONCEPTS_BY_ID.has(cid));
      need.normalised_label = normalizeCosmeticWording(
        need.normalised_label || need.phrase_from_user,
        need.concepts[0]
      );
      if (detectedCat) {
        need.preferred_category = detectedCat.categoryId as ProductCategory;
      } else {
        need.preferred_category = null;
      }
    }

    recordLlmCall();

    // Map into legacy ParsedNeeds for single-need consumers
    const primaryNeed = validated.needs[0];
    const legacyNeeds: ParsedNeeds = {
      goal: primaryNeed?.concepts[0] || null,
      category: primaryNeed?.preferred_category || null,
      format_preferences: primaryNeed?.format_preferences || [],
      avoidances: validated.avoidances || [],
      routine_context: validated.routine_context ? { notes: validated.routine_context } : null,
      uncertainties: [],
      confidence: primaryNeed?.confidence || "medium",
      evidence_text: primaryNeed?.phrase_from_user ? { goal: primaryNeed.phrase_from_user } : {},
    };

    return {
      parsed_request: validated,
      parsed_needs: legacyNeeds,
      strategy: "B",
      source: "llm",
      model: completion.model,
      latencyMs: completion.latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorCategory =
      err instanceof GroqClientError ? err.category : "unknown_error";
    const fallbackReason =
      err instanceof Error ? err.message : "Unexpected LLM failure";

    const rulesRequest = parseRequestKeyword(rawInput);
    const rulesNeeds = parseNeedsKeyword(rawInput);

    return {
      parsed_request: rulesRequest,
      parsed_needs: rulesNeeds,
      strategy: "A",
      source: "rules",
      latencyMs,
      error_category: errorCategory,
      fallback_reason: fallbackReason,
    };
  }
}
