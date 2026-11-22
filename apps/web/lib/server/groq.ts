/**
 * Server-side Groq Client for Next.js App Router API Routes
 * Runs exclusively in Node.js serverless functions on Vercel or local Next.js server.
 * Uses native global fetch (zero heavy external SDKs).
 *
 * STRICT SECURITY:
 * - Reads key ONLY from process.env.GROQ_API_KEY
 * - Never prints, logs, or returns the key in any error, response, or console log
 * - Never logs prompt bodies or model outputs (Rule 8)
 */

import * as fs from "fs";
import * as path from "path";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqVisionOptions {
  imageBase64: string;
  prompt: string;
  model?: string;
  timeoutMs?: number;
}

export interface GroqCompletionOptions {
  model?: string;
  apiKey?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  timeoutMs?: number;
}

export interface GroqCompletionResult {
  content: string;
  model: string;
  latencyMs: number;
  retryAttempted: boolean;
  jsonModeUsed: boolean;
}

export class GroqClientError extends Error {
  public statusCode?: number;
  public category:
    | "timeout"
    | "groq_429"
    | "groq_5xx"
    | "groq_4xx"
    | "missing_key"
    | "invalid_response"
    | "json_parse_error";

  constructor(
    message: string,
    category: GroqClientError["category"],
    statusCode?: number
  ) {
    super(message);
    this.name = "GroqClientError";
    this.category = category;
    this.statusCode = statusCode;
  }
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b";
export const FALLBACK_GROQ_MODEL = "llama-3.3-70b-versatile";

// Daily usage state to guard against unexpected usage spikes
interface DailyUsageState {
  date: string;
  count: number;
}

let usageState: DailyUsageState = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function ensureCurrentDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (usageState.date !== today) {
    usageState = { date: today, count: 0 };
  }
}

export function canMakeLlmCall(): boolean {
  ensureCurrentDay();
  const cap = parseInt(process.env.LLM_DAILY_CAP || "500", 10);
  return usageState.count < cap;
}

export function recordLlmCall(): void {
  ensureCurrentDay();
  usageState.count += 1;
}

export function getGroqConfig() {
  let rawKey = (process.env.GROQ_API_KEY || process.env.LLM_API_KEY || "")
    .replace(/\r/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  // In non-test Node server environment and key is missing from memory, attempt reading candidate files
  if (
    process.env.NODE_ENV !== "test" &&
    !rawKey &&
    typeof process !== "undefined" &&
    typeof process.cwd === "function"
  ) {
    try {
      const cwd = process.cwd();
      const candidates = [
        path.resolve(cwd, ".env.local"),
        path.resolve(cwd, "apps/web/.env.local"),
        path.resolve(cwd, "apps/api/.env"),
        path.resolve(cwd, ".env"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          const content = fs.readFileSync(candidate, "utf-8");
          const match = content.match(/^(?:GROQ_API_KEY|LLM_API_KEY)=(.+)$/m);
          if (match && match[1]) {
            const found = match[1].replace(/\r/g, "").replace(/^["']|["']$/g, "").trim();
            if (found.length > 0) {
              rawKey = found;
              // Cache in memory for subsequent calls in current process
              process.env.GROQ_API_KEY = found;
              break;
            }
          }
        }
      }
    } catch {
      // Safe fallback
    }
  }

  const apiKey = rawKey.length > 0 ? rawKey : undefined;
  const keyPresent = Boolean(apiKey);
  const keyPrefixOk = Boolean(apiKey && apiKey.startsWith("gsk_"));
  const keyLength = apiKey ? apiKey.length : 0;
  const enabled = process.env.LLM_ENABLED !== "false" && keyPresent;
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || "15000", 10);
  const maxInputChars = parseInt(process.env.LLM_MAX_INPUT_CHARS || "1500", 10);

  return {
    apiKey,
    keyPresent,
    keyPrefixOk,
    keyLength,
    enabled,
    model,
    timeoutMs,
    maxInputChars,
  };
}

export async function callGroqChatCompletion(
  options: GroqCompletionOptions
): Promise<GroqCompletionResult> {
  const cfg = getGroqConfig();
  const apiKey = options.apiKey || cfg.apiKey;
  if (!apiKey) {
    throw new GroqClientError("GROQ_API_KEY is not configured", "missing_key");
  }

  const model = options.model || cfg.model || DEFAULT_GROQ_MODEL;
  const timeoutMs = options.timeoutMs ?? cfg.timeoutMs;
  const temperature = options.temperature ?? 0;
  const max_tokens = options.max_tokens ?? 600;
  let response_format: { type: "json_object" | "text" } | undefined =
    options.response_format ?? { type: "json_object" };

  const startTime = Date.now();
  let retryAttempted = false;
  let jsonModeUsed = Boolean(response_format && response_format.type === "json_object");

  const executeRequest = async (
    rf: { type: "json_object" | "text" } | undefined
  ): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const bodyPayload: Record<string, unknown> = {
        model,
        messages: options.messages,
        temperature,
        max_tokens,
      };
      if (rf) {
        bodyPayload.response_format = rf;
      }

      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });
      return response;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new GroqClientError(
          `Groq request timed out after ${timeoutMs}ms`,
          "timeout"
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  let response: Response;
  try {
    response = await executeRequest(response_format);
  } catch (err) {
    if (err instanceof GroqClientError) throw err;
    throw new GroqClientError("Network error during Groq completion call", "groq_5xx");
  }

  // Handle model rejecting response_format json_object
  if (response.status === 400 && response_format?.type === "json_object") {
    try {
      const errJson = (await response.clone().json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const errMsg = errJson?.error?.message?.toLowerCase() || "";
      if (errMsg.includes("response_format") || errMsg.includes("json")) {
        response_format = undefined;
        jsonModeUsed = false;
        retryAttempted = true;
        response = await executeRequest(undefined);
      }
    } catch {
      // Continue with normal error handling
    }
  }

  // One retry on 429 or 5xx with a short backoff (500ms)
  if ((response.status === 429 || response.status >= 500) && !retryAttempted) {
    retryAttempted = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      response = await executeRequest(response_format);
    } catch (retryErr) {
      if (retryErr instanceof GroqClientError) throw retryErr;
      throw new GroqClientError("Network error during retry attempt", "groq_5xx");
    }
  }

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new GroqClientError("Groq rate limit exceeded (429)", "groq_429", 429);
    }
    if (status >= 500) {
      throw new GroqClientError(`Groq server error (${status})`, "groq_5xx", status);
    }
    throw new GroqClientError(`Groq client error (${status})`, "groq_4xx", status);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
  } catch {
    throw new GroqClientError(
      "Failed to parse JSON response from Groq",
      "invalid_response",
      response.status
    );
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new GroqClientError(
      "Empty completion content received from Groq",
      "invalid_response",
      200
    );
  }

  return {
    content,
    model,
    latencyMs,
    retryAttempted,
    jsonModeUsed,
  };
}

/**
 * Diagnostic utility for testing Groq connectivity in Next.js API routes.
 * Safely tests key validity without ever leaking key material.
 */
export async function testGroqDebug(): Promise<{
  keyPresent: boolean;
  keyLength: number;
  keyPrefixOk: boolean;
  model: string;
  llmEnabled: boolean;
  httpStatus: number | null;
  latencyMs: number;
  jsonModeOk: boolean;
  errorCategory: string | null;
}> {
  const cfg = getGroqConfig();

  if (!cfg.keyPresent || !cfg.apiKey) {
    return {
      keyPresent: false,
      keyLength: 0,
      keyPrefixOk: false,
      model: cfg.model,
      llmEnabled: cfg.enabled,
      httpStatus: null,
      latencyMs: 0,
      jsonModeOk: false,
      errorCategory: "missing_key",
    };
  }

  const startTime = Date.now();
  try {
    const result = await callGroqChatCompletion({
      messages: [
        {
          role: "system",
          content: 'Output JSON only: {"status":"healthy"}',
        },
        { role: "user", content: "ping" },
      ],
      temperature: 0,
      max_tokens: 30,
      response_format: { type: "json_object" },
      timeoutMs: 8000,
    });

    let jsonModeOk = false;
    try {
      const parsed = JSON.parse(result.content);
      jsonModeOk = parsed.status === "healthy";
    } catch {
      jsonModeOk = false;
    }

    return {
      keyPresent: true,
      keyLength: cfg.keyLength,
      keyPrefixOk: cfg.keyPrefixOk,
      model: result.model,
      llmEnabled: cfg.enabled,
      httpStatus: 200,
      latencyMs: result.latencyMs,
      jsonModeOk,
      errorCategory: null,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    if (err instanceof GroqClientError) {
      return {
        keyPresent: true,
        keyLength: cfg.keyLength,
        keyPrefixOk: cfg.keyPrefixOk,
        model: cfg.model,
        llmEnabled: cfg.enabled,
        httpStatus: err.statusCode || null,
        latencyMs,
        jsonModeOk: false,
        errorCategory: err.category,
      };
    }

    return {
      keyPresent: true,
      keyLength: cfg.keyLength,
      keyPrefixOk: cfg.keyPrefixOk,
      model: cfg.model,
      llmEnabled: cfg.enabled,
      httpStatus: null,
      latencyMs,
      jsonModeOk: false,
      errorCategory: "unknown_error",
    };
  }
}

/**
 * Multimodal Vision Completion for Groq Vision models.
 * Used for packaging analysis in Visual Product Camera.
 */
export async function callGroqVisionCompletion(
  options: GroqVisionOptions
): Promise<GroqCompletionResult> {
  const cfg = getGroqConfig();
  if (!cfg.apiKey) {
    throw new GroqClientError("GROQ_API_KEY is not configured", "missing_key");
  }

  // Ensure data URL prefix is valid
  let formattedUrl = options.imageBase64.trim();
  if (!formattedUrl.startsWith("data:image/")) {
    formattedUrl = `data:image/jpeg;base64,${formattedUrl}`;
  }

  const model = options.model || "qwen/qwen3.8-27b";
  const timeoutMs = options.timeoutMs ?? 20000;
  const startTime = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: options.prompt },
              { type: "image_url", image_url: { url: formattedUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new GroqClientError("Groq rate limit exceeded (429)", "groq_429", 429);
      }
      throw new GroqClientError(`Groq vision error (${status})`, "groq_4xx", status);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new GroqClientError("Empty response from Groq vision", "invalid_response", 200);
    }

    return {
      content,
      model,
      latencyMs: Date.now() - startTime,
      retryAttempted: false,
      jsonModeUsed: false,
    };
  } catch (err: unknown) {
    if (err instanceof GroqClientError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GroqClientError(`Groq vision timed out after ${timeoutMs}ms`, "timeout");
    }
    throw new GroqClientError("Network error during vision call", "groq_5xx");
  } finally {
    clearTimeout(timer);
  }
}

