import { ProductRecord } from "../product";
import { ParsedRequest } from "./types";
import { CatalogFamily } from "../families";
import { getCandidateFamilies } from "./facet-selector";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";
import { KNOWLEDGE_CARDS_SEED } from "../data/knowledge.seed";

const knowledgeCardByProductId = new Map(KNOWLEDGE_CARDS_SEED.map((c) => [c.productId, c]));

export interface PreviewFamily {
  familyId: string;
  name: string;
  category: string;
  categoryLabel?: string;
  format: string;
  imageUrl: string | null;
  priceInr: number | null;
  whyLine: string;
  rank?: number;
  benefitsCovered?: string[];
  notSpecificallyDescribed?: boolean;
}

export interface LimitingChip {
  id: string;
  label: string;
  type: "avoidance" | "facet" | "format" | "category";
}

export interface MatchPreviewResult {
  count: number;
  familiesTop: PreviewFamily[];
  perNeedCounts: Array<{ needId: string; label: string; count: number }>;
  status: "focused" | "broad" | "empty";
  limitingChip?: LimitingChip;
}

/**
 * Builds a friendly 1-line reason for a family in the preview
 */
function buildPreviewWhyLine(fam: CatalogFamily, request: ParsedRequest): string {
  // Check matching goal/concept
  const requestedConceptIds = new Set<string>();
  for (const need of request.needs) {
    for (const c of need.concepts) {
      requestedConceptIds.add(c);
      if (c === "hydration" || c === "dryness") requestedConceptIds.add("hydration_barrier");
    }
  }

  for (const goal of fam.primaryProduct.supported_goals) {
    if (requestedConceptIds.has(goal)) {
      const concept = CONCEPTS_BY_ID.get(goal);
      if (concept) {
        return `Formulated to support ${concept.label.toLowerCase()}.`;
      }
    }
  }

  if (fam.primaryProduct.official_description) {
    const firstSentence = fam.primaryProduct.official_description.split(". ")[0];
    if (firstSentence && firstSentence.length < 100) {
      return `${firstSentence}.`;
    }
  }

  return `Matches your stated ${fam.category.replace(/_/g, " ")} goal.`;
}

/**
 * Finds the single filter/avoidance chip most responsible for 0 candidates
 */
function findLimitingChip(
  request: ParsedRequest,
  catalogue: ProductRecord[],
  answeredFacets: Record<string, string>
): LimitingChip | undefined {
  // 1. Check answered facets
  for (const [key, value] of Object.entries(answeredFacets)) {
    if (!value) continue;
    const withoutFacet = { ...answeredFacets };
    delete withoutFacet[key];
    const candidateCount = getCandidateFamilies(request, catalogue, withoutFacet).length;
    if (candidateCount > 0) {
      return {
        id: `facet_${key}`,
        label: key === "fragrance" && value === "fragrance_free" ? "Fragrance-free" : value,
        type: key === "format" ? "format" : key === "category" ? "category" : "facet",
      };
    }
  }

  // 2. Check avoidances
  for (const avoidance of request.avoidances) {
    const withoutAvoidance: ParsedRequest = {
      ...request,
      avoidances: request.avoidances.filter((a) => a !== avoidance),
    };
    const candidateCount = getCandidateFamilies(withoutAvoidance, catalogue, answeredFacets).length;
    if (candidateCount > 0) {
      return {
        id: `avoidance_${avoidance}`,
        label: `No ${avoidance}`,
        type: "avoidance",
      };
    }
  }

  // 3. Check format preferences inside needs
  for (const need of request.needs) {
    if (need.format_preferences && need.format_preferences.length > 0) {
      for (const fmt of need.format_preferences) {
        const withoutFmt: ParsedRequest = {
          ...request,
          needs: request.needs.map((n) =>
            n.id === need.id
              ? { ...n, format_preferences: n.format_preferences?.filter((f) => f !== fmt) }
              : n
          ),
        };
        const candidateCount = getCandidateFamilies(withoutFmt, catalogue, answeredFacets).length;
        if (candidateCount > 0) {
          return {
            id: `format_${fmt}`,
            label: fmt,
            type: "format",
          };
        }
      }
    }
  }

  return undefined;
}

/**
 * Calculates a live preview of matching candidate families for /match/confirm
 */
export function calculateMatchPreview(
  request: ParsedRequest,
  catalogue: ProductRecord[],
  answeredFacets: Record<string, string> = {}
): MatchPreviewResult {
  const candidateFamilies = getCandidateFamilies(request, catalogue, answeredFacets);
  const count = candidateFamilies.length;

  // Calculate per-need counts
  const perNeedCounts = request.needs.map((need) => {
    const needConceptIds = new Set(need.concepts);
    for (const c of need.concepts) {
      if (c === "hydration" || c === "dryness") needConceptIds.add("hydration_barrier");
      if (c === "dark_spot_look" || c === "hyperpigmentation") needConceptIds.add("dark_spots_look");
    }

    const needCount = candidateFamilies.filter((fam) => {
      if (needConceptIds.size === 0) return true;
      const card = knowledgeCardByProductId.get(fam.primaryProduct.id);
      const matchesGoal = fam.primaryProduct.supported_goals.some((g) => needConceptIds.has(g));
      const matchesConcept = card ? card.concepts.some((c) => needConceptIds.has(c)) : false;
      if (matchesGoal || matchesConcept) return true;
      if (need.preferred_category && fam.category === need.preferred_category) return true;
      const matchesRelatedCat = Array.from(needConceptIds).some((cid) => {
        const concept = CONCEPTS_BY_ID.get(cid);
        return concept?.related_categories.includes(fam.category);
      });
      return matchesRelatedCat;
    }).length;

    return {
      needId: need.id,
      label: need.normalised_label || need.phrase_from_user,
      count: needCount,
    };
  });

  // Top 3 families
  const topFamilies = candidateFamilies.slice(0, 3).map((fam) => {
    const firstVariant = fam.variants.find((v) => v.image_url);
    const imageUrl = fam.primaryProduct.image_url || firstVariant?.image_url || null;

    return {
      familyId: fam.familyId,
      name: fam.canonical_name,
      category: fam.category,
      format: fam.format,
      imageUrl,
      priceInr: fam.primaryProduct.price_inr,
      whyLine: buildPreviewWhyLine(fam, request),
    };
  });

  let status: "focused" | "broad" | "empty" = "broad";
  if (count === 0) {
    status = "empty";
  } else if (count <= 3) {
    status = "focused";
  }

  let limitingChip: LimitingChip | undefined = undefined;
  if (count === 0) {
    limitingChip = findLimitingChip(request, catalogue, answeredFacets);
  }

  return {
    count,
    familiesTop: topFamilies,
    perNeedCounts,
    status,
    limitingChip,
  };
}
