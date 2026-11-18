import { describe, it, expect } from "vitest";
import {
  selectNextQuestion,
  getCandidateProducts,
  PREDEFINED_QUESTIONS,
} from "./next-question";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";
import { ParsedNeeds } from "./types";

describe("Next-Question Selector Engine", () => {
  const baseParsedNeeds: ParsedNeeds = {
    goal: "body_bumps_look",
    category: "body_wash",
    format_preferences: [],
    avoidances: [],
    routine_context: null,
    uncertainties: [],
    confidence: "high",
  };

  it("never includes forbidden questions (no age, no diagnosis, no medical history, no name, no contact)", () => {
    for (const q of PREDEFINED_QUESTIONS) {
      const qLower = q.question.toLowerCase();
      expect(qLower).not.toMatch(/\b(age|years\s*old)\b/);
      expect(qLower).not.toMatch(/\b(diagnos|doctor|condition|disease)\b/);
      expect(qLower).not.toMatch(/\b(medical|history|prescription)\b/);
      expect(qLower).not.toMatch(/\b(name|email|phone|contact)\b/);

      for (const opt of q.options) {
        const optLower = opt.label.toLowerCase();
        expect(optLower).not.toMatch(/\b(diagnos|prescrib|cure)\b/);
      }
    }
  });

  it("selects a question that partitions remaining candidates", () => {
    const result = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED);
    expect(result.candidate_count).toBeGreaterThan(0);
    expect(result.question).not.toBeNull();
    expect(result.question?.options.length).toBeGreaterThan(1);
    expect(result.explanation).toContain(result.question!.id);
  });

  it("skips fragrance question if user already avoids fragrance", () => {
    const needsWithFragranceAvoidance: ParsedNeeds = {
      ...baseParsedNeeds,
      avoidances: ["fragrance"],
    };

    const result = selectNextQuestion(needsWithFragranceAvoidance, DEMO_CATALOGUE_SEED);
    expect(result.question?.id).not.toBe("fragrance_preference");
  });

  it("skips format question if user already specified format preferences", () => {
    const needsWithFormat: ParsedNeeds = {
      ...baseParsedNeeds,
      format_preferences: ["liquid"],
    };

    const result = selectNextQuestion(needsWithFormat, DEMO_CATALOGUE_SEED);
    expect(result.question?.id).not.toBe("format_preference");
  });

  it("skips already answered questions", () => {
    const result1 = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED, []);
    const firstQId = result1.question!.id;

    const result2 = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED, [firstQId]);
    if (result2.question) {
      expect(result2.question.id).not.toBe(firstQId);
    }
  });

  it("returns null when candidate pool has only 1 product", () => {
    // Single product catalogue
    const singleProduct = [DEMO_CATALOGUE_SEED[0]];
    const result = selectNextQuestion(baseParsedNeeds, singleProduct);

    expect(result.question).toBeNull();
    expect(result.candidate_count).toBe(1);
    expect(result.explanation).toContain("Sufficient clarity");
  });

  it("returns null when all eligible questions are answered", () => {
    const allIds = PREDEFINED_QUESTIONS.map((q) => q.id);
    const result = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED, allIds);

    expect(result.question).toBeNull();
    expect(result.explanation).toContain("All clarifying dimensions have been addressed");
  });

  it("is 100% deterministic (same input produces identical question 50 times)", () => {
    const firstResult = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED);
    for (let i = 0; i < 50; i++) {
      const res = selectNextQuestion(baseParsedNeeds, DEMO_CATALOGUE_SEED);
      expect(res.question?.id).toBe(firstResult.question?.id);
      expect(res.candidate_count).toBe(firstResult.candidate_count);
    }
  });

  it("getCandidateProducts excludes products violating avoidances", () => {
    const needsWithFragrance: ParsedNeeds = {
      ...baseParsedNeeds,
      avoidances: ["fragrance"],
    };
    const candidates = getCandidateProducts(needsWithFragrance, DEMO_CATALOGUE_SEED);
    for (const c of candidates) {
      expect(c.fragrance_free).not.toBe(false);
    }
  });
});
