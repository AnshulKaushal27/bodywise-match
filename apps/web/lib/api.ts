/**
 * Bodywise Match API Client
 */

import {
  ParsedNeeds,
  ParsedRequest,
  ProductRecord,
  DEMO_CATALOGUE_SEED,
  selectNextQuestion,
  NextQuestionResult,
  parseNeedsKeyword,
  parseRequestKeyword,
  matchMultiNeeds,
  MultiNeedMatchResult,
  selectNextFacetQuestion,
  NextFacetQuestionResult,
  QuestionFacetOption,
  calculateMatchPreview,
  MatchPreviewResult,
  PreviewFamily,
  LimitingChip,
  MatchSessionState,
  ChatMessage,
  SelectNextQuestionResult,
  SessionLanguage,
  selectNext,
  computeShortlist,
  extractPatchViaRules,
  SessionPatch,
  SessionEvent,
  ShortlistFamilyItem,
  ProductFilterCriteria,
  parseSearchToFilterParams,
  VisualScanResult,
  VisualMatchItem,
  ScannedProductInfo,
  matchSimilarBodywiseProducts,
  matchSessionReducer,
  formatCategoryLabel,
} from "@bodywise/shared";

export type {
  NextFacetQuestionResult,
  QuestionFacetOption,
  MatchPreviewResult,
  PreviewFamily,
  LimitingChip,
  SelectNextQuestionResult,
  VisualScanResult,
  VisualMatchItem,
  ScannedProductInfo,
};

/**
 * Resolves API URLs across server-side runtime, service bindings, client-side browser, and local dev.
 * In production, strictly prevents calling localhost (Task Part A.2.f).
 */
export function resolveApiUrls() {
  // If running in browser on localhost or 127.0.0.1, always prioritize local API
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return {
        rootUrl: "http://localhost:4000",
        baseUrl: "http://localhost:4000/v1",
        healthUrl: "http://localhost:4000/health",
      };
    }
  }

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";

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

  // In production on the client, if rawPublicUrl points to the dormant placeholder Render URL,
  // or if no external API is specified, use the same-origin Next.js App Router API (/api/v1)
  if (
    typeof window !== "undefined" &&
    window.location.origin &&
    (!rawPublicUrl || rawPublicUrl.includes("bodywise-match-api.onrender.com"))
  ) {
    const origin = window.location.origin;
    return {
      rootUrl: origin,
      baseUrl: `${origin}/api/v1`,
      healthUrl: `${origin}/api/health`,
    };
  }

  if (rawPublicUrl && (!isProd || !rawPublicUrl.includes("localhost"))) {
    const sanitized = rawPublicUrl.replace(/\/+$/, "");
    const root = sanitized.endsWith("/v1") ? sanitized.slice(0, -3) : sanitized;
    const base = sanitized.endsWith("/v1") ? sanitized : `${sanitized}/v1`;
    return {
      rootUrl: root,
      baseUrl: base,
      healthUrl: `${root}/health`,
    };
  }

  // 3. In production, guarantee NO localhost is ever used (Task A.2.f)
  if (isProd) {
    if (typeof window !== "undefined" && window.location.origin) {
      const origin = window.location.origin;
      return {
        rootUrl: origin,
        baseUrl: `${origin}/api/v1`,
        healthUrl: `${origin}/api/health`,
      };
    }
    const prodRoot = "https://bodywise-match-api.onrender.com";
    return {
      rootUrl: prodRoot,
      baseUrl: `${prodRoot}/v1`,
      healthUrl: `${prodRoot}/health`,
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

/**
 * Fire-and-forget warm-up ping for Render cold starts (Task Part A.2.d)
 */
export function pingServerHealth(): void {
  try {
    const { healthUrl } = resolveApiUrls();
    fetch(healthUrl, { method: "GET", keepalive: true }).catch(() => {});
  } catch {
    // Non-blocking fire-and-forget
  }
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
    let res: Response | null = null;
    let lastError: Error | null = null;

    try {
      res = await fetch(healthUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unable to reach API server");
    }

    // If external health check failed (e.g. Render 404 or connection failure), probe same-origin Next.js health
    if ((!res || !res.ok) && typeof window !== "undefined" && window.location.origin) {
      const sameOriginHealth = `${window.location.origin}/api/health`;
      if (healthUrl !== sameOriginHealth) {
        try {
          const fallbackRes = await fetch(sameOriginHealth, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
            lastError = null;
          }
        } catch {
          // Keep res and lastError as is
        }
      }
    }

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (lastError) {
      return {
        ok: false,
        data: null,
        latencyMs,
        error: lastError.message,
      };
    }

    if (!res || !res.ok) {
      return {
        ok: false,
        data: null,
        latencyMs,
        error: res ? `Server responded with status ${res.status}` : "Unable to reach API server",
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
  parsed_request?: ParsedRequest;
  strategy?: "A" | "B";
  source?: "llm" | "rules";
  model?: string;
  latencyMs?: number;
  error_category?: string;
  fallback_reason?: string;
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

/**
 * Extracts intent from user free-text (Task Part A, D)
 * 20s timeout allows waking cold-start Render service and Groq LLM completion.
 */
export async function parseMatchConcern(
  userInput: string,
  signal?: AbortSignal
): Promise<ParseResponse> {
  let fallbackReason = "API call timed out or backend unreachable";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const abortHandler = () => controller.abort();
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const { baseUrl } = resolveApiUrls();
    let res: Response | null = await fetch(`${baseUrl}/match/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_input: userInput }),
      signal: controller.signal,
    }).catch(() => null);

    // If external call failed (e.g. Render 404 or connection failure), retry same-origin Next.js API
    if ((!res || !res.ok) && typeof window !== "undefined" && window.location.origin) {
      const sameOriginParse = `${window.location.origin}/api/v1/match/parse`;
      if (`${baseUrl}/match/parse` !== sameOriginParse) {
        try {
          const fallbackRes = await fetch(sameOriginParse, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_input: userInput }),
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch {
          // Keep res as is
        }
      }
    }

    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }

    if (res && res.ok) {
      return (await res.json()) as ParseResponse;
    } else {
      fallbackReason = res ? `API responded with HTTP ${res.status}` : "API backend unreachable";
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err;
    }
    fallbackReason = err instanceof Error ? err.message : "Network failure";
  }

  // Resilient fallback to deterministic Strategy A rules (Rule 2 & Rule 9)
  const legacyNeeds = parseNeedsKeyword(userInput);
  const multiRequest = parseRequestKeyword(userInput);

  return {
    request_id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    parsed_needs: legacyNeeds,
    parsed_request: multiRequest,
    strategy: "A",
    source: "rules",
    error_category: "network_or_cold_start",
    fallback_reason: fallbackReason,
  };
}

/**
 * Fetches multi-need recommendations from API or deterministic client engine
 */
export async function fetchMultiNeedRecommendations(
  parsedRequest: ParsedRequest,
  signal?: AbortSignal
): Promise<MultiNeedMatchResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const abortHandler = () => controller.abort();
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/match/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parsed_request: parsedRequest }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }

    if (res.ok) {
      return (await res.json()) as MultiNeedMatchResult;
    }
  } catch {
    // Fall back to client-side deterministic engine
  }

  return matchMultiNeeds(parsedRequest, DEMO_CATALOGUE_SEED);
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

/**
 * Fetches live shortlist preview for /match/confirm
 */
export async function fetchMatchPreview(
  parsedRequest: ParsedRequest,
  answeredFacets: Record<string, string> = {},
  signal?: AbortSignal
): Promise<MatchPreviewResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const abortHandler = () => controller.abort();
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/match/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parsed: parsedRequest,
        answeredFacets,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }

    if (res.ok) {
      return (await res.json()) as MatchPreviewResult;
    }
  } catch {
    // Fall back to client-side deterministic preview calculation
  }

  return calculateMatchPreview(parsedRequest, DEMO_CATALOGUE_SEED, answeredFacets);
}

/**
 * Fetches the next catalogue-driven facet clarifying question (Information Gain)
 */
export async function fetchNextFacetQuestion(
  parsedRequest: ParsedRequest,
  answeredFacets: Record<string, string> = {},
  askedCount: number = 0,
  signal?: AbortSignal
): Promise<NextFacetQuestionResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const abortHandler = () => controller.abort();
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/match/next-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parsed: parsedRequest,
        answeredFacets,
        askedCount,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }

    if (res.ok) {
      return (await res.json()) as NextFacetQuestionResult;
    }
  } catch {
    // Fall back to client-side deterministic question selector
  }

  return selectNextFacetQuestion(parsedRequest, DEMO_CATALOGUE_SEED, answeredFacets, askedCount);
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
): Promise<{ success: boolean; message: string }> {
  try {
    const { baseUrl } = resolveApiUrls();
    const res = await fetch(`${baseUrl}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Feedback saved" };
    }
  } catch {
    // Gracefully handled in UI
  }

  return {
    success: true,
    message: "Thank you for helping improve the discovery experience.",
  };
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

export interface MatchChatResponse {
  patch: SessionPatch;
  events: SessionEvent[];
  assistantMessage: string;
  quickReplies: Array<{ id: string; label: string; action: string; value: unknown }>;
  nextQuestion: SelectNextQuestionResult | null;
  candidateCount: number;
  sourceTag?: {
    source: string;
    verifiedAt: string;
    url?: string;
  };
  meta: {
    source: "llm" | "rules";
    fallbackReason?: string;
  };
}

export interface UnifiedChatInput {
  state: MatchSessionState;
  message: string;
  history?: ChatMessage[];
  pageContext?: {
    page: "home" | "confirm" | "results" | "products" | "product_detail" | "compare" | "help";
    focusFamilyId?: string;
    comparedFamilyIds?: string[];
  };
  language?: SessionLanguage;
  mode?: "rules" | "retrieval" | "digest" | "hybrid";
}

export interface UnifiedChatResponse {
  request_id?: string;
  patch: SessionPatch;
  assistantMessage: string;
  quickReplies: Array<{ id: string; label: string; action: string; value: unknown }>;
  actions: Array<{ type: string; payload: unknown }>;
  candidates: ShortlistFamilyItem[];
  shortlist: {
    stateHash: string;
    count: number;
    topFamilies: ShortlistFamilyItem[];
  };
  sources: Array<{ source: string; verifiedAt: string; url?: string }>;
  meta?: {
    mode: string;
    fallbackReason?: string;
    tokenEstimate?: number;
    latencyMs?: number;
  };
}

export async function sendUnifiedChat(input: UnifiedChatInput): Promise<UnifiedChatResponse> {
  const { baseUrl } = resolveApiUrls();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    let res: Response | null = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    }).catch(() => null);

    // If external chat failed, retry same-origin Next.js chat route
    if ((!res || !res.ok) && typeof window !== "undefined" && window.location.origin) {
      const sameOriginChat = `${window.location.origin}/api/v1/chat`;
      if (`${baseUrl}/chat` !== sameOriginChat) {
        try {
          const fallbackRes = await fetch(sameOriginChat, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch {
          // Keep res as is
        }
      }
    }

    clearTimeout(timeout);

    if (res && res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client-side pure rules logic
  }

  // Client-side deterministic fallback
  const rules = extractPatchViaRules(input.message);
  const nextState = matchSessionReducer(input.state, {
    type: "APPLY_PATCH",
    source: "user_text",
    status: "confirmed",
    patch: rules.patch,
  });
  const nextQ = selectNext(nextState, DEMO_CATALOGUE_SEED);
  const shortlist = computeShortlist(nextState, DEMO_CATALOGUE_SEED);

  const categoryLabel = rules.patch.product_type
    ? formatCategoryLabel(rules.patch.product_type)
    : null;
  const needLabel = rules.patch.needs?.[0]?.phrase_from_user || null;

  let assistantMessage = "";
  if (categoryLabel) {
    const goalText = needLabel ? ` for ${needLabel}` : "";
    if (shortlist.totalFamilies > 0) {
      if (!nextQ.done && nextQ.question) {
        assistantMessage = `Focused on ${categoryLabel}${goalText}. We found ${shortlist.totalFamilies} matching option${shortlist.totalFamilies === 1 ? "" : "s"}. ${nextQ.question}`;
      } else {
        assistantMessage = `Focused on ${categoryLabel}${goalText}. We found ${shortlist.totalFamilies} matching option${shortlist.totalFamilies === 1 ? "" : "s"} from our verified catalogue.`;
      }
    } else {
      assistantMessage = `We noted your interest in ${categoryLabel}${goalText}, but could not find an exact match in our current catalogue.`;
    }
  } else if (needLabel) {
    assistantMessage = `Noted your goal: ${needLabel}. ${nextQ.question || ""}`;
  } else {
    assistantMessage = nextQ.done
      ? `Understood. We found ${shortlist.totalFamilies} products matching your criteria.`
      : `Noted. ${nextQ.question || ""}`;
  }

  return {
    patch: rules.patch,
    assistantMessage: assistantMessage.trim(),
    quickReplies: (nextQ.options || []).slice(0, 3).map((o) => ({
      id: o.id,
      label: o.label,
      action: "answer_facet",
      value: { facetId: nextQ.facet, value: o.value },
    })),
    actions: [
      { type: "apply_patch", payload: rules.patch },
      { type: "show_results", payload: { count: shortlist.totalFamilies, stateHash: shortlist.stateHash } },
    ],
    candidates: shortlist.topFamilies,
    shortlist: {
      stateHash: shortlist.stateHash,
      count: shortlist.totalFamilies,
      topFamilies: shortlist.topFamilies.slice(0, 3),
    },
    sources: [],
    meta: {
      mode: "rules",
      fallbackReason: "Local rules active",
    },
  };
}

export async function sendMatchChat(input: {
  state: MatchSessionState;
  message: string;
  history?: ChatMessage[];
  language?: SessionLanguage;
}): Promise<MatchChatResponse> {
  const res = await sendUnifiedChat({
    state: input.state,
    message: input.message,
    history: input.history,
    language: input.language,
  });

  const nextState = matchSessionReducer(input.state, {
    type: "APPLY_PATCH",
    source: "chat",
    status: "confirmed",
    patch: res.patch,
  });

  const nextQ = selectNext(nextState, DEMO_CATALOGUE_SEED);

  return {
    patch: res.patch,
    events: [],
    assistantMessage: res.assistantMessage,
    quickReplies: res.quickReplies,
    nextQuestion: nextQ.done ? null : nextQ,
    candidateCount: res.shortlist.count,
    sourceTag: res.sources.length > 0 ? res.sources[0] : undefined,
    meta: {
      source: res.meta?.mode === "rules" ? "rules" : "llm",
      fallbackReason: res.meta?.fallbackReason,
    },
  };
}

export async function fetchNextSessionQuestion(
  state: MatchSessionState
): Promise<SelectNextQuestionResult> {
  const { baseUrl } = resolveApiUrls();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${baseUrl}/match/next-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to deterministic client evaluation
  }

  return selectNext(state, DEMO_CATALOGUE_SEED);
}

export async function fetchSessionPreview(state: MatchSessionState): Promise<{
  stateHash: string;
  count: number;
  familiesTop: PreviewFamily[];
  status: "NO_FIT" | "FOCUSED";
  unmatchedBenefit?: string | null;
  canExploreOtherCategories?: boolean;
  alternativeCategoryMatchesCount?: number;
}> {
  const { baseUrl } = resolveApiUrls();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${baseUrl}/match/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Client fallback to single shared computation
  }

  const shortlist = computeShortlist(state, DEMO_CATALOGUE_SEED);
  return {
    stateHash: shortlist.stateHash,
    count: shortlist.totalFamilies,
    familiesTop: shortlist.topFamilies.slice(0, 3).map((f) => ({
      familyId: f.familyId,
      name: f.canonical_name,
      category: f.category,
      categoryLabel: f.categoryLabel,
      format: f.format,
      priceInr: f.priceInr,
      imageUrl: f.imageUrl,
      whyLine: f.whyText,
      rank: f.rank,
      benefitsCovered: f.benefitsCovered,
      notSpecificallyDescribed: f.notSpecificallyDescribed,
    })),
    status: shortlist.totalFamilies === 0 ? "NO_FIT" : "FOCUSED",
    unmatchedBenefit: shortlist.unmatchedBenefit,
    canExploreOtherCategories: shortlist.canExploreOtherCategories,
    alternativeCategoryMatchesCount: shortlist.alternativeCategoryMatchesCount,
  };
}

export interface ParsedFilterIntentResult {
  request_id: string;
  intent_type: "exact_name" | "concern_intent" | "filter_modification";
  criteria: {
    search?: string;
    categories: string[];
    formats: string[];
    goals: string[];
    fragrance: string;
  };
  explanation?: string;
  source: "llm" | "fallback";
}

/**
 * Calls Fastify /v1/match/parse-filter endpoint.
 * Evaluates the query using Groq LLM (with deterministic fallback),
 * determining whether the input is an exact product name, a wellness concern, or a filter modification.
 */
export async function parseFilterIntent(
  query: string,
  activeFilters?: ProductFilterCriteria
): Promise<ParsedFilterIntentResult> {
  const { baseUrl } = resolveApiUrls();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    let res: Response | null = await fetch(`${baseUrl}/match/parse-filter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, active_filters: activeFilters }),
      signal: controller.signal,
    }).catch(() => null);

    // If external call failed (e.g. Render 404 or connection failure), retry same-origin Next.js API
    if ((!res || !res.ok) && typeof window !== "undefined" && window.location.origin) {
      const sameOriginParseFilter = `${window.location.origin}/api/v1/match/parse-filter`;
      if (`${baseUrl}/match/parse-filter` !== sameOriginParseFilter) {
        try {
          const fallbackRes = await fetch(sameOriginParseFilter, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, active_filters: activeFilters }),
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch {
          // Keep res as is
        }
      }
    }

    clearTimeout(timeout);

    if (res && res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client-side deterministic parse
  } finally {
    clearTimeout(timeout);
  }

  // Pure fallback
  const fallback = parseSearchToFilterParams(query);
  return {
    request_id: "client_fallback",
    intent_type: fallback.search ? "exact_name" : "concern_intent",
    criteria: {
      search: fallback.search,
      categories: fallback.categories,
      formats: fallback.formats,
      goals: fallback.goals,
      fragrance: fallback.fragrance,
    },
    source: "fallback",
  };
}

/**
 * Visual Camera & Photo Product Scanner
 * Sends camera capture or uploaded image to Multimodal LLM + deterministic catalogue matcher.
 */
export async function visualScanProduct(options: {
  imageBase64?: string;
  preset?: string;
}): Promise<VisualScanResult> {
  const { baseUrl } = resolveApiUrls();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    let res: Response | null = await fetch(`${baseUrl}/match/visual-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: options.imageBase64,
        preset: options.preset,
      }),
      signal: controller.signal,
    }).catch(() => null);

    // If external call failed (e.g. Render 404), retry same-origin Next.js API
    if ((!res || !res.ok) && typeof window !== "undefined" && window.location.origin) {
      const sameOriginVisualScan = `${window.location.origin}/api/v1/match/visual-scan`;
      if (`${baseUrl}/match/visual-scan` !== sameOriginVisualScan) {
        try {
          const fallbackRes = await fetch(sameOriginVisualScan, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: options.imageBase64,
              preset: options.preset,
            }),
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch {
          // Keep res as is
        }
      }
    }

    clearTimeout(timeout);

    if (res && res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[visualScanProduct] Fetch failed, falling back to local simulation", err);
  } finally {
    clearTimeout(timeout);
  }

  // If a preset was explicitly requested, return preset match
  if (options.preset) {
    const fallbackPresets: Record<string, ScannedProductInfo> = {
      "minimalist-salicylic-face-wash": {
        is_product_detected: true,
        brand: "Minimalist",
        product_name: "Minimalist 2% Salicylic Acid Cleanser",
        category: "face_wash",
        format: "Gel / Foaming cleanser",
        active_ingredients: ["Salicylic Acid", "LHA", "Zinc PCA"],
        primary_concerns: ["Acne", "Oil control", "Blackheads"],
        summary: "A daily exfoliating face cleanser with 2% Salicylic Acid for pore decongestion.",
      },
      "minimalist-niacinamide-serum": {
        is_product_detected: true,
        brand: "Minimalist",
        product_name: "Minimalist 10% Niacinamide Serum",
        category: "serum",
        format: "Serum",
        active_ingredients: ["Niacinamide", "Zinc PCA"],
        primary_concerns: ["Dark spots", "Open pores", "Uneven texture"],
        summary: "A high-strength nourishing serum containing 10% pure Niacinamide.",
      },
      "minimalist-spf50-sunscreen": {
        is_product_detected: true,
        brand: "Minimalist",
        product_name: "Minimalist SPF 50 Multi-Vitamin Sunscreen",
        category: "sunscreen",
        format: "Lotion",
        active_ingredients: ["Avobenzone", "Octocrylene", "Niacinamide"],
        primary_concerns: ["Sun protection", "UV damage", "Tanning"],
        summary: "A broad-spectrum SPF 50 PA++++ sunscreen lotion.",
      },
      "sebamed-anti-dandruff-shampoo": {
        is_product_detected: true,
        brand: "Sebamed",
        product_name: "Sebamed Anti-Dandruff Shampoo",
        category: "shampoo",
        format: "Liquid shampoo",
        active_ingredients: ["Piroctone Olamine"],
        primary_concerns: ["Dandruff", "Flaky scalp"],
        summary: "A gentle cleansing shampoo targeting visible scalp flakes.",
      },
      "cetaphil-gentle-cleanser": {
        is_product_detected: true,
        brand: "Cetaphil",
        product_name: "Cetaphil Gentle Skin Cleanser",
        category: "face_wash",
        format: "Cream / Lotion cleanser",
        active_ingredients: ["Glycerin", "Niacinamide", "Panthenol"],
        primary_concerns: ["Dry skin", "Sensitive barrier"],
        summary: "A non-foaming hydrating face cleanser designed for sensitive skin.",
      },
    };

    const presetInfo = fallbackPresets[options.preset] || fallbackPresets["minimalist-salicylic-face-wash"];
    const matches = matchSimilarBodywiseProducts(presetInfo, DEMO_CATALOGUE_SEED);
    return {
      scanned_product: presetInfo,
      explanation: `We identified ${presetInfo.product_name}. Here are the closest Be Bodywise catalogue equivalents.`,
      matches,
      latency_ms: 50,
    };
  }

  // If an image was submitted but the server was unreachable, do NOT pretend it's a random face wash!
  const undetectedInfo: ScannedProductInfo = {
    is_product_detected: false,
    brand: "Unknown",
    product_name: "Scan unavailable",
    category: "unknown",
    format: "unknown",
    active_ingredients: [],
    primary_concerns: [],
    summary:
      "Unable to reach the visual scan service. Please check your network connection or try selecting a sample preset below.",
  };

  return {
    scanned_product: undetectedInfo,
    explanation:
      "The visual analysis service could not be reached. Please check your connection or choose a sample product preset below to preview visual matching.",
    matches: [],
    latency_ms: 50,
  };
}



