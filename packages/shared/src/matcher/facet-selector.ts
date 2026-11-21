import { ProductRecord, ProductCategory } from "../product";
import { ParsedRequest } from "./types";
import { evaluateHardExclusions } from "./index";
import { groupProductsIntoFamilies, CatalogFamily } from "../families";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";
import { KNOWLEDGE_CARDS_SEED } from "../data/knowledge.seed";

const knowledgeCardByProductId = new Map(KNOWLEDGE_CARDS_SEED.map((c) => [c.productId, c]));

export interface QuestionFacetOption {
  id: string;
  label: string;
  count: number;
  filterDimension: "category" | "format" | "fragrance" | "sub_concept" | "routine";
  filterValue: string | boolean | null;
  isAny?: boolean;
}

export interface NextFacetQuestionResult {
  done: boolean;
  facet?: "category" | "format" | "fragrance" | "sub_concept" | "routine";
  question?: string;
  options?: QuestionFacetOption[];
  whyAsking?: string;
  candidateCount: number;
  askedCount: number;
  remaining?: number;
}

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  body_wash: "Body wash",
  face_wash: "Face wash",
  serum: "Leave-on serum",
  shampoo: "Shampoo",
  conditioner: "Conditioner",
  hair_oil: "Hair oil",
  supplement: "Daily gummies / supplement",
  sunscreen: "Sun protection",
  other: "Specialized care",
};

/**
 * Filter catalogue candidates strictly for the given parsed request and answered facets.
 */
export function getCandidateFamilies(
  request: ParsedRequest,
  catalogue: ProductRecord[],
  answeredFacets: Record<string, string> = {}
): CatalogFamily[] {
  // Extract all concept IDs and requested goals across all needs
  const requestedConceptIds = new Set<string>();
  for (const need of request.needs) {
    for (const c of need.concepts) {
      requestedConceptIds.add(c);
      if (c === "hydration" || c === "dryness") {
        requestedConceptIds.add("hydration_barrier");
      }
      if (c === "dark_spot_look" || c === "hyperpigmentation") {
        requestedConceptIds.add("dark_spots_look");
      }
    }
  }

  const qualifiedProducts = catalogue.filter((product) => {
    // 1. Hard exclusions (avoidances)
    const exclusionCheck = evaluateHardExclusions(product, request.avoidances);
    if (exclusionCheck.excluded) return false;

    // 2. Goal / concept match: product must support at least one requested concept/goal
    if (requestedConceptIds.size > 0) {
      const card = knowledgeCardByProductId.get(product.id);
      const matchesGoal = product.supported_goals.some((g) => requestedConceptIds.has(g));
      const matchesConcept = card ? card.concepts.some((c) => requestedConceptIds.has(c)) : false;

      if (!matchesGoal && !matchesConcept) {
        // Also check if any concept keyword matches product category / format
        const matchesCategory = Array.from(requestedConceptIds).some((cid) => {
          const concept = CONCEPTS_BY_ID.get(cid);
          if (!concept) return false;
          return concept.related_categories.includes(product.category);
        });
        if (!matchesCategory) return false;
      }
    }

    // 3. User preferred category across needs
    const preferredCats = request.needs
      .map((n) => n.preferred_category)
      .filter((c): c is ProductCategory => Boolean(c));
    if (preferredCats.length > 0 && !preferredCats.includes(product.category as ProductCategory)) {
      return false;
    }

    // 4. Answered facets filter
    if (answeredFacets.category && product.category !== answeredFacets.category) {
      return false;
    }
    if (
      answeredFacets.format &&
      !product.format.toLowerCase().includes(answeredFacets.format.toLowerCase().trim())
    ) {
      return false;
    }
    if (answeredFacets.fragrance === "fragrance_free" && product.fragrance_free !== true) {
      return false;
    }
    if (
      answeredFacets.sub_concept &&
      !(product.supported_goals as string[]).includes(answeredFacets.sub_concept)
    ) {
      return false;
    }

    return true;
  });

  return groupProductsIntoFamilies(qualifiedProducts);
}

/**
 * Information Gain Selector: Pure TypeScript, 100% deterministic.
 * Evaluates candidate facets over candidate families, computes Gini split,
 * and chooses the highest-gain facet.
 */
export function selectNextFacetQuestion(
  request: ParsedRequest,
  catalogue: ProductRecord[],
  answeredFacets: Record<string, string> = {},
  askedCount: number = 0
): NextFacetQuestionResult {
  const candidateFamilies = getCandidateFamilies(request, catalogue, answeredFacets);
  const totalCandidates = candidateFamilies.length;

  // Stop conditions:
  // 1. Asked 3 questions
  // 2. Candidate families <= 3
  if (askedCount >= 3 || totalCandidates <= 3) {
    return {
      done: true,
      candidateCount: totalCandidates,
      askedCount,
    };
  }

  interface FacetCandidate {
    facet: "category" | "format" | "fragrance" | "sub_concept";
    gini: number;
    splitRatio: number; // size of smallest significant bucket / total
    buckets: Map<string, { label: string; count: number; filterValue: string | boolean }>;
    whyAsking: string;
    question: string;
  }

  const evaluatedFacets: FacetCandidate[] = [];

  // --- Facet 1: Category ---
  if (!answeredFacets.category) {
    const hasCategoryPreference = request.needs.some((n) => Boolean(n.preferred_category));
    if (!hasCategoryPreference) {
      const buckets = new Map<string, { label: string; count: number; filterValue: string }>();
      for (const fam of candidateFamilies) {
        const cat = fam.category;
        const current = buckets.get(cat) || {
          label: CATEGORY_DISPLAY_NAMES[cat] || cat.replace(/_/g, " "),
          count: 0,
          filterValue: cat,
        };
        current.count += 1;
        buckets.set(cat, current);
      }

      if (buckets.size >= 2) {
        const counts = Array.from(buckets.values()).map((b) => b.count);
        const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / totalCandidates, 2), 0);
        const gini = 1 - sumSq;
        const minCount = Math.min(...counts);
        const splitRatio = minCount / totalCandidates;

        const bucketNames = Array.from(buckets.values())
          .sort((a, b) => b.count - a.count)
          .map((b) => b.label.toLowerCase());

        evaluatedFacets.push({
          facet: "category",
          gini,
          splitRatio,
          buckets,
          question: "What kind of product are you after?",
          whyAsking: `Your matches include both ${bucketNames.slice(0, 2).join(" and ")}.`,
        });
      }
    }
  }

  // --- Facet 2: Format ---
  if (!answeredFacets.format) {
    const hasFormatPreference = request.needs.some(
      (n) => n.format_preferences && n.format_preferences.length > 0
    );
    if (!hasFormatPreference) {
      const buckets = new Map<string, { label: string; count: number; filterValue: string }>();
      for (const fam of candidateFamilies) {
        const fmt = fam.format;
        const current = buckets.get(fmt) || {
          label: fmt,
          count: 0,
          filterValue: fmt,
        };
        current.count += 1;
        buckets.set(fmt, current);
      }

      if (buckets.size >= 2) {
        const counts = Array.from(buckets.values()).map((b) => b.count);
        const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / totalCandidates, 2), 0);
        const gini = 1 - sumSq;
        const minCount = Math.min(...counts);
        const splitRatio = minCount / totalCandidates;

        const bucketNames = Array.from(buckets.values())
          .sort((a, b) => b.count - a.count)
          .map((b) => b.label.toLowerCase());

        evaluatedFacets.push({
          facet: "format",
          gini,
          splitRatio,
          buckets,
          question: "Which format do you prefer?",
          whyAsking: `Your matches include both ${bucketNames.slice(0, 2).join(" and ")} formats.`,
        });
      }
    }
  }

  // --- Facet 3: Fragrance ---
  if (!answeredFacets.fragrance) {
    const userAvoidsFragrance = request.avoidances.some(
      (a) => a.toLowerCase() === "fragrance"
    );
    if (!userAvoidsFragrance) {
      let ffCount = 0;
      let scentedCount = 0;
      for (const fam of candidateFamilies) {
        if (fam.primaryProduct.fragrance_free === true) {
          ffCount += 1;
        } else {
          scentedCount += 1;
        }
      }

      if (ffCount > 0 && scentedCount > 0) {
        const counts = [ffCount, scentedCount];
        const sumSq = counts.reduce((acc, c) => acc + Math.pow(c / totalCandidates, 2), 0);
        const gini = 1 - sumSq;
        const splitRatio = Math.min(ffCount, scentedCount) / totalCandidates;

        const buckets = new Map<string, { label: string; count: number; filterValue: string }>();
        buckets.set("fragrance_free", {
          label: "Fragrance-free formula",
          count: ffCount,
          filterValue: "fragrance_free",
        });
        buckets.set("standard", {
          label: "Lightly scented / standard",
          count: scentedCount,
          filterValue: "standard",
        });

        evaluatedFacets.push({
          facet: "fragrance",
          gini,
          splitRatio,
          buckets,
          question: "Do you prefer fragrance-free formulations?",
          whyAsking: "Your shortlist includes both fragrance-free and standard options.",
        });
      }
    }
  }

  // Stop condition 3: Threshold check.
  // Best possible question must split candidates with at least Gini 0.15
  if (evaluatedFacets.length === 0) {
    return {
      done: true,
      candidateCount: totalCandidates,
      askedCount,
    };
  }

  // Sort by Gini descending (highest information gain first)
  evaluatedFacets.sort((a, b) => b.gini - a.gini);
  const bestFacet = evaluatedFacets[0];

  if (bestFacet.gini < 0.15) {
    // If the best split gives less than 15% information gain, shortlist is already focused enough
    return {
      done: true,
      candidateCount: totalCandidates,
      askedCount,
    };
  }

  // Build sorted options with counts, plus "Any / not sure"
  const options: QuestionFacetOption[] = Array.from(bestFacet.buckets.values())
    .sort((a, b) => b.count - a.count)
    .map((b) => ({
      id: `${bestFacet.facet}_${String(b.filterValue).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      label: `${b.label} (${b.count})`,
      count: b.count,
      filterDimension: bestFacet.facet,
      filterValue: b.filterValue,
    }));

  // Append neutral "Any / not sure" option
  options.push({
    id: `${bestFacet.facet}_any`,
    label: "Any / not sure",
    count: totalCandidates,
    filterDimension: bestFacet.facet,
    filterValue: null,
    isAny: true,
  });

  return {
    done: false,
    facet: bestFacet.facet,
    question: bestFacet.question,
    options,
    whyAsking: bestFacet.whyAsking,
    candidateCount: totalCandidates,
    askedCount,
    remaining: totalCandidates,
  };
}
