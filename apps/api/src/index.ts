import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
import {
  CATALOGUE_VERSION,
  CONTROLLED_GOALS,
  DEMO_CATALOGUE_SEED,
  Feedback,
  FeedbackSchema,
  MatchRequestSchema,
  ParsedNeeds,
  ParsedNeedsSchema,
  RULES_VERSION,
  matchProducts,
  selectNextQuestion,
} from "@bodywise/shared";
import { parseUserNeeds } from "./services/parse-service";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const rawCors =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  "http://localhost:3000";
const CORS_ORIGINS = rawCors
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DEFAULT_RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "100", 10);

interface SerializedReq {
  id?: string | number;
  method?: string;
  url?: string;
  ip?: string;
}

interface SerializedRes {
  statusCode?: number;
}

// Startup check: if GROQ_API_KEY is missing, log a single line and continue
if (!process.env.GROQ_API_KEY || process.env.LLM_ENABLED === "false") {
  console.log("LLM disabled: using rules parser");
}

export function buildServer(opts?: { rateLimitMax?: number }) {
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

  // In-memory feedback and session store for demo environment
  const feedbackStore: Array<Feedback & { recorded_at: string }> = [];

  app.register(async (api) => {
    // Security headers via Helmet
    await api.register(helmet, {
      contentSecurityPolicy: false,
    });

    // CORS with env allowlist
    await api.register(cors, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (
          CORS_ORIGINS.includes("*") ||
          CORS_ORIGINS.includes(origin) ||
          origin.startsWith("http://localhost:")
        ) {
          return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"), false);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
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

    // --- ROUTES ---

    // Health check (used by Render health check and /status page)
    api.get("/health", async () => {
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
        version: "0.1.0",
        rules_version: RULES_VERSION,
        catalogue_version: CATALOGUE_VERSION,
        database: isDbConfigured ? "configured" : "in_memory_fallback",
        llm: isLlmConfigured ? "groq" : "deterministic_only",
        ephemeral_disk: true,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      };
    });

    // GET /v1/products
    api.get("/v1/products", async () => {
      return {
        products: DEMO_CATALOGUE_SEED,
        total: DEMO_CATALOGUE_SEED.length,
        is_demo: true,
      };
    });

    // GET /v1/goals (Catalogue-supported goals only)
    api.get("/v1/goals", async () => {
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
    api.get<{ Params: { slug: string } }>("/v1/products/:slug", async (req, reply) => {
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

    // POST /v1/match/parse (Extracts intent into Zod schema without diagnosis, Rule 2)
    api.post<{ Body: { user_input: string } }>(
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

        const { parsed_needs, strategy, source } = await parseUserNeeds(
          user_input,
          String(req.id)
        );

        return {
          request_id: req.id,
          parsed_needs,
          strategy,
          source,
        };
      }
    );

    // POST /v1/match/next-question (Single question that best splits remaining candidates, Rule 2)
    api.post<{
      Body: {
        parsed_needs: ParsedNeeds;
        answered_question_ids?: string[];
      };
    }>("/v1/match/next-question", async (req, reply) => {
      const { parsed_needs, answered_question_ids } = req.body || {};
      if (!parsed_needs) {
        return reply.status(400).send({
          error: "Invalid request. 'parsed_needs' is required.",
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

    // POST /v1/match/recommend (Pure TypeScript deterministic matching, Rule 2)
    api.post("/v1/match/recommend", async (req, reply) => {
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

      const matchResult = matchProducts(parsedNeeds, DEMO_CATALOGUE_SEED);
      return matchResult;
    });

    // POST /v1/feedback (Was this shortlist useful? with anonymous session ID & aggregate consent)
    api.post("/v1/feedback", async (req, reply) => {
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

    // DELETE /v1/session/:id - Delete server session data by ID (Privacy & Data Right)
    api.delete<{ Params: { id: string } }>("/v1/session/:id", async (req) => {
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

    // POST /v1/session/delete - Alternative route for clients preferring POST
    api.post<{ Body: { session_id?: string; id?: string } }>("/v1/session/delete", async (req, reply) => {
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
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const server = buildServer();
  server.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    console.log(`[Bodywise Match API] Server listening at ${address}`);
  });
}
