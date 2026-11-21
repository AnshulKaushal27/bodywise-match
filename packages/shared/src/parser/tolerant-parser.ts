/**
 * Tolerant LLM Output Parser & Salvage Logic
 * Strips markdown code blocks, normalizes schemas, drops unknown keys,
 * defaults missing arrays, and salvages partial valid needs (Section G.4).
 */

import { SessionNeed, SessionPatch, TimeOfDay, Frequency } from "../matchSession/types";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";
import { mapUserPhraseToProductType, CatalogueType } from "../data/typeMap";
import { normalizeCosmeticWording } from "./strategy-a";

export interface TolerantParseResult {
  success: boolean;
  patch: SessionPatch;
  evidence: Record<string, string | null>;
  salvagedNeedsCount: number;
  unrecognizedFields: string[];
}

export function cleanCodeFences(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

/**
 * Tolerantly extracts structured session patch from raw LLM string or parsed object.
 */
interface RawLlmPayload {
  needs?: unknown[];
  body_area?: unknown;
  product_type?: unknown;
  category?: unknown;
  time_of_day?: unknown;
  frequency?: unknown;
  format?: unknown;
  format_preferences?: unknown[];
  fragrance_free?: unknown;
  fragrance_pref?: unknown;
  avoidances?: unknown[];
  evidence_text?: Record<string, unknown>;
}

/**
 * Tolerantly extracts structured session patch from raw LLM string or parsed object.
 */
export function tolerantParseLlmResponse(raw: string | Record<string, unknown>): TolerantParseResult {
  let obj: RawLlmPayload;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(cleanCodeFences(raw));
    } catch {
      return {
        success: false,
        patch: {},
        evidence: {},
        salvagedNeedsCount: 0,
        unrecognizedFields: ["invalid_json"],
      };
    }
  } else {
    obj = raw as RawLlmPayload;
  }

  if (!obj || typeof obj !== "object") {
    return {
      success: false,
      patch: {},
      evidence: {},
      salvagedNeedsCount: 0,
      unrecognizedFields: ["non_object_root"],
    };
  }

  const patch: SessionPatch = {};
  const evidence: Record<string, string | null> = {};
  const unrecognized: string[] = [];

  // 1. Salvage Needs
  const rawNeeds = Array.isArray(obj.needs) ? obj.needs : [];
  const validNeeds: SessionNeed[] = [];

  for (let i = 0; i < rawNeeds.length; i++) {
    const rawNeed = rawNeeds[i] as Record<string, unknown>;
    if (!rawNeed || typeof rawNeed !== "object") continue;

    // Extract concept IDs
    let conceptId: string | null = null;
    if (typeof rawNeed.concept_id === "string") {
      conceptId = rawNeed.concept_id;
    } else if (Array.isArray(rawNeed.concepts) && typeof rawNeed.concepts[0] === "string") {
      conceptId = rawNeed.concepts[0];
    } else if (typeof rawNeed.goal === "string") {
      conceptId = rawNeed.goal;
    }

    // Check validity against controlled concepts
    if (!conceptId || !CONCEPTS_BY_ID.has(conceptId)) {
      // Map common synonyms to canonical concept IDs if possible
      if (conceptId === "dryness" || conceptId === "dry_skin") conceptId = "hydration";
      else if (conceptId === "darkspots" || conceptId === "hyperpigmentation") conceptId = "dark_spots_look";
      else if (conceptId === "oily_skin") conceptId = "oil_control";
      else if (conceptId === "dandruff") conceptId = "scalp_comfort";
      else if (conceptId === "thinning") conceptId = "hair_density_appearance";
      else conceptId = null;
    }

    if (conceptId) {
      const userPhrase = typeof rawNeed.phrase_from_user === "string" ? rawNeed.phrase_from_user : "";
      const label = normalizeCosmeticWording(
        typeof rawNeed.normalised_label === "string" ? rawNeed.normalised_label : userPhrase,
        conceptId
      );

      validNeeds.push({
        id: `need_${i + 1}`,
        concept_id: conceptId,
        phrase_from_user: userPhrase,
        normalised_label: label,
        confidence: typeof rawNeed.confidence === "number" ? rawNeed.confidence : 0.9,
        status: userPhrase.trim().length > 0 ? "confirmed" : "guessed",
        source: "user_text",
        evidence_text: userPhrase || null,
      });

      if (userPhrase) {
        evidence[conceptId] = userPhrase;
      }
    }
  }

  if (validNeeds.length > 0) {
    patch.needs = validNeeds;
  }

  // 2. Body Area
  const rawArea = typeof obj.body_area === "string" ? obj.body_area.toLowerCase().trim() : null;
  if (rawArea && ["face", "body", "scalp", "hair", "underarm"].includes(rawArea)) {
    patch.body_area = rawArea;
    evidence["body_area"] = typeof obj.evidence_text?.body_area === "string" ? obj.evidence_text.body_area : null;
  }

  // 3. Product Type
  let rawType: CatalogueType | null = null;
  if (typeof obj.product_type === "string") {
    rawType = mapUserPhraseToProductType(obj.product_type);
  } else if (typeof obj.category === "string") {
    rawType = mapUserPhraseToProductType(obj.category);
  }
  if (rawType) {
    patch.product_type = rawType;
    evidence["product_type"] = typeof obj.evidence_text?.product_type === "string" ? obj.evidence_text.product_type : null;
  }

  // 4. Time of Day
  const rawTod = typeof obj.time_of_day === "string" ? obj.time_of_day.toLowerCase().trim() : null;
  if (rawTod && ["morning", "night", "both", "any"].includes(rawTod)) {
    patch.time_of_day = rawTod as TimeOfDay;
    evidence["time_of_day"] = typeof obj.evidence_text?.time_of_day === "string" ? obj.evidence_text.time_of_day : null;
  }

  // 5. Frequency
  const rawFreq = typeof obj.frequency === "string" ? obj.frequency.toLowerCase().trim() : null;
  if (rawFreq && ["daily", "occasional", "any"].includes(rawFreq)) {
    patch.frequency = rawFreq as Frequency;
    evidence["frequency"] = typeof obj.evidence_text?.frequency === "string" ? obj.evidence_text.frequency : null;
  }

  // 6. Format
  if (typeof obj.format === "string") {
    patch.format = obj.format;
  } else if (Array.isArray(obj.format_preferences) && typeof obj.format_preferences[0] === "string") {
    patch.format = obj.format_preferences[0];
  }

  // 7. Fragrance
  if (obj.fragrance_free === true || obj.fragrance_pref === "free_only") {
    patch.fragrance_pref = "free_only";
  }

  // 8. Avoidances
  if (Array.isArray(obj.avoidances)) {
    patch.avoidances = obj.avoidances.filter(
      (a: unknown): a is string => typeof a === "string" && a.trim().length > 0
    );
  }

  const hasAnyData =
    Boolean(patch.needs && patch.needs.length > 0) ||
    Boolean(patch.body_area) ||
    Boolean(patch.product_type) ||
    Boolean(patch.time_of_day) ||
    Boolean(patch.frequency) ||
    Boolean(patch.format);

  return {
    success: hasAnyData,
    patch,
    evidence,
    salvagedNeedsCount: validNeeds.length,
    unrecognizedFields: unrecognized,
  };
}
