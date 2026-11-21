import { DEMO_CATALOGUE_SEED, ProductRecord } from "@bodywise/shared";

export interface CategorySummary {
  id: string;
  label: string;
  word: string; // singular word for hero rotation
  count: number;
  description: string;
}

// Compute real catalogue statistics strictly at build time from verified data
export function getCatalogueStats(products: ProductRecord[] = DEMO_CATALOGUE_SEED) {
  const totalProducts = products.length;

  const categoryCounts: Record<string, number> = {};
  let productsWithVerifiedDate = 0;

  for (const p of products) {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
    if (p.last_verified_at) {
      productsWithVerifiedDate++;
    }
  }

  // Real categories with > 0 products and human-friendly labels
  const categoryMetadata: Record<string, { label: string; word: string; description: string }> = {
    body_wash: {
      label: "Body Washes & Scrubs",
      word: "body wash",
      description: "Exfoliating salicylic and lactic acid shower rinses",
    },
    face_wash: {
      label: "Cleansers & Face Wash",
      word: "face wash",
      description: "Gentle foaming and gel cleansers for daily skin care",
    },
    serum: {
      label: "Active Serums & Roll-ons",
      word: "serum",
      description: "Niacinamide, AHA/BHA, and roll-on targeted treatments",
    },
    shampoo: {
      label: "Scalp Care & Shampoos",
      word: "shampoo",
      description: "Anti-dandruff and strengthening hair wash formulas",
    },
    sunscreen: {
      label: "Sunscreens & SPF",
      word: "sunscreen",
      description: "Broad spectrum UV protection with zero white cast",
    },
    supplement: {
      label: "Supplements & Gummies",
      word: "supplement",
      description: "Biotin, zinc, and multivitamin nutritional support",
    },
  };

  const realCategories: CategorySummary[] = Object.entries(categoryMetadata)
    .filter(([catId]) => (categoryCounts[catId] || 0) > 0)
    .map(([catId, meta]) => ({
      id: catId,
      label: meta.label,
      word: meta.word,
      count: categoryCounts[catId] || 0,
      description: meta.description,
    }))
    .sort((a, b) => b.count - a.count);

  const percentVerified =
    totalProducts > 0
      ? Math.round((productsWithVerifiedDate / totalProducts) * 100)
      : 100;

  return {
    totalProducts,
    realCategories,
    categoriesCount: realCategories.length,
    percentVerified,
    heroWords: realCategories.map((c) => c.word),
  };
}

export const CATALOGUE_STATS = getCatalogueStats();
