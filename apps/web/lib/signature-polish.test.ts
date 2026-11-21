import { describe, it, expect } from "vitest";
import { getCatalogueStats } from "./catalogueStats";
import { MOTION_TOKENS } from "./motion";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

describe("Signature Polish - Catalogue Stats & Categories", () => {
  it("builds category stats where every category has at least one verified product", () => {
    const stats = getCatalogueStats();

    expect(stats.realCategories.length).toBeGreaterThan(0);
    for (const cat of stats.realCategories) {
      expect(cat.count).toBeGreaterThan(0);
      expect(cat.id).toBeDefined();
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.word.length).toBeGreaterThan(0);
    }
  });

  it("computes stats matching the real catalogue seed without invented numbers", () => {
    const stats = getCatalogueStats();

    expect(stats.totalProducts).toBe(DEMO_CATALOGUE_SEED.length);
    expect(stats.totalProducts).toBe(107);
    expect(stats.categoriesCount).toBe(6);

    // Verified date count
    const productsWithDate = DEMO_CATALOGUE_SEED.filter((p) => Boolean(p.last_verified_at)).length;
    const expectedPct = Math.round((productsWithDate / DEMO_CATALOGUE_SEED.length) * 100);
    expect(stats.percentVerified).toBe(expectedPct);
    expect(stats.percentVerified).toBe(100);
  });

  it("never includes an empty category in the active category list", () => {
    const stats = getCatalogueStats();
    const emptyCats = stats.realCategories.filter((c) => c.count === 0);
    expect(emptyCats).toHaveLength(0);
  });

  it("provides hero rotation words matching active real categories", () => {
    const stats = getCatalogueStats();
    expect(stats.heroWords).toEqual([
      "body wash",
      "serum",
      "supplement",
      "sunscreen",
      "face wash",
      "shampoo",
    ]);
  });
});

describe("Signature Polish - Motion System Tokens", () => {
  it("exports exact required duration and easing tokens", () => {
    expect(MOTION_TOKENS.durations.fast).toBe("150ms");
    expect(MOTION_TOKENS.durations.normal).toBe("250ms");
    expect(MOTION_TOKENS.durations.moderate).toBe("400ms");
    expect(MOTION_TOKENS.durations.slow).toBe("700ms");
    expect(MOTION_TOKENS.easing).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
    expect(MOTION_TOKENS.stagger).toBe(60);
  });
});
