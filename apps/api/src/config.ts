import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";

/**
 * Trims surrounding whitespace, strips Windows carriage returns (\r),
 * strips surrounding single or double quotes, and treats empty strings as undefined.
 */
export function cleanEnvValue(val: string | undefined | null): string | undefined {
  if (val === undefined || val === null) return undefined;
  let cleaned = String(val).replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).replace(/\r/g, "").trim();
  }
  return cleaned === "" ? undefined : cleaned;
}

let envLoaded = false;
let detectedEnvSource = "none";

/**
 * Robust environment file loader.
 * Loads env files in strict priority order without overwriting existing environment variables:
 * 1. apps/api/.env.local
 * 2. apps/api/.env
 * 3. repo-root .env.local
 * 4. repo-root .env
 *
 * Explicit absolute paths are derived from the current file location to withstand pnpm/turbo cwd shifts.
 */
export function initEnv(forceReload = false): { source: string } {
  if (process.env.NODE_ENV === "test") {
    detectedEnvSource = "test";
    envLoaded = true;
    return { source: "test" };
  }

  if (envLoaded && !forceReload) {
    return { source: detectedEnvSource };
  }

  const baseDir = typeof __dirname !== "undefined"
    ? __dirname
    : path.resolve(process.cwd(), "apps/api/src");

  // Relative to apps/api/src:
  // .. is apps/api
  // ../../.. is repo root
  const candidateFiles = [
    { label: "apps/api/.env.local", filePath: path.resolve(baseDir, "../.env.local") },
    { label: "apps/api/.env", filePath: path.resolve(baseDir, "../.env") },
    { label: ".env.local", filePath: path.resolve(baseDir, "../../../.env.local") },
    { label: ".env", filePath: path.resolve(baseDir, "../../../.env") },
  ];

  const hadInitialKey = Boolean(cleanEnvValue(process.env.GROQ_API_KEY));
  let source = hadInitialKey ? "system" : "none";

  for (const candidate of candidateFiles) {
    if (fs.existsSync(candidate.filePath)) {
      try {
        const fileContent = fs.readFileSync(candidate.filePath, "utf-8");
        const parsed = dotenv.parse(fileContent);

        // Assign only unset variables
        for (const [k, v] of Object.entries(parsed)) {
          if (process.env[k] === undefined) {
            process.env[k] = v;
          }
        }

        if (source === "none" && parsed.GROQ_API_KEY) {
          const val = cleanEnvValue(parsed.GROQ_API_KEY);
          if (val) {
            source = candidate.label;
          }
        }
      } catch {
        // Ignore unreadable files
      }
    }
  }

  detectedEnvSource = source;
  envLoaded = true;
  return { source: detectedEnvSource };
}

const RawConfigSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT: z.coerce.number().default(100),
  DEBUG_TOKEN: z.string().optional(),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("qwen/qwen3.8-27b"),
  GROQ_FAST_MODEL: z.string().default("openai/gpt-oss-20b"),
  LLM_ENABLED: z.enum(["true", "false"]).default("true"),
  LLM_TIMEOUT_MS: z.coerce.number().default(15000),
  LLM_MAX_INPUT_CHARS: z.coerce.number().default(1500),
  LLM_DAILY_CAP: z.coerce.number().default(500),
});

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigins: string[];
  rateLimit: number;
  debugToken?: string;
  llm: {
    enabled: boolean;
    keyPresent: boolean;
    keyLength: number;
    keyPrefixOk: boolean;
    model: string;
    fastModel: string;
    timeoutMs: number;
    maxInputChars: number;
    dailyCap: number;
    envSource: string;
    apiKey?: string;
  };
}

/**
 * Lazily reads and validates environment configuration.
 * Never logs secret values.
 */
export function getConfig(overrideEnv?: Record<string, string | undefined>): AppConfig {
  if (!envLoaded && !overrideEnv) {
    initEnv();
  }

  const rawEnv = overrideEnv || process.env;

  const rawCleaned: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    const cleaned = cleanEnvValue(v);
    if (cleaned !== undefined) {
      rawCleaned[k] = cleaned;
    }
  }

  const parsed = RawConfigSchema.parse(rawCleaned);

  const apiKey = cleanEnvValue(rawCleaned.GROQ_API_KEY);
  const keyPresent = Boolean(apiKey && apiKey.length > 0);
  const keyLength = apiKey ? apiKey.length : 0;
  const keyPrefixOk = apiKey ? apiKey.startsWith("gsk_") : false;
  const llmFlagEnabled = parsed.LLM_ENABLED !== "false";
  const enabled = llmFlagEnabled && keyPresent;

  const rawCors =
    parsed.CORS_ORIGINS ||
    parsed.CORS_ORIGIN ||
    "http://localhost:3000,https://bodywise-match-x5hd.vercel.app";
  const corsOrigins = rawCors
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    port: parsed.PORT,
    host: parsed.HOST,
    nodeEnv: parsed.NODE_ENV,
    corsOrigins,
    rateLimit: parsed.RATE_LIMIT,
    debugToken: parsed.DEBUG_TOKEN,
    llm: {
      enabled,
      keyPresent,
      keyLength,
      keyPrefixOk,
      model: parsed.GROQ_MODEL,
      fastModel: parsed.GROQ_FAST_MODEL,
      timeoutMs: parsed.LLM_TIMEOUT_MS,
      maxInputChars: parsed.LLM_MAX_INPUT_CHARS,
      dailyCap: parsed.LLM_DAILY_CAP,
      envSource: detectedEnvSource,
      apiKey: apiKey || undefined,
    },
  };
}

/**
 * Startup log line:
 * "LLM: enabled (key present, model X)" or "LLM: disabled (reason: <missing key | LLM_ENABLED=false>)"
 */
export function logLlmStartup(config: AppConfig): void {
  if (config.llm.enabled) {
    console.log(`LLM: enabled (key present, model ${config.llm.model})`);
  } else {
    const reason = !config.llm.keyPresent ? "missing key" : "LLM_ENABLED=false";
    console.log(`LLM: disabled (reason: ${reason})`);
  }
}
