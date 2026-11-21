import { describe, it, expect } from "vitest";
import { filterProducts, computeFacetCounts, normalizeToken } from "./filters";
import { DEMO_CATALOGUE_SEED } from "./data/catalogue.seed";

describe("filterProducts pure filter logic (packages/shared/src/filters.ts)", () => {
  const allProducts = DEMO_CATALOGUE_SEED;

  it("returns all products when criteria are empty or 'all'", () => {
    const result = filterProducts(allProducts, {});
    expect(result.length).toBe(allProducts.length);

    const resultAll = filterProducts(allProducts, {
      categories: ["all"],
      formats: ["all"],
      goals: ["all"],
      fragrance: "all",
    });
    expect(resultAll.length).toBe(allProducts.length);
  });

  it("filters by single category (e.g. face_wash and face-wash)", () => {
    const underscoreResult = filterProducts(allProducts, { categories: ["face_wash"] });
    const hyphenResult = filterProducts(allProducts, { categories: ["face-wash"] });

    expect(underscoreResult.length).toBeGreaterThan(0);
    expect(hyphenResult.length).toBe(underscoreResult.length);
    expect(underscoreResult.every((p) => p.category === "face_wash")).toBe(true);
  });

  it("combines multiple selections within a group using OR", () => {
    const faceWashes = filterProducts(allProducts, { categories: ["face_wash"] });
    const bodyWashes = filterProducts(allProducts, { categories: ["body_wash"] });
    const combined = filterProducts(allProducts, { categories: ["face_wash", "body_wash"] });

    expect(combined.length).toBe(faceWashes.length + bodyWashes.length);
    expect(combined.every((p) => p.category === "face_wash" || p.category === "body_wash")).toBe(true);
  });

  it("combines different filter groups using AND", () => {
    const faceWashes = filterProducts(allProducts, { categories: ["face_wash"] });
    const faceWashesWithGel = filterProducts(allProducts, {
      categories: ["face_wash"],
      formats: ["gel"],
    });

    expect(faceWashesWithGel.length).toBeLessThanOrEqual(faceWashes.length);
    expect(faceWashesWithGel.every((p) => p.category === "face_wash" && p.format.toLowerCase().includes("gel"))).toBe(true);
  });

  it("faithfully handles the honest fragrance declaration filter", () => {
    const fragranceFree = filterProducts(allProducts, { fragrance: "fragrance_free" });
    const fragranceOther = filterProducts(allProducts, { fragrance: "other" });

    expect(fragranceFree.every((p) => p.fragrance_free === true)).toBe(true);
    expect(fragranceOther.every((p) => p.fragrance_free !== true)).toBe(true);
    expect(fragranceFree.length + fragranceOther.length).toBe(allProducts.length);
  });

  it("filters by search query across name, description, ingredients, and goals", () => {
    const searchSalicylic = filterProducts(allProducts, { search: "salicylic" });
    expect(searchSalicylic.length).toBeGreaterThan(0);
    expect(
      searchSalicylic.every(
        (p) =>
          p.official_name.toLowerCase().includes("salicylic") ||
          p.official_description.toLowerCase().includes("salicylic") ||
          (p.ingredients && p.ingredients.some((i) => i.toLowerCase().includes("salicylic")))
      )
    ).toBe(true);
  });

  it("computes facet counts that strictly equal the filtered count", () => {
    const options = {
      categories: [{ id: "all" }, { id: "face_wash" }, { id: "body_wash" }],
      formats: [{ id: "all" }, { id: "gel" }, { id: "liquid" }],
      goals: [{ id: "all" }, { id: "oil_control" }],
      fragrance: [{ id: "all" }, { id: "fragrance_free" }, { id: "other" }],
    };

    const currentCriteria = {
      categories: ["face_wash"],
      formats: ["gel"],
    };

    const counts = computeFacetCounts(allProducts, currentCriteria, options);

    // Verify face_wash count matches filterProducts with face_wash + gel
    const faceWashCount = filterProducts(allProducts, {
      categories: ["face_wash"],
      formats: ["gel"],
    }).length;
    expect(counts.categories["face_wash"]).toBe(faceWashCount);

    // Verify fragrance_free count matches filterProducts with face_wash + gel + fragrance_free
    const ffCount = filterProducts(allProducts, {
      categories: ["face_wash"],
      formats: ["gel"],
      fragrance: "fragrance_free",
    }).length;
    expect(counts.fragrance["fragrance_free"]).toBe(ffCount);
  });

  it("normalizes tokens correctly", () => {
    expect(normalizeToken("face-wash")).toBe("face_wash");
    expect(normalizeToken("Oil-Sebum-Balance")).toBe("oil_sebum_balance");
  });
});
