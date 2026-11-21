import { z } from "zod";

// Controlled vocabulary & Product Schemas
export * from "./goals";
export * from "./product";
export * from "./data/catalogue.seed";
export * from "./experience";
export * from "./data/experiences.seed";
export * from "./data/support-links";
export * from "./help";
export * from "./matcher/index";
export * from "./matcher/next-question";
export * from "./parser/strategy-a";
export * from "./retrieval/index";
export * from "./data/knowledge.seed";
export * from "./filters";
export * from "./families/index";
export * from "./matcher/facet-selector";
export * from "./matcher/preview";
export * from "./data/synonyms.hinglish";
export * from "./data/typeMap";
export * from "./matchSession/index";
export * from "./questions/selectNext";
export * from "./parser/tolerant-parser";
export * from "./parser/rules-patcher";
export * from "./data/categories";
export * from "./data/categoryMap";
export * from "./matchSession/guard";
export * from "./matcher/shortlist";
export * from "./knowledge/index";

// --- Fact Verification Provenance (Rule 3) ---
export const VerificationProvenanceSchema = z.object({
  source: z.string().nullable(),
  last_verified_at: z.string().nullable(),
});

export type VerificationProvenance = z.infer<typeof VerificationProvenanceSchema>;

// --- Match Request (Core Flow) ---
import { ParsedNeedsSchema } from "./matcher/types";

export const MatchRequestSchema = z.object({
  user_input: z.string().min(3),
  parsed_needs: ParsedNeedsSchema.optional(),
  clarification_answer: z.string().optional(),
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;

// --- Feedback ---
export const FeedbackSchema = z
  .object({
    request_id: z.string().optional(),
    session_id: z.string().optional(),
    helpful: z.boolean().optional(),
    rating: z.enum(["yes", "somewhat", "no"]).or(z.string()).optional(),
    rating_clarity: z.number().int().min(1).max(5).optional(),
    chosen_product_slug: z.string().optional(),
    feedback_category: z
      .enum([
        "match_relevance",
        "clarity",
        "missing_product",
        "safety_concern",
        "other",
      ])
      .optional(),
    reason: z.string().optional(),
    notes: z.string().max(500).optional(),
    aggregate_consent: z.boolean().default(false),
  })
  .refine((data) => Boolean(data.request_id || data.session_id), {
    message: "Either request_id or session_id must be provided",
  });

export type Feedback = z.infer<typeof FeedbackSchema>;
