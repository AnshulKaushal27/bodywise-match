import { describe, it, expect } from "vitest";
import { filterProducts, computeFacetCounts, normalizeToken, parseSearchToFilterParams } from "./filters";
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

  describe("parseSearchToFilterParams (Dynamic Search-to-Filters Engine)", () => {
    it("parses 'oily face ka ilaaj' by applying goal only and NO category", () => {
      const parsed = parseSearchToFilterParams("oily face ka ilaaj");
      expect(parsed.goals).toContain("oil_control");
      expect(parsed.categories).toEqual([]);
      expect(parsed.fragrance).toBe("all");
      expect(parsed.formats).toEqual([]);
      expect(parsed.search).toBeUndefined();
    });

    it("parses 'chehre ke daag dhabbe aur tanning ke liye serum' with category serum, goal dark_spots_look, and NO search keyword", () => {
      const parsed = parseSearchToFilterParams("chehre ke daag dhabbe aur tanning ke liye serum");
      expect(parsed.categories).toContain("serum");
      expect(parsed.goals).toContain("dark_spots_look");
      expect(parsed.fragrance).toBe("all");
      expect(parsed.search).toBeUndefined();
    });

    it("parses 'meri skin pe bahut tel rehta hai' by applying goal oil_control and NO search keyword", () => {
      const parsed = parseSearchToFilterParams("meri skin pe bahut tel rehta hai");
      expect(parsed.goals).toContain("oil_control");
      expect(parsed.categories).toEqual([]);
      expect(parsed.search).toBeUndefined();
      const matches = filterProducts(allProducts, parsed);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("parses 'hair fall bohot zyada ho raha hai' with goal hair_fall_appearance and NO residual search", () => {
      const parsed = parseSearchToFilterParams("hair fall bohot zyada ho raha hai");
      expect(parsed.goals).toContain("hair_fall_appearance");
      expect(parsed.search).toBeUndefined();
      const matches = filterProducts(allProducts, parsed);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("prevents conversational stopwords in search from breaking structured filters", () => {
      const brokenFilterAttempt = filterProducts(allProducts, {
        goals: ["oil_control"],
        search: "pe bahut rehta",
      });
      expect(brokenFilterAttempt.length).toBeGreaterThan(0);
      expect(brokenFilterAttempt.every((p) => p.supported_goals.includes("oil_control"))).toBe(true);
    });

    it("parses 'salicylic acid body wash for back acne' with category body_wash, goal body_bumps_look, and search 'salicylic acid'", () => {
      const parsed = parseSearchToFilterParams("salicylic acid body wash for back acne");
      expect(parsed.categories).toContain("body_wash");
      expect(parsed.goals).toContain("body_bumps_look");
      expect(parsed.search).toContain("salicylic acid");
    });

    it("parses 'fragrance free sunscreen' with category sunscreen, fragrance fragrance_free, and no goal", () => {
      const parsed = parseSearchToFilterParams("fragrance free sunscreen");
      expect(parsed.categories).toContain("sunscreen");
      expect(parsed.fragrance).toBe("fragrance_free");
      expect(parsed.goals).toEqual([]);
    });

    it("parses raw ingredient 'niacinamide' as search query with no filters", () => {
      const parsed = parseSearchToFilterParams("niacinamide");
      expect(parsed.search).toBe("niacinamide");
      expect(parsed.categories).toEqual([]);
      expect(parsed.goals).toEqual([]);
      expect(parsed.fragrance).toBe("all");
    });

    it("handles empty or whitespace inputs gracefully", () => {
      const empty = parseSearchToFilterParams("");
      expect(empty.categories).toEqual([]);
      expect(empty.goals).toEqual([]);
      expect(empty.fragrance).toBe("all");
      expect(empty.search).toBeUndefined();
    });
  });
});
