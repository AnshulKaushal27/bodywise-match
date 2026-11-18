/**
 * Lightweight Groq API Client for Bodywise Match
 * Uses standard Node.js global fetch (zero heavy external SDKs).
 * Communicates with Groq's OpenAI-compatible chat completions endpoint.
 *
 * STRICT SECURITY:
 * - Reads key ONLY from process.env.GROQ_API_KEY (apps/api only, never client-side)
 * - Never prints, logs, or returns the key in any error or response
 * - Never logs prompt bodies or model outputs
 */

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqCompletionOptions {
  model?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  timeoutMs?: number;
  allowJsonFallback?: boolean;
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

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const DEFAULT_GROQ_FAST_MODEL =
  process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant";

export async function callGroqChatCompletion(
  options: GroqCompletionOptions
): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new GroqClientError("GROQ_API_KEY is not configured", "missing_key");
  }

  const model = options.model || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  // 15s timeout default to prevent cold start drops (Task A.2.d)
  const timeoutMs =
    options.timeoutMs ??
    parseInt(process.env.LLM_TIMEOUT_MS || "15000", 10);
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

  // Handle model rejecting response_format json_object (Task A.2.c)
  if (response.status === 400 && response_format?.type === "json_object") {
    try {
      const errJson = (await response.clone().json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const errMsg = errJson?.error?.message?.toLowerCase() || "";
      if (errMsg.includes("response_format") || errMsg.includes("json")) {
        // Fall back to prompt-enforced JSON without response_format
        response_format = undefined;
        jsonModeUsed = false;
        retryAttempted = true;
        response = await executeRequest(undefined);
      }
    } catch {
      // Continue with normal error handling
    }
  }

  // Exactly one retry on 429 (Rate Limit) or 5xx with a short backoff (500ms)
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
 * Diagnostic utility for GET /v1/debug/llm (Task A.1)
 * Performs one tiny call and returns strict non-sensitive metadata only.
 */
export async function testLlmDebug(): Promise<{
  keyPresent: boolean;
  model: string;
  httpStatus: number | null;
  latencyMs: number;
  jsonModeOk: boolean;
  errorCategory: string | null;
}> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  if (!apiKey) {
    return {
      keyPresent: false,
      model,
      httpStatus: null,
      latencyMs: 0,
      jsonModeOk: false,
      errorCategory: "missing_key",
    };
  }

  const startTime = Date.now();
  try {
    const result = await callGroqChatCompletion({
      model,
      messages: [
        {
          role: "user",
          content: 'Return strictly valid JSON: {"ping": "pong"}',
        },
      ],
      max_tokens: 25,
      temperature: 0,
      response_format: { type: "json_object" },
      timeoutMs: 15000,
    });

    const parsed = JSON.parse(result.content);
    const jsonModeOk = typeof parsed === "object" && parsed !== null;

    return {
      keyPresent: true,
      model: result.model,
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
        model,
        httpStatus: err.statusCode || null,
        latencyMs,
        jsonModeOk: false,
        errorCategory: err.category,
      };
    }
    return {
      keyPresent: true,
      model,
      httpStatus: null,
      latencyMs,
      jsonModeOk: false,
      errorCategory: "unknown_error",
    };
  }
}
