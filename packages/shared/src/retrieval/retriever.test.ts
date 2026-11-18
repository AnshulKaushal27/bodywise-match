import { describe, it, expect } from "vitest";
import { BM25KnowledgeRetriever } from "./retriever";
import { ParsedNeed } from "../matcher/types";

describe("BM25 Knowledge Retriever (Task Part C)", () => {
  const retriever = new BM25KnowledgeRetriever();

  it("retrieves candidates for blackhead_look with valid evidence snippets", async () => {
    const need: ParsedNeed = {
      id: "need_1",
      phrase_from_user: "reduce the look of blackheads",
      concepts: ["blackhead_look"],
      preferred_category: "face_wash",
      format_preferences: [],
      priority: "primary",
      confidence: "high",
    };

    const candidates = await retriever.retrieve(need, 3);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].conceptHits).toContain("blackhead_look");
    expect(candidates[0].evidenceSnippets.length).toBeGreaterThan(0);
    expect(candidates[0].evidenceSnippets[0].toLowerCase()).toMatch(/(blackhead|unclog|pore)/);
  });

  it("retrieves candidates for oil_control with valid evidence snippets", async () => {
    const need: ParsedNeed = {
      id: "need_2",
      phrase_from_user: "oil control and shine reduction",
      concepts: ["oil_control"],
      preferred_category: null,
      format_preferences: [],
      priority: "primary",
      confidence: "high",
    };

    const candidates = await retriever.retrieve(need, 3);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].conceptHits).toContain("oil_control");
    expect(candidates[0].evidenceSnippets.length).toBeGreaterThan(0);
  });

  it("returns candidates sorted by concept evidence, category fit, and score", async () => {
    const need: ParsedNeed = {
      id: "need_3",
      phrase_from_user: "face wash for blackheads",
      concepts: ["blackhead_look"],
      preferred_category: "face_wash",
      format_preferences: [],
      priority: "primary",
      confidence: "high",
    };

    const candidates = await retriever.retrieve(need, 5);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].category).toBe("face_wash");
  });

  it("returns empty or zero concept hits for completely fabricated concepts", async () => {
    const need: ParsedNeed = {
      id: "need_fake",
      phrase_from_user: "quantum levitation telepathy lotion",
      concepts: ["fabricated_concept_xyz"],
      preferred_category: null,
      format_preferences: [],
      priority: "primary",
      confidence: "low",
    };

    const candidates = await retriever.retrieve(need, 3);
    // Since concept is unknown/fabricated, candidates should have 0 concept hits
    for (const c of candidates) {
      expect(c.conceptHits).not.toContain("fabricated_concept_xyz");
    }
  });
});
