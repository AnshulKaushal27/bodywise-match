import { describe, it, expect } from "vitest";
import { selectNextFacetQuestion, getCandidateFamilies } from "./facet-selector";
import { calculateMatchPreview } from "./preview";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";
import { KNOWLEDGE_CARDS_SEED } from "../data/knowledge.seed";
import { CONCEPTS_BY_ID } from "../retrieval/concepts";
import { ParsedRequest } from "./types";

describe("Facet Selector (Information Gain Guided Questions)", () => {
  const hydrationRequest: ParsedRequest = {
    medical_flag: false,
    needs: [
      {
        id: "need_1",
        phrase_from_user: "dry skin on my body",
        normalised_label: "Hydration & moisture balance",
        concepts: ["dryness", "hydration"],
        target_zone: "body",
      },
    ],
    avoidances: ["Parabens"],
    routine_context: "evening",
  };

  it("retrieves candidates strictly matching the requested goals and avoidances", () => {
    const candidates = getCandidateFamilies(hydrationRequest, DEMO_CATALOGUE_SEED);
    expect(candidates.length).toBeGreaterThan(0);

    for (const fam of candidates) {
      // Must not contain Parabens
      expect(
        fam.primaryProduct.ingredients?.some((i) => i.toLowerCase().includes("paraben"))
      ).toBeFalsy();

      // Must support dryness or hydration, or match category
      const card = KNOWLEDGE_CARDS_SEED.find((c) => c.productId === fam.primaryProduct.id);
      const supportsGoal =
        fam.primaryProduct.supported_goals.some(
          (g) => g === "dryness" || g === "hydration" || g === "hydration_barrier"
        ) ||
        (card ? card.concepts.includes("hydration") : false) ||
        Boolean(CONCEPTS_BY_ID.get("hydration")?.related_categories.includes(fam.category));
      expect(supportsGoal).toBe(true);
    }
  });

  it("does not offer irrelevant options like scalp or sunscreen when asking about hydration", () => {
    const result = selectNextFacetQuestion(hydrationRequest, DEMO_CATALOGUE_SEED, {}, 0);
    expect(result.done).toBe(false);
    expect(result.facet).toBeDefined();
    expect(result.options).toBeDefined();

    // Verify no zero-count options
    for (const opt of result.options!) {
      expect(opt.count).toBeGreaterThan(0);
      expect(opt.label).not.toContain("Scalp & hair");
      expect(opt.label).not.toContain("Sun protection");
    }

    // Verify last option is neutral "Any / not sure"
    const lastOpt = result.options![result.options!.length - 1];
    expect(lastOpt.isAny).toBe(true);
    expect(lastOpt.label).toBe("Any / not sure");
  });

  it("stops when 3 questions have been asked", () => {
    const result = selectNextFacetQuestion(hydrationRequest, DEMO_CATALOGUE_SEED, {}, 3);
    expect(result.done).toBe(true);
  });

  it("stops when candidate families are 3 or fewer", () => {
    // Restrict with category that has <= 3 families (conditioner has 1)
    const result = selectNextFacetQuestion(
      hydrationRequest,
      DEMO_CATALOGUE_SEED,
      { category: "conditioner" },
      0
    );
    expect(result.done).toBe(true);
    expect(result.candidateCount).toBeLessThanOrEqual(3);
  });

  it("is 100% deterministic across 100 runs", () => {
    const firstRun = selectNextFacetQuestion(hydrationRequest, DEMO_CATALOGUE_SEED, {}, 0);
    for (let i = 0; i < 100; i++) {
      const subsequentRun = selectNextFacetQuestion(hydrationRequest, DEMO_CATALOGUE_SEED, {}, 0);
      expect(subsequentRun).toEqual(firstRun);
    }
  });
});

describe("calculateMatchPreview", () => {
  const hydrationRequest: ParsedRequest = {
    medical_flag: false,
    needs: [
      {
        id: "need_1",
        phrase_from_user: "dry skin",
        normalised_label: "Hydration",
        concepts: ["dryness", "hydration"],
      },
    ],
    avoidances: [],
  };

  it("returns top 3 preview families with non-empty fields", () => {
    const preview = calculateMatchPreview(hydrationRequest, DEMO_CATALOGUE_SEED);
    expect(preview.count).toBeGreaterThan(0);
    expect(preview.familiesTop.length).toBeLessThanOrEqual(3);
    expect(preview.perNeedCounts.length).toBe(1);
    expect(preview.status).toMatch(/focused|broad/);

    for (const fam of preview.familiesTop) {
      expect(fam.name).toBeTruthy();
      expect(fam.category).toBeTruthy();
      expect(fam.whyLine).toBeTruthy();
    }
  });

  it("identifies the limiting chip when candidate set is empty", () => {
    const impossibleRequest: ParsedRequest = {
      medical_flag: false,
      needs: [
        {
          id: "need_1",
          phrase_from_user: "dry skin",
          normalised_label: "Hydration",
          concepts: ["dryness"],
        },
      ],
      avoidances: [],
    };

    const preview = calculateMatchPreview(impossibleRequest, DEMO_CATALOGUE_SEED, {
      format: "oil",
    });
    expect(preview.count).toBe(0);
    expect(preview.status).toBe("empty");
    expect(preview.limitingChip).toBeDefined();
    expect(preview.limitingChip?.type).toBe("format");
    expect(preview.limitingChip?.label).toBe("oil");
  });
});
