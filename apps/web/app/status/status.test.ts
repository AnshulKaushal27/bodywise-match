import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { metadata } from "./page";
import {
  API_HEALTH_URL,
  API_ROOT_URL,
  API_BASE_URL,
  fetchApiHealth,
} from "@/lib/api";
import {
  RULES_VERSION,
  CATALOGUE_VERSION,
  DEMO_CATALOGUE_SEED,
} from "@bodywise/shared";

describe("/status Page & Health Diagnostics", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("exports correct page metadata adhering to brand and non-diagnostic guidelines", () => {
    expect(metadata.title).toContain("System & Service Status");
    expect(metadata.description).toContain("health monitoring");
    expect(metadata.description).not.toMatch(/cure|treat|guarantee/i);
  });

  it("exposes consistent RULES_VERSION and CATALOGUE_VERSION constants", () => {
    expect(RULES_VERSION).toBe("3.0.0");
    expect(CATALOGUE_VERSION).toBe("1.0.0-verified");
    expect(Array.isArray(DEMO_CATALOGUE_SEED)).toBe(true);
    expect(DEMO_CATALOGUE_SEED.length).toBeGreaterThan(0);
    // Fact integrity: all verified products are flagged is_demo: false with provenance
    for (const p of DEMO_CATALOGUE_SEED) {
      expect(p.is_demo).toBe(false);
      expect(p.catalog_version).toBe(CATALOGUE_VERSION);
    }
  });

  it("normalizes API_HEALTH_URL to root /health endpoint", () => {
    expect(API_HEALTH_URL).toMatch(/\/health$/);
    expect(API_HEALTH_URL).not.toContain("/v1/health");
    expect(API_BASE_URL).toMatch(/\/v1$/);
    expect(API_ROOT_URL).not.toMatch(/\/v1$/);
  });

  it("fetchApiHealth() parses healthy 200 response with deployment telemetry", async () => {
    const mockHealth = {
      status: "ok",
      service: "bodywise-match-api",
      version: "0.1.0",
      rules_version: "1.0.0",
      catalogue_version: "0.1.0-draft",
      database: "configured",
      llm: "deterministic_only",
      ephemeral_disk: true,
      uptime: 120,
      timestamp: "2026-11-18T12:00:00.000Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHealth,
    } as unknown as Response);

    const result = await fetchApiHealth();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(mockHealth);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.data?.ephemeral_disk).toBe(true);
  });

  it("fetchApiHealth() gracefully returns ok: false when server is cold-starting or offline", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection refused"));

    const result = await fetchApiHealth();

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toContain("Network connection refused");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("fetchApiHealth() handles 503 Service Unavailable / waking up without crashing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as unknown as Response);

    const result = await fetchApiHealth();

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toContain("503");
  });
});
