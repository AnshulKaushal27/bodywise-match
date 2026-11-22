import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseFilterIntent,
  fallbackParseFilterIntent,
} from "./filterIntentService";

describe("filterIntentService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("extracts hair fall and density goals from Hinglish query via fallback", () => {
    const result = fallbackParseFilterIntent("mere baal kam ho rhe hain");
    expect(result.criteria.goals).toContain("hair_fall_appearance");
    expect(result.criteria.goals).toContain("hair_density_appearance");
    expect(result.criteria.search).toBeUndefined();
  });

  it("extracts rough_texture_smoothing and roll_on for cracked heels in Hinglish", () => {
    const result = fallbackParseFilterIntent("paer ki aedi fati hui hai");
    expect(result.criteria.goals).toContain("rough_texture_smoothing");
    expect(result.criteria.categories).toContain("roll_on");
    expect(result.criteria.search).toBeUndefined();
  });

  it("identifies specific product name searches as exact_name", () => {
    const result = fallbackParseFilterIntent("Folli Advanced");
    expect(result.intent_type).toBe("exact_name");
    expect(result.criteria.search).toBe("Folli Advanced");
  });

  it("uses Groq LLM parsing when LLM is enabled and configured", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                intent_type: "concern_intent",
                search: null,
                categories: ["face_wash"],
                formats: ["gel"],
                goals: ["oil_control"],
                fragrance: "all",
                explanation: "User wants a face wash for oily skin.",
              }),
            },
          },
        ],
      }),
    });

    const result = await parseFilterIntent({
      query: "face wash for very oily skin",
    });

    expect(result.source).toBe("llm");
    expect(result.intent_type).toBe("concern_intent");
    expect(result.criteria.categories).toContain("face_wash");
    expect(result.criteria.goals).toContain("oil_control");
  });
});
