import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../index";
import { FastifyInstance } from "fastify";
import { createInitialSessionState, matchSessionReducer } from "@bodywise/shared";

describe("API Contract Tests: Hybrid Match Flow (Section F & Acceptance Tests 3, 7, 8)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /v1/match/next-question with state returns deterministic question without hallucination", async () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: { product_type: "moisturizer" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/v1/match/next-question",
      payload: { state },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.done).toBe(false);
    expect(body.facet).toBe("body_area");
    expect(Array.isArray(body.options)).toBe(true);
    expect(body.candidateCount).toBeGreaterThan(0);
  });

  it("POST /v1/match/preview with state returns family count and top families", async () => {
    const state = createInitialSessionState();
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/preview",
      payload: { state },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(typeof body.count).toBe("number");
    expect(Array.isArray(body.familiesTop)).toBe(true);
    expect(body.familiesTop.length).toBeLessThanOrEqual(3);
  });

  it("Acceptance Test 3: POST /v1/match/chat 'mai ise raat ko lagaunga' -> time_of_day=night", async () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        needs: [
          {
            id: "need_1",
            concept_id: "hydration",
            phrase_from_user: "dryness",
            normalised_label: "Hydration",
            confidence: 0.95,
            status: "confirmed",
            source: "user_text",
            evidence_text: "dryness",
          },
        ],
        body_area: "face",
        product_type: "moisturizer",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/v1/match/chat",
      payload: {
        state,
        message: "mai ise raat ko lagaunga",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.patch.time_of_day).toBe("night");
    expect(body.assistantMessage).toBeDefined();
    expect(Array.isArray(body.events)).toBe(true);
    expect(typeof body.candidateCount).toBe("number");
  });

  it("Acceptance Test 7: Product question in chat returns catalogue facts with SourceTag, never efficacy promise", async () => {
    const state = createInitialSessionState();
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/chat",
      payload: {
        state,
        message: "1% Salicylic Acid Body Wash kya karta hai?",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.assistantMessage).toContain("Salicylic Acid Body Wash");
    expect(body.sourceTag).toBeDefined();
    expect(body.sourceTag.source).toBeDefined();
    // Rule 1 check: No curative or medical promise
    expect(body.assistantMessage.toLowerCase()).not.toContain("cure");
    expect(body.assistantMessage.toLowerCase()).not.toContain("100%");
  });

  it("Acceptance Test 8: Medical wording in chat shows neutral caution and keeps cosmetic matching", async () => {
    const state = createInitialSessionState();
    const res = await app.inject({
      method: "POST",
      url: "/v1/match/chat",
      payload: {
        state,
        message: "Can you cure my severe eczema infection?",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    // Must contain neutral medical caution
    expect(body.assistantMessage.toLowerCase()).toContain("consult a qualified");
    expect(typeof body.candidateCount).toBe("number");
  });
});

