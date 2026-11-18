/**
 * Clarifying Next-Question Engine
 * Rule 1: No medical diagnosis, no treatment plans. Never ask for age,
 *         diagnosis, medical history, name, or contact details.
 * Rule 2: Pure deterministic TypeScript logic. Chooses the single question
 *         that best splits remaining candidate products.
 */

import { ProductRecord } from "../product";
import { ParsedNeeds } from "./types";
import { evaluateHardExclusions } from "./index";
import { CONTROLLED_GOALS } from "../goals";

export interface QuestionOption {
  id: string;
  label: string;
  filterDimension?: "format" | "fragrance" | "category" | "goal" | "timing";
  filterValue?: string | boolean;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  dimension: "target_area" | "format_preference" | "fragrance_preference" | "hair_focus" | "routine_timing";
  options: QuestionOption[];
}

export interface NextQuestionResult {
  question: ClarifyingQuestion | null;
  candidate_count: number;
  explanation: string;
}

// --- Predefined Question Bank (Strictly non-diagnostic, no PII, no medical questions) ---
export const PREDEFINED_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "target_area",
    question: "Which specific area is your primary focus for this routine?",
    dimension: "target_area",
    options: [
      { id: "area_body", label: "Body & back care", filterDimension: "category", filterValue: "body_wash" },
      { id: "area_hair_scalp", label: "Scalp & hair health", filterDimension: "category", filterValue: "shampoo" },
      { id: "area_underarms", label: "Underarm care & freshness", filterDimension: "category", filterValue: "serum" },
      { id: "area_general", label: "Daily sun protection / skincare", filterDimension: "category", filterValue: "sunscreen" },
    ],
  },
  {
    id: "format_preference",
    question: "Which application format fits best into your daily habits?",
    dimension: "format_preference",
    options: [
      { id: "format_rinse_wash", label: "Liquid rinse-off wash (shower use)", filterDimension: "format", filterValue: "liquid" },
      { id: "format_leave_on_serum", label: "Leave-on topical serum / roll-on", filterDimension: "format", filterValue: "roll-on" },
      { id: "format_nourishing_oil", label: "Nourishing oil", filterDimension: "format", filterValue: "oil" },
      { id: "format_chewable", label: "Chewable daily gummies", filterDimension: "format", filterValue: "gummies" },
    ],
  },
  {
    id: "fragrance_preference",
    question: "Do you prefer strictly fragrance-free formulations?",
    dimension: "fragrance_preference",
    options: [
      { id: "fragrance_strict_free", label: "Yes, strictly fragrance-free", filterDimension: "fragrance", filterValue: true },
      { id: "fragrance_gentle_fine", label: "Gentle, light scent is fine", filterDimension: "fragrance", filterValue: false },
    ],
  },
  {
    id: "hair_focus",
    question: "Which hair concern would you like to prioritize first?",
    dimension: "hair_focus",
    options: [
      { id: "hair_density", label: "Hairline & parting visible density", filterDimension: "goal", filterValue: "hair_density_appearance" },
      { id: "hair_fall", label: "Comb shedding & strand breakage appearance", filterDimension: "goal", filterValue: "hair_fall_appearance" },
      { id: "hair_scalp", label: "Scalp comfort & itch relief", filterDimension: "goal", filterValue: "scalp_comfort" },
    ],
  },
  {
    id: "routine_timing",
    question: "When in your day do you intend to use this product?",
    dimension: "routine_timing",
    options: [
      { id: "timing_morning", label: "Morning routine / start of day", filterDimension: "timing", filterValue: "morning" },
      { id: "timing_evening", label: "Evening / night-time wind-down", filterDimension: "timing", filterValue: "evening" },
      { id: "timing_anytime", label: "Flexible / as needed throughout the day", filterDimension: "timing", filterValue: "anytime" },
    ],
  },
];

/**
 * Filters the catalogue down to candidate products based on current ParsedNeeds.
 */
export function getCandidateProducts(
  parsed: ParsedNeeds,
  catalogue: ProductRecord[]
): ProductRecord[] {
  // Step 1: Remove products excluded by hard avoidances
  const nonExcluded = catalogue.filter((product) => {
    const check = evaluateHardExclusions(product, parsed.avoidances);
    return !check.excluded;
  });

  if (nonExcluded.length <= 1) {
    return nonExcluded;
  }

  // Step 2: If goal is specified, filter to products matching goal or related category
  if (parsed.goal) {
    const userGoal = parsed.goal.toLowerCase().trim();
    const userGoalDef = CONTROLLED_GOALS.find((g) => g.id === userGoal);

    const goalMatches = nonExcluded.filter((p) => {
      // Exact goal match
      if (p.supported_goals.some((g) => g.toLowerCase() === userGoal)) {
        return true;
      }
      // Related category goal match
      if (userGoalDef) {
        return p.supported_goals.some((prodGoal) => {
          const prodGoalDef = CONTROLLED_GOALS.find((g) => g.id === prodGoal);
          return prodGoalDef && prodGoalDef.category === userGoalDef.category;
        });
      }
      return false;
    });

    if (goalMatches.length > 0) {
      return goalMatches;
    }
  }

  // Step 3: If category is specified, filter to that category
  if (parsed.category) {
    const catMatches = nonExcluded.filter(
      (p) => p.category.toLowerCase() === (parsed.category || "").toLowerCase()
    );
    if (catMatches.length > 0) {
      return catMatches;
    }
  }

  return nonExcluded;
}

/**
 * Calculates how many candidates match an option.
 */
function countMatchesForOption(option: QuestionOption, candidates: ProductRecord[]): number {
  if (!option.filterDimension) return 0;

  switch (option.filterDimension) {
    case "format": {
      const target = String(option.filterValue).toLowerCase();
      return candidates.filter((p) => p.format.toLowerCase().includes(target)).length;
    }
    case "fragrance": {
      const isFree = Boolean(option.filterValue);
      return candidates.filter((p) => (isFree ? p.fragrance_free === true : p.fragrance_free !== true)).length;
    }
    case "category": {
      const targetCat = String(option.filterValue).toLowerCase();
      return candidates.filter((p) => p.category.toLowerCase() === targetCat).length;
    }
    case "goal": {
      const targetGoal = String(option.filterValue).toLowerCase();
      return candidates.filter((p) => p.supported_goals.some((g) => g.toLowerCase() === targetGoal)).length;
    }
    default:
      return 0;
  }
}

/**
 * Computes the Shannon entropy score for how a question splits candidates.
 * Higher entropy means a more balanced split among candidate options.
 */
function calculateSplitEntropy(question: ClarifyingQuestion, candidates: ProductRecord[]): number {
  const total = candidates.length;
  if (total <= 1) return 0;

  const counts = question.options.map((opt) => countMatchesForOption(opt, candidates));
  const nonZeroCounts = counts.filter((c) => c > 0);

  // If all candidates fall into one bucket or zero buckets, no split occurred
  if (nonZeroCounts.length <= 1) {
    return 0;
  }

  let entropy = 0;
  for (const c of nonZeroCounts) {
    const p = c / total;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Selects the single best clarifying question that splits the remaining candidates.
 */
export function selectNextQuestion(
  parsed: ParsedNeeds,
  catalogue: ProductRecord[],
  answeredQuestionIds: string[] = []
): NextQuestionResult {
  const candidates = getCandidateProducts(parsed, catalogue);

  if (candidates.length <= 1) {
    return {
      question: null,
      candidate_count: candidates.length,
      explanation: "Sufficient clarity reached to provide product matches.",
    };
  }

  // Determine which questions are still relevant based on current ParsedNeeds
  const alreadyAnswered = new Set(answeredQuestionIds);

  const eligibleQuestions = PREDEFINED_QUESTIONS.filter((q) => {
    if (alreadyAnswered.has(q.id)) return false;

    // If user already specified fragrance avoidance, fragrance question is redundant
    if (q.id === "fragrance_preference" && parsed.avoidances.includes("fragrance")) {
      return false;
    }

    // If user already specified format preferences, format question is redundant
    if (q.id === "format_preference" && parsed.format_preferences.length > 0) {
      return false;
    }

    // If user already has a specific hair goal, hair focus question is redundant
    if (q.id === "hair_focus" && parsed.goal && parsed.goal.startsWith("hair_")) {
      return false;
    }

    // If candidates do not contain any hair products, skip hair focus question
    if (q.id === "hair_focus" && !candidates.some((p) => p.category === "shampoo" || p.category === "hair_oil")) {
      return false;
    }

    return true;
  });

  if (eligibleQuestions.length === 0) {
    return {
      question: null,
      candidate_count: candidates.length,
      explanation: "All clarifying dimensions have been addressed.",
    };
  }

  // Score each question by how evenly it splits remaining candidates
  let bestQuestion: ClarifyingQuestion | null = null;
  let bestScore = -1;

  for (const q of eligibleQuestions) {
    const entropy = calculateSplitEntropy(q, candidates);
    if (entropy > bestScore && entropy > 0) {
      bestScore = entropy;
      bestQuestion = q;
    }
  }

  // Fallback: If no question splits cleanly, pick the first eligible question that offers actionable differentiation
  if (!bestQuestion) {
    bestQuestion = eligibleQuestions[0];
  }

  return {
    question: bestQuestion,
    candidate_count: candidates.length,
    explanation: `Question '${bestQuestion.id}' provides optimal partitioning across ${candidates.length} candidate products.`,
  };
}
