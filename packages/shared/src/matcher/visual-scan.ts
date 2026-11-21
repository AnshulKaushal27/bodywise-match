import { z } from "zod";
import { ProductRecord, ProductRecordSchema } from "../product";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";

export const ScannedProductInfoSchema = z.object({
  brand: z.string().default("Unknown Brand"),
  product_name: z.string().default("Product"),
  category: z.string().default("general"),
  format: z.string().default("general"),
  active_ingredients: z.array(z.string()).default([]),
  primary_concerns: z.array(z.string()).default([]),
  summary: z.string().default(""),
  is_product_detected: z.boolean().default(true),
});

export type ScannedProductInfo = z.infer<typeof ScannedProductInfoSchema>;

export const VisualMatchItemSchema = z.object({
  product: ProductRecordSchema,
  similarity_score: z.number(),
  match_reasons: z.array(z.string()),
  shared_ingredients: z.array(z.string()),
  shared_concerns: z.array(z.string()),
});

export type VisualMatchItem = z.infer<typeof VisualMatchItemSchema>;

export const VisualScanResultSchema = z.object({
  scanned_product: ScannedProductInfoSchema,
  explanation: z.string(),
  matches: z.array(VisualMatchItemSchema),
  latency_ms: z.number().optional(),
});

export type VisualScanResult = z.infer<typeof VisualScanResultSchema>;

/**
 * Deterministic matching function (Rule 2: AI interprets packaging, rules decide match ranking)
 * Matches a scanned competitor or third-party product against the Be Bodywise catalogue.
 */
export function matchSimilarBodywiseProducts(
  scanned: ScannedProductInfo,
  catalogue: ProductRecord[] = DEMO_CATALOGUE_SEED
): VisualMatchItem[] {
  // If no product was detected or image was unmeaningful/blurry, return empty list honestly
  if (
    scanned.is_product_detected === false ||
    (scanned.brand.toLowerCase() === "unknown" &&
      (!scanned.active_ingredients || scanned.active_ingredients.length === 0) &&
      (!scanned.category || scanned.category === "general" || scanned.category === "unknown"))
  ) {
    return [];
  }

  const normCategory = scanned.category.toLowerCase().replace(/[- ]/g, "_");
  const normActives = (scanned.active_ingredients || []).map((a) =>
    a.toLowerCase().replace(/\(.*?\)/g, "").trim()
  ).filter(Boolean);
  const normConcerns = (scanned.primary_concerns || []).map((c) =>
    c.toLowerCase().trim()
  ).filter(Boolean);

  const scored = catalogue.map((prod) => {
    let score = 0;
    const reasons: string[] = [];
    const sharedIngredients: string[] = [];
    const sharedConcerns: string[] = [];

    const prodCat = prod.category.toLowerCase().replace(/[- ]/g, "_");
    const prodName = prod.official_name.toLowerCase();
    const prodDesc = prod.official_description.toLowerCase();
    const prodIngredients = (prod.ingredients || []).map((i) => i.toLowerCase());
    const prodGoals = (prod.supported_goals as string[]).map((g) =>
      g.toLowerCase().replace(/_/g, " ")
    );

    // 1. Category Matching (40 points)
    if (prodCat === normCategory) {
      score += 45;
      reasons.push(`Exact category match: ${prod.category.replace(/_/g, " ")}`);
    } else if (
      (normCategory.includes("face") && prodCat.includes("face")) ||
      (normCategory.includes("wash") && prodCat.includes("wash")) ||
      (normCategory.includes("serum") && prodCat.includes("serum")) ||
      (normCategory.includes("sunscreen") && prodCat.includes("sunscreen")) ||
      (normCategory.includes("shampoo") && prodCat.includes("shampoo")) ||
      (normCategory.includes("lotion") && prodCat.includes("moisturizer"))
    ) {
      score += 25;
      reasons.push("Related routine step");
    }

    // 2. Active Ingredients Matching (Up to 50 points per matching active)
    for (const active of normActives) {
      if (active.length < 3) continue;
      const inIngredients = prodIngredients.some((i) => i.includes(active));
      const inName = prodName.includes(active);
      const inDesc = prodDesc.includes(active);

      if (inIngredients || inName || inDesc) {
        score += inName ? 45 : 30;
        sharedIngredients.push(active);
        reasons.push(`Shares active ingredient: ${active}`);
      }
    }

    // 3. Concerns / Stated Wellness Goals (15 points each)
    for (const concern of normConcerns) {
      if (concern.length < 3) continue;
      const matchesGoal = prodGoals.some(
        (g) => g.includes(concern) || concern.includes(g)
      );
      const inDesc = prodDesc.includes(concern);
      if (matchesGoal || inDesc) {
        score += 15;
        sharedConcerns.push(concern);
      }
    }

    // 4. Format consistency bonus
    if (
      scanned.format &&
      scanned.format.length > 2 &&
      prod.format.toLowerCase().includes(scanned.format.toLowerCase())
    ) {
      score += 10;
      reasons.push(`Matching format: ${prod.format}`);
    }

    return {
      product: prod,
      similarity_score: Math.min(score, 100),
      match_reasons: reasons,
      shared_ingredients: Array.from(new Set(sharedIngredients)),
      shared_concerns: Array.from(new Set(sharedConcerns)),
    };
  });

  // Filter products with meaningful similarity, sort by score descending
  const relevant = scored.filter((item) => item.similarity_score >= 25);
  relevant.sort((a, b) => b.similarity_score - a.similarity_score);

  // Return top 3 matches (or top 1-2 if fewer available)
  return relevant.slice(0, 3);
}
