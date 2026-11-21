import { DEMO_CATALOGUE_SEED, ProductRecord } from "@bodywise/shared";

export interface CategorySummary {
  id: string;
  label: string;
  word: string; // singular word for hero rotation
  count: number;
  description: string;
  badge?: string;
  pluralAction?: string;
  highlights?: string[];
  theme?: {
    iconBg: string;
    iconColor: string;
    badgeBorder: string;
    badgeText: string;
    accentColor: string;
  };
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

  // Real categories with > 0 products, human-friendly labels, and curated ingredient metadata
  const categoryMetadata: Record<
    string,
    {
      label: string;
      word: string;
      description: string;
      badge: string;
      pluralAction: string;
      highlights: string[];
      theme: {
        iconBg: string;
        iconColor: string;
        badgeBorder: string;
        badgeText: string;
        accentColor: string;
      };
    }
  > = {
    body_wash: {
      label: "Body Washes & Scrubs",
      word: "body wash",
      badge: "Bestseller Routine",
      pluralAction: "Explore body washes",
      description: "Exfoliating salicylic and lactic acid foaming washes crafted to smooth rough texture, strawberry legs, and body bumps.",
      highlights: ["1% Salicylic Acid", "Lactic Acid", "Body Bumps"],
      theme: {
        iconBg: "bg-teal-50",
        iconColor: "text-teal-700",
        badgeBorder: "border-teal-200/80",
        badgeText: "text-teal-800",
        accentColor: "teal",
      },
    },
    serum: {
      label: "Active Serums & Roll-ons",
      word: "serum",
      badge: "Targeted Actives",
      pluralAction: "Explore active serums",
      description: "High-potency Niacinamide, AHA/BHA, and scalp roll-on treatments calibrated for dark spots, barrier repair, and density.",
      highlights: ["10% Niacinamide", "Scalp Actives", "Dark Spots"],
      theme: {
        iconBg: "bg-blue-50",
        iconColor: "text-brand-primary",
        badgeBorder: "border-brand-primary/25",
        badgeText: "text-brand-primary",
        accentColor: "blue",
      },
    },
    supplement: {
      label: "Supplements & Gummies",
      word: "supplement",
      badge: "Daily Nutrition",
      pluralAction: "Explore supplements",
      description: "Biotin, zinc, iron, and multivitamin gummies supporting internal hair follicle nourishment and wellness.",
      highlights: ["Biotin 10,000 mcg", "Zinc & Folate", "Zero Sugar"],
      theme: {
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-700",
        badgeBorder: "border-indigo-200/80",
        badgeText: "text-indigo-800",
        accentColor: "indigo",
      },
    },
    sunscreen: {
      label: "Sunscreens & SPF",
      word: "sunscreen",
      badge: "UV Defense",
      pluralAction: "Explore sunscreens",
      description: "Broad spectrum PA++++ daily sun protection with ultralight fluid textures and zero white cast.",
      highlights: ["SPF 50 PA++++", "Zero White Cast", "Matte Gel"],
      theme: {
        iconBg: "bg-amber-50",
        iconColor: "text-amber-700",
        badgeBorder: "border-amber-200/80",
        badgeText: "text-amber-800",
        accentColor: "amber",
      },
    },
    face_wash: {
      label: "Cleansers & Face Wash",
      word: "face wash",
      badge: "Gentle Rinses",
      pluralAction: "Explore face washes",
      description: "Gentle foaming and gel cleansers with AHA/BHA actives to clear pore sebum while preserving lipid barrier moisture.",
      highlights: ["AHA / BHA", "Barrier Safe", "Oil Control"],
      theme: {
        iconBg: "bg-sky-50",
        iconColor: "text-sky-700",
        badgeBorder: "border-sky-200/80",
        badgeText: "text-sky-800",
        accentColor: "sky",
      },
    },
    shampoo: {
      label: "Scalp Care & Shampoos",
      word: "shampoo",
      badge: "Scalp Health",
      pluralAction: "Explore shampoos",
      description: "Anti-dandruff and strengthening hair wash formulas that soothe flakes, calm itching, and reinforce follicle roots.",
      highlights: ["Zinc Pyrithione", "Flake Defense", "Root Strength"],
      theme: {
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-700",
        badgeBorder: "border-emerald-200/80",
        badgeText: "text-emerald-800",
        accentColor: "emerald",
      },
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
      badge: meta.badge,
      pluralAction: meta.pluralAction,
      highlights: meta.highlights,
      theme: meta.theme,
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
