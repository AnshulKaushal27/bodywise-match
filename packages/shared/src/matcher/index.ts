/**
 * Pure Deterministic Matching Engine
 * Version 2.0.0 (Multi-Need RAG & Deterministic Ranking)
 * Follows AGENTS.md (Rule 1: No diagnosis; Rule 2: Deterministic rules decide)
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
  ParsedNeed,
  ParsedRequest,
  MatchResult,
  Recommendation,
  NeedRecommendation,
  NeedMatchGroup,
  MultiNeedMatchResult,
  MatcherReasonCode,
  MatcherReasonCodeSchema,
  MatchLabel,
} from "./types";
import { defaultRetriever, Retriever } from "../retrieval/retriever";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";

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

interface ScoredCandidate {
  product: ProductRecord;
  score: number;
  bm25Score: number;
  conceptHits: string[];
  evidenceSnippets: string[];
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
      const baseAvoidance =
        avoidance.endsWith("s") && avoidance.length > 3 ? avoidance.slice(0, -1) : avoidance;
      const match = product.ingredients.some((ing) => {
        const ingLower = ing.toLowerCase();
        return (
          ingLower.includes(avoidance) ||
          avoidance.includes(ingLower) ||
          ingLower.includes(baseAvoidance)
        );
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
 * Builds an honest, non-diagnostic "Why it's here" explanation from templates and facts.
 */
function buildWhyHereExplanation(
  product: ProductRecord,
  conceptHits: string[],
  evidenceSnippets: string[],
  need: ParsedNeed
): { whyHere: string; sourceTag: string } {
  let whyHere = "";
  if (conceptHits.length > 0 && evidenceSnippets.length > 0) {
    const primaryConcept = conceptHits[0];
    const conceptObj = CONCEPTS_BY_ID.get(primaryConcept);
    const conceptName = conceptObj?.label || primaryConcept;
    const quote = evidenceSnippets[0];
    whyHere = `Formulated for ${conceptName.toLowerCase()} per official formula: "${quote}".`;
  } else if (need.preferred_category && product.category === need.preferred_category) {
    whyHere = `Matches your requested ${product.category.replace(/_/g, " ")} format for daily care.`;
  } else {
    whyHere = `Designed for personal care relevant to ${need.normalised_label || need.phrase_from_user}.`;
  }

  const sourceTag = product.source_url
    ? `Verified from official store page (${product.source_url})`
    : `Verified from official catalogue facts`;

  return { whyHere, sourceTag };
}

/**
 * Multi-Need Deterministic Matcher (Task Part E)
 * For each need:
 * 1. Candidates = retrieve(need, k=6), then apply hard exclusions
 * 2. Score from config (matcher.config.ts)
 * 3. Product must have at least one evidenced concept to qualify, else NO_FIT
 * 4. Deduplicate across needs: prefer distinct product categories across needs
 * 5. Rules version 2.0.0
 */
export async function matchMultiNeeds(
  request: ParsedRequest,
  catalogue: ProductRecord[],
  retriever: Retriever = defaultRetriever
): Promise<MultiNeedMatchResult> {
  const productsById = new Map<string, ProductRecord>(catalogue.map((p) => [p.id, p]));
  const groups: NeedMatchGroup[] = [];
  const assignedProductIds = new Set<string>();
  const assignedCategories = new Set<string>();

  for (const need of request.needs) {
    // 1. Retrieve candidates
    const rawCandidates = await retriever.retrieve(need, 6);

    const scoredCandidates: ScoredCandidate[] = [];

    for (const cand of rawCandidates) {
      const product = productsById.get(cand.productId);
      if (!product) continue;

      // Apply hard exclusions
      const exclusionCheck = evaluateHardExclusions(product, request.avoidances);
      if (exclusionCheck.excluded) continue;

      // Part E.3: A product must have at least one evidenced concept for the need to qualify!
      if (cand.conceptHits.length === 0) {
        continue;
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
          missingFacts.push(`We couldn't verify this product's ${unv} against official packaging.`);
        }
      }

      // 1. Concept evidence match (highest priority weight)
      score += MATCHER_WEIGHTS.CONCEPT_EVIDENCE_MATCH * cand.conceptHits.length;
      reasonCodes.push(MatcherReasonCodeSchema.enum.CONCEPT_EVIDENCE_MATCH);
      matchedFields.push("concept_evidence");
      if (cand.evidenceSnippets.length > 0) {
        considerIf.push(`Official published formula notes: "${cand.evidenceSnippets[0]}".`);
      }

      // 2. Preferred category match
      if (need.preferred_category && product.category === need.preferred_category) {
        score += MATCHER_WEIGHTS.CATEGORY_FIT;
        reasonCodes.push(MatcherReasonCodeSchema.enum.CATEGORY_FIT);
        matchedFields.push("category");
        considerIf.push(`Matches your requested ${product.category.replace(/_/g, " ")} format.`);
      }

      // 3. Format match
      if (need.format_preferences && need.format_preferences.length > 0) {
        const matchesFormat = need.format_preferences.some((fp) =>
          product.format.toLowerCase().includes(fp.toLowerCase().trim())
        );
        if (matchesFormat) {
          score += MATCHER_WEIGHTS.FORMAT_MATCH;
          reasonCodes.push(MatcherReasonCodeSchema.enum.FORMAT_PREFERENCE_MET);
          matchedFields.push("format");
          considerIf.push(`Matches your preferred ${product.format} format.`);
        }
      }

      // 4. Bounded retrieval score bonus
      const boundedBonus = Math.min(Math.max(0, cand.bm25Score), MATCHER_WEIGHTS.RETRIEVAL_BONUS_MAX);
      score += boundedBonus;

      // 5. Avoidance verified & satisfied
      if (request.avoidances && request.avoidances.length > 0) {
        const hasFragranceAvoidance = request.avoidances.some((a) => a.toLowerCase() === "fragrance");
        if (hasFragranceAvoidance && product.fragrance_free === true) {
          score += MATCHER_WEIGHTS.AVOIDANCE_SATISFIED_VERIFIED;
          reasonCodes.push(MatcherReasonCodeSchema.enum.AVOIDANCE_SATISFIED_VERIFIED);
          matchedFields.push("fragrance_free: verified");
          considerIf.push("Verified 100% fragrance-free per official label specifications.");
        }
      }

      // 6. Routine compatibility
      if (request.routine_context) {
        score += MATCHER_WEIGHTS.ROUTINE_COMPATIBLE;
        reasonCodes.push(MatcherReasonCodeSchema.enum.ROUTINE_COMPATIBLE);
        matchedFields.push("routine_context");
      }

      // Missing facts check
      if (product.ingredients === null) {
        missingFacts.push("Complete ingredients list is not verified yet.");
      }
      if (product.price_inr === null) {
        missingFacts.push("Price has not been verified from official store.");
      }
      if (product.last_verified_at === null) {
        missingFacts.push("Verification timestamp not yet recorded.");
      }
      if (missingFacts.length > 0 && !reasonCodes.includes(MatcherReasonCodeSchema.enum.MISSING_FACTS_NOTED)) {
        reasonCodes.push(MatcherReasonCodeSchema.enum.MISSING_FACTS_NOTED);
      }

      // Label cautions
      if (product.cautions && product.cautions.length > 0) {
        for (const caution of product.cautions) {
          mayNotFitIf.push(caution);
        }
        if (!reasonCodes.includes(MatcherReasonCodeSchema.enum.CAUTION_APPLIED)) {
          reasonCodes.push(MatcherReasonCodeSchema.enum.CAUTION_APPLIED);
        }
      } else {
        mayNotFitIf.push("Patch test on a small area of skin before regular use.");
      }

      scoredCandidates.push({
        product,
        score,
        bm25Score: cand.bm25Score,
        conceptHits: cand.conceptHits,
        evidenceSnippets: cand.evidenceSnippets,
        reasonCodes,
        matchedFields,
        missingFacts,
        considerIf,
        mayNotFitIf,
        verifiedFactsCount: countVerifiedFacts(product),
      });
    }

    if (scoredCandidates.length === 0) {
      groups.push({
        needId: need.id,
        needLabel: need.normalised_label || need.phrase_from_user,
        rawPhrase: need.phrase_from_user,
        category: need.preferred_category,
        status: "NO_FIT",
        noFitReason: `No products in the catalogue met the verified fit requirements for ${need.phrase_from_user}.`,
        recommendations: [],
      });
      continue;
    }

    // Deterministic tie-breaking:
    // 1. score descending
    // 2. verified facts count descending
    // 3. slug ascending
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.verifiedFactsCount !== a.verifiedFactsCount) return b.verifiedFactsCount - a.verifiedFactsCount;
      return a.product.slug.localeCompare(b.product.slug);
    });

    // Deduplication across needs:
    // Prefer distinct products and different product categories across needs
    let selectedCandidates: ScoredCandidate[] = [];

    // First attempt: unassigned products
    const unassigned = scoredCandidates.filter((c) => !assignedProductIds.has(c.product.id));
    // Category diversity bonus: prefer categories not yet assigned
    const diverseCategory = unassigned.filter((c) => !assignedCategories.has(c.product.category));

    if (diverseCategory.length > 0) {
      selectedCandidates = diverseCategory.slice(0, MATCHER_THRESHOLDS.MAX_SHORTLIST_SIZE);
      // Fill remaining slots from unassigned
      if (selectedCandidates.length < MATCHER_THRESHOLDS.MAX_SHORTLIST_SIZE) {
        for (const cand of unassigned) {
          if (!selectedCandidates.some((sc) => sc.product.id === cand.product.id)) {
            selectedCandidates.push(cand);
            if (selectedCandidates.length >= MATCHER_THRESHOLDS.MAX_SHORTLIST_SIZE) break;
          }
        }
      }
    } else if (unassigned.length > 0) {
      selectedCandidates = unassigned.slice(0, MATCHER_THRESHOLDS.MAX_SHORTLIST_SIZE);
    } else {
      // If all candidates are assigned, show top candidate with dual whyHere explanation
      selectedCandidates = scoredCandidates.slice(0, 1);
    }

    for (const sc of selectedCandidates) {
      assignedProductIds.add(sc.product.id);
      assignedCategories.add(sc.product.category);
    }

    const recommendations: NeedRecommendation[] = selectedCandidates.map((cand, idx) => {
      const rank = (idx + 1) as 1 | 2 | 3;
      let matchLabel: MatchLabel = "PARTIAL_FIT";
      if (cand.reasonCodes.includes(MatcherReasonCodeSchema.enum.FORMAT_PREFERENCE_MET)) {
        matchLabel = "STRONG_FORMAT_FIT";
      } else if (cand.reasonCodes.includes(MatcherReasonCodeSchema.enum.CONCEPT_EVIDENCE_MATCH)) {
        matchLabel = "GOAL_FIT";
      } else if (cand.reasonCodes.includes(MatcherReasonCodeSchema.enum.ROUTINE_COMPATIBLE)) {
        matchLabel = "ROUTINE_FIT";
      }

      const { whyHere, sourceTag } = buildWhyHereExplanation(
        cand.product,
        cand.conceptHits,
        cand.evidenceSnippets,
        need
      );

      return {
        productId: cand.product.id,
        rank,
        reasonCodes: cand.reasonCodes,
        matchLabel,
        considerIf: cand.considerIf.length > 0 ? cand.considerIf : ["May be relevant to your stated wellness goal."],
        mayNotFitIf: cand.mayNotFitIf,
        matchedFields: cand.matchedFields,
        missingFacts: cand.missingFacts,
        evidenceSnippets: cand.evidenceSnippets,
        whyHere,
        sourceTag,
        productName: cand.product.official_name,
        productSlug: cand.product.slug,
        category: cand.product.category,
        format: cand.product.format,
        priceInr: cand.product.price_inr,
        fragranceFree: cand.product.fragrance_free ?? undefined,
      };
    });

    groups.push({
      needId: need.id,
      needLabel: need.normalised_label || need.phrase_from_user,
      rawPhrase: need.phrase_from_user,
      category: need.preferred_category,
      status: recommendations.length > 0 ? "MATCHED" : "NO_FIT",
      recommendations,
    });
  }

  const allNoFit = groups.every((g) => g.status === "NO_FIT");

  return {
    status: allNoFit ? "NO_FIT" : "MATCHES_FOUND",
    rules_version: "2.0.0",
    medical_flag: request.medical_flag,
    medical_caution: request.medical_flag
      ? "Informational only, not medical advice. Bodywise Match provides cosmetic product discovery only. For clinical conditions or severe symptoms, please consult a healthcare professional."
      : undefined,
    groups,
    total_evaluated: catalogue.length,
  };
}

/**
 * Pure deterministic matcher for legacy single-goal requests (Version 1.0.0 / 2.0.0 compatible)
 * Preserves 100% of original behaviour for backward compatibility and test verification.
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
        missingFacts.push(
          `We couldn't verify this product's ${unv} against official packaging.`
        );
      }
    }

    // Step 2: Goal fit
    let hasExactGoal = false;
    if (product.supported_goals && product.supported_goals.length > 0) {
      hasExactGoal = product.supported_goals.some(
        (g) => g.toLowerCase() === normalizedUserGoal
      );
      if (hasExactGoal) {
        score += MATCHER_WEIGHTS.EXACT_GOAL_FIT;
        reasonCodes.push("EXACT_GOAL_MATCH");
        matchedFields.push("supported_goals");
        considerIf.push(`Specifically formulated to address ${normalizedUserGoal.replace(/_/g, " ")}.`);
      }
    }

    // Related goal fit
    if (!hasExactGoal && normalizedUserGoal) {
      const userGoalDef = CONTROLLED_GOALS.find((g) => g.id === normalizedUserGoal);
      if (userGoalDef) {
        const hasRelatedGoal = product.supported_goals?.some((pg) => {
          const pgDef = CONTROLLED_GOALS.find((g) => g.id === pg);
          return pgDef && pgDef.category === userGoalDef.category;
        });
        if (hasRelatedGoal) {
          score += MATCHER_WEIGHTS.RELATED_GOAL_FIT;
          reasonCodes.push("RELATED_GOAL_MATCH");
          matchedFields.push("related_category_goals");
          considerIf.push(`Supports general ${userGoalDef.category} care routine.`);
        }
      }
    }

    // Category fit
    if (parsed.category) {
      const normCat = parsed.category.toLowerCase().trim();
      if (product.category.toLowerCase() === normCat) {
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
