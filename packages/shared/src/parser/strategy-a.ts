/**
 * Strategy A: Deterministic Keyword & Synonym Parser
 * Rule 1: No medical diagnosis, no treatment plans, no "this will fix X".
 * Rule 2: AI interprets, rules decide. Pure TypeScript, no LLM required.
 * Rule 8: Sanitize PII (strip emails and phone numbers) before processing.
 * Task Part D: Multi-need request parsing with cosmetic wording normalization.
 */

import { CONTROLLED_GOALS, GoalId } from "../goals";
import { ProductCategory } from "../product";
import { ParsedNeeds, ParsedNeed, ParsedRequest } from "../matcher/types";
import { CONTROLLED_CONCEPTS, CONCEPTS_BY_ID } from "../retrieval/concepts";
import { detectPrimaryCategory } from "../data/categories";

// --- PII Sanitization Patterns (Rule 8) ---
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/g;

/**
 * Strips phone numbers and email addresses to guarantee privacy.
 */
export function sanitizePii(input: string): string {
  if (!input) return "";
  return input
    .replace(EMAIL_REGEX, "")
    .replace(PHONE_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Medical / Diagnostic Guardrails (Rule 1) ---
const MEDICAL_DIAGNOSTIC_PATTERNS = [
  { pattern: /\b(acne\s+treatment|treat\s+acne|cure\s+acne)\b/i, term: "acne treatment" },
  { pattern: /\b(diagnose|diagnosis|diagnostic)\b/i, term: "diagnosis" },
  { pattern: /\b(cure|prescribe|prescription|medication|medicine)\b/i, term: "prescription/cure" },
  { pattern: /\b(severe\s+rash|rash\s+on\s+my|painful\s+rash)\b/i, term: "severe rash" },
  { pattern: /\b(eczema|psoriasis|dermatitis|fungal\s+infection|cystic\s+acne)\b/i, term: "clinical condition" },
];

const MEDICAL_FLAG_PATTERNS = [
  /\b(acne|cystic acne|severe acne|breakouts?)\b/i,
  /\b(infection|fungal|bacterial)\b/i,
  /\b(pain|painful|bleeding|pus|oozing)\b/i,
  /\b(rash|severe rash|swelling|swollen)\b/i,
  /\b(allergy|allergic reaction|hives)\b/i,
  /\b(eczema|psoriasis|dermatitis|rosacea)\b/i,
  /\b(cure|prescribe|prescription|medication|medicine)\b/i,
];

// --- Avoidance Patterns ---
const AVOIDANCE_RULES = [
  {
    key: "fragrance",
    regex: /\b(no\s+fragrance|fragrance[\s-]free|without\s+fragrance|unscented|no\s+perfume|without\s+perfume|no\s+scent|without\s+scent|without\s+artificial\s+fragrance)\b/i,
  },
  {
    key: "sulphates",
    regex: /\b(no\s+sulphates?|sulphate[\s-]free|without\s+sulphates?|no\s+sulfates?|sulfate[\s-]free|without\s+sulfates?|no\s+sls)\b/i,
  },
  {
    key: "parabens",
    regex: /\b(no\s+parabens?|paraben[\s-]free|without\s+parabens?)\b/i,
  },
  {
    key: "silicones",
    regex: /\b(no\s+silicones?|silicone[\s-]free|without\s+silicones?)\b/i,
  },
  {
    key: "essential oils",
    regex: /\b(no\s+essential\s+oils?|essential\s+oil[\s-]free|without\s+essential\s+oils?)\b/i,
  },
  {
    key: "alcohol",
    regex: /\b(no\s+alcohol|alcohol[\s-]free|without\s+alcohol)\b/i,
  },
];

// --- Format Patterns ---
const FORMAT_RULES = [
  { format: "liquid", regex: /\b(body\s*wash|wash|cleanser|gel|soap|liquid\s*wash|exfoliating\s*wash)\b/i },
  { format: "roll-on", regex: /\b(roll-on|roller|serum\s*roller)\b/i },
  { format: "serum", regex: /\b(serum|dropper|concentrate)\b/i },
  { format: "oil", regex: /\b(hair\s*oil|scalp\s*oil|nourishing\s*oil|oil)\b/i },
  { format: "cream", regex: /\b(cream|lotion|moisturizer|butter)\b/i },
  { format: "gummies", regex: /\b(gummies|gummy|chewable|chewables)\b/i },
  { format: "shampoo", regex: /\b(shampoo)\b/i },
];


/**
 * Normalizes aggressive/medical wording to neutral cosmetic framing.
 */
export function normalizeCosmeticWording(phrase: string, conceptId?: string): string {
  if (conceptId) {
    const concept = CONCEPTS_BY_ID.get(conceptId);
    if (concept) {
      return concept.label;
    }
    const goal = CONTROLLED_GOALS.find((g) => g.id === conceptId);
    if (goal) {
      return goal.label;
    }
  }

  let cleaned = phrase
    .replace(/\b(i want|i need|looking for|help with|something for|please find|can you find)\b/gi, "")
    .trim();

  cleaned = cleaned
    .replace(/\b(blackhead\s+removal|blackhead\s+treatment|remove\s+blackheads|cure\s+blackheads)\b/gi, "reduce the look of blackheads")
    .replace(/\b(oily\s+skin\s+treatment|treat\s+oily\s+skin|cure\s+oily\s+skin|fix\s+oily\s+skin)\b/gi, "oil control")
    .replace(/\b(acne\s+treatment|treat\s+acne|cure\s+acne|fix\s+acne)\b/gi, "blemish care & surface clarifying")
    .replace(/\b(treatment|cure|fix|eliminate|remove\s+permanently)\b/gi, "cosmetic care")
    .trim();

  if (!cleaned) return phrase;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Multi-need deterministic rules parser (Task Part D fallback)
 * Splits free-text across multi-concern conjunctions ("and", commas, "also", "plus", "&").
 * Strictly maps to CONTROLLED_CONCEPTS and preserves cosmetic framing.
 */
export function parseRequestKeyword(rawInput: string): ParsedRequest {
  const sanitized = sanitizePii(rawInput);
  const lower = sanitized.toLowerCase();

  // 1. Medical flag detection
  const medical_flag = MEDICAL_FLAG_PATTERNS.some((pat) => pat.test(lower));

  // 2. Avoidances extraction
  const avoidances: string[] = [];
  for (const rule of AVOIDANCE_RULES) {
    if (rule.regex.test(sanitized)) {
      avoidances.push(rule.key);
    }
  }

  // 3. Routine context extraction
  let routine_context: string | null = null;
  if (lower.includes("evening") || lower.includes("night") || lower.includes("bedtime") || lower.includes("pm")) {
    routine_context = "evening";
  } else if (lower.includes("morning") || lower.includes("daytime") || lower.includes("am")) {
    routine_context = "morning";
  } else if (lower.includes("shower") || lower.includes("bath")) {
    routine_context = "shower";
  }

  // 4. Split into distinct need segments
  // Split on "and", commas, "also", "plus", "&", "with"
  const splitRegex = /\s+(?:and\s+also|and|also|plus|along\s+with|&|\+)\s+|,\s*/gi;
  const segments = sanitized
    .split(splitRegex)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const rawSegments = segments.length > 0 ? segments : [sanitized];

  const needs: ParsedNeed[] = [];
  let needCounter = 1;

  for (const seg of rawSegments) {
    const segLower = seg.toLowerCase();
    const matchedConcepts: string[] = [];

    // Concept matching via synonyms
    for (const concept of CONTROLLED_CONCEPTS) {
      for (const syn of concept.synonyms) {
        const pattern = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (pattern.test(segLower)) {
          if (!matchedConcepts.includes(concept.id)) {
            matchedConcepts.push(concept.id);
          }
          break;
        }
      }
    }

    // Explicit category detection via authoritative detector (Section B.1 & B.2)
    let preferredCategory: ProductCategory | null = null;
    const detectedInSeg = detectPrimaryCategory(seg);
    const detectedInFull = detectPrimaryCategory(rawInput);
    if (detectedInSeg) {
      preferredCategory = detectedInSeg.categoryId as ProductCategory;
    } else if (detectedInFull) {
      preferredCategory = detectedInFull.categoryId as ProductCategory;
    } else if (matchedConcepts.length > 0) {
      // Default preferred category for legacy multi-need retrieval if no explicit category in input
      const first = matchedConcepts[0];
      if (first === "blackhead_look" || first === "oil_control") {
        preferredCategory = "face_wash";
      } else if (first === "body_bumps_look") {
        preferredCategory = "body_wash";
      } else if (first === "hair_fall_appearance" || first === "scalp_comfort") {
        preferredCategory = "shampoo";
      }
    }

    // Format preference in this segment
    const formatPrefs: string[] = [];
    for (const rule of FORMAT_RULES) {
      if (rule.regex.test(segLower)) {
        formatPrefs.push(rule.format);
      }
    }

    const primaryConcept = matchedConcepts[0];
    const normalisedLabel = primaryConcept
      ? normalizeCosmeticWording(seg, primaryConcept)
      : normalizeCosmeticWording(seg);

    needs.push({
      id: `need_${needCounter++}`,
      phrase_from_user: seg,
      concepts: matchedConcepts,
      preferred_category: preferredCategory,
      format_preferences: formatPrefs,
      priority: needCounter === 2 ? "primary" : "secondary",
      confidence: matchedConcepts.length > 0 ? "high" : "medium",
      normalised_label: normalisedLabel,
    });
  }

  // If a segment didn't match any concept but whole input matches, fallback to whole input concepts
  if (needs.every((n) => n.concepts.length === 0)) {
    const fallbackConcepts: string[] = [];
    for (const concept of CONTROLLED_CONCEPTS) {
      for (const syn of concept.synonyms) {
        const pattern = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (pattern.test(lower)) {
          if (!fallbackConcepts.includes(concept.id)) {
            fallbackConcepts.push(concept.id);
          }
          break;
        }
      }
    }
    if (fallbackConcepts.length > 0 && needs.length > 0) {
      needs[0].concepts = fallbackConcepts;
      needs[0].normalised_label = normalizeCosmeticWording(sanitized, fallbackConcepts[0]);
    }
  }

  return {
    needs,
    avoidances,
    routine_context,
    uncertainties: [],
    follow_up_question: null,
    medical_flag,
  };
}

/**
 * Parses user free-text into ParsedNeeds using deterministic keyword and synonym matching.
 * Preserves 100% of the original Strategy A logic for single-goal flows and all tests.
 */
export function parseNeedsKeyword(rawInput: string): ParsedNeeds {
  // Rule 8: Strip PII first
  const sanitized = sanitizePii(rawInput);
  const inputLower = sanitized.toLowerCase();

  const evidenceText: Record<string, string> = {};
  const uncertainties: string[] = [];

  // 1. Check Medical / Diagnostic Guardrails
  let hasMedicalDiagnosticClaim = false;
  for (const med of MEDICAL_DIAGNOSTIC_PATTERNS) {
    const match = sanitized.match(med.pattern);
    if (match) {
      hasMedicalDiagnosticClaim = true;
      uncertainties.push(
        "Medical diagnosis or treatment requested; Bodywise Match provides non-diagnostic cosmetic product discovery only."
      );
      evidenceText.uncertainties = match[0];
      break;
    }
  }

  // 2. Identify Avoidances
  const avoidances: string[] = [];
  for (const rule of AVOIDANCE_RULES) {
    const match = sanitized.match(rule.regex);
    if (match) {
      avoidances.push(rule.key);
      if (!evidenceText.avoidances) {
        evidenceText.avoidances = match[0];
      }
    }
  }

  // 3. Identify Format Preferences
  const formatPreferences: string[] = [];
  for (const rule of FORMAT_RULES) {
    const match = sanitized.match(rule.regex);
    if (match) {
      if (!formatPreferences.includes(rule.format)) {
        formatPreferences.push(rule.format);
        if (!evidenceText.format_preferences) {
          evidenceText.format_preferences = match[0];
        }
      }
    }
  }

  // 4. Identify Explicit Category via Authoritative Detector (Section B.1 & B.2)
  let category: ProductCategory | null = null;
  const detectedCategory = detectPrimaryCategory(sanitized);
  if (detectedCategory) {
    if (detectedCategory.categoryId === "roll_on") {
      category = "serum"; // Map roll-on to serum for legacy ProductCategory enum
    } else if (detectedCategory.categoryId === "moisturizer") {
      category = "other";
    } else {
      category = detectedCategory.categoryId as ProductCategory;
    }
    evidenceText.category = detectedCategory.matchedText;
  }

  // 5. Match Controlled Goal
  let matchedGoal: GoalId | null = null;
  let matchedSnippet: string | null = null;
  let isVagueRequest = false;

  for (const goal of CONTROLLED_GOALS) {
    for (const syn of goal.synonyms) {
      const synLower = syn.toLowerCase();
      if (inputLower.includes(synLower)) {
        matchedGoal = goal.id;
        matchedSnippet = syn;
        break;
      }
    }
    if (matchedGoal) break;
  }

  // Secondary synonym rules if exact synonym not found
  if (!matchedGoal) {
    if (inputLower.includes("odor") || inputLower.includes("sweat") || inputLower.includes("smell")) {
      matchedGoal = "underarm_odor_freshness";
      matchedSnippet = "underarm odor freshness";
    } else if (
      inputLower.includes("underarm") &&
      (inputLower.includes("aha") || inputLower.includes("texture") || inputLower.includes("smooth") || inputLower.includes("dark") || inputLower.includes("pigment") || inputLower.includes("roll-on"))
    ) {
      matchedGoal = "underarm_texture_smoothing";
      matchedSnippet = "underarm texture smoothing";
    } else if (
      inputLower.includes("gentle") &&
      (inputLower.includes("daily") || inputLower.includes("wash") || inputLower.includes("cleanser"))
    ) {
      matchedGoal = "gentle_daily_cleansing";
      matchedSnippet = "gentle daily cleansing";
    } else if (
      (inputLower.includes("bump") || inputLower.includes("rough") || inputLower.includes("strawberry")) &&
      (inputLower.includes("arm") || inputLower.includes("leg") || inputLower.includes("back") || inputLower.includes("body"))
    ) {
      matchedGoal = "body_bumps_look";
      matchedSnippet = "body bumps on arms and back";
    } else if (inputLower.includes("tight") || inputLower.includes("dry") || inputLower.includes("barrier")) {
      matchedGoal = "hydration_barrier";
      matchedSnippet = "dry tight skin";
    } else if (inputLower.includes("dark spot") || inputLower.includes("marks") || inputLower.includes("pigment")) {
      matchedGoal = "dark_spots_look";
      matchedSnippet = "dark spot marks";
    } else if (inputLower.includes("greasy") || inputLower.includes("sebum") || inputLower.includes("oil") || inputLower.includes("blackhead")) {
      matchedGoal = "oil_control";
      matchedSnippet = "oil control";
    } else if (inputLower.includes("flake") || inputLower.includes("itch") || inputLower.includes("dandruff")) {
      matchedGoal = "scalp_comfort";
      matchedSnippet = "itchy flaky scalp";
    } else if (inputLower.includes("fall") || inputLower.includes("shedding") || inputLower.includes("comb")) {
      matchedGoal = "hair_fall_appearance";
      matchedSnippet = "hair strands coming out in comb";
    } else if (inputLower.includes("frizz") || inputLower.includes("frizzy") || inputLower.includes("flyaways")) {
      matchedGoal = "frizz_control";
      matchedSnippet = "frizzy hair";
    } else if (
      inputLower.includes("hairline") ||
      inputLower.includes("parting") ||
      (inputLower.includes("thinning") && (inputLower.includes("hair") || inputLower.includes("scalp") || inputLower.includes("temple")))
    ) {
      matchedGoal = "hair_density_appearance";
      matchedSnippet = "hairline and parting";
    } else if (inputLower.includes("sunscreen") || inputLower.includes("spf") || inputLower.includes("sun protection")) {
      matchedGoal = "sun_protection";
      matchedSnippet = "sunscreen";
    } else if (
      (inputLower.includes("clarifying") || inputLower.includes("buildup")) &&
      (inputLower.includes("scalp") || inputLower.includes("roots") || inputLower.includes("oily"))
    ) {
      matchedGoal = "scalp_clarifying";
      matchedSnippet = "product buildup from oily roots";
    } else if (
      (inputLower.includes("gummies") || inputLower.includes("chewable")) &&
      inputLower.includes("hair")
    ) {
      matchedGoal = "hair_density_appearance";
      matchedSnippet = "gummies for hair support";
    } else if (inputLower.includes("strawberry legs") || inputLower.includes("rough bumps")) {
      matchedGoal = "body_bumps_look";
      matchedSnippet = "strawberry legs";
    } else if (inputLower.includes("acne") || inputLower.includes("breakout")) {
      matchedGoal = "body_bumps_look";
      matchedSnippet = "acne";
    } else if (inputLower.includes("clean") || inputLower.includes("refreshing")) {
      matchedGoal = "gentle_daily_cleansing";
      matchedSnippet = "clean and refreshing";
      isVagueRequest = true;
    }
  }

  // Multi-concern conflict detection
  const mentionsHair = inputLower.includes("hair") || inputLower.includes("scalp");
  const mentionsBody = inputLower.includes("body") || inputLower.includes("back") || inputLower.includes("bumps");
  const mentionsUnderarm = inputLower.includes("underarm") || inputLower.includes("armpit");

  const distinctDomains = [mentionsHair, mentionsBody, mentionsUnderarm].filter(Boolean).length;
  if (distinctDomains > 1) {
    uncertainties.push(
      "Multiple distinct body zones mentioned (e.g. hair and body); use a clarifying question to confirm target focus."
    );
  }

  if (matchedGoal) {
    evidenceText.goal = matchedSnippet || matchedGoal;
  }

  // 6. Infer fallback category for legacy ParsedNeeds if goal implies default domain:
  if (!category && matchedGoal) {
    if (matchedGoal === "body_bumps_look" || matchedGoal === "gentle_daily_cleansing") {
      category = "body_wash";
    } else if (
      matchedGoal === "hair_fall_appearance" ||
      matchedGoal === "scalp_comfort" ||
      matchedGoal === "scalp_clarifying" ||
      matchedGoal === "frizz_control"
    ) {
      category = "shampoo";
    } else if (
      matchedGoal === "underarm_odor_freshness" ||
      matchedGoal === "underarm_texture_smoothing" ||
      matchedGoal === "hair_density_appearance" ||
      matchedGoal === "dark_spots_look"
    ) {
      category = "serum";
    } else if (matchedGoal === "sun_protection") {
      category = "sunscreen";
    }
  }

  // 7. Calculate Confidence
  let confidence: "low" | "medium" | "high" = "medium";

  if (
    hasMedicalDiagnosticClaim ||
    distinctDomains > 1 ||
    !matchedGoal ||
    isVagueRequest ||
    sanitized.length < 10
  ) {
    confidence = "low";
  } else if (
    matchedGoal &&
    (category || formatPreferences.length > 0 || avoidances.length > 0)
  ) {
    confidence = "high";
  } else if (matchedGoal) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // If pure diagnostic/clinical inquiry with no cosmetic relevance, clear goal
  if (
    hasMedicalDiagnosticClaim &&
    (inputLower.includes("diagnose") || inputLower.includes("severe rash"))
  ) {
    matchedGoal = null;
    category = null;
  }

  return {
    goal: matchedGoal,
    category,
    format_preferences: formatPreferences,
    avoidances,
    routine_context: null,
    uncertainties,
    confidence,
    evidence_text: Object.keys(evidenceText).length > 0 ? evidenceText : undefined,
  };
}
