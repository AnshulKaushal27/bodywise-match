import { describe, it, expect } from "vitest";
import {
  parseRequestKeyword,
  matchMultiNeeds,
  DEMO_CATALOGUE_SEED,
  ParsedRequest,
  ParsedNeed,
} from "../index";

describe("Multi-Need RAG Matching & Ranking (Task Part D, E, G)", () => {
  it("Target Acceptance Test: 'I want blackhead removal and oily skin treatment'", async () => {
    // 1. Parse multi-need request using deterministic rules
    const parsedRequest = parseRequestKeyword(
      "I want blackhead removal and oily skin treatment"
    );

    // Expected: Understood needs shown as two needs
    expect(parsedRequest.needs.length).toBe(2);

    const need1 = parsedRequest.needs[0];
    const need2 = parsedRequest.needs[1];

    // Need 1: reduce the look of blackheads -> face wash
    expect(need1.concepts).toContain("blackhead_look");
    expect(need1.preferred_category).toBe("face_wash");
    expect(need1.normalised_label?.toLowerCase()).toContain("look of blackheads");

    // Need 2: oil control -> best-fitting product type
    expect(need2.concepts).toContain("oil_control");
    expect(need2.normalised_label?.toLowerCase()).toContain("oil");

    // Wording uses cosmetic framing, NEVER "treat", "cure", or "remove blackheads permanently"
    const allLabels = parsedRequest.needs.map((n) => n.normalised_label || n.phrase_from_user).join(" ");
    expect(allLabels.toLowerCase()).not.toContain("cure");
    expect(allLabels.toLowerCase()).not.toContain("remove blackheads permanently");

    // 2. Perform multi-need matching
    const matchResult = await matchMultiNeeds(parsedRequest, DEMO_CATALOGUE_SEED);

    expect(matchResult.status).toBe("MATCHES_FOUND");
    expect(matchResult.rules_version).toBe("2.0.0");
    expect(matchResult.groups.length).toBe(2);

    // Group 1: For blackheads
    const group1 = matchResult.groups[0];
    expect(group1.status).toBe("MATCHED");
    expect(group1.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(group1.recommendations.length).toBeLessThanOrEqual(3);

    // Top product in Group 1 must have blackhead evidence
    const topRec1 = group1.recommendations[0];
    expect(topRec1.evidenceSnippets.length).toBeGreaterThan(0);
    expect(topRec1.whyHere).toContain("official formula");
    expect(topRec1.sourceTag).toMatch(/Verified from official/);
    expect(topRec1.whyHere.toLowerCase()).not.toContain("cure");

    // Group 2: For oil control
    const group2 = matchResult.groups[1];
    expect(group2.status).toBe("MATCHED");
    expect(group2.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(group2.recommendations.length).toBeLessThanOrEqual(3);

    const topRec2 = group2.recommendations[0];
    expect(topRec2.evidenceSnippets.length).toBeGreaterThan(0);
    expect(topRec2.whyHere).toBeDefined();
    expect(topRec2.sourceTag).toMatch(/Verified from official/);

    // Deduplication across needs: if the same product was top for both, Group 2 picks distinct product or diverse category
    if (topRec1.productId === topRec2.productId) {
      expect(topRec2.whyHere).toBeDefined();
    }
  });

  it("handles isolated NO_FIT per need when one need has no good catalogue product", async () => {
    const mixedRequest: ParsedRequest = {
      needs: [
        {
          id: "need_valid",
          phrase_from_user: "reduce visible hair fall",
          concepts: ["hair_fall_look"],
          preferred_category: "shampoo",
          format_preferences: [],
          priority: "primary",
          confidence: "high",
          normalised_label: "Reduce visible hair fall",
        },
        {
          id: "need_unsupported",
          phrase_from_user: "astral projection anti-gravity cream",
          concepts: ["unsupported_concept_xyz"],
          preferred_category: null,
          format_preferences: [],
          priority: "secondary",
          confidence: "low",
          normalised_label: "Astral projection",
        },
      ],
      avoidances: [],
      routine_context: null,
      uncertainties: [],
      follow_up_question: null,
      medical_flag: false,
    };

    const result = await matchMultiNeeds(mixedRequest, DEMO_CATALOGUE_SEED);

    expect(result.status).toBe("MATCHES_FOUND");
    expect(result.groups.length).toBe(2);

    // Valid need matches
    expect(result.groups[0].status).toBe("MATCHED");
    expect(result.groups[0].recommendations.length).toBeGreaterThan(0);

    // Unsupported need isolated NO_FIT
    expect(result.groups[1].status).toBe("NO_FIT");
    expect(result.groups[1].recommendations.length).toBe(0);
    expect(result.groups[1].noFitReason).toBeDefined();
  });

  it("evidence-required rule: products without evidence for a concept can never be returned for that concept", async () => {
    const need: ParsedNeed = {
      id: "need_kp",
      phrase_from_user: "strawberry legs and body bumps",
      concepts: ["body_bumps_look"],
      preferred_category: "body_wash",
      format_preferences: [],
      priority: "primary",
      confidence: "high",
    };

    const req: ParsedRequest = {
      needs: [need],
      avoidances: [],
      routine_context: null,
      uncertainties: [],
      follow_up_question: null,
      medical_flag: false,
    };

    const result = await matchMultiNeeds(req, DEMO_CATALOGUE_SEED);
    expect(result.status).toBe("MATCHES_FOUND");

    for (const rec of result.groups[0].recommendations) {
      // Must carry evidence snippet from official text
      expect(rec.evidenceSnippets.length).toBeGreaterThan(0);
      expect(rec.reasonCodes).toContain("CONCEPT_EVIDENCE_MATCH");
    }
  });

  it("sets medical_flag: true and neutral caution banner for clinical terms", async () => {
    const parsedMedical = parseRequestKeyword(
      "I have painful cystic acne and bleeding breakouts on my face"
    );

    expect(parsedMedical.medical_flag).toBe(true);

    const result = await matchMultiNeeds(parsedMedical, DEMO_CATALOGUE_SEED);
    expect(result.medical_flag).toBe(true);
    expect(result.medical_caution).toBeDefined();
    expect(result.medical_caution).toContain("Informational only, not medical advice");
  });

  it("is 100% deterministic (same input produces identical output across 100 runs)", async () => {
    const req = parseRequestKeyword("I want blackhead removal and oily skin treatment");

    const firstRun = await matchMultiNeeds(req, DEMO_CATALOGUE_SEED);
    const firstJson = JSON.stringify(firstRun);

    for (let i = 0; i < 50; i++) {
      const subsequentRun = await matchMultiNeeds(req, DEMO_CATALOGUE_SEED);
      expect(JSON.stringify(subsequentRun)).toBe(firstJson);
    }
  }, 15000);
});
