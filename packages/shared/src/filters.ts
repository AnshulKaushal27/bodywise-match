/**
 * Pure Product Filtering and Faceted Count Logic (Rule 2: Deterministic Matching)
 *
 * Filter rules:
 * - Different groups combine with AND.
 * - Multiple selections within a group combine with OR.
 * - Selecting "all" or an empty array clears that group's restriction.
 * - Fragrance filter:
 *   - "fragrance_free": only products with fragrance_free === true.
 *   - "other": products where fragrance_free is false or null.
 *   - "all": any fragrance status.
 */

import { ProductRecord } from "./product";
import { detectExplicitCategories } from "./data/categories";
import { CONTROLLED_GOALS } from "./goals";
import { HINGLISH_NEEDS } from "./data/synonyms.hinglish";
import { DEMO_CATALOGUE_SEED } from "./data/catalogue.seed";

export interface ProductFilterCriteria {
  search?: string;
  categories?: string[];
  formats?: string[];
  goals?: string[];
  fragrance?: string;
}

export interface ParsedFilterParams {
  search?: string;
  categories: string[];
  formats: string[];
  goals: string[];
  fragrance: string;
}

/**
 * Normalizes identifier strings (converting hyphens to underscores, lowercase)
 * so that both URL params like "face-wash" and catalogue tokens like "face_wash" match reliably.
 */
export function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/-/g, "_");
}

/**
 * Pure filter function used across both the products catalogue grid and the filters dialog.
 * Guarantees that the dialog preview count always strictly equals the grid results count.
 */
export function filterProducts(
  products: ProductRecord[],
  criteria: ProductFilterCriteria
): ProductRecord[] {
  const search = criteria.search?.trim().toLowerCase() || "";
  const categories = (criteria.categories || [])
    .map(normalizeToken)
    .filter((c) => c && c !== "all");
  const formats = (criteria.formats || [])
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f && f !== "all");
  const goals = (criteria.goals || [])
    .map(normalizeToken)
    .filter((g) => g && g !== "all");
  const fragrance = criteria.fragrance?.trim().toLowerCase() || "all";

  return products.filter((prod) => {
    // 1. Search Query Match
    if (search.length > 0) {
      const nameMatch = prod.official_name.toLowerCase().includes(search);
      const descMatch = prod.official_description.toLowerCase().includes(search);
      const catMatch = prod.category.toLowerCase().replace(/_/g, " ").includes(search);
      const formatMatch = prod.format.toLowerCase().includes(search);
      const goalsMatch = (prod.supported_goals as string[]).some((g) =>
        g.toLowerCase().replace(/_/g, " ").includes(search)
      );
      const ingredientsMatch = prod.ingredients
        ? prod.ingredients.some((ing) => ing.toLowerCase().includes(search))
        : false;

      if (!nameMatch && !descMatch && !catMatch && !formatMatch && !goalsMatch && !ingredientsMatch) {
        return false;
      }
    }

    // 2. Category Match (OR within group, AND across groups)
    if (categories.length > 0) {
      const prodCat = normalizeToken(prod.category);
      const matchesCategory = categories.some((c) => c === prodCat);
      if (!matchesCategory) return false;
    }

    // 3. Format Match (OR within group, substring match, AND across groups)
    if (formats.length > 0) {
      const prodFormat = prod.format.toLowerCase();
      const matchesFormat = formats.some((fmt) => {
        const normFmt = fmt.toLowerCase().trim();
        if (normFmt === "roll-on" || normFmt === "roll_on" || normFmt === "roll on") {
          return prodFormat.includes("roll-on") || prodFormat.includes("roll on") || prodFormat.includes("roller");
        }
        if (normFmt === "cream" || normFmt === "lotion") {
          return prodFormat.includes("cream") || prodFormat.includes("lotion") || prodFormat.includes("moisturizer");
        }
        if (normFmt === "gel") {
          return prodFormat.includes("gel") || prodFormat.includes("foam");
        }
        if (normFmt === "serum") {
          return prodFormat.includes("serum");
        }
        if (normFmt === "liquid") {
          return prodFormat.includes("liquid");
        }
        if (normFmt === "gummies" || normFmt === "gummy") {
          return prodFormat.includes("gumm") || prodFormat.includes("chewable");
        }
        if (normFmt === "spray") {
          return prodFormat.includes("spray");
        }
        if (normFmt === "scrub") {
          return prodFormat.includes("scrub");
        }
        return prodFormat.includes(normFmt);
      });
      if (!matchesFormat) return false;
    }

    // 4. Goal Match (OR within group, AND across groups)
    if (goals.length > 0) {
      const prodGoals = (prod.supported_goals as string[]).map(normalizeToken);
      const matchesGoal = goals.some((goal) => prodGoals.includes(goal));
      if (!matchesGoal) return false;
    }

    // 5. Fragrance Declaration Match (Honest Wording Rule)
    if (fragrance === "fragrance_free" || fragrance === "free") {
      if (prod.fragrance_free !== true) return false;
    } else if (fragrance === "other" || fragrance === "unverified") {
      if (prod.fragrance_free === true) return false;
    }

    return true;
  });
}

export interface FacetOption {
  id: string;
}

export interface FacetCountResult {
  categories: Record<string, number>;
  formats: Record<string, number>;
  goals: Record<string, number>;
  fragrance: Record<string, number>;
}

/**
 * Computes live product counts for each chip option based on the other active filters.
 * Enables dimming/disabling chips that would yield 0 results.
 */
export function computeFacetCounts(
  products: ProductRecord[],
  current: ProductFilterCriteria,
  options: {
    categories: FacetOption[];
    formats: FacetOption[];
    goals: FacetOption[];
    fragrance: FacetOption[];
  }
): FacetCountResult {
  const result: FacetCountResult = {
    categories: {},
    formats: {},
    goals: {},
    fragrance: {},
  };

  // 1. Categories facet counts (keeping formats, goals, fragrance, search constant)
  for (const opt of options.categories) {
    if (opt.id === "all") {
      result.categories[opt.id] = filterProducts(products, {
        ...current,
        categories: [],
      }).length;
    } else {
      result.categories[opt.id] = filterProducts(products, {
        ...current,
        categories: [opt.id],
      }).length;
    }
  }

  // 2. Formats facet counts (keeping categories, goals, fragrance, search constant)
  for (const opt of options.formats) {
    if (opt.id === "all") {
      result.formats[opt.id] = filterProducts(products, {
        ...current,
        formats: [],
      }).length;
    } else {
      result.formats[opt.id] = filterProducts(products, {
        ...current,
        formats: [opt.id],
      }).length;
    }
  }

  // 3. Goals facet counts (keeping categories, formats, fragrance, search constant)
  for (const opt of options.goals) {
    if (opt.id === "all") {
      result.goals[opt.id] = filterProducts(products, {
        ...current,
        goals: [],
      }).length;
    } else {
      result.goals[opt.id] = filterProducts(products, {
        ...current,
        goals: [opt.id],
      }).length;
    }
  }

  // 4. Fragrance facet counts (keeping categories, formats, goals, search constant)
  for (const opt of options.fragrance) {
    result.fragrance[opt.id] = filterProducts(products, {
      ...current,
      fragrance: opt.id,
    }).length;
  }

  return result;
}

const FORMAT_PATTERNS = [
  { format: "gel", regex: /\b(gel)\b/i },
  { format: "liquid", regex: /\b(liquid)\b/i },
  { format: "roll-on", regex: /\b(roll[\s-]*on|roller)\b/i },
  { format: "oil", regex: /\b(hair[\s-]*oil|scalp[\s-]*oil|body[\s-]*oil)\b/i },
  { format: "cream", regex: /\b(cream|lotion|moisturizer|moisturiser|cold[\s-]*cream)\b/i },
  { format: "gummies", regex: /\b(gummies|gummy|chewables?)\b/i },
];

const FRAGRANCE_FREE_REGEX = /\b(no\s+fragrance|fragrance[\s-]free|without\s+fragrance|unscented|no\s+perfume|without\s+perfume|no\s+scent|without\s+scent|bina\s+khushbu|khushbu\s+bina|no\s+artificial\s+fragrance)\b/i;
const SCENTED_REGEX = /\b(with\s+fragrance|scented|perfumed|fragranced|khushbudar)\b/i;

/**
 * Deterministically parses free-text search (English or Hinglish) into structured product filters:
 * - Category filter: applied ONLY if user explicitly mentions a category (e.g. face wash, serum, shampoo).
 * - Goal filter: applied ONLY if user explicitly mentions a goal/concern (e.g. oiliness, acne, dark spots, hair fall).
 * - Fragrance filter: applied ONLY if user explicitly mentions fragrance (fragrance-free vs scented).
 * - Format filter: applied ONLY if user explicitly mentions format (e.g. gel, roll-on, cream, gummies).
 * - Residual keyword: any specific active ingredient (e.g. salicylic acid, niacinamide) or brand/product keyword.
 */
export function parseSearchToFilterParams(rawInput: string): ParsedFilterParams {
  const result: ParsedFilterParams = {
    categories: [],
    formats: [],
    goals: [],
    fragrance: "all",
  };

  if (!rawInput || typeof rawInput !== "string") {
    return result;
  }

  const cleanedInput = rawInput.trim();
  if (cleanedInput.length === 0) {
    return result;
  }

  const lower = cleanedInput.toLowerCase();
  const matchedSubstrings: string[] = [];

  // 1. Explicit Category Detection (Authoritative longest-match-first)
  const categoryWords = new Set<string>();
  const explicitCategories = detectExplicitCategories(cleanedInput);
  if (explicitCategories.length > 0) {
    for (const cat of explicitCategories) {
      const catText = cat.matchedText.toLowerCase();
      categoryWords.add(catText);
      categoryWords.add(cat.categoryId);
      matchedSubstrings.push(catText);
      if (!result.categories.includes(cat.categoryId)) {
        result.categories.push(cat.categoryId);
      }
    }
  }

  // 2. Format Detection
  for (const fmt of FORMAT_PATTERNS) {
    const match = fmt.regex.exec(cleanedInput);
    if (match) {
      matchedSubstrings.push(match[0].toLowerCase());
      if (!result.formats.includes(fmt.format)) {
        result.formats.push(fmt.format);
      }
    }
  }

  // 3. Fragrance Detection
  const ffMatch = cleanedInput.match(FRAGRANCE_FREE_REGEX);
  if (ffMatch) {
    result.fragrance = "fragrance_free";
    matchedSubstrings.push(ffMatch[0].toLowerCase());
  } else {
    const scMatch = cleanedInput.match(SCENTED_REGEX);
    if (scMatch) {
      result.fragrance = "other";
      matchedSubstrings.push(scMatch[0].toLowerCase());
    }
  }

  // 4. Goal Detection (Hinglish + English synonyms)
  const detectedGoals: Set<string> = new Set();

  const matchesPhrase = (text: string, phrase: string): boolean => {
    const p = phrase.trim().toLowerCase();
    if (!p) return false;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
    return regex.test(text);
  };

  // Check HINGLISH_NEEDS (match all phrases so compound terms are fully extracted)
  for (const [key, synonyms] of Object.entries(HINGLISH_NEEDS)) {
    const canonicalGoal = key === "hydration" ? "hydration_barrier" : key;
    for (const syn of synonyms) {
      if (categoryWords.has(syn.toLowerCase())) continue;
      if (matchesPhrase(lower, syn)) {
        detectedGoals.add(canonicalGoal);
        matchedSubstrings.push(syn.toLowerCase());
      }
    }
  }

  // Check CONTROLLED_GOALS definitions
  for (const goal of CONTROLLED_GOALS) {
    for (const syn of goal.synonyms) {
      if (categoryWords.has(syn.toLowerCase())) continue;
      if (matchesPhrase(lower, syn)) {
        detectedGoals.add(goal.id);
        matchedSubstrings.push(syn.toLowerCase());
      }
    }

    if (!categoryWords.has(goal.label.toLowerCase()) && matchesPhrase(lower, goal.label)) {
      detectedGoals.add(goal.id);
      matchedSubstrings.push(goal.label.toLowerCase());
    }
  }

  result.goals = Array.from(detectedGoals);

  // 5. Product / Ingredient Keyword Search Identification
  // If the user's input directly contains a catalogue product name or active ingredient verbatim,
  // retain that keyword. Otherwise, if structured filters (goals, categories) were detected from concerns,
  // leave search empty so conversational filler does NOT break the search to 0 results!
  const hasStructuredFilters =
    result.categories.length > 0 ||
    result.goals.length > 0 ||
    result.formats.length > 0 ||
    (result.fragrance !== "all" && result.fragrance.length > 0);

  const matchesCatalogueEntity = DEMO_CATALOGUE_SEED.some((prod) => {
    const inName = prod.official_name.toLowerCase().includes(lower);
    const inIngs = prod.ingredients?.some((ing) => ing.toLowerCase().includes(lower) || lower.includes(ing.toLowerCase()));
    return inName || inIngs;
  });

  if (!hasStructuredFilters) {
    // Pure free-text search (e.g. "niacinamide", "ceramide", "ice roller")
    result.search = cleanedInput;
  } else if (matchesCatalogueEntity && lower.length >= 4) {
    // Both structured filters and a recognized specific product/ingredient were requested (e.g. "salicylic acid body wash")
    const foundIngredient = DEMO_CATALOGUE_SEED.flatMap((p) => p.ingredients || [])
      .find((ing) => lower.includes(ing.toLowerCase()) && ing.length >= 4);
    if (foundIngredient) {
      result.search = foundIngredient.toLowerCase();
    }
  }

  return result;
}
