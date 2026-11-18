/**
 * Pure Deterministic Matching Engine
 * Version 1.0.0 (AI interprets, rules decide — Rule 2)
 */

import { ProductRecord } from "../product";
import { CONTROLLED_GOALS } from "../goals";
import {
  MATCHER_WEIGHTS,
  MATCHER_THRESHOLDS,
  RULES_VERSION,
} from "./matcher.config";
import {
  ParsedNeeds,
  MatchResult,
  Recommendation,
  MatcherReasonCode,
  MatchLabel,
} from "./types";

export * from "./types";
export * from "./matcher.config";
export * from "./explanations";

interface ScoredProduct {
  product: ProductRecord;
  score: number;
  reasonCodes: MatcherReasonCode[];
  matchedFields: string[];
  missingFacts: string[];
  considerIf: string[];
  mayNotFitIf: string[];
  verifiedFactsCount: number;
}

/**
 * Counts how many objective facts have verified, non-null values.
 * Used for deterministic tie-breaking (Rule 5: More verified facts first).
 */
export function countVerifiedFacts(product: ProductRecord): number {
  let count = 0;
  if (product.ingredients !== null && product.ingredients.length > 0) count++;
  if (product.cautions !== null && product.cautions.length > 0) count++;
  if (product.price_inr !== null) count++;
  if (product.price_source !== null) count++;
  if (product.source_url !== null && product.source_url.length > 0) count++;
  if (product.last_verified_at !== null) count++;
  if (product.image_url !== null) count++;
  if (product.fragrance_free !== null) count++;
  if (product.suitable_for !== null && product.suitable_for.length > 0) count++;
  return count;
}

/**
 * Checks hard exclusions and unverified avoidance rules (Step 1).
 * Returns { excluded: boolean; reason?: string; unverifiedAvoidances: string[] }
 */
export function evaluateHardExclusions(
  product: ProductRecord,
  avoidances: string[]
): {
  excluded: boolean;
  exclusionReason?: string;
  unverifiedAvoidances: string[];
} {
  const unverifiedAvoidances: string[] = [];

  for (const rawAvoidance of avoidances) {
    const avoidance = rawAvoidance.toLowerCase().trim();
    if (!avoidance) continue;

    // Fragrance avoidance check
    if (avoidance === "fragrance" || avoidance === "perfume" || avoidance === "scent") {
      if (product.fragrance_free === false) {
        return {
          excluded: true,
          exclusionReason: "Product is explicitly declared as containing fragrance.",
          unverifiedAvoidances,
        };
      }
      if (product.fragrance_free === null) {
        unverifiedAvoidances.push("fragrance-free status");
      }
      continue;
    }

    // Ingredient-specific avoidances
    if (product.ingredients !== null) {
      const match = product.ingredients.some((ing) => {
        const ingLower = ing.toLowerCase();
        return ingLower.includes(avoidance) || avoidance.includes(ingLower);
      });
      if (match) {
        return {
          excluded: true,
          exclusionReason: `Product contains avoided ingredient matching '${avoidance}'.`,
          unverifiedAvoidances,
        };
      }
    } else {
      // Ingredients list is null in catalogue: KEEP but attach unverified avoidance
      unverifiedAvoidances.push(`ingredients list for ${avoidance}`);
    }

    // Check official label cautions for conflicts
    if (product.cautions !== null) {
      const cautionMatch = product.cautions.some((c) =>
        c.toLowerCase().includes(avoidance)
      );
      if (cautionMatch) {
        return {
          excluded: true,
          exclusionReason: `Product official cautions conflict with avoidance '${avoidance}'.`,
          unverifiedAvoidances,
        };
      }
    }
  }

  return {
    excluded: false,
    unverifiedAvoidances,
  };
}

/**
 * Pure deterministic matcher
 */
export function matchProducts(
  parsed: ParsedNeeds,
  catalogue: ProductRecord[]
): MatchResult {
  if (!catalogue || catalogue.length === 0) {
    return {
      status: "NO_FIT",
      rules_version: RULES_VERSION,
      suggestion: "BROWSE_CATALOGUE",
      reason: "The product catalogue is empty.",
      total_evaluated: 0,
    };
  }

  const normalizedUserGoal = parsed.goal ? parsed.goal.toLowerCase().trim() : "";
  const scoredCandidates: ScoredProduct[] = [];

  // Step 1: Hard exclusions & scoring
  for (const product of catalogue) {
    const exclusionCheck = evaluateHardExclusions(product, parsed.avoidances);
    if (exclusionCheck.excluded) {
      continue; // Exclude from shortlist
    }

    let score = 0;
    const reasonCodes: MatcherReasonCode[] = [];
    const matchedFields: string[] = [];
    const missingFacts: string[] = [];
    const considerIf: string[] = [];
    const mayNotFitIf: string[] = [];

    // Document unverified avoidances if present
    if (exclusionCheck.unverifiedAvoidances.length > 0) {
      reasonCodes.push("UNVERIFIED_AVOIDANCE");
      for (const unv of exclusionCheck.unverifiedAvoidances) {
        missingFacts.push(`Unverified ${unv}: We couldn't verify this against official records.`);
      }
    }

    // Step 2: Goal and category fit
    const hasExactGoalMatch = product.supported_goals.some(
      (g) => g.toLowerCase() === normalizedUserGoal
    );

    if (hasExactGoalMatch) {
      score += MATCHER_WEIGHTS.EXACT_GOAL_FIT;
      reasonCodes.push("EXACT_GOAL_MATCH");
      matchedFields.push("supported_goals: exact match");
      considerIf.push(`Your stated goal is ${parsed.goal}, which this product directly addresses.`);
    } else {
      // Related goal check (same domain or related controlled goal)
      const userGoalDef = CONTROLLED_GOALS.find((g) => g.id === normalizedUserGoal);
      const isRelatedGoal = product.supported_goals.some((prodGoal) => {
        const prodGoalDef = CONTROLLED_GOALS.find((g) => g.id === prodGoal);
        return (
          userGoalDef &&
          prodGoalDef &&
          userGoalDef.category === prodGoalDef.category
        );
      });

      if (isRelatedGoal) {
        score += MATCHER_WEIGHTS.RELATED_GOAL_FIT;
        reasonCodes.push("RELATED_GOAL_MATCH");
        matchedFields.push("supported_goals: related match");
        considerIf.push("May support complementary aspects of your primary wellness goal.");
      }
    }

    // Category fit
    if (parsed.category) {
      const normUserCat = parsed.category.toLowerCase().replace(/[\s-]/g, "_");
      const normProdCat = product.category.toLowerCase().replace(/[\s-]/g, "_");

      if (normUserCat === normProdCat) {
        score += MATCHER_WEIGHTS.CATEGORY_FIT;
        reasonCodes.push("CATEGORY_FIT");
        matchedFields.push("category");
      }
    }

    // Step 3: Preference fit
    if (parsed.format_preferences && parsed.format_preferences.length > 0) {
      const matchesFormat = parsed.format_preferences.some((fp) =>
        product.format.toLowerCase().includes(fp.toLowerCase().trim())
      );
      if (matchesFormat) {
        score += MATCHER_WEIGHTS.FORMAT_MATCH;
        reasonCodes.push("FORMAT_PREFERENCE_MET");
        matchedFields.push("format");
        considerIf.push(`Matches your preference for a ${product.format} format.`);
      }
    }

    // Avoidance satisfied & verified
    if (parsed.avoidances && parsed.avoidances.length > 0) {
      const hasFragranceAvoidance = parsed.avoidances.some(
        (a) => a.toLowerCase() === "fragrance"
      );
      if (hasFragranceAvoidance && product.fragrance_free === true) {
        score += MATCHER_WEIGHTS.AVOIDANCE_SATISFIED_VERIFIED;
        reasonCodes.push("AVOIDANCE_SATISFIED_VERIFIED");
        matchedFields.push("fragrance_free: verified");
        considerIf.push("Verified 100% fragrance-free per official label specifications.");
      }
    }

    // Step 4: Routine compatibility
    if (parsed.routine_context) {
      // Simple non-conflicting routine check
      score += MATCHER_WEIGHTS.ROUTINE_COMPATIBLE;
      reasonCodes.push("ROUTINE_COMPATIBLE");
      matchedFields.push("routine_context");
    }

    // Check missing catalogue facts
    if (product.ingredients === null) {
      missingFacts.push("Complete ingredients list is not verified yet.");
    }
    if (product.price_inr === null) {
      missingFacts.push("Price has not been verified from official store.");
    }
    if (product.last_verified_at === null) {
      missingFacts.push("Verification timestamp not yet recorded.");
    }
    if (missingFacts.length > 0 && !reasonCodes.includes("MISSING_FACTS_NOTED")) {
      reasonCodes.push("MISSING_FACTS_NOTED");
    }

    // Label cautions to mayNotFitIf
    if (product.cautions && product.cautions.length > 0) {
      for (const caution of product.cautions) {
        mayNotFitIf.push(caution);
      }
      if (!reasonCodes.includes("CAUTION_APPLIED")) {
        reasonCodes.push("CAUTION_APPLIED");
      }
    } else {
      mayNotFitIf.push("Patch test on a small area of skin before starting regular use.");
    }

    const verifiedFactsCount = countVerifiedFacts(product);

    scoredCandidates.push({
      product,
      score,
      reasonCodes,
      matchedFields,
      missingFacts,
      considerIf,
      mayNotFitIf,
      verifiedFactsCount,
    });
  }

  // Filter candidates by minimum fit threshold
  const qualifying = scoredCandidates.filter(
    (c) => c.score >= MATCHER_THRESHOLDS.MIN_SCORE_FOR_FIT
  );

  if (qualifying.length === 0) {
    return {
      status: "NO_FIT",
      rules_version: RULES_VERSION,
      suggestion: "BROWSE_CATALOGUE",
      reason: "No product in the catalogue met the required fit threshold for this combination of goals and avoidances.",
      total_evaluated: catalogue.length,
    };
  }

  // Step 5: Pure deterministic tie-breaks
  // 1. score descending
  // 2. verifiedFactsCount descending (more verified facts first)
  // 3. slug ascending (alphabetical)
  qualifying.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.verifiedFactsCount !== a.verifiedFactsCount) {
      return b.verifiedFactsCount - a.verifiedFactsCount;
    }
    return a.product.slug.localeCompare(b.product.slug);
  });

  // Take top N
  const topCandidates = qualifying.slice(0, MATCHER_THRESHOLDS.MAX_SHORTLIST_SIZE);

  const shortlist: Recommendation[] = topCandidates.map((candidate, idx) => {
    const rank = (idx + 1) as 1 | 2 | 3;

    let matchLabel: MatchLabel = "PARTIAL_FIT";
    if (
      candidate.score >= MATCHER_THRESHOLDS.STRONG_FIT_SCORE &&
      candidate.reasonCodes.includes("FORMAT_PREFERENCE_MET")
    ) {
      matchLabel = "STRONG_FORMAT_FIT";
    } else if (candidate.reasonCodes.includes("EXACT_GOAL_MATCH")) {
      matchLabel = "GOAL_FIT";
    } else if (
      candidate.reasonCodes.includes("ROUTINE_COMPATIBLE") &&
      candidate.reasonCodes.includes("CATEGORY_FIT")
    ) {
      matchLabel = "ROUTINE_FIT";
    } else if (candidate.reasonCodes.includes("UNVERIFIED_AVOIDANCE")) {
      matchLabel = "CAUTIONARY_FIT";
    }

    return {
      productId: candidate.product.id,
      rank,
      reasonCodes: candidate.reasonCodes,
      matchLabel,
      considerIf:
        candidate.considerIf.length > 0
          ? candidate.considerIf
          : ["May be relevant to your stated wellness goal."],
      mayNotFitIf: candidate.mayNotFitIf,
      matchedFields: candidate.matchedFields,
      missingFacts: candidate.missingFacts,
    };
  });

  return {
    status: "MATCHES_FOUND",
    rules_version: RULES_VERSION,
    shortlist,
    total_evaluated: catalogue.length,
  };
}
