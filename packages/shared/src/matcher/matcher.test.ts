import { describe, it, expect } from "vitest";
import { matchProducts } from "./index";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";
import { ProductRecord } from "../product";
import { ParsedNeeds } from "./types";

describe("Deterministic Matching Engine (RULES_VERSION = 1.0.0)", () => {
  const baseNeeds: ParsedNeeds = {
    goal: "body_bumps_look",
    category: "body_wash",
    format_preferences: ["Liquid Body Cleanser"],
    avoidances: [],
    routine_context: "evening_shower",
    uncertainties: [],
    confidence: "high",
  };

  it("produces valid match shortlist for standard goals", () => {
    const result = matchProducts(baseNeeds, DEMO_CATALOGUE_SEED);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      expect(result.shortlist.length).toBeGreaterThan(0);
      expect(result.shortlist.length).toBeLessThanOrEqual(3);
      expect(result.shortlist[0].rank).toBe(1);
      expect(result.shortlist[0].reasonCodes).toContain("EXACT_GOAL_MATCH");
    }
  });

  it("handles Hard Exclusions (Step 1) when avoidance explicitly conflicts", () => {
    const mockProducts: ProductRecord[] = [
      {
        ...DEMO_CATALOGUE_SEED[0],
        id: "b2000000-0000-0000-0000-000000000001",
        slug: "scented-body-wash",
        fragrance_free: false, // explicitly contains fragrance
      },
      {
        ...DEMO_CATALOGUE_SEED[1],
        id: "b2000000-0000-0000-0000-000000000002",
        slug: "unscented-body-wash",
        fragrance_free: true, // verified fragrance free
      },
    ];

    const needsWithFragranceAvoidance: ParsedNeeds = {
      ...baseNeeds,
      avoidances: ["fragrance"],
    };

    const result = matchProducts(needsWithFragranceAvoidance, mockProducts);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      const ids = result.shortlist.map((r) => r.productId);
      expect(ids).toContain("b2000000-0000-0000-0000-000000000002");
      expect(ids).not.toContain("b2000000-0000-0000-0000-000000000001");
      expect(result.shortlist[0].reasonCodes).toContain("AVOIDANCE_SATISFIED_VERIFIED");
    }
  });

  it("keeps product with UNVERIFIED_AVOIDANCE when avoidance data is null", () => {
    const mockProductWithNull: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000003",
      slug: "unverified-fragrance-wash",
      fragrance_free: null, // unknown / unverified
    };

    const needsWithAvoidance: ParsedNeeds = {
      ...baseNeeds,
      avoidances: ["fragrance"],
    };

    const result = matchProducts(needsWithAvoidance, [mockProductWithNull]);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      expect(result.shortlist[0].productId).toBe("b2000000-0000-0000-0000-000000000003");
      expect(result.shortlist[0].reasonCodes).toContain("UNVERIFIED_AVOIDANCE");
      expect(
        result.shortlist[0].missingFacts.some((f) => f.includes("We couldn't verify this"))
      ).toBe(true);
    }
  });

  it("returns NO_FIT with BROWSE_CATALOGUE suggestion when no product qualifies", () => {
    const impossibleNeeds: ParsedNeeds = {
      goal: "unsupported_unknown_goal_xyz",
      category: null,
      format_preferences: ["Unobtainable Format"],
      avoidances: [],
      routine_context: null,
      uncertainties: [],
      confidence: "low",
    };

    const result = matchProducts(impossibleNeeds, DEMO_CATALOGUE_SEED);
    expect(result.status).toBe("NO_FIT");
    if (result.status === "NO_FIT") {
      expect(result.suggestion).toBe("BROWSE_CATALOGUE");
      expect(result.reason).toBeDefined();
    }
  });

  it("breaks ties deterministically by verified facts count, then alphabetical slug", () => {
    const prodA: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000010",
      slug: "product-zebra",
      // 3 verified facts
      ingredients: ["Aqua", "Glycerin"],
      cautions: ["Keep out of reach of children."],
      price_inr: 299,
      price_source: "Official Site",
    };

    const prodB: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000020",
      slug: "product-alpha",
      // Fewer verified facts
      ingredients: null,
      cautions: null,
      price_inr: null,
      price_source: null,
    };

    // Both match baseNeeds equally, but prodA has more verified facts
    const result = matchProducts(baseNeeds, [prodB, prodA]);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      // prodA should win because of more verified facts
      expect(result.shortlist[0].productId).toBe(prodA.id);
    }
  });

  it("breaks ties by alphabetical slug when scores and verified facts are equal", () => {
    const prodZebra: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000030",
      slug: "zebra-cleanser",
      ingredients: null,
    };

    const prodApple: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000040",
      slug: "apple-cleanser",
      ingredients: null,
    };

    const result = matchProducts(baseNeeds, [prodZebra, prodApple]);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      // "apple-cleanser" comes before "zebra-cleanser" alphabetically
      expect(result.shortlist[0].productId).toBe(prodApple.id);
      expect(result.shortlist[1].productId).toBe(prodZebra.id);
    }
  });

  it("is 100% deterministic (same input produces identical output across 100 runs)", () => {
    const firstResult = JSON.stringify(matchProducts(baseNeeds, DEMO_CATALOGUE_SEED));

    for (let i = 0; i < 100; i++) {
      const repeatedResult = JSON.stringify(matchProducts(baseNeeds, DEMO_CATALOGUE_SEED));
      expect(repeatedResult).toBe(firstResult);
    }
  });

  it("never references a productId not present in the catalogue", () => {
    const result = matchProducts(baseNeeds, DEMO_CATALOGUE_SEED);
    expect(result.status).toBe("MATCHES_FOUND");
    if (result.status === "MATCHES_FOUND") {
      const catalogueIds = new Set(DEMO_CATALOGUE_SEED.map((p) => p.id));
      for (const item of result.shortlist) {
        expect(catalogueIds.has(item.productId)).toBe(true);
      }
    }
  });

  it("never outputs percentage match scores (Rule 4)", () => {
    const result = matchProducts(baseNeeds, DEMO_CATALOGUE_SEED);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/%|percentage|match_score/i);
  });

  it("returns NO_FIT when catalogue is completely empty", () => {
    const result = matchProducts(baseNeeds, []);
    expect(result.status).toBe("NO_FIT");
    if (result.status === "NO_FIT") {
      expect(result.reason).toContain("empty");
      expect(result.total_evaluated).toBe(0);
    }
  });

  it("hard excludes products containing avoided chemical in ingredients list", () => {
    const mockSalicylicProduct: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000099",
      slug: "salicylic-cleanser",
      ingredients: ["Aqua", "Salicylic Acid", "Glycerin"],
    };

    const needsWithSalicylicAvoidance: ParsedNeeds = {
      ...baseNeeds,
      avoidances: ["salicylic acid"],
    };

    const result = matchProducts(needsWithSalicylicAvoidance, [mockSalicylicProduct]);
    expect(result.status).toBe("NO_FIT");
  });

  it("hard excludes products whose official cautions conflict with avoidance", () => {
    const mockRetinolProduct: ProductRecord = {
      ...DEMO_CATALOGUE_SEED[0],
      id: "b2000000-0000-0000-0000-000000000098",
      slug: "retinol-wash",
      ingredients: ["Aqua", "Glycerin"],
      cautions: ["Not suitable for pregnancy or nursing."],
    };

    const needsWithPregnancyAvoidance: ParsedNeeds = {
      ...baseNeeds,
      avoidances: ["pregnancy"],
    };

    const result = matchProducts(needsWithPregnancyAvoidance, [mockRetinolProduct]);
    expect(result.status).toBe("NO_FIT");
  });
});
