import { describe, it, expect } from "vitest";
import { extractPatchViaRules } from "./rules-patcher";
import { tolerantParseLlmResponse } from "./tolerant-parser";
import { createInitialSessionState, matchSessionReducer } from "../matchSession/index";
import { selectNext } from "../questions/selectNext";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";

describe("Hinglish Intake & Tolerant Parser (Section G & Acceptance Test 1)", () => {
  const hinglishInput =
    "yaar mere muh pe bahut dryness hai aur darkkspots bhi hain koi cream bata do jo daily laga sku";

  it("Acceptance Test 1: extracts hydration + dark spots, face, moisturizer/cream, daily, NO time_of_day guess", () => {
    const { patch, evidence, detectedLanguage } = extractPatchViaRules(hinglishInput);

    expect(detectedLanguage).toBe("hi-latn");

    // Needs check
    const conceptIds = (patch.needs || []).map((n) => n.concept_id);
    expect(conceptIds).toContain("hydration");
    expect(conceptIds).toContain("dark_spots_look");

    // Body Area check
    expect(patch.body_area).toBe("face");
    expect(evidence.body_area).toContain("muh pe");

    // Product Type check (cream -> moisturizer, NEVER serum)
    expect(patch.product_type).toBe("moisturizer");

    // Frequency check (daily -> daily)
    expect(patch.frequency).toBe("daily");

    // Time of Day must NOT be guessed
    expect(patch.time_of_day).toBeUndefined();
  });

  it("The first question for this input is NOT fragrance", () => {
    const { patch, evidence } = extractPatchViaRules(hinglishInput);
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch,
      evidence,
    });

    const questionResult = selectNext(state, DEMO_CATALOGUE_SEED);

    // Because face, moisturizer, and daily are known, the question should NOT be fragrance!
    if (!questionResult.done) {
      expect(questionResult.facet).not.toBe("fragrance_pref");
      expect(questionResult.facet).not.toBe("product_type");
      expect(questionResult.facet).not.toBe("body_area");
    }
  });

  it("Tolerant parser cleans code fences and salvages partial needs", () => {
    const messyLlmResponse = `\`\`\`json
{
  "needs": [
    { "concept_id": "hydration", "phrase_from_user": "sukha chehra", "confidence": 0.9 },
    { "concept_id": "fake_medical_cure", "phrase_from_user": "cure this disease" }
  ],
  "body_area": "face",
  "product_type": "cream",
  "unknown_hallucinated_field": "test"
}
\`\`\``;

    const result = tolerantParseLlmResponse(messyLlmResponse);
    expect(result.success).toBe(true);
    expect(result.salvagedNeedsCount).toBe(1);
    expect(result.patch.needs?.[0].concept_id).toBe("hydration");
    expect(result.patch.body_area).toBe("face");
    expect(result.patch.product_type).toBe("moisturizer");
  });
});

