import { describe, it, expect } from "vitest";
import {
  fallbackParseFilterIntent,
  parseFilterIntent,
} from "./filter-intent-service";

describe("Filter Intent Service (apps/api/src/services/filter-intent-service.ts)", () => {
  it("discriminates exact product name query as 'exact_name' and retains search keyword", async () => {
    const result = await parseFilterIntent({
      query: "Anti Hair Fall Kit",
    });

    expect(result.intent_type).toBe("exact_name");
    expect(result.criteria.search).toBeTruthy();
    expect(result.criteria.categories).toContain("kit");
  });

  it("discriminates exact active ingredient query as 'exact_name'", async () => {
    const result = await parseFilterIntent({
      query: "niacinamide",
    });

    expect(result.intent_type).toBe("exact_name");
    expect(result.criteria.search).toBe("niacinamide");
  });

  it("discriminates Hinglish concern 'mere baal kam ho rhe hain' as 'concern_intent' and clears search filler", async () => {
    const result = await parseFilterIntent({
      query: "mere baal kam ho rhe hain",
    });

    expect(result.intent_type).toBe("concern_intent");
    expect(result.criteria.goals).toContain("hair_fall_appearance");
    expect(result.criteria.goals).toContain("hair_density_appearance");
    expect(result.criteria.search).toBeUndefined();
  });

  it("discriminates body texture concern 'strawberry legs' as 'concern_intent' without broken search keyword", async () => {
    const result = await parseFilterIntent({
      query: "strawberry legs and rough bumps",
    });

    expect(result.intent_type).toBe("concern_intent");
    expect(result.criteria.goals).toContain("body_bumps_look");
    expect(result.criteria.search).toBeUndefined();
  });

  it("discriminates cracked heels concern 'paer ki aedi fati hui hai' as 'concern_intent' mapping to roll_on category and rough_texture_smoothing", async () => {
    const result = await parseFilterIntent({
      query: "paer ki aedi fati hui hai",
    });

    expect(result.intent_type).toBe("concern_intent");
    expect(result.criteria.categories).toContain("roll_on");
    expect(result.criteria.goals).toContain("rough_texture_smoothing");
    expect(result.criteria.search).toBeUndefined();
  });

  it("deterministic fallback reliably parses hair thinning and hair fall without glue code", () => {
    const fallback = fallbackParseFilterIntent("mere baal kam ho rhe hain");
    expect(fallback.intent_type).toBe("concern_intent");
    expect(fallback.criteria.goals).toContain("hair_fall_appearance");
    expect(fallback.criteria.goals).toContain("hair_density_appearance");
    expect(fallback.criteria.search).toBeUndefined();
  });

  it("deterministic fallback maps cracked heels and fati aedi to roll_on and rough_texture_smoothing", () => {
    const fallback = fallbackParseFilterIntent("paer ki aedi fati hui hai");
    expect(fallback.intent_type).toBe("concern_intent");
    expect(fallback.criteria.categories).toContain("roll_on");
    expect(fallback.criteria.formats).toContain("roll-on");
    expect(fallback.criteria.goals).toContain("rough_texture_smoothing");
    expect(fallback.criteria.search).toBeUndefined();
  });

  it("deterministic fallback retains active ingredient searches", () => {
    const fallback = fallbackParseFilterIntent("salicylic acid");
    expect(fallback.intent_type).toBe("exact_name");
    expect(fallback.criteria.search).toBe("salicylic acid");
  });
});
