/**
 * Deterministic Rules Patcher with English & Hinglish Keyword Support
 * Zero LLM dependency. Used as primary rules engine and robust fallback (Section G.1 & F).
 */

import { SessionPatch, SessionNeed, TimeOfDay, Frequency } from "../matchSession/types";
import {
  HINGLISH_NEEDS,
  HINGLISH_BODY_AREAS,
  HINGLISH_TIME_OF_DAY,
  HINGLISH_FREQUENCY,
  HINGLISH_PRODUCT_TYPES,
} from "../data/synonyms.hinglish";
import { CatalogueType } from "../data/typeMap";
import { normalizeCosmeticWording } from "./strategy-a";

export interface RulesPatchResult {
  patch: SessionPatch;
  evidence: Record<string, string>;
  detectedLanguage: "en" | "hi-latn";
}

/**
 * Strips PII (emails and phone numbers) per Rule 8.
 */
export function sanitizeInputPii(text: string): string {
  let cleaned = text;
  // Phone numbers (10 digits, with optional spaces or dashes)
  cleaned = cleaned.replace(/\b(?:\+91[-.\s]?)?[6-9]\d{9}\b/g, "[REDACTED_PHONE]");
  // Emails
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  return cleaned;
}

export function extractPatchViaRules(rawText: string): RulesPatchResult {
  const sanitized = sanitizeInputPii(rawText.toLowerCase());
  const patch: SessionPatch = {};
  const evidence: Record<string, string> = {};

  // Detect Roman-Hindi language cues
  const hinglishCues = [
    "hai", "hain", "karo", "kare", "mujhe", "mere", "meri", "kuch", "chahiye", "lagana", "batao",
    "bata do", "raat", "subah", "dhoop", "roz", "chehra", "muh", "baal", "daag", "dhabbe", "yaar",
    "sku", "laga", "pe", "ka", "ki", "ke", "mai", "ise", "ko"
  ];
  const hasHinglish = hinglishCues.some((cue) => new RegExp(`(^|\\b)${cue}(\\b|$)`, "i").test(sanitized));
  const detectedLanguage: "en" | "hi-latn" = hasHinglish ? "hi-latn" : "en";

  // 1. Detect Needs (longer synonyms first)
  const detectedNeeds: SessionNeed[] = [];
  let needIdx = 1;

  for (const [conceptId, synonyms] of Object.entries(HINGLISH_NEEDS)) {
    const sorted = [...synonyms].sort((a, b) => b.length - a.length);
    for (const syn of sorted) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      const match = sanitized.match(regex);
      if (match) {
        const foundPhrase = match[0].trim();
        const label = normalizeCosmeticWording(foundPhrase, conceptId);

        detectedNeeds.push({
          id: `need_${needIdx++}`,
          concept_id: conceptId,
          phrase_from_user: foundPhrase,
          normalised_label: label,
          confidence: 0.95,
          status: "confirmed",
          source: "user_text",
          evidence_text: foundPhrase,
        });

        evidence[conceptId] = foundPhrase;
        break; // Match one synonym per concept
      }
    }
  }

  if (detectedNeeds.length > 0) {
    patch.needs = detectedNeeds;
  }

  // 2. Detect Body Area (sort synonyms by length descending so longer phrases match first)
  for (const [area, synonyms] of Object.entries(HINGLISH_BODY_AREAS)) {
    const sorted = [...synonyms].sort((a, b) => b.length - a.length);
    for (const syn of sorted) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      const match = sanitized.match(regex);
      if (match) {
        patch.body_area = area;
        evidence["body_area"] = match[0].trim();
        break;
      }
    }
    if (patch.body_area) break;
  }

  // 3. Detect Product Type
  for (const [pType, synonyms] of Object.entries(HINGLISH_PRODUCT_TYPES)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      const match = sanitized.match(regex);
      if (match) {
        patch.product_type = pType as CatalogueType;
        evidence["product_type"] = match[0].trim();
        break;
      }
    }
    if (patch.product_type) break;
  }

  // 4. Detect Time of Day
  for (const [tod, synonyms] of Object.entries(HINGLISH_TIME_OF_DAY)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      const match = sanitized.match(regex);
      if (match) {
        patch.time_of_day = tod as TimeOfDay;
        evidence["time_of_day"] = match[0].trim();
        break;
      }
    }
    if (patch.time_of_day) break;
  }

  // 5. Detect Frequency
  for (const [freq, synonyms] of Object.entries(HINGLISH_FREQUENCY)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      const match = sanitized.match(regex);
      if (match) {
        patch.frequency = freq as Frequency;
        evidence["frequency"] = match[0].trim();
        break;
      }
    }
    if (patch.frequency) break;
  }

  // 6. Fragrance & Avoidances
  if (/\b(fragrance[- ]?free|no fragrance|bina khushbu|perfume[- ]?free|unscented)\b/i.test(sanitized)) {
    patch.fragrance_pref = "free_only";
    evidence["fragrance_pref"] = "fragrance-free";
  }

  const avoidances: string[] = [];
  if (/\b(sulphate|sulfate|sulphates|sulfates)\b/i.test(sanitized)) avoidances.push("sulphates");
  if (/\b(paraben|parabens)\b/i.test(sanitized)) avoidances.push("parabens");
  if (/\b(silicone|silicones)\b/i.test(sanitized)) avoidances.push("silicones");

  if (avoidances.length > 0) {
    patch.avoidances = avoidances;
  }

  return {
    patch,
    evidence,
    detectedLanguage,
  };
}
