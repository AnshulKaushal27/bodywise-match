import { describe, it, expect } from "vitest";
import {
  EXPLANATION_TEMPLATES,
  getReasonExplanation,
} from "./explanations";
import { MatcherReasonCode } from "./types";

describe("Deterministic Explanation Templates (Rule 1 & Rule 2)", () => {
  it("renders non-curative explanation for EXACT_GOAL_MATCH with context", () => {
    const text = getReasonExplanation("EXACT_GOAL_MATCH", {
      goal: "hair_density_appearance",
    });
    expect(text).toContain("hair_density_appearance");
    expect(text).toContain("May be relevant to your stated goal");
    // Rule 1: No medical cure or treatment claims
    expect(text.toLowerCase()).not.toMatch(/\b(cure|treat|diagnose|guarantee)\b/);
  });

  it("renders safe fallback for EXACT_GOAL_MATCH without context", () => {
    const text = getReasonExplanation("EXACT_GOAL_MATCH");
    expect(text).toBe("May be relevant to your primary stated goal based on declared product functions.");
  });

  it("renders RELATED_GOAL_MATCH explanation", () => {
    const withCtx = getReasonExplanation("RELATED_GOAL_MATCH", { goal: "scalp_clarity" });
    expect(withCtx).toContain("scalp_clarity");
    const withoutCtx = getReasonExplanation("RELATED_GOAL_MATCH");
    expect(withoutCtx).toContain("stated goal");
  });

  it("renders CATEGORY_FIT explanation", () => {
    const text = getReasonExplanation("CATEGORY_FIT", { category: "serum" });
    expect(text).toContain("requested serum category");
  });

  it("renders FORMAT_PREFERENCE_MET explanation", () => {
    const text = getReasonExplanation("FORMAT_PREFERENCE_MET", { format: "roll-on" });
    expect(text).toContain("roll-on formulation");
  });

  it("renders AVOIDANCE_SATISFIED_VERIFIED explanation", () => {
    const text = getReasonExplanation("AVOIDANCE_SATISFIED_VERIFIED", { avoidance: "fragrance" });
    expect(text).toContain("Verified to exclude fragrance");
  });

  it("renders UNVERIFIED_AVOIDANCE explanation instructing physical label check", () => {
    const text = getReasonExplanation("UNVERIFIED_AVOIDANCE", { avoidance: "sulfates" });
    expect(text).toContain("Check physical packaging before applying");
  });

  it("renders ROUTINE_COMPATIBLE explanation", () => {
    const text = getReasonExplanation("ROUTINE_COMPATIBLE");
    expect(text).toContain("layering without obvious active ingredient overlap");
  });

  it("renders MISSING_FACTS_NOTED explanation transparently", () => {
    const text = getReasonExplanation("MISSING_FACTS_NOTED");
    expect(text).toContain("remain unverified in the current catalogue version");
  });

  it("renders CAUTION_APPLIED with specific label caution", () => {
    const text = getReasonExplanation("CAUTION_APPLIED", {
      caution: "Use sunscreen during daytime when using this product.",
    });
    expect(text).toContain("Label caution: Use sunscreen during daytime when using this product.");
  });

  it("returns safe default string for unmapped reason code", () => {
    const fallback = getReasonExplanation("UNKNOWN_CODE" as MatcherReasonCode);
    expect(fallback).toBe("Here is why this appears in your shortlist.");
  });

  it("guarantees every registered reason code in EXPLANATION_TEMPLATES has a functioning function", () => {
    const codes: MatcherReasonCode[] = [
      "EXACT_GOAL_MATCH",
      "RELATED_GOAL_MATCH",
      "CATEGORY_FIT",
      "FORMAT_PREFERENCE_MET",
      "AVOIDANCE_SATISFIED_VERIFIED",
      "UNVERIFIED_AVOIDANCE",
      "ROUTINE_COMPATIBLE",
      "MISSING_FACTS_NOTED",
      "CAUTION_APPLIED",
    ];

    for (const code of codes) {
      expect(typeof EXPLANATION_TEMPLATES[code]).toBe("function");
      const generated = EXPLANATION_TEMPLATES[code]({ goal: "test" });
      expect(generated.length).toBeGreaterThan(10);
      expect(generated.toLowerCase()).not.toMatch(/\b(cure|treat|treatment|diagnos|guarantee)\b/);
    }
  });
});
