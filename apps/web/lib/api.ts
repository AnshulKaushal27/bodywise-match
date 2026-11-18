/**
 * Bodywise Match API Client
 */

import {
  ParsedNeeds,
  ProductRecord,
  DEMO_CATALOGUE_SEED,
  selectNextQuestion,
  NextQuestionResult,
  parseNeedsKeyword,
} from "@bodywise/shared";

/**
 * Resolves API URLs across server-side runtime, service bindings, client-side browser, and local dev.
 * In Vercel Services, process.env.API_URL is injected into the calling web service at runtime via service binding.
 */
export function resolveApiUrls() {
  // 1. Bound internal service URL (injected by Vercel into process.env.API_URL via service binding)
  if (process.env.API_URL) {
    const raw = process.env.API_URL.replace(/\/+$/, "");
    const root = raw.endsWith("/v1") ? raw.slice(0, -3) : raw;
    const v1 = raw.endsWith("/v1") ? raw : `${raw}/v1`;
    return {
      rootUrl: root,
      baseUrl: v1,
      healthUrl: `${root}/health`,
    };
  }

  // 2. Explicit public API URL (e.g. NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL)
  const rawPublicUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (rawPublicUrl) {
    const sanitized = rawPublicUrl.replace(/\/+$/, "");
    const root = sanitized.endsWith("/v1") ? sanitized.slice(0, -3) : sanitized;
    const base = sanitized.endsWith("/v1") ? sanitized : `${sanitized}/v1`;
    return {
      rootUrl: root,
      baseUrl: base,
      healthUrl: `${root}/health`,
    };
  }

  // 3. Client-side browser in production (same-domain Vercel Services rewrite /api/*)
  if (typeof window !== "undefined") {
    return {
      rootUrl: "/api",
      baseUrl: "/api/v1",
      healthUrl: "/api/health",
    };
  }

  // 4. Default fallback for local testing / dev environment
  return {
    rootUrl: "http://localhost:4000",
    baseUrl: "http://localhost:4000/v1",
    healthUrl: "http://localhost:4000/health",
  };
}

const initialUrls = resolveApiUrls();
export const API_ROOT_URL = initialUrls.rootUrl;
export const API_BASE_URL = initialUrls.baseUrl;
export const API_HEALTH_URL = initialUrls.healthUrl;

export interface ApiHealthResponse {
  status: string;
  service: string;
  version: string;
  rules_version: string;
  catalogue_version: string;
  database: string;
  llm: string;
  ephemeral_disk: boolean;
  uptime: number;
  timestamp: string;
}

export async function fetchApiHealth(): Promise<{
  ok: boolean;
  data: ApiHealthResponse | null;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const { healthUrl } = resolveApiUrls();
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        ok: false,
        data: null,
        latencyMs,
        error: `Server responded with status ${res.status} (${res.statusText})`,
      };
    }

    const data = (await res.json()) as ApiHealthResponse;
    return {
      ok: true,
      data,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : "Unable to reach API server";
    return {
      ok: false,
      data: null,
      latencyMs,
      error: msg,
    };
  }
}

export interface GoalItem {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface ParseResponse {
  request_id: string;
  parsed_needs: ParsedNeeds;
  strategy?: "A" | "B";
  source?: "llm" | "rules";
}

// Fallback catalogue goals if backend is waking up or offline
export const FALLBACK_CATALOGUE_GOALS: GoalItem[] = [
  {
    id: "body_bumps_look",
    label: "Reduce the look of body bumps",
    description: "Supports smoother skin appearance on arms, legs, and back.",
    category: "body",
  },
  {
    id: "gentle_daily_cleansing",
    label: "Gentle daily cleansing",
    description: "Preserves the moisture barrier without tight post-wash feeling.",
    category: "body",
  },
  {
    id: "underarm_odor_freshness",
    label: "Underarm odor freshness",
    description: "Targets odor-causing bacteria for neutral freshness.",
    category: "underarm",
  },
  {
    id: "hair_density_appearance",
    label: "Hairline & parting visible density",
    description: "Topical peptide active care supporting visible fullness.",
    category: "hair",
  },
  {
    id: "hair_fall_appearance",
    label: "Reduce hair fall appearance",
    description: "Minimizes daily comb shedding through root nourishment.",
    category: "hair",
  },
  {
    id: "scalp_comfort",
    label: "Scalp comfort & itch relief",
    description: "Calms scalp tightness and dryness-induced flaking.",
    category: "scalp",
  },
  {
    id: "sun_protection",
    label: "Daily sun protection",
    description: "Broad spectrum protection without a heavy greasy feel.",
    category: "skincare",
  },
  {
    id: "oil_control",
    label: "Oil & sebum balance",
    description: "Helps regulate excess shine and surface greasiness.",
    category: "skincare",
  },
];

export async function fetchCatalogueGoals(): Promise<GoalItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/goals`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.goals) && data.goals.length > 0) {
        return data.goals;
      }
    }
    return FALLBACK_CATALOGUE_GOALS;
  } catch {
    // If backend is sleeping or unreachable, gracefully return fallback catalogue goals
    return FALLBACK_CATALOGUE_GOALS;
  }
}

export async function parseMatchConcern(
  userInput: string,
  signal?: AbortSignal
): Promise<ParseResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const abortHandler = () => controller.abort();
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/match/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_input: userInput }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }

    if (res.ok) {
      return (await res.json()) as ParseResponse;
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }
    // Network failure, timeout, or server unavailable: gracefully fallback
  }

  // Resilient fallback to deterministic Strategy A rules (Rule 2 & Rule 9)
  const parsed = parseNeedsKeyword(userInput);
  return {
    request_id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    parsed_needs: parsed,
    strategy: "A",
    source: "rules",
  };
}

export async function fetchNextQuestion(
  parsedNeeds: ParsedNeeds,
  answeredQuestionIds: string[] = []
): Promise<NextQuestionResult> {
  try {
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/match/next-question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parsed_needs: parsedNeeds,
        answered_question_ids: answeredQuestionIds,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        question: data.question,
        candidate_count: data.candidate_count,
        explanation: data.explanation,
      };
    }
  } catch {
    // Graceful fallback to client-side deterministic matcher
  }

  return selectNextQuestion(
    parsedNeeds,
    DEMO_CATALOGUE_SEED,
    answeredQuestionIds
  );
}

export interface FeedbackPayload {
  request_id?: string;
  session_id?: string;
  helpful?: boolean;
  rating?: "yes" | "somewhat" | "no" | string;
  feedback_category?:
    | "match_relevance"
    | "clarity"
    | "missing_product"
    | "safety_concern"
    | "other";
  rating_clarity?: number;
  chosen_product_slug?: string;
  notes?: string;
  reason?: string;
  aggregate_consent?: boolean;
}

export async function submitMatchFeedback(
  payload: FeedbackPayload
): Promise<boolean> {
  try {
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteServerSession(sessionId: string): Promise<boolean> {
  try {
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/session/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchProducts(): Promise<ProductRecord[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/products`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        return data.products;
      }
    }
  } catch {
    // Fallback to local catalogue seed
  }
  return DEMO_CATALOGUE_SEED;
}

export async function fetchProductBySlug(slug: string): Promise<ProductRecord | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/products/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.product) {
        return data.product;
      }
    }
  } catch {
    // Fallback to local catalogue seed
  }
  const match = DEMO_CATALOGUE_SEED.find((p) => p.slug === slug);
  return match || null;
}
