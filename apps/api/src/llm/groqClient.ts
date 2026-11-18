/**
 * Lightweight Groq API Client for Bodywise Match
 * Uses standard Node.js global fetch (zero heavy external SDKs).
 * Communicates with Groq's OpenAI-compatible chat completions endpoint.
 *
 * STRICT SECURITY:
 * - Reads key ONLY from process.env.GROQ_API_KEY
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
}

export interface GroqCompletionResult {
  content: string;
  model: string;
  latencyMs: number;
  retryAttempted: boolean;
}

export class GroqClientError extends Error {
  public statusCode?: number;
  public category: "timeout" | "groq_429" | "groq_5xx" | "groq_4xx" | "missing_key" | "invalid_response";

  constructor(message: string, category: GroqClientError["category"], statusCode?: number) {
    super(message);
    this.name = "GroqClientError";
    this.category = category;
    this.statusCode = statusCode;
  }
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroqChatCompletion(
  options: GroqCompletionOptions
): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new GroqClientError("GROQ_API_KEY is not configured", "missing_key");
  }

  const model = options.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const timeoutMs = options.timeoutMs ?? parseInt(process.env.LLM_TIMEOUT_MS || "8000", 10);
  const temperature = options.temperature ?? 0;
  const max_tokens = options.max_tokens ?? 500;
  const response_format = options.response_format ?? { type: "json_object" };

  const startTime = Date.now();
  let retryAttempted = false;

  const executeRequest = async (_isRetry: boolean): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature,
          max_tokens,
          response_format,
        }),
        signal: controller.signal,
      });
      return response;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new GroqClientError(`Groq request timed out after ${timeoutMs}ms`, "timeout");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  let response: Response;
  try {
    response = await executeRequest(false);
  } catch (err) {
    if (err instanceof GroqClientError) throw err;
    throw new GroqClientError("Network error during Groq completion call", "groq_5xx");
  }

  // Exactly one retry on 429 (Rate Limit) or 5xx (Server Error) with a short backoff (500ms)
  if ((response.status === 429 || response.status >= 500) && !retryAttempted) {
    retryAttempted = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      response = await executeRequest(true);
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
    data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  } catch {
    throw new GroqClientError("Failed to parse JSON response from Groq", "invalid_response", response.status);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new GroqClientError("Empty completion content received from Groq", "invalid_response", 200);
  }

  return {
    content,
    model,
    latencyMs,
    retryAttempted,
  };
}
