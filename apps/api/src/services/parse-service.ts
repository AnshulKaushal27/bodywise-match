/**
 * Unified Parse Service for Bodywise Match
 * Integrates Groq LLM as the optional intent extractor (Strategy B).
 * When Groq is disabled, unconfigured, timed out, or unavailable, seamlessly falls back
 * to the deterministic Pure TypeScript rules parser (Strategy A).
 */

import { ParsedNeeds } from "@bodywise/shared";
import { parseIntentWithGroq, ParseIntentResult } from "../llm/parseIntent";

export interface ParseResult {
  parsed_needs: ParsedNeeds;
  strategy: "A" | "B";
  source: "llm" | "rules";
  model?: string;
  latencyMs: number;
  error_category?: string;
}

export async function parseUserNeeds(
  rawInput: string,
  requestId: string = "unknown"
): Promise<ParseResult> {
  const result: ParseIntentResult = await parseIntentWithGroq(rawInput, requestId);

  return {
    parsed_needs: result.parsed_needs,
    strategy: result.source === "llm" ? "B" : "A",
    source: result.source,
    model: result.model,
    latencyMs: result.latencyMs,
    error_category: result.error_category,
  };
}
