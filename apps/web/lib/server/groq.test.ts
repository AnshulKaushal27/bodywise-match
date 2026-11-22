import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  callGroqChatCompletion,
  getGroqConfig,
  testGroqDebug,
  GroqClientError,
} from "./groq";
import { parseUserConcern } from "./parseService";
import { handleServerChatTurn } from "./chatService";
import { createInitialSessionState } from "@bodywise/shared";

describe("Next.js Server-side Groq Client & Services", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("getGroqConfig detects presence and prefix of GROQ_API_KEY safely", () => {
    process.env.GROQ_API_KEY = "gsk_test_1234567890abcdef";
    process.env.LLM_ENABLED = "true";

    const cfg = getGroqConfig();
    expect(cfg.keyPresent).toBe(true);
    expect(cfg.keyPrefixOk).toBe(true);
    expect(cfg.enabled).toBe(true);
    expect(cfg.keyLength).toBe("gsk_test_1234567890abcdef".length);
  });

  it("callGroqChatCompletion throws missing_key error when GROQ_API_KEY is not set", async () => {
    delete process.env.GROQ_API_KEY;

    await expect(
      callGroqChatCompletion({
        messages: [{ role: "user", content: "test" }],
      })
    ).rejects.toThrow(GroqClientError);
  });

  it("callGroqChatCompletion executes fetch and parses chat completion response", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                needs: [
                  {
                    id: "need_1",
                    phrase_from_user: "dry skin",
                    concepts: ["dry_skin"],
                    preferred_category: "body_wash",
                    format_preferences: [],
                    priority: "primary",
                    confidence: "high",
                    normalised_label: "Dry skin comfort",
                  },
                ],
                avoidances: [],
                routine_context: null,
                medical_flag: false,
              }),
            },
          },
        ],
      }),
    } as unknown as Response);

    const result = await callGroqChatCompletion({
      messages: [{ role: "user", content: "I have dry skin" }],
    });

    expect(result.content).toContain("dry_skin");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("testGroqDebug returns non-sensitive metadata without leaking API key", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_secret_key_12345";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"status":"healthy"}' } }],
      }),
    } as unknown as Response);

    const debug = await testGroqDebug();
    expect(debug.keyPresent).toBe(true);
    expect(debug.keyPrefixOk).toBe(true);
    expect(debug.jsonModeOk).toBe(true);
    expect(debug.httpStatus).toBe(200);
    // Crucial: API key string must NEVER appear in debug payload
    expect(JSON.stringify(debug)).not.toContain("gsk_mock_secret_key_12345");
  });

  it("parseUserConcern uses Groq Strategy B when API key is present and returns valid JSON", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                needs: [
                  {
                    id: "need_1",
                    phrase_from_user: "hair fall",
                    concepts: ["hair_fall_look"],
                    preferred_category: "shampoo",
                    format_preferences: [],
                    priority: "primary",
                    confidence: "high",
                    normalised_label: "Hair fall control",
                  },
                ],
                avoidances: ["sulfates"],
                routine_context: "morning shower",
                medical_flag: false,
              }),
            },
          },
        ],
      }),
    } as unknown as Response);

    const parsed = await parseUserConcern("I have severe hair fall");
    expect(parsed.strategy).toBe("B");
    expect(parsed.source).toBe("llm");
    expect(parsed.parsed_needs.goal).toBe("hair_fall_look");
    expect(parsed.parsed_request.avoidances).toContain("sulfates");
  });

  it("parseUserConcern seamlessly falls back to Strategy A rules when Groq fails", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_valid_key";

    global.fetch = vi.fn().mockRejectedValue(new Error("Groq connection timeout"));

    const parsed = await parseUserConcern("I have body bumps on my arms");
    expect(parsed.strategy).toBe("A");
    expect(parsed.source).toBe("rules");
    expect(parsed.fallback_reason).toBeDefined();
    expect(parsed.parsed_needs).toBeDefined();
  });

  it("handleServerChatTurn responds with verified facts and shortlist updates", async () => {
    delete process.env.GROQ_API_KEY;

    const state = createInitialSessionState();
    const result = await handleServerChatTurn({
      state,
      message: "I need a body wash for rough bumps",
    });

    expect(result.assistantMessage).toBeTruthy();
    expect(result.patch.product_type).toBe("body_wash");
    expect(result.shortlist.count).toBeGreaterThan(0);
    expect(result.meta.mode).toBe("rules");
  });
});
