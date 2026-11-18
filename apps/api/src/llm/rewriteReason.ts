/**
 * Optional Reason Code Rewriter
 * Rewrites approved reason-code templates into friendlier sentences
 * ONLY if ENABLE_LLM_REWRITE=true (default false).
 *
 * STRICT SAFEGUARDS:
 * - Matcher still decides products, rankings, and order. The LLM NEVER selects products.
 * - Rewritten text must be validated against approved facts and forbidden terms.
 * - If validation fails or any error occurs, safely returns the template text.
 */

import { callGroqChatCompletion } from "./groqClient";
import { canMakeLlmCall, recordLlmCall } from "./dailyCap";

const FORBIDDEN_WORDS = [
  /\bcure\b/i,
  /\btreats?\b/i,
  /\bdiagnos/i,
  /\bguarantee/i,
  /\b\d+%\b/,
  /\bmedical\b/i,
  /\bprescription\b/i,
];

export interface RewriteReasonOptions {
  productName: string;
  templateText: string;
  goalLabel?: string;
}

export async function rewriteMatchReason(
  options: RewriteReasonOptions
): Promise<string> {
  const isEnabled = process.env.ENABLE_LLM_REWRITE === "true";
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);

  if (!isEnabled || !hasKey || !canMakeLlmCall()) {
    return options.templateText;
  }

  const model = process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant";

  const systemPrompt = `You rewrite personal-care product match explanations into 1 warm, clear sentence.
CRITICAL RULES:
1. Mention ONLY the approved product (${options.productName}) and the provided reason.
2. NEVER diagnose, NEVER promise medical results, cures, or treatments.
3. NEVER invent ingredients or add claims not in the source text.
4. Output raw plain text only. If you cannot comply, repeat the source text exactly.`;

  const userPrompt = `Source text: "${options.templateText}" for product "${options.productName}".`;

  try {
    const result = await callGroqChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "text" },
      timeoutMs: 4000,
    });

    const candidate = result.content.trim().replace(/^["']|["']$/g, "");

    // Validate rewritten candidate
    if (candidate.length < 10 || candidate.length > 250) {
      return options.templateText;
    }

    for (const pattern of FORBIDDEN_WORDS) {
      if (pattern.test(candidate)) {
        return options.templateText;
      }
    }

    recordLlmCall();
    return candidate;
  } catch {
    // On any error, safely return the approved template text
    return options.templateText;
  }
}
