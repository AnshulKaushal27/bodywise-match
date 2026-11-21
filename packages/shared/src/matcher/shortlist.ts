/**
 * Single Shared Computation Engine for Bodywise Match
 * Section C: packages/shared is the ONLY place that applies tiers and ranks.
 * Calls from: POST /v1/match/preview, question selector, chat route, "See top matches", results page.
 *
 * TIER HIERARCHY:
 * Tier 0: Safety & Hard Exclusions (avoidances)
 * Tier 1: EXPLICIT PRODUCT CATEGORY (Hard Filter - never crossed unless user clicks explicit button)
 * Tier 2: Benefit / Sub-concept ranking within category
 * Tier 3: Soft preferences (format, body area, routine, fragrance)
 */

import { ProductRecord } from "../product";
import { groupProductsIntoFamilies, CatalogFamily } from "../families";
import { MatchSessionState, SessionSlots } from "../matchSession/types";
import { evaluateHardExclusions } from "./index";
import { CATALOGUE_CATEGORIES, formatCategoryLabel, CatalogueCategoryId } from "../data/categories";
import { RULES_VERSION, MATCHER_WEIGHTS } from "./matcher.config";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";

export interface ShortlistFamilyItem {
  familyId: string;
  name: string;
  canonical_name: string;
  category: string;
  categoryLabel: string;
  format: string;
  priceInr: number | null;
  price_inr: number | null;
  imageUrl: string | null;
  image_url: string | null;
  rank: number;
  benefitsCovered: string[];
  notSpecificallyDescribed: boolean;
  whyText: string;
  brandClaim: string | null;
  sourceText: string;
  sourceUrl: string;
  primaryProduct: ProductRecord;
  score: number;
}

export interface ShortlistGroup {
  groupId: string;
  category: string | null;
  categoryLabel: string;
  needLabel: string;
  rawPhrase: string;
  status: "MATCHED" | "NO_FIT";
  notSpecificallyDescribed: boolean;
  canExploreOtherCategories?: boolean;
  alternativeCategoryMatchesCount?: number;
  families: ShortlistFamilyItem[];
}

export interface ShortlistResult {
  stateHash: string;
  rulesVersion: string;
  filtersApplied: string[];
  totalFamilies: number;
  topFamilies: ShortlistFamilyItem[];
  groups: ShortlistGroup[];
  reasonCodes: string[];
  unmatchedBenefit?: string | null;
  canExploreOtherCategories?: boolean;
  alternativeCategoryMatchesCount?: number;
}

/**
 * Deterministic hash of session state slots.
 */
export function computeStateHash(slots: SessionSlots): string {
  const canonical = {
    c: slots.product_type.value || "",
    n: slots.needs
      .map((n) => `${n.concept_id || n.id}:${n.status}`)
      .sort()
      .join(","),
    a: slots.body_area.value || "",
    t: slots.time_of_day.value || "",
    f: slots.frequency.value || "",
    fmt: slots.format.value || "",
    fg: slots.fragrance_pref.value || "",
    av: (slots.avoidances.value || []).slice().sort().join(","),
  };
  const str = JSON.stringify(canonical);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `sh_${Math.abs(hash).toString(16)}`;
}

/**
 * Trims a brand claim quote to at most 15 words with neutral cosmetic wording and zero emojis.
 */
export function sanitizeBrandClaimQuote(rawText: string | null | undefined): string | null {
  if (!rawText) return null;
  // Remove emojis and pictographs
  const clean = rawText
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u26FF\u2700-\u27BF]/g, "")
    .replace(/[«»""“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  // Split into words and limit to 15
  const words = clean.split(" ");
  if (words.length <= 15) {
    return words.join(" ");
  }
  return words.slice(0, 15).join(" ") + "...";
}

/**
 * Builds clean, template-based "Why it's here" explanation.
 * Strictly 1-2 short sentences + 1 quote <= 15 words.
 */
export function buildCleanWhyExplanation(
  product: ProductRecord,
  categoryLabel: string,
  matchedBenefits: string[],
  notSpecificallyDescribed: boolean
): {
  whyText: string;
  brandClaim: string | null;
  sourceText: string;
  sourceUrl: string;
} {
  let whyText: string;
  if (notSpecificallyDescribed) {
    whyText = `Matches your category: ${categoryLabel}. Not specifically described for your stated concern, but formulated for regular care.`;
  } else if (matchedBenefits.length > 0) {
    const benefitStr = matchedBenefits.join(" and ");
    whyText = `Matches your category: ${categoryLabel}. Mentions ${benefitStr} on the product page.`;
  } else {
    whyText = `Matches your category: ${categoryLabel}. Formulated for regular cosmetic care.`;
  }

  // Derive single short brand claim <= 15 words
  let rawClaim: string | null = null;
  if (product.official_description && product.official_description.length > 5) {
    rawClaim = product.official_description;
  } else if (product.label_directions && product.label_directions.length > 5) {
    rawClaim = product.label_directions;
  }
  const brandClaim = sanitizeBrandClaimQuote(rawClaim);

  return {
    whyText,
    brandClaim,
    sourceText: "bebodywise.com, checked 20 Nov 2026",
    sourceUrl: product.source_url || "https://bebodywise.com",
  };
}

/**
 * Evaluates whether a product matches a concept or goal.
 */
function productMatchesConcept(product: ProductRecord, conceptId: string): boolean {
  // 1. Direct supported_goals match
  if ((product.supported_goals as string[]).includes(conceptId)) return true;

  // 2. Goal mapping synonyms
  const conceptDef = CONCEPTS_BY_ID.get(conceptId);
  const searchCorpus = `${product.official_name} ${product.format} ${product.official_description || ""}`.toLowerCase();

  if (conceptDef) {
    for (const syn of conceptDef.synonyms) {
      if (searchCorpus.includes(syn.toLowerCase())) return true;
    }
  }

  // Specific domain checks
  if (conceptId === "oil_control") {
    return /\b(salicylic|bha|oil control|sebum|anti-acne|clearing|pore)\b/i.test(searchCorpus);
  }
  if (conceptId === "blackhead_look") {
    return /\b(blackhead|clogged pore|whitehead|exfoliat|salicylic|bha)\b/i.test(searchCorpus);
  }
  if (conceptId === "body_bumps_look") {
    return /\b(rough|bumpy|strawberry|keratosis|lactic|urea|salicylic)\b/i.test(searchCorpus);
  }
  if (conceptId === "hydration") {
    return /\b(hydrat|moistur|hyaluronic|ceramide|dry)\b/i.test(searchCorpus);
  }
  if (conceptId === "scalp_comfort") {
    return /\b(dandruff|itch|scalp|flake|flaky)\b/i.test(searchCorpus);
  }
  if (conceptId === "hair_density_appearance" || conceptId === "hair_fall_appearance") {
    return /\b(hair fall|density|redensyl|biotin|growth|thinning)\b/i.test(searchCorpus);
  }

  return false;
}

/**
 * Computes the shortlist of product families deterministically.
 * Single source of truth for all screens and endpoints.
 */
export function computeShortlist(
  state: MatchSessionState,
  catalogue: ProductRecord[],
  nominations?: Array<{ familyId: string; needId?: string; evidence_phrase?: string }>
): ShortlistResult {
  const { slots } = state;
  const stateHash = computeStateHash(slots);
  const filtersApplied: string[] = [];
  const reasonCodes: string[] = [];

  // --- Tier 0: Safety & Hard Exclusions ---
  const hardAvoidances =
    slots.avoidances.status === "confirmed" && slots.avoidances.value
      ? slots.avoidances.value
      : [];

  const tier0Products = catalogue.filter((product) => {
    if (hardAvoidances.length > 0) {
      const exclusion = evaluateHardExclusions(product, hardAvoidances);
      if (exclusion.excluded) return false;
    }
    return true;
  });

  if (hardAvoidances.length > 0) {
    filtersApplied.push(`Avoid: ${hardAvoidances.join(", ")}`);
    reasonCodes.push("SAFETY_AVOIDANCES_APPLIED");
  }

  // --- Tier 1: Explicit Category (HARD FILTER) ---
  const confirmedCategory =
    slots.product_type.value && slots.product_type.status === "confirmed"
      ? (slots.product_type.value as CatalogueCategoryId)
      : null;

  let tier1Products = tier0Products;
  let categoryLabel = "Any product type";

  if (confirmedCategory) {
    const catDef = CATALOGUE_CATEGORIES.find((c) => c.id === confirmedCategory);
    categoryLabel = catDef ? catDef.displayLabel : formatCategoryLabel(confirmedCategory);
    filtersApplied.push(`Category: ${categoryLabel}`);
    reasonCodes.push("TIER_1_CATEGORY_FILTER");

    tier1Products = tier0Products.filter((product) => {
      if (confirmedCategory === "moisturizer") {
        if (product.category !== "other" && product.category !== "body_wash") return false;
        const nameLower = product.official_name.toLowerCase();
        const formatLower = product.format.toLowerCase();
        return (
          nameLower.includes("moisturizer") ||
          nameLower.includes("cream") ||
          nameLower.includes("lotion") ||
          formatLower.includes("cream") ||
          formatLower.includes("lotion")
        );
      }
      if (confirmedCategory === "roll_on") {
        return (
          product.format.toLowerCase().includes("roll-on") ||
          product.official_name.toLowerCase().includes("roll on")
        );
      }
      // 1. Check canonical product category enum
      if (catDef && catDef.canonicalProductCategories.includes(product.category)) {
        return true;
      }
      // 2. Format or official name check for multi-category products
      if (confirmedCategory === "body_wash" && product.category === "body_wash") return true;
      if (confirmedCategory === "face_wash" && product.category === "face_wash") return true;
      if (confirmedCategory === "shampoo" && product.category === "shampoo") return true;
      if (confirmedCategory === "conditioner" && product.category === "conditioner") return true;
      if (confirmedCategory === "hair_oil" && product.category === "hair_oil") return true;
      if (confirmedCategory === "serum" && product.category === "serum") return true;
      if (confirmedCategory === "sunscreen" && product.category === "sunscreen") return true;
      if (confirmedCategory === "supplement" && product.category === "supplement") return true;

      return false;
    });
  }

  // --- Tier 2: Benefit / Concern within category ---
  const activeNeeds = slots.needs.filter((n) => n.concept_id && n.status === "confirmed");
  const conceptIds = activeNeeds.map((n) => n.concept_id);

  let notSpecificallyDescribed = false;
  let unmatchedBenefit: string | null = null;
  let canExploreOtherCategories = false;
  let alternativeCategoryMatchesCount = 0;

  // Check if benefit matching yields zero products inside the Tier 1 category
  if (confirmedCategory && conceptIds.length > 0) {
    const hasAnyBenefitMatch = tier1Products.some((p) =>
      conceptIds.some((cid) => productMatchesConcept(p, cid))
    );

    if (!hasAnyBenefitMatch) {
      // Rule 4: Zero products match the benefit inside the category -> DO NOT switch category.
      // Label in-category options as "Not specifically described for <benefit>"
      notSpecificallyDescribed = true;
      unmatchedBenefit = activeNeeds[0]?.normalised_label || conceptIds[0];
      canExploreOtherCategories = true;

      // Count matches in other categories
      alternativeCategoryMatchesCount = tier0Products.filter(
        (p) =>
          !tier1Products.some((tp) => tp.id === p.id) &&
          conceptIds.some((cid) => productMatchesConcept(p, cid))
      ).length;

      reasonCodes.push("BENEFIT_NOT_SPECIFICALLY_DESCRIBED");
    }
  }

  // Group products into families
  const allFamilies = groupProductsIntoFamilies(tier1Products);

  // Score and rank families
  interface ScoredFamily {
    family: CatalogFamily;
    score: number;
    matchedBenefits: string[];
    whyText: string;
    brandClaim: string | null;
    sourceText: string;
    sourceUrl: string;
  }

  const scoredFamilies: ScoredFamily[] = allFamilies.map((fam) => {
    let score = 0;
    const primary = fam.primaryProduct;
    const matchedBenefits: string[] = [];

    // Tier 2 Scoring: Benefit matches
    for (const need of activeNeeds) {
      if (productMatchesConcept(primary, need.concept_id)) {
        score += MATCHER_WEIGHTS.CONCEPT_EVIDENCE_MATCH;
        matchedBenefits.push(need.normalised_label || need.concept_id);
      }
    }

    // Tier 3 Scoring: Format preference
    if (slots.format.value && slots.format.status === "confirmed") {
      if (primary.format.toLowerCase().includes(slots.format.value.toLowerCase())) {
        score += MATCHER_WEIGHTS.FORMAT_MATCH;
      }
    }

    // Tier 3 Scoring: Fragrance free
    if (slots.fragrance_pref.value === "free_only" && slots.fragrance_pref.status === "confirmed") {
      if (primary.fragrance_free === true) {
        score += MATCHER_WEIGHTS.AVOIDANCE_SATISFIED_VERIFIED;
      }
    }

    // Bounded Nomination Bonus (from validated LLM/retrieval evidence)
    if (nominations && nominations.length > 0) {
      const isNominated = nominations.some((n) => n.familyId === fam.familyId);
      if (isNominated) {
        score += 15; // Bounded bonus: raises rank within category, never breaks hard filter
      }
    }

    // Tier 3 Scoring: Routine / Time of day
    if (
      slots.time_of_day.value &&
      slots.time_of_day.value !== "any" &&
      slots.time_of_day.status === "confirmed"
    ) {
      score += MATCHER_WEIGHTS.TIME_OF_DAY_MATCH;
    }

    const { whyText, brandClaim, sourceText, sourceUrl } = buildCleanWhyExplanation(
      primary,
      categoryLabel,
      matchedBenefits,
      notSpecificallyDescribed
    );

    return {
      family: fam,
      score,
      matchedBenefits,
      whyText,
      brandClaim,
      sourceText,
      sourceUrl,
    };
  });

  // Sort families deterministically:
  // 1. Score descending (products covering more benefits rank first)
  // 2. Canonical name ascending
  scoredFamilies.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.family.canonical_name.localeCompare(b.family.canonical_name);
  });

  // Convert to ShortlistFamilyItem (numbered from 1)
  const topFamilies: ShortlistFamilyItem[] = scoredFamilies.map((sf, idx) => ({
    familyId: sf.family.familyId,
    name: sf.family.canonical_name,
    canonical_name: sf.family.canonical_name,
    category: confirmedCategory || sf.family.category,
    categoryLabel: formatCategoryLabel(confirmedCategory || sf.family.category),
    format: sf.family.format,
    priceInr: sf.family.primaryProduct.price_inr,
    price_inr: sf.family.primaryProduct.price_inr,
    imageUrl: sf.family.primaryProduct.image_url,
    image_url: sf.family.primaryProduct.image_url,
    rank: idx + 1,
    benefitsCovered: sf.matchedBenefits,
    notSpecificallyDescribed,
    whyText: sf.whyText,
    brandClaim: sf.brandClaim,
    sourceText: sf.sourceText,
    sourceUrl: sf.sourceUrl,
    primaryProduct: sf.family.primaryProduct,
    score: sf.score,
  }));

  // Build Results Group(s)
  const groups: ShortlistGroup[] = [];
  if (topFamilies.length > 0) {
    const mainNeedLabel =
      activeNeeds.map((n) => n.normalised_label || n.phrase_from_user).join(" and ") ||
      (confirmedCategory ? categoryLabel : "Personal Care Goal");
    const rawPhrase = activeNeeds.map((n) => n.phrase_from_user).join(" and ") || categoryLabel;

    groups.push({
      groupId: "group_1",
      category: confirmedCategory,
      categoryLabel,
      needLabel: mainNeedLabel,
      rawPhrase,
      status: "MATCHED",
      notSpecificallyDescribed,
      canExploreOtherCategories,
      alternativeCategoryMatchesCount,
      families: topFamilies,
    });
  } else {
    // Honest empty state
    groups.push({
      groupId: "group_empty",
      category: confirmedCategory,
      categoryLabel,
      needLabel: activeNeeds[0]?.normalised_label || "Selected criteria",
      rawPhrase: activeNeeds[0]?.phrase_from_user || "",
      status: "NO_FIT",
      notSpecificallyDescribed: false,
      families: [],
    });
  }

  return {
    stateHash,
    rulesVersion: RULES_VERSION,
    filtersApplied,
    totalFamilies: topFamilies.length,
    topFamilies,
    groups,
    reasonCodes,
    unmatchedBenefit,
    canExploreOtherCategories,
    alternativeCategoryMatchesCount,
  };
}
