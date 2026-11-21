/**
 * LLM Smoke Test Script for Bodywise Match
 * Makes ONE real parse call using the env key and prints only:
 *   { source, latencyMs, fieldsFilled }
 *
 * STRICT SECURITY:
 * - Reads key ONLY from process.env.GROQ_API_KEY
 * - NEVER prints or logs the key
 * - NEVER prints the full response payload or raw prompt
 */

import { initEnv } from "../apps/api/src/config";
import { parseUserNeeds } from "../apps/api/src/services/parse-service";

initEnv();

async function runSmokeTest(): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    console.log("LLM disabled: using rules parser");
  }

  const sampleQuery =
    "I have strawberry legs and rough body bumps on my arms, looking for a gentle daily body cleanser without fragrance";

  const startTime = Date.now();
  const result = await parseUserNeeds(sampleQuery, "smoke-test-run");
  const totalLatencyMs = result.latencyMs || Date.now() - startTime;

  // Determine filled non-empty fields safely
  const needs = result.parsed_needs as Record<string, unknown>;
  const fieldsFilled = Object.keys(needs).filter((k) => {
    const val = needs[k];
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  });

  // Print ONLY the strict summary required: { source, latencyMs, fieldsFilled }
  const summary = {
    source: result.source,
    latencyMs: totalLatencyMs,
    fieldsFilled,
  };

  console.log(JSON.stringify(summary, null, 2));
}

runSmokeTest().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : "Smoke test failed";
  console.error("LLM smoke test encountered error:", msg);
  process.exit(1);
});
