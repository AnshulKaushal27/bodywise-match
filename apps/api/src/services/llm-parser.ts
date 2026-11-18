/**
 * Strategy B: Server-Side LLM Intent Parser
 * Enabled only if process.env.LLM_API_KEY is defined.
 * 
 * Non-negotiable guardrails:
 * - Never diagnose, never name products, never add fields, output JSON only.
 * - Strips emails and phone numbers from input first (Rule 8).
 * - 1,500-character input cap.
 * - 8-second timeout.
 * - Validates response with Zod; on ANY failure falls back to Strategy A silently.
 */

import { ParsedNeeds, ParsedNeedsSchema, sanitizePii } from "@bodywise/shared";

const SYSTEM_PROMPT = `You are a pure intent extraction engine for Bodywise Match.
Extract user wellness intent into a JSON object matching the following schema:
{
  "goal": string or null (from controlled goals e.g. "body_bumps_look", "gentle_daily_cleansing", "oil_control", "hydration_barrier", "dark_spots_look", "hair_fall_appearance", "scalp_comfort", "frizz_control", "sun_protection", "underarm_odor_freshness", "underarm_texture_smoothing", "rough_texture_smoothing", "hair_density_appearance", "scalp_clarifying"),
  "category": string or null ("body_wash", "face_wash", "serum", "shampoo", "conditioner", "hair_oil", "supplement", "sunscreen"),
  "format_preferences": string[],
  "avoidances": string[],
  "routine_context": object or null,
  "uncertainties": string[],
  "confidence": "low" | "medium" | "high",
  "evidence_text": object with matched snippets per field
}

CRITICAL RULES:
1. NEVER diagnose any condition, never provide medical advice, never promise treatments or cures.
2. NEVER name products or brands.
3. NEVER add extra fields outside the schema.
4. Mark unknown fields as null.
5. If the request asks for medical diagnosis, treatment, or cure, set confidence to "low" and add an uncertainty stating that medical treatment is not provided.
6. Output raw JSON only. Do not wrap in markdown quotes or codeblocks.`;

export async function parseNeedsLLM(rawInput: string): Promise<ParsedNeeds | null> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  try {
    // Rule 8: Strip emails and phone numbers first
    const sanitized = sanitizePii(rawInput);

    // 1,500-character input cap
    const cappedInput = sanitized.slice(0, 1500);

    const endpoint =
      process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
    const model = process.env.LLM_MODEL || "gpt-4o-mini";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: cappedInput },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Non-200 response -> silently fall back
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsedJson = JSON.parse(content);
    const validated = ParsedNeedsSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    }

    // Zod validation failed -> silently fall back
    return null;
  } catch {
    // Timeout, network error, or JSON parse error -> silently fall back to Strategy A
    return null;
  }
}
