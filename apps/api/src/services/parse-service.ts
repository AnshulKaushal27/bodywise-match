/**
 * Unified Parse Service for Bodywise Match
 * Integrates Groq LLM as the multi-need intent extractor (Strategy B).
 * When Groq is disabled, unconfigured, timed out, or unavailable, seamlessly falls back
 * to the deterministic Pure TypeScript rules parser (Strategy A).
 */

import { ParsedRequest, ParsedNeeds } from "@bodywise/shared";
import {
  parseRequestWithGroq,
  ParseRequestResult,
  parseIntentWithGroq,
  ParseIntentResult,
} from "../llm/parseIntent";

export interface ParseRequestServiceResult {
  parsed_request: ParsedRequest;
  strategy: "A" | "B";
  source: "llm" | "rules";
  model?: string;
  latencyMs: number;
  error_category?: string;
  fallback_reason?: string;
}

export async function parseUserRequest(
  rawInput: string,
  requestId: string = "unknown"
): Promise<ParseRequestServiceResult> {
  const result: ParseRequestResult = await parseRequestWithGroq(rawInput, requestId);

  return {
    parsed_request: result.parsed_request,
    strategy: result.source === "llm" ? "B" : "A",
    source: result.source,
    model: result.model,
    latencyMs: result.latencyMs,
    error_category: result.error_category,
    fallback_reason: result.fallback_reason,
  };
}

/**
 * Backward compatibility wrapper for single-need callers (Strategy A/B)
 */
export async function parseUserNeeds(
  rawInput: string,
  requestId: string = "unknown"
): Promise<{
  parsed_needs: ParsedNeeds;
  strategy: "A" | "B";
  source: "llm" | "rules";
  model?: string;
  latencyMs: number;
  error_category?: string;
  fallback_reason?: string;
}> {
  const singleResult: ParseIntentResult = await parseIntentWithGroq(rawInput, requestId);

  return {
    parsed_needs: singleResult.parsed_needs,
    strategy: singleResult.source === "llm" ? "B" : "A",
    source: singleResult.source,
    model: singleResult.model,
    latencyMs: singleResult.latencyMs,
    error_category: singleResult.error_category,
    fallback_reason: singleResult.fallback_reason,
  };
}
