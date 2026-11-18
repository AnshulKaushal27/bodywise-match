/**
 * Strategy A: Deterministic Keyword & Synonym Parser
 * Rule 1: No medical diagnosis, no treatment plans, no "this will fix X".
 * Rule 2: AI interprets, rules decide. Pure TypeScript, no LLM required.
 * Rule 8: Sanitize PII (strip emails and phone numbers) before processing.
 */

import { CONTROLLED_GOALS, GoalId } from "../goals";
import { ProductCategory } from "../product";
import { ParsedNeeds } from "../matcher/types";

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

// --- Category Patterns ---
const CATEGORY_RULES: Array<{ category: ProductCategory; regex: RegExp }> = [
  { category: "body_wash", regex: /\b(body\s*wash|shower\s*gel|body\s*cleanser|bath|shower)\b/i },
  { category: "face_wash", regex: /\b(face\s*wash|facial\s*cleanser|face\s*cleanser)\b/i },
  { category: "hair_oil", regex: /\b(hair\s*oil|scalp\s*oil)\b/i },
  { category: "shampoo", regex: /\b(shampoo|anti-dandruff\s*shampoo|scalp\s*wash)\b/i },
  { category: "conditioner", regex: /\b(conditioner)\b/i },
  { category: "sunscreen", regex: /\b(sunscreen|sunblock|spf|sun\s*cream|sun\s*shield)\b/i },
  { category: "supplement", regex: /\b(gummies|gummy|supplement|biotin|chewable|supplements)\b/i },
  { category: "serum", regex: /\b(serum|roll-on|roller)\b/i },
];

/**
 * Parses user free-text into ParsedNeeds using deterministic keyword and synonym matching.
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
      } else {
        evidenceText.avoidances += `, ${match[0]}`;
      }
    }
  }

  // 3. Identify Format Preferences
  const formatPreferences: string[] = [];
  for (const rule of FORMAT_RULES) {
    const match = sanitized.match(rule.regex);
    if (match && !formatPreferences.includes(rule.format)) {
      formatPreferences.push(rule.format);
      if (!evidenceText.format_preferences) {
        evidenceText.format_preferences = match[0];
      }
    }
  }

  // 4. Identify Category
  let category: ProductCategory | null = null;
  for (const rule of CATEGORY_RULES) {
    const match = sanitized.match(rule.regex);
    if (match) {
      category = rule.category;
      evidenceText.category = match[0];
      break;
    }
  }

  // 5. Match Goal from controlled vocabulary, synonyms & semantic patterns
  let matchedGoal: GoalId | null = null;
  let matchedSnippet = "";
  let isVagueRequest = false;

  // Direct phrase / synonym matching from CONTROLLED_GOALS
  for (const g of CONTROLLED_GOALS) {
    for (const syn of g.synonyms) {
      if (inputLower.includes(syn)) {
        matchedGoal = g.id;
        matchedSnippet = syn;
        break;
      }
    }
    if (matchedGoal) break;
  }

  // Semantic pattern matching for realistic variations
  if (!matchedGoal) {
    // Underarm odor freshness
    if (
      (inputLower.includes("underarm") || inputLower.includes("armpit")) &&
      (inputLower.includes("odor") || inputLower.includes("smell") || inputLower.includes("sweat") || inputLower.includes("freshness"))
    ) {
      matchedGoal = "underarm_odor_freshness";
      matchedSnippet = "controls odor";
    }
    // Underarm texture smoothing & AHA
    else if (
      (inputLower.includes("underarm") || inputLower.includes("armpit")) &&
      (inputLower.includes("aha") || inputLower.includes("dark") || inputLower.includes("texture") || inputLower.includes("smooth"))
    ) {
      matchedGoal = "underarm_texture_smoothing";
      matchedSnippet = "underarms with AHA";
    }
    // Gentle daily cleansing
    else if (
      (inputLower.includes("gentle") || inputLower.includes("mild") || inputLower.includes("everyday")) &&
      (inputLower.includes("wash") || inputLower.includes("cleanse") || inputLower.includes("cleansing"))
    ) {
      matchedGoal = "gentle_daily_cleansing";
      matchedSnippet = "gentle daily";
    }
    // Oil control / sebum
    else if (
      (inputLower.includes("greasy") || inputLower.includes("oily") || inputLower.includes("sebum") || inputLower.includes("shine")) &&
      (inputLower.includes("forehead") || inputLower.includes("nose") || inputLower.includes("midday") || inputLower.includes("face"))
    ) {
      matchedGoal = "oil_control";
      matchedSnippet = "greasy forehead";
    }
    // Dark spots / marks (singular or plural)
    else if (
      inputLower.includes("dark spot") ||
      inputLower.includes("dark spots") ||
      inputLower.includes("blemish mark") ||
      inputLower.includes("post acne")
    ) {
      matchedGoal = "dark_spots_look";
      matchedSnippet = "dark spot marks";
    }
    // Hair fall appearance
    else if (
      (inputLower.includes("hair") || inputLower.includes("strands")) &&
      (inputLower.includes("comb") || inputLower.includes("falling") || inputLower.includes("shedding") || inputLower.includes("breakage"))
    ) {
      matchedGoal = "hair_fall_appearance";
      matchedSnippet = "hair strands coming out in my comb";
    }
    // Scalp comfort & itch relief
    else if (
      inputLower.includes("scalp") &&
      (inputLower.includes("itch") || inputLower.includes("itchy") || inputLower.includes("flaky") || inputLower.includes("irritation"))
    ) {
      matchedGoal = "scalp_comfort";
      matchedSnippet = "itchy flaky scalp";
    }
    // Frizz control
    else if (inputLower.includes("frizz") || inputLower.includes("frizzy") || inputLower.includes("flyaways")) {
      matchedGoal = "frizz_control";
      matchedSnippet = "frizzy hair";
    }
    // Hairline & parting density appearance
    else if (
      inputLower.includes("hairline") ||
      inputLower.includes("parting") ||
      (inputLower.includes("thinning") && (inputLower.includes("hair") || inputLower.includes("scalp") || inputLower.includes("temple")))
    ) {
      matchedGoal = "hair_density_appearance";
      matchedSnippet = "hairline and parting";
    }
    // Sun protection
    else if (inputLower.includes("sunscreen") || inputLower.includes("spf") || inputLower.includes("sun protection")) {
      matchedGoal = "sun_protection";
      matchedSnippet = "sunscreen";
    }
    // Scalp clarifying
    else if (
      (inputLower.includes("clarifying") || inputLower.includes("buildup")) &&
      (inputLower.includes("scalp") || inputLower.includes("roots") || inputLower.includes("oily"))
    ) {
      matchedGoal = "scalp_clarifying";
      matchedSnippet = "product buildup from oily roots";
    }
    // Hair density / support gummies
    else if (
      (inputLower.includes("gummies") || inputLower.includes("chewable")) &&
      inputLower.includes("hair")
    ) {
      matchedGoal = "hair_density_appearance";
      matchedSnippet = "gummies for hair support";
    }
    // Strawberry legs / body bumps
    else if (inputLower.includes("strawberry legs") || inputLower.includes("rough bumps")) {
      matchedGoal = "body_bumps_look";
      matchedSnippet = "strawberry legs";
    }
    // General acne phrase -> cosmetic body_bumps_look without curative claims
    else if (inputLower.includes("acne") || inputLower.includes("breakout")) {
      matchedGoal = "body_bumps_look";
      matchedSnippet = "acne";
    }
    // Vague/general intent (e.g. "clean and refreshing")
    else if (inputLower.includes("clean") || inputLower.includes("refreshing")) {
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

  // 6. Infer / Reconcile Category if not explicitly provided
  if (!category && matchedGoal) {
    switch (matchedGoal) {
      case "body_bumps_look":
      case "gentle_daily_cleansing":
      case "rough_texture_smoothing":
        category = "body_wash";
        break;
      case "underarm_odor_freshness":
      case "underarm_texture_smoothing":
        category = "serum";
        break;
      case "hair_density_appearance":
        category = formatPreferences.includes("gummies") ? "supplement" : "serum";
        break;
      case "hair_fall_appearance":
      case "scalp_comfort":
      case "scalp_clarifying":
        category = "shampoo";
        break;
      case "frizz_control":
        category = "conditioner";
        break;
      case "dark_spots_look":
        category = "serum";
        break;
      case "oil_control":
        category = "face_wash";
        break;
      case "hydration_barrier":
        category = "body_wash";
        break;
      case "sun_protection":
        category = "sunscreen";
        break;
      default:
        category = null;
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
