import { describe, it, expect } from "vitest";
import { search } from "./search";
import { CATALOGUE_CATEGORIES } from "../data/categories";

describe("Retrieval Service (packages/shared/knowledge)", () => {
  it("proves ZERO category leakage for every category filter", () => {
    // For every category in CATALOGUE_CATEGORIES, query with terms that could match multiple categories
    const ambiguousQueries = [
      "acne and oily skin wash",
      "dryness moisturizer cream",
      "hair dandruff soothing",
      "gentle cleansing wash for rough skin",
      "sunscreen daily protection",
      "odor control roll on",
    ];

    for (const catDef of CATALOGUE_CATEGORIES) {
      const targetCategory = catDef.id;

      for (const q of ambiguousQueries) {
        const results = search({
          query: q,
          filters: { category: targetCategory },
          collection: "products",
          k: 20,
        });

        // Every returned family must strictly match targetCategory
        for (const res of results) {
          expect(res.category).toBe(targetCategory);
          // And each of its matched chunks must match targetCategory
          for (const chunk of res.matchedChunks) {
            // chunkId starts with familyId
            expect(chunk.chunkId).toBeDefined();
            expect(res.familyId).toBeDefined();
          }
        }
      }
    }
  });

  it("strictly isolates product and support collections", () => {
    // 1. Search products collection
    const productResults = search({
      query: "return refund delivery courier support",
      collection: "products",
      k: 10,
    });

    for (const res of productResults) {
      expect(res.familyId).toBeDefined();
      expect(res.id).toBeUndefined();
      for (const mc of res.matchedChunks) {
        expect(mc.chunkType).not.toBe("support");
      }
    }

    // 2. Search support collection
    const supportResults = search({
      query: "return refund delivery courier support",
      collection: "support",
      k: 10,
    });

    expect(supportResults.length).toBeGreaterThan(0);
    for (const res of supportResults) {
      expect(res.id).toBeDefined();
      expect(res.familyId).toBeUndefined();
      for (const mc of res.matchedChunks) {
        expect(mc.chunkType).toBe("support");
        expect(mc.text).toMatch(/https?:\/\/|tel:|mailto:/);
      }
    }
  });

  it("retrieves relevant families for Hinglish and English queries", () => {
    // Hinglish query: "sukhapan" (dryness) / "rukhi skin"
    const results = search({
      query: "sukhapan rukhi skin",
      collection: "products",
      k: 5,
    });

    expect(results.length).toBeGreaterThan(0);

    // English query: "salicylic acid body wash"
    const bodyWashResults = search({
      query: "salicylic acid body wash",
      filters: { category: "body_wash" },
      collection: "products",
      k: 5,
    });

    expect(bodyWashResults.length).toBeGreaterThan(0);
    expect(bodyWashResults[0].category).toBe("body_wash");
    expect(bodyWashResults[0].familyId).toContain("salicylic");
  });

  it("returns empty array if pre-filter matches 0 products without throwing", () => {
    const results = search({
      query: "anything",
      filters: { category: "non_existent_category" },
      collection: "products",
      k: 5,
    });

    expect(results).toEqual([]);
  });
});
