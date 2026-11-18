import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "./index";
import { FastifyInstance } from "fastify";

describe("Fastify API Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200 with status ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("bodywise-match-api");
    expect(body.rules_version).toBe("1.0.0");
    expect(body.catalogue_version).toBe("1.0.0-verified");
    expect(body.ephemeral_disk).toBe(true);
    expect(["configured", "in_memory_fallback"]).toContain(body.database);
    expect(["enabled", "deterministic_only"]).toContain(body.llm);
  });

  it("GET /v1/products returns product array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/products",
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
  });

  it("GET /v1/goals returns catalogue-supported goals", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/goals",
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.goals)).toBe(true);
    expect(body.goals.length).toBeGreaterThan(0);
    expect(body.goals[0]).toHaveProperty("id");
    expect(body.goals[0]).toHaveProperty("label");
  });

  it("GET /v1/products/:slug returns 404 for unknown product", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/products/non-existent-product",
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST /v1/match/parse returns parsed needs with Strategy A default", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: {
        user_input: "Looking for something to help with hair thinning at temples",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.strategy).toBe("A");
    expect(body.parsed_needs.category).toBe("serum");
    expect(body.parsed_needs.goal).toBe("hair_density_appearance");
  });

  it("POST /v1/match/parse sanitizes PII (phone and email) from evidence", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: {
        user_input: "Call me at 9876543210 or user@test.com for body wash for strawberry legs",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    const evidenceStr = JSON.stringify(body.parsed_needs.evidence_text || {});
    expect(evidenceStr).not.toContain("9876543210");
    expect(evidenceStr).not.toContain("user@test.com");
    expect(body.parsed_needs.goal).toBe("body_bumps_look");
  });

  it("POST /v1/match/parse returns low confidence and uncertainty for medical requests", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: {
        user_input: "help with my acne treatment",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.parsed_needs.confidence).toBe("low");
    expect(body.parsed_needs.uncertainties.length).toBeGreaterThan(0);
    expect(body.parsed_needs.uncertainties[0]).toContain("Medical diagnosis or treatment");
  });

  it("POST /v1/match/next-question returns single clarifying question", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/next-question",
      payload: {
        parsed_needs: {
          goal: "body_bumps_look",
          category: "body_wash",
          format_preferences: [],
          avoidances: [],
          routine_context: null,
          uncertainties: [],
          confidence: "high",
        },
        answered_question_ids: [],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.question).not.toBeNull();
    expect(body.candidate_count).toBeGreaterThan(0);
    // Question must never ask for age, diagnosis, medical history, name, or contact details
    const qText = body.question.question.toLowerCase();
    expect(qText).not.toMatch(/\b(age|diagnos|medical|doctor|name|phone|contact)\b/);
  });

  it("POST /v1/match/next-question validates parsed_needs", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/next-question",
      payload: {
        parsed_needs: {
          invalid: "data",
        },
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /v1/match/recommend produces deterministic matches", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/recommend",
      payload: {
        user_input: "Looking for underarm roll on for daily odor",
        parsed_needs: {
          goal: "underarm_odor_freshness",
          category: "serum",
          format_preferences: ["roll-on"],
          avoidances: [],
          routine_context: null,
          uncertainties: [],
          confidence: "high",
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("MATCHES_FOUND");
    expect(body.shortlist.length).toBeGreaterThan(0);
    expect(body.shortlist[0].reasonCodes).toContain("EXACT_GOAL_MATCH");
  });

  it("POST /v1/feedback accepts valid feedback", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/feedback",
      payload: {
        request_id: "test-req-123",
        helpful: true,
        feedback_category: "match_relevance",
        notes: "Clear and straightforward.",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });

  it("POST /v1/feedback defaults aggregate_consent to false and supports session_id", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/feedback",
      payload: {
        session_id: "session-test-priv-001",
        rating: "yes",
        reason: "Matched format preference",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.session_id).toBe("session-test-priv-001");
    expect(body.aggregate_consent).toBe(false);
  });

  it("DELETE /v1/session/:id erases server session records", async () => {
    // 1. Submit feedback for this session
    await app.inject({
      method: "POST",
      url: "/v1/feedback",
      payload: {
        session_id: "session-to-erase-999",
        rating: "no",
      },
    });

    // 2. Erase the session
    const delRes = await app.inject({
      method: "DELETE",
      url: "/v1/session/session-to-erase-999",
    });
    expect(delRes.statusCode).toBe(200);
    const delBody = JSON.parse(delRes.payload);
    expect(delBody.success).toBe(true);
    expect(delBody.removed_records).toBe(1);

    // 3. Repeating erase reports 0 removed records
    const repeatDel = await app.inject({
      method: "DELETE",
      url: "/v1/session/session-to-erase-999",
    });
    const repeatBody = JSON.parse(repeatDel.payload);
    expect(repeatBody.removed_records).toBe(0);
  });

  it("GET /v1/products/:slug returns 200 for existing product", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/products/1-salicylic-acid-body-wash",
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.product).toBeDefined();
    expect(body.product.slug).toBe("1-salicylic-acid-body-wash");
    expect(body.product.official_name).toBeDefined();
  });

  it("POST /v1/match/parse returns 400 for bad inputs (empty, too short, non-string, missing)", async () => {
    // 1. Missing payload
    const res1 = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: {},
    });
    expect(res1.statusCode).toBe(400);

    // 2. Empty string
    const res2 = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: { user_input: "   " },
    });
    expect(res2.statusCode).toBe(400);

    // 3. String too short (< 3 chars)
    const res3 = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: { user_input: "hi" },
    });
    expect(res3.statusCode).toBe(400);

    // 4. Non-string type
    const res4 = await app.inject({
      method: "POST",
      url: "/v1/match/parse",
      payload: { user_input: 12345 },
    });
    expect(res4.statusCode).toBe(400);
  });

  it("POST /v1/match/recommend handles bad inputs and returns 400", async () => {
    // Missing user_input and parsed_needs
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/recommend",
      payload: {
        user_input: "ab", // too short (< 3 chars)
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /v1/match/recommend returns NO_FIT when criteria conflict with catalogue", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/recommend",
      payload: {
        user_input: "Looking for completely unavailable product format",
        parsed_needs: {
          goal: "unknown_impossible_goal",
          category: null,
          format_preferences: ["impossible_capsule_format"],
          avoidances: ["water", "aqua"],
          routine_context: null,
          uncertainties: [],
          confidence: "low",
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("NO_FIT");
    expect(body.suggestion).toBe("BROWSE_CATALOGUE");
  });

  it("POST /v1/feedback returns 400 for invalid inputs", async () => {
    // 1. Missing both request_id and session_id
    const res1 = await app.inject({
      method: "POST",
      url: "/v1/feedback",
      payload: {
        rating: "yes",
      },
    });
    expect(res1.statusCode).toBe(400);

    // 2. Invalid rating clarity value (> 5)
    const res2 = await app.inject({
      method: "POST",
      url: "/v1/feedback",
      payload: {
        session_id: "sess-123",
        rating_clarity: 99,
      },
    });
    expect(res2.statusCode).toBe(400);
  });

  it("POST /v1/session/delete returns 400 when missing session_id/id", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/session/delete",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error).toContain("Missing session_id or id");
  });

  it("Enforces security headers via Helmet and returns rate limit headers", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["x-ratelimit-limit"]).toBeDefined();
    expect(res.headers["x-ratelimit-remaining"]).toBeDefined();
  });

  it("Rate limiting rejects requests with 429 when threshold exceeded", async () => {
    const rateLimitApp = buildServer({ rateLimitMax: 2 });
    await rateLimitApp.ready();

    // 1st request -> 200
    const res1 = await rateLimitApp.inject({ method: "GET", url: "/health" });
    expect(res1.statusCode).toBe(200);

    // 2nd request -> 200
    const res2 = await rateLimitApp.inject({ method: "GET", url: "/health" });
    expect(res2.statusCode).toBe(200);

    // 3rd request -> 429 Too Many Requests
    const res3 = await rateLimitApp.inject({ method: "GET", url: "/health" });
    expect(res3.statusCode).toBe(429);
    const body = JSON.parse(res3.payload);
    expect(body.statusCode).toBe(429);
    expect(body.error).toBe("Too Many Requests");

    await rateLimitApp.close();
  });
});
