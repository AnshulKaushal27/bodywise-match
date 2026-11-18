import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseUserNeeds } from "./parse-service";

describe("Unified Parse Service (Strategy A & Groq LLM Strategy B)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("uses Strategy A by default when GROQ_API_KEY is not defined", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.LLM_API_KEY;

    const result = await parseUserNeeds("Looking for underarm roll-on for odor");
    expect(result.strategy).toBe("A");
    expect(result.source).toBe("rules");
    expect(result.parsed_needs.goal).toBe("underarm_odor_freshness");
  });

  it("silently falls back to Strategy A if Groq fails or returns non-200", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_test_key_1234567890abcdefghij";

    // Mock global fetch returning 500 error
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      })
    );

    const result = await parseUserNeeds("Gentle daily body wash without fragrance");
    expect(result.strategy).toBe("A");
    expect(result.source).toBe("rules");
    expect(result.parsed_needs.goal).toBe("gentle_daily_cleansing");
    expect(result.parsed_needs.avoidances).toContain("fragrance");
  });

  it("silently falls back to Strategy A if Groq network call throws/times out", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_test_key_1234567890abcdefghij";

    // Mock global fetch throwing network abort error
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Timeout / network failure"))
    );

    const result = await parseUserNeeds("Daily sunscreen that doesn't feel heavy");
    expect(result.strategy).toBe("A");
    expect(result.source).toBe("rules");
    expect(result.parsed_needs.goal).toBe("sun_protection");
  });

  it("silently falls back to Strategy A if Groq returns invalid schema JSON", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_test_key_1234567890abcdefghij";

    // Mock global fetch returning JSON that violates ParsedNeedsSchema
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  confidence: "super-high-invalid", // Not low | medium | high
                }),
              },
            },
          ],
        }),
      })
    );

    const result = await parseUserNeeds("Need hair thinning serum");
    expect(result.strategy).toBe("A");
    expect(result.source).toBe("rules");
    expect(result.parsed_needs.goal).toBe("hair_density_appearance");
  });

  it("uses Strategy B (source: llm) when Groq responds with valid ParsedNeeds JSON", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_test_key_1234567890abcdefghij";

    const mockLlmNeeds = {
      goal: "hair_density_appearance",
      category: "serum",
      format_preferences: ["roll-on"],
      avoidances: [],
      routine_context: null,
      uncertainties: [],
      confidence: "high",
      evidence_text: { goal: "hair thinning" },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockLlmNeeds),
              },
            },
          ],
        }),
      })
    );

    const result = await parseUserNeeds("Looking for hair thinning serum");
    expect(result.strategy).toBe("B");
    expect(result.source).toBe("llm");
    expect(result.parsed_needs.goal).toBe("hair_density_appearance");
    expect(result.parsed_needs.confidence).toBe("high");
  });
});
