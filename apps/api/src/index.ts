import { initEnv, getConfig, logLlmStartup } from "./config";
// 1. Initialize environment loader before any other imports evaluate
initEnv();

import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "crypto";
import {
  CATALOGUE_VERSION,
  CONTROLLED_GOALS,
  DEMO_CATALOGUE_SEED,
  CustomerExperienceRecord,
  DEMO_EXPERIENCES_SEED,
  Feedback,
  FeedbackSchema,
  MatchRequestSchema,
  ParsedNeeds,
  ParsedNeedsSchema,
  ParsedRequest,
  ParsedRequestSchema,
  RULES_VERSION,
  parseNeedsKeyword,
  matchProducts,
  matchMultiNeeds,
  selectNextQuestion,
  selectNextFacetQuestion,
  calculateMatchPreview,
  selectNext,
  computeShortlist,
  MatchSessionState,
  ChatMessage,
  SessionLanguage,
  createInitialSessionState,
} from "@bodywise/shared";
import { handleChatTurn, PageContext } from "./services/chat-pipeline";
import { testLlmDebug } from "./llm/groqClient";
import { parseFilterIntent } from "./services/filter-intent-service";
import { processVisualScan } from "./services/visual-scan-service";

interface SerializedReq {
  id?: string | number;
  method?: string;
  url?: string;
  ip?: string;
}

interface SerializedRes {
  statusCode?: number;
}

export function buildServer(opts?: { rateLimitMax?: number }) {
  const config = getConfig();
  const CORS_ORIGINS = config.corsOrigins;
  const DEFAULT_RATE_LIMIT = opts?.rateLimitMax ?? config.rateLimit;

  // Redacting logger: Strictly never logs request bodies or user inputs (Rule 8)
  const app = fastify({
    genReqId: () => randomUUID(),
    requestIdHeader: "x-request-id",
    logger: {
      level: process.env.LOG_LEVEL || "info",
      serializers: {
        req(req: SerializedReq) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.ip,
            // body is intentionally omitted to prevent logging free-text inputs
          };
        },
        res(reply: SerializedRes) {
          return {
            statusCode: reply.statusCode,
          };
        },
      },
    },
  });

  // In-memory feedback and community experiences store
  const feedbackStore: Array<Feedback & { recorded_at: string }> = [];
  const experiencesStore: CustomerExperienceRecord[] = [...DEMO_EXPERIENCES_SEED];

  app.register(async (api) => {
    // Security headers via Helmet
    await api.register(helmet, {
      contentSecurityPolicy: false,
    });

    // CORS with env allowlist (Task A.2.e)
    await api.register(cors, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (
          CORS_ORIGINS.includes("*") ||
          CORS_ORIGINS.includes(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.endsWith(".vercel.app") ||
          origin === "https://bodywise-match-x5hd.vercel.app"
        ) {
          return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"), false);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "x-debug-token"],
    });

    // Rate Limiting
    await api.register(rateLimit, {
      max: opts?.rateLimitMax ?? DEFAULT_RATE_LIMIT,
      timeWindow: "1 minute",
      addHeaders: {
        "x-ratelimit-limit": true,
        "x-ratelimit-remaining": true,
        "x-ratelimit-reset": true,
        "retry-after": true,
      },
    });

    // --- ROUTES DEFINITION ---
    const registerRoutes = (routeScope: typeof api) => {
      // Health check (used by Render/Vercel health check and /status page)
      routeScope.get("/health", async () => {
        const isDbConfigured = Boolean(
          process.env.DATABASE_URL &&
            !process.env.DATABASE_URL.includes("[PASSWORD]")
        );
        const isLlmConfigured = Boolean(
          process.env.GROQ_API_KEY && process.env.LLM_ENABLED !== "false"
        );

        return {
          status: "ok",
          service: "bodywise-match-api",
          version: "0.2.0",
          rules_version: RULES_VERSION,
          catalogue_version: CATALOGUE_VERSION,
          database: isDbConfigured ? "configured" : "in_memory_fallback",
          llm: isLlmConfigured ? "groq" : "deterministic_only",
          ephemeral_disk: true,
          uptime: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        };
      });

      // GET /v1/debug/llm (Task A.1 & Step 1.5)
      routeScope.get("/v1/debug/llm", async (req, reply) => {
        const config = getConfig();
        const isProduction = config.nodeEnv === "production";
        const debugToken = config.debugToken;
        const headerToken = req.headers["x-debug-token"];

        if (isProduction && (!debugToken || headerToken !== debugToken)) {
          return reply.status(403).send({
            error: "Debug endpoint disabled in production without valid x-debug-token header.",
          });
        }

        const debugResult = await testLlmDebug();
        return debugResult;
      });

      // GET /v1/products
      routeScope.get("/v1/products", async () => {
        return {
          products: DEMO_CATALOGUE_SEED,
          total: DEMO_CATALOGUE_SEED.length,
          is_demo: true,
        };
      });

      // GET /v1/goals (Catalogue-supported goals only)
      routeScope.get("/v1/goals", async () => {
        const supportedGoalIds = new Set<string>();
        for (const prod of DEMO_CATALOGUE_SEED) {
          for (const g of prod.supported_goals) {
            supportedGoalIds.add(g);
          }
        }
        const goals = CONTROLLED_GOALS.filter((g) => supportedGoalIds.has(g.id));
        return {
          goals,
          total: goals.length,
        };
      });

      // GET /v1/products/:slug
      routeScope.get<{ Params: { slug: string } }>("/v1/products/:slug", async (req, reply) => {
        const { slug } = req.params;
        const product = DEMO_CATALOGUE_SEED.find((p) => p.slug === slug);
        if (!product) {
          return reply.status(404).send({
            error: "Product not found",
            slug,
          });
        }
        return { product };
      });

      // POST /v1/chat (Primary Unified Gateway for all chat & interpretation)
      routeScope.post("/v1/chat", async (req, reply) => {
        const body = (req.body || {}) as {
          state?: MatchSessionState;
          message?: string;
          history?: ChatMessage[];
          pageContext?: PageContext;
          language?: SessionLanguage;
          mode?: "rules" | "retrieval" | "digest" | "hybrid";
        };

        if (!body.message || typeof body.message !== "string") {
          return reply.status(400).send({
            error: "Invalid request. 'message' string is required.",
          });
        }

        const sessionState = body.state || createInitialSessionState();

        const result = await handleChatTurn({
          state: sessionState,
          message: body.message,
          history: body.history,
          pageContext: body.pageContext,
          language: body.language,
          mode: body.mode,
          requestId: String(req.id),
        });

        return {
          request_id: req.id,
          ...result,
          events: [],
          candidateCount: result.shortlist.count,
          sourceTag: result.sources.length > 0 ? result.sources[0] : undefined,
        };
      });

      // POST /v1/match/parse (Thin wrapper delegating to handleChatTurn)
      routeScope.post<{ Body: { user_input: string } }>(
        "/v1/match/parse",
        {
          config: {
            rateLimit: {
              max: 20,
              timeWindow: "1 minute",
            },
          },
        },
        async (req, reply) => {
          const { user_input } = req.body || {};
          if (
            !user_input ||
            typeof user_input !== "string" ||
            user_input.trim().length < 3
          ) {
            return reply.status(400).send({
              error:
                "Invalid input. Please provide a description of your primary goal.",
            });
          }

          const sessionState = createInitialSessionState();
          const turnResult = await handleChatTurn({
            state: sessionState,
            message: user_input,
            requestId: String(req.id),
          });

          // Build legacy parsed_needs for backward compatibility
          const legacyNeeds: ParsedNeeds = parseNeedsKeyword(user_input);

          return {
            request_id: req.id,
            parsed_request: {
              needs: turnResult.patch.needs || [{
                id: "need_1",
                concept_id: turnResult.patch.product_type || "general",
                phrase_from_user: user_input,
                normalised_label: user_input,
                confidence: 1,
                status: "confirmed",
                source: "user_text",
                evidence_text: user_input,
              }],
              primary_category: turnResult.patch.product_type || null,
              format_preference: turnResult.patch.format || null,
              body_area: turnResult.patch.body_area || null,
              time_of_day: turnResult.patch.time_of_day || null,
              avoidances: turnResult.patch.avoidances || [],
              confidence: 1,
              strategy: "A",
            },
            parsed_needs: legacyNeeds,
            strategy: "A",
            source: turnResult.meta.mode === "rules" ? "rules" : "llm",
            model: "groq-llama-3.3-70b",
            latencyMs: turnResult.meta.latencyMs,
            fallback_reason: turnResult.meta.fallbackReason,
            patch: turnResult.patch,
            shortlist: turnResult.shortlist,
            turn_result: turnResult,
          };
        }
      );

      // POST /v1/match/parse-filter (Intelligent LLM filter & query intent parser)
      routeScope.post(
        "/v1/match/parse-filter",
        {
          config: {
            rateLimit: {
              max: 60,
              timeWindow: "1 minute",
            },
          },
        },
        async (req, reply) => {
          const body = (req.body || {}) as {
            query?: string;
            active_filters?: {
              search?: string;
              categories?: string[];
              formats?: string[];
              goals?: string[];
              fragrance?: string;
            };
          };

          if (typeof body.query !== "string") {
            return reply.status(400).send({
              error: "Invalid input. 'query' string is required.",
            });
          }

          const result = await parseFilterIntent({
            query: body.query,
            active_filters: body.active_filters,
            requestId: String(req.id),
          });

          return result;
        }
      );

      // POST /v1/match/visual-scan (Multimodal Vision LLM & Deterministic Matcher)
      routeScope.post(
        "/v1/match/visual-scan",
        {
          config: {
            rateLimit: {
              max: 30,
              timeWindow: "1 minute",
            },
          },
        },
        async (req, reply) => {
          const body = (req.body || {}) as {
            image?: string;
            image_base64?: string;
            preset?: string;
          };

          const imageBase64 = body.image_base64 || body.image;
          const preset = body.preset;

          if (!imageBase64 && !preset) {
            return reply.status(400).send({
              error: "Please provide either an image or a preset product identifier.",
            });
          }

          const result = await processVisualScan({
            imageBase64,
            preset,
          });

          return {
            request_id: req.id,
            ...result,
          };
        }
      );

      // POST /v1/match/next-question (Deterministic, Rule 2 & Section F)
      routeScope.post("/v1/match/next-question", async (req, reply) => {
        const body = (req.body || {}) as Record<string, unknown>;

        // 1. Shared MatchSessionState contract (Primary)
        if (body.state) {
          const sessionState = body.state as MatchSessionState;
          const result = selectNext(sessionState, DEMO_CATALOGUE_SEED);
          return {
            request_id: req.id,
            ...result,
          };
        }

        // 2. Multi-need parsed request contract (Backward compatibility)
        let parsedRequest: ParsedRequest | null = null;
        if (body.parsed) {
          const safe = ParsedRequestSchema.safeParse(body.parsed);
          if (safe.success) parsedRequest = safe.data;
        } else if (body.parsed_request) {
          const safe = ParsedRequestSchema.safeParse(body.parsed_request);
          if (safe.success) parsedRequest = safe.data;
        } else if (body.needs && Array.isArray(body.needs)) {
          const safe = ParsedRequestSchema.safeParse(body);
          if (safe.success) parsedRequest = safe.data;
        }

        if (parsedRequest) {
          const answeredFacets = (body.answeredFacets || body.answered_facets || {}) as Record<
            string,
            string
          >;
          const askedCount =
            typeof body.askedCount === "number"
              ? body.askedCount
              : typeof body.asked_count === "number"
              ? body.asked_count
              : 0;
          const result = selectNextFacetQuestion(
            parsedRequest,
            DEMO_CATALOGUE_SEED,
            answeredFacets,
            askedCount
          );
          return {
            request_id: req.id,
            ...result,
          };
        }

        // 3. Legacy single-goal parsed_needs fallback
        const { parsed_needs, answered_question_ids } = body as {
          parsed_needs?: ParsedNeeds;
          answered_question_ids?: string[];
        };

        if (!parsed_needs) {
          return reply.status(400).send({
            error: "Invalid request. 'state', 'parsed', or 'parsed_needs' is required.",
          });
        }

        const validatedNeeds = ParsedNeedsSchema.safeParse(parsed_needs);
        if (!validatedNeeds.success) {
          return reply.status(400).send({
            error: "Invalid parsed_needs schema.",
            details: validatedNeeds.error.flatten(),
          });
        }

        const result = selectNextQuestion(
          validatedNeeds.data,
          DEMO_CATALOGUE_SEED,
          answered_question_ids || []
        );

        return {
          request_id: req.id,
          question: result.question,
          candidate_count: result.candidate_count,
          explanation: result.explanation,
        };
      });

      // POST /v1/match/preview (Live shortlist preview for /match/confirm)
      routeScope.post("/v1/match/preview", async (req, reply) => {
        const body = (req.body || {}) as Record<string, unknown>;

        // 1. Shared MatchSessionState contract (Primary Single Shared Computation Engine)
        if (body.state) {
          const sessionState = body.state as MatchSessionState;
          const shortlist = computeShortlist(sessionState, DEMO_CATALOGUE_SEED);
          return {
            request_id: req.id,
            stateHash: shortlist.stateHash,
            count: shortlist.totalFamilies,
            familiesTop: shortlist.topFamilies.slice(0, 3).map((f) => ({
              familyId: f.familyId,
              name: f.canonical_name,
              canonical_name: f.canonical_name,
              category: f.category,
              categoryLabel: f.categoryLabel,
              format: f.format,
              priceInr: f.priceInr,
              price_inr: f.price_inr,
              imageUrl: f.imageUrl,
              image_url: f.image_url,
              whyLine: f.whyText,
              rank: f.rank,
              benefitsCovered: f.benefitsCovered,
              notSpecificallyDescribed: f.notSpecificallyDescribed,
              primaryProduct: f.primaryProduct,
            })),
            status: shortlist.totalFamilies === 0 ? "NO_FIT" : "FOCUSED",
            filtersApplied: shortlist.filtersApplied,
            rulesVersion: shortlist.rulesVersion,
            unmatchedBenefit: shortlist.unmatchedBenefit,
            canExploreOtherCategories: shortlist.canExploreOtherCategories,
            alternativeCategoryMatchesCount: shortlist.alternativeCategoryMatchesCount,
          };
        }

        // 2. Multi-need parsed request contract (Backward compatibility)
        let parsedRequest: ParsedRequest | null = null;
        if (body.parsed) {
          const safe = ParsedRequestSchema.safeParse(body.parsed);
          if (safe.success) parsedRequest = safe.data;
        } else if (body.parsed_request) {
          const safe = ParsedRequestSchema.safeParse(body.parsed_request);
          if (safe.success) parsedRequest = safe.data;
        } else if (body.needs && Array.isArray(body.needs)) {
          const safe = ParsedRequestSchema.safeParse(body);
          if (safe.success) parsedRequest = safe.data;
        }

        if (!parsedRequest) {
          return reply.status(400).send({
            error: "Invalid request. 'state' or 'parsed' with valid ParsedRequest is required.",
          });
        }

        const answeredFacets = (body.answeredFacets || body.answered_facets || {}) as Record<
          string,
          string
        >;
        const preview = calculateMatchPreview(parsedRequest, DEMO_CATALOGUE_SEED, answeredFacets);

        return {
          request_id: req.id,
          ...preview,
        };
      });

      // POST /v1/match/chat (Thin wrapper delegating to handleChatTurn)
      routeScope.post("/v1/match/chat", async (req, reply) => {
        const body = (req.body || {}) as {
          state?: MatchSessionState;
          message?: string;
          history?: ChatMessage[];
          language?: SessionLanguage;
        };

        if (!body.state || !body.message || typeof body.message !== "string") {
          return reply.status(400).send({
            error: "Invalid request. 'state' and 'message' are required.",
          });
        }

        const result = await handleChatTurn({
          state: body.state,
          message: body.message,
          history: body.history,
          language: body.language,
          requestId: String(req.id),
        });

        return {
          request_id: req.id,
          ...result,
          events: [],
          candidateCount: result.shortlist.count,
          sourceTag: result.sources.length > 0 ? result.sources[0] : undefined,
        };
      });

      // POST /v1/match/recommend (Pure TypeScript deterministic matching, Task Part E)
      routeScope.post("/v1/match/recommend", async (req, reply) => {
        const body = (req.body || {}) as Record<string, unknown>;

        // 0. Shared MatchSessionState contract (Primary Single Shared Engine)
        if (body.state) {
          const sessionState = body.state as MatchSessionState;
          const shortlist = computeShortlist(sessionState, DEMO_CATALOGUE_SEED);
          return {
            request_id: req.id,
            status: shortlist.totalFamilies === 0 ? "NO_FIT" : "MATCHES_FOUND",
            stateHash: shortlist.stateHash,
            rules_version: shortlist.rulesVersion,
            totalFamilies: shortlist.totalFamilies,
            groups: shortlist.groups,
            topFamilies: shortlist.topFamilies,
            filtersApplied: shortlist.filtersApplied,
            canExploreOtherCategories: shortlist.canExploreOtherCategories,
            unmatchedBenefit: shortlist.unmatchedBenefit,
            alternativeCategoryMatchesCount: shortlist.alternativeCategoryMatchesCount,
          };
        }

        // 1. Check if multi-need request payload was sent
        let parsedRequest: ParsedRequest | null = null;
        if (body.parsed_request) {
          const safeReq = ParsedRequestSchema.safeParse(body.parsed_request);
          if (safeReq.success) {
            parsedRequest = safeReq.data;
          }
        } else if (body.needs && Array.isArray(body.needs)) {
          const safeReq = ParsedRequestSchema.safeParse(body);
          if (safeReq.success) {
            parsedRequest = safeReq.data;
          }
        }

        if (parsedRequest) {
          const multiResult = await matchMultiNeeds(parsedRequest, DEMO_CATALOGUE_SEED);
          return multiResult;
        }

        // 2. Fall back to legacy single-goal match payload
        const parseResult = MatchRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: "Invalid match request payload",
            details: parseResult.error.flatten(),
          });
        }

        const matchReq = parseResult.data;
        const parsedNeeds: ParsedNeeds = matchReq.parsed_needs || {
          goal: "hair_density_appearance",
          category: "serum",
          format_preferences: [],
          avoidances: [],
          routine_context: null,
          uncertainties: [],
          confidence: "high",
        };

        const result = matchProducts(parsedNeeds, DEMO_CATALOGUE_SEED);
        return result;
      });

      // POST /v1/feedback
      routeScope.post("/v1/feedback", async (req, reply) => {
        const parseResult = FeedbackSchema.safeParse(req.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: "Invalid feedback payload",
            details: parseResult.error.flatten(),
          });
        }

        const record = {
          ...parseResult.data,
          recorded_at: new Date().toISOString(),
        };
        feedbackStore.push(record);

        return {
          success: true,
          message: "Feedback received. Thank you for helping improve the discovery experience.",
          session_id: record.session_id || record.request_id,
          aggregate_consent: record.aggregate_consent,
          recorded_at: record.recorded_at,
        };
      });

      // GET /v1/experiences (Community product reviews)
      routeScope.get<{ Querystring: { slug?: string; product_id?: string } }>(
        "/v1/experiences",
        async (req) => {
          const { slug, product_id } = req.query;
          let list = experiencesStore;
          if (slug) {
            list = list.filter((e) => e.product_slug === slug);
          } else if (product_id) {
            list = list.filter((e) => e.product_id === product_id);
          }
          return {
            experiences: list,
            total: list.length,
          };
        }
      );

      // GET /v1/products/:slug/experiences
      routeScope.get<{ Params: { slug: string } }>(
        "/v1/products/:slug/experiences",
        async (req) => {
          const { slug } = req.params;
          const list = experiencesStore.filter((e) => e.product_slug === slug);
          return {
            experiences: list,
            total: list.length,
          };
        }
      );

      // POST /v1/experiences (Save and publish community customer experience)
      routeScope.post("/v1/experiences", async (req, reply) => {
        const body = (req.body || {}) as Partial<CustomerExperienceRecord> & {
          textSnippet?: string;
          optional_text?: string;
        };

        if (!body.product_slug) {
          return reply.status(400).send({
            error: "product_slug is required",
          });
        }

        const product = DEMO_CATALOGUE_SEED.find((p) => p.slug === body.product_slug);
        const record: CustomerExperienceRecord = {
          id: body.id || `exp-${Date.now()}-${randomUUID().slice(0, 6)}`,
          product_id: body.product_id || product?.id || "unknown",
          product_slug: body.product_slug,
          duration_bucket: body.duration_bucket || "2-4 weeks",
          usage_consistency: body.usage_consistency || "daily",
          self_reported_outcome: body.self_reported_outcome || "better",
          comfort_reaction: body.comfort_reaction || "no issue",
          moderated_text: body.moderated_text || body.optional_text || body.textSnippet || null,
          moderation_status: "published",
          publication_consent: true,
          recommendation_consent: true,
          created_at: body.created_at || new Date().toISOString().split("T")[0],
          source: body.source || "Verified Customer Review",
          is_demo: false,
        };

        const existingIdx = experiencesStore.findIndex((e) => e.id === record.id);
        if (existingIdx >= 0) {
          experiencesStore[existingIdx] = record;
        } else {
          experiencesStore.unshift(record);
        }

        return {
          success: true,
          message: "Experience saved and published to the community.",
          experience: record,
        };
      });

      // DELETE /v1/session/:id
      routeScope.delete<{ Params: { id: string } }>("/v1/session/:id", async (req) => {
        const { id } = req.params;
        let removed = 0;
        for (let i = feedbackStore.length - 1; i >= 0; i--) {
          if (feedbackStore[i].session_id === id || feedbackStore[i].request_id === id) {
            feedbackStore.splice(i, 1);
            removed++;
          }
        }
        return {
          success: true,
          message: `Erased server session data for ${id}`,
          id,
          removed_records: removed,
        };
      });

      // POST /v1/session/delete
      routeScope.post<{ Body: { session_id?: string; id?: string } }>("/v1/session/delete", async (req, reply) => {
        const targetId = req.body?.session_id || req.body?.id;
        if (!targetId) {
          return reply.status(400).send({ error: "Missing session_id or id in request body" });
        }
        let removed = 0;
        for (let i = feedbackStore.length - 1; i >= 0; i--) {
          if (feedbackStore[i].session_id === targetId || feedbackStore[i].request_id === targetId) {
            feedbackStore.splice(i, 1);
            removed++;
          }
        }
        return {
          success: true,
          message: `Erased server session data for ${targetId}`,
          id: targetId,
          removed_records: removed,
        };
      });
    };

    // Register routes at root scope
    registerRoutes(api);

    // Also register routes under /api scope
    api.register(
      async (subScope) => {
        registerRoutes(subScope);
      },
      { prefix: "/api" }
    );
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const config = getConfig();
  logLlmStartup(config);
  const server = buildServer();
  server.listen({ port: config.port, host: config.host }, (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    console.log(`[Bodywise Match API] Server listening at ${address}`);
  });
}
