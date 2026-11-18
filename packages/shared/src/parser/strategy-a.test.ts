import { describe, it, expect } from "vitest";
import { parseNeedsKeyword, sanitizePii } from "./strategy-a";
import { selectNextQuestion } from "../matcher/next-question";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";
import { ParsedNeedsSchema } from "../matcher/types";

describe("Strategy A Keyword Parser & 20 Sample Sentences", () => {
  it("strictly sanitizes PII (phone numbers and emails) per Rule 8", () => {
    const raw = "Call me at +91 9876543210 or email user@test.com for my shampoo order";
    const cleaned = sanitizePii(raw);
    expect(cleaned).not.toContain("9876543210");
    expect(cleaned).not.toContain("user@test.com");
    expect(cleaned).toContain("for my shampoo order");
  });

  const testCases = [
    {
      id: 1,
      input: "Help with body bumps on arms and back",
      expectedGoal: "body_bumps_look",
      expectedCategory: "body_wash",
      minConfidence: "medium",
      description: "Body bumps phrasing maps to body_bumps_look without curative claims",
    },
    {
      id: 2,
      input: "Looking for a gentle daily body wash without fragrance",
      expectedGoal: "gentle_daily_cleansing",
      expectedCategory: "body_wash",
      expectedAvoidances: ["fragrance"],
      expectedFormat: ["liquid"],
      minConfidence: "high",
      description: "Gentle daily wash with fragrance avoidance",
    },
    {
      id: 3,
      input: "Hair thinning along my front hairline and parting",
      expectedGoal: "hair_density_appearance",
      expectedCategory: "serum",
      minConfidence: "high",
      description: "Hairline density appearance",
    },
    {
      id: 4,
      input: "Underarm roll-on that controls odor all day without perfume",
      expectedGoal: "underarm_odor_freshness",
      expectedCategory: "serum",
      expectedFormat: ["roll-on"],
      expectedAvoidances: ["fragrance"],
      minConfidence: "high",
      description: "Underarm odor freshness roll-on with perfume avoidance",
    },
    {
      id: 5,
      input: "Greasy forehead and nose by midday",
      expectedGoal: "oil_control",
      minConfidence: "medium",
      description: "Oil control and sebum balance",
    },
    {
      id: 6,
      input: "Dry tight skin after evening showers",
      expectedGoal: "hydration_barrier",
      minConfidence: "medium",
      description: "Hydration and skin barrier comfort",
    },
    {
      id: 7,
      input: "Dark spot marks left over from old bumps",
      expectedGoal: "dark_spots_look",
      minConfidence: "high",
      description: "Dark spot marks appearance",
    },
    {
      id: 8,
      input: "Lots of hair strands coming out in my comb",
      expectedGoal: "hair_fall_appearance",
      expectedCategory: "shampoo",
      minConfidence: "high",
      description: "Hair fall and comb shedding appearance",
    },
    {
      id: 9,
      input: "Itchy flaky scalp that feels uncomfortable",
      expectedGoal: "scalp_comfort",
      expectedCategory: "shampoo",
      minConfidence: "high",
      description: "Scalp comfort and itch relief",
    },
    {
      id: 10,
      input: "Frizzy hair that puffs up in humidity",
      expectedGoal: "frizz_control",
      minConfidence: "high",
      description: "Frizz control and hair softness",
    },
    {
      id: 11,
      input: "Daily sunscreen that doesn't feel heavy or greasy",
      expectedGoal: "sun_protection",
      expectedCategory: "sunscreen",
      minConfidence: "high",
      description: "Daily broad spectrum sun protection",
    },
    {
      id: 12,
      input: "Clarifying wash to remove product buildup from oily roots",
      expectedGoal: "scalp_clarifying",
      expectedCategory: "shampoo",
      minConfidence: "high",
      description: "Scalp clarifying and buildup removal",
    },
    {
      id: 13,
      input: "Chewable gummies for hair support without artificial fragrance",
      expectedGoal: "hair_density_appearance",
      expectedCategory: "supplement",
      expectedFormat: ["gummies"],
      expectedAvoidances: ["fragrance"],
      minConfidence: "high",
      description: "Hair supplement chewables without fragrance",
    },
    {
      id: 14,
      input: "Need an exfoliating wash for rough strawberry legs, no sulphates",
      expectedGoal: "body_bumps_look",
      expectedCategory: "body_wash",
      expectedFormat: ["liquid"],
      expectedAvoidances: ["sulphates"],
      minConfidence: "high",
      description: "Exfoliating body wash for strawberry legs, sulphate-free",
    },
    {
      id: 15,
      input: "help with my acne treatment",
      expectedGoal: "body_bumps_look",
      mustHaveConfidence: "low",
      mustFlagMedicalUncertainty: true,
      description: "Ambiguous and medical treatment phrase -> low confidence, flags uncertainty, asks 1 question, never promises cure",
    },
    {
      id: 16,
      input: "Can you diagnose this severe rash on my chest",
      expectedGoal: null,
      mustHaveConfidence: "low",
      mustFlagMedicalUncertainty: true,
      description: "Clinical diagnosis request -> null goal, low confidence, flags medical uncertainty, never diagnoses",
    },
    {
      id: 17,
      input: "Something for my hair and also my back bumps",
      mustHaveConfidence: "low",
      mustFlagMultiConcernUncertainty: true,
      description: "Conflicting multi-concern input -> low confidence, prompts target area question",
    },
    {
      id: 18,
      input: "My phone is 9876543210 and email test@example.com help me find a shampoo",
      expectedCategory: "shampoo",
      piiSanitizedCheck: true,
      description: "Input with phone and email -> PII stripped before parsing, shampoo identified",
    },
    {
      id: 19,
      input: "Just want something clean and refreshing",
      expectedGoal: "gentle_daily_cleansing",
      mustHaveConfidence: "low",
      description: "Broad/vague input -> low confidence, asks clarifying question",
    },
    {
      id: 20,
      input: "Looking for a roll-on serum for underarms with AHA",
      expectedGoal: "underarm_texture_smoothing",
      expectedCategory: "serum",
      expectedFormat: ["roll-on"],
      minConfidence: "high",
      description: "Underarm texture smoothing roll-on serum",
    },
  ];

  testCases.forEach((tc) => {
    it(`Case ${tc.id}: ${tc.description} ("${tc.input}")`, () => {
      const parsed = parseNeedsKeyword(tc.input);

      // 1. Must always conform to ParsedNeedsSchema
      const validation = ParsedNeedsSchema.safeParse(parsed);
      expect(validation.success).toBe(true);

      // 2. Goal check
      if (tc.expectedGoal !== undefined) {
        expect(parsed.goal).toBe(tc.expectedGoal);
      }

      // 3. Category check
      if (tc.expectedCategory !== undefined) {
        expect(parsed.category).toBe(tc.expectedCategory);
      }

      // 4. Avoidance check
      if (tc.expectedAvoidances) {
        expect(parsed.avoidances).toEqual(expect.arrayContaining(tc.expectedAvoidances));
      }

      // 5. Format check
      if (tc.expectedFormat) {
        expect(parsed.format_preferences).toEqual(expect.arrayContaining(tc.expectedFormat));
      }

      // 6. Confidence check
      if (tc.mustHaveConfidence) {
        expect(parsed.confidence).toBe(tc.mustHaveConfidence);
      } else if (tc.minConfidence === "high") {
        expect(parsed.confidence).toBe("high");
      }

      // 7. Medical uncertainty flag check
      if (tc.mustFlagMedicalUncertainty) {
        expect(parsed.uncertainties.some((u) => u.toLowerCase().includes("medical"))).toBe(true);
      }

      // 8. Multi-concern uncertainty check
      if (tc.mustFlagMultiConcernUncertainty) {
        expect(parsed.uncertainties.some((u) => u.toLowerCase().includes("multiple"))).toBe(true);
      }

      // 9. PII check
      if (tc.piiSanitizedCheck) {
        const evidenceStr = JSON.stringify(parsed.evidence_text || {});
        expect(evidenceStr).not.toContain("9876543210");
        expect(evidenceStr).not.toContain("test@example.com");
      }

      // 10. Clarifying question verification:
      // When ParsedNeeds is evaluated against catalogue, it chooses 1 focused question
      // and NEVER asks for age, diagnosis, medical history, name, or contact details.
      const questionResult = selectNextQuestion(parsed, DEMO_CATALOGUE_SEED);
      if (questionResult.question) {
        const qText = questionResult.question.question.toLowerCase();
        expect(qText).not.toContain("age");
        expect(qText).not.toContain("diagnos");
        expect(qText).not.toContain("medical");
        expect(qText).not.toContain("name");
        expect(qText).not.toContain("phone");
        expect(qText).not.toContain("email");
        expect(questionResult.question.options.length).toBeGreaterThan(1);
      }
    });
  });
});
