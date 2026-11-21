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

export interface ProductFilterCriteria {
  search?: string;
  categories?: string[];
  formats?: string[];
  goals?: string[];
  fragrance?: string;
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
      const matchesFormat = formats.some((fmt) => prodFormat.includes(fmt));
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
