import { describe, it, expect } from "vitest";
import { selectNext } from "./selectNext";
import { createInitialSessionState, matchSessionReducer } from "../matchSession/index";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";

describe("selectNext Deterministic Question Selector", () => {
  it("Ordering Case 1: When product_type=moisturizer only is known, first question is body_area (NEVER product_type, fragrance comes last)", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        product_type: "moisturizer",
      },
      evidence: { product_type: "moisturizer" },
    });

    const result = selectNext(state, DEMO_CATALOGUE_SEED);

    expect(result.done).toBe(false);
    // Must NEVER ask product_type because it is already confirmed!
    expect(result.facet).not.toBe("product_type");
    // Must be body_area because candidates span both face and body
    expect(result.facet).toBe("body_area");
    expect(result.options?.some((o) => o.id === "face")).toBe(true);
    expect(result.options?.some((o) => o.id === "body")).toBe(true);
  });

  it("Ordering Case 2: When face + cream + daily are known, skips all three; asks time_of_day if data supports", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        body_area: "face",
        product_type: "moisturizer",
        format: "cream",
        frequency: "daily",
      },
      evidence: {
        body_area: "face",
        product_type: "cream",
        frequency: "daily",
      },
    });

    const result = selectNext(state, DEMO_CATALOGUE_SEED);

    // It must NEVER ask body_area, product_type, format, or frequency
    if (!result.done) {
      expect(result.facet).not.toBe("body_area");
      expect(result.facet).not.toBe("product_type");
      expect(result.facet).not.toBe("format");
      expect(result.facet).not.toBe("frequency");
    }
  });

  it("Stop condition: stops when questionCount reaches 3", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "product_type",
      value: "serum",
      source: "question",
    });
    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "body_area",
      value: "hair",
      source: "question",
    });
    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "fragrance_pref",
      value: "free_only",
      source: "question",
    });

    expect(state.questionCount).toBe(3);
    const result = selectNext(state, DEMO_CATALOGUE_SEED);
    expect(result.done).toBe(true);
  });

  it("Options include live candidate counts and 'Any / not sure' option", () => {
    const state = createInitialSessionState();
    const result = selectNext(state, DEMO_CATALOGUE_SEED);

    expect(result.done).toBe(false);
    expect(result.options).toBeDefined();
    expect(result.options!.length).toBeGreaterThan(1);

    // Live counts must be positive numbers
    for (const opt of result.options!) {
      expect(opt.count).toBeGreaterThan(0);
    }

    // Must include an 'Any / not sure' option
    const anyOption = result.options!.find((o) => o.isAny);
    expect(anyOption).toBeDefined();
  });

  it("Generates Hinglish question and why line when language is 'hi-latn'", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "SET_LANGUAGE",
      language: "hi-latn",
    });
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: { product_type: "moisturizer" },
    });

    const result = selectNext(state, DEMO_CATALOGUE_SEED);
    expect(result.facet).toBe("body_area");
    expect(result.question).toContain("kahan lagayenge");
  });
});

