import { describe, it, expect } from "vitest";
import {
  matchSimilarBodywiseProducts,
  ScannedProductInfo,
} from "./visual-scan";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";

describe("Visual Product Matcher (Rule 2: AI interprets packaging, rules decide match ranking)", () => {
  it("correctly matches Minimalist 2% Salicylic Acid Face Wash to Be Bodywise Salicylic Acid Face Wash", () => {
    const scanned: ScannedProductInfo = {
      brand: "Minimalist",
      product_name: "Minimalist 2% Salicylic Acid Cleanser",
      category: "face_wash",
      format: "Gel / Foaming cleanser",
      active_ingredients: ["Salicylic Acid", "LHA", "Zinc PCA"],
      primary_concerns: ["Acne", "Oil control", "Blackheads"],
      summary: "Daily gentle exfoliating face wash with 2% Salicylic Acid.",
    };

    const matches = matchSimilarBodywiseProducts(scanned, DEMO_CATALOGUE_SEED);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(3);

    const topMatch = matches[0];
    expect(topMatch.product.official_name).toContain("Salicylic Acid");
    expect(topMatch.product.category).toBe("face_wash");
    expect(topMatch.similarity_score).toBeGreaterThanOrEqual(90);
    expect(topMatch.shared_ingredients).toContain("salicylic acid");
    expect(topMatch.match_reasons.some((r) => r.includes("Shares active ingredient"))).toBe(true);
  });

  it("correctly matches Sunscreen products to Be Bodywise SPF 50 sunscreens", () => {
    const scanned: ScannedProductInfo = {
      brand: "Minimalist",
      product_name: "Minimalist SPF 50 Multi-Vitamin Sunscreen",
      category: "sunscreen",
      format: "Lotion",
      active_ingredients: ["Avobenzone", "Octocrylene", "Niacinamide"],
      primary_concerns: ["Sun protection", "UV damage"],
      summary: "Broad-spectrum SPF 50 PA++++ sunscreen lotion.",
    };

    const matches = matchSimilarBodywiseProducts(scanned, DEMO_CATALOGUE_SEED);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].product.category).toBe("sunscreen");
    expect(matches[0].product.official_name.toLowerCase()).toContain("sunscreen");
  });

  it("correctly matches Anti-Dandruff Shampoos to Be Bodywise Dandruff Shampoos", () => {
    const scanned: ScannedProductInfo = {
      brand: "Sebamed",
      product_name: "Sebamed Anti-Dandruff Shampoo",
      category: "shampoo",
      format: "Liquid shampoo",
      active_ingredients: ["Piroctone Olamine", "Ketoconazole"],
      primary_concerns: ["Dandruff", "Flaky scalp"],
      summary: "Anti-dandruff shampoo targeting scalp flakes.",
    };

    const matches = matchSimilarBodywiseProducts(scanned, DEMO_CATALOGUE_SEED);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].product.category).toBe("shampoo");
    expect(matches[0].product.official_name.toLowerCase()).toContain("dandruff");
  });

  it("returns zero matches when image does not contain a product", () => {
    const nonProduct: ScannedProductInfo = {
      is_product_detected: false,
      brand: "Unknown",
      product_name: "No product detected",
      category: "unknown",
      format: "unknown",
      active_ingredients: [],
      primary_concerns: [],
      summary: "No cosmetic or wellness product was found in this image.",
    };

    const matches = matchSimilarBodywiseProducts(nonProduct, DEMO_CATALOGUE_SEED);
    expect(matches).toEqual([]);
  });
});
