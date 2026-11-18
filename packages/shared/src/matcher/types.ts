import { z } from "zod";
import { ProductCategorySchema } from "../product";
import { GoalIdSchema } from "../goals";

export const MatchLabelSchema = z.enum([
  "STRONG_FORMAT_FIT",
  "GOAL_FIT",
  "PARTIAL_FIT",
  "ROUTINE_FIT",
  "CAUTIONARY_FIT",
]);

export type MatchLabel = z.infer<typeof MatchLabelSchema>;

export const MatcherReasonCodeSchema = z.enum([
  "EXACT_GOAL_MATCH",
  "RELATED_GOAL_MATCH",
  "CATEGORY_FIT",
  "FORMAT_PREFERENCE_MET",
  "AVOIDANCE_SATISFIED_VERIFIED",
  "UNVERIFIED_AVOIDANCE",
  "ROUTINE_COMPATIBLE",
  "MISSING_FACTS_NOTED",
  "CAUTION_APPLIED",
  "CONCEPT_EVIDENCE_MATCH",
]);

export type MatcherReasonCode = z.infer<typeof MatcherReasonCodeSchema>;

export const RoutineContextSchema = z
  .object({
    frequency: z.string().optional(),
    current_actives: z.array(z.string()).optional(),
    shower_timing: z.string().optional(),
    notes: z.string().optional(),
  })
  .or(z.string())
  .nullable()
  .optional();

export type RoutineContext = z.infer<typeof RoutineContextSchema>;

// --- Legacy Single-Goal Schema (for backward compatibility) ---
export const ParsedNeedsSchema = z.object({
  goal: GoalIdSchema.or(z.string()).nullable(),
  category: ProductCategorySchema.or(z.string()).nullable().optional(),
  format_preferences: z.array(z.string()).default([]),
  avoidances: z.array(z.string()).default([]),
  routine_context: RoutineContextSchema.default(null),
  uncertainties: z.array(z.string()).default([]),
  confidence: z.enum(["low", "medium", "high"]),
  evidence_text: z.record(z.string(), z.string()).optional(),
});

export type ParsedNeeds = z.infer<typeof ParsedNeedsSchema>;

// --- Multi-Need Schemas (Task Part D) ---
export const ParsedNeedSchema = z.object({
  id: z.string(), // e.g. "need_1", "need_2"
  phrase_from_user: z.string(),
  concepts: z.array(z.string()), // ConceptId[]
  preferred_category: ProductCategorySchema.nullable().default(null),
  format_preferences: z.array(z.string()).default([]),
  priority: z.enum(["primary", "secondary"]).default("primary"),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  normalised_label: z.string().optional(),
});

export type ParsedNeed = z.infer<typeof ParsedNeedSchema>;

export const ParsedRequestSchema = z.object({
  needs: z.array(ParsedNeedSchema),
  avoidances: z.array(z.string()).default([]),
  routine_context: z.string().nullable().default(null),
  uncertainties: z.array(z.string()).default([]),
  follow_up_question: z.string().nullable().default(null),
  medical_flag: z.boolean().default(false),
});

export type ParsedRequest = z.infer<typeof ParsedRequestSchema>;

export const RecommendationSchema = z.object({
  productId: z.string().uuid(),
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reasonCodes: z.array(MatcherReasonCodeSchema),
  matchLabel: MatchLabelSchema,
  considerIf: z.array(z.string()),
  mayNotFitIf: z.array(z.string()),
  matchedFields: z.array(z.string()),
  missingFacts: z.array(z.string()),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export interface NeedRecommendation extends Recommendation {
  evidenceSnippets: string[];
  whyHere: string;
  sourceTag: string;
  productName?: string;
  productSlug?: string;
  category?: string;
  format?: string;
  priceInr?: number | null;
  fragranceFree?: boolean;
}

export interface NeedMatchGroup {
  needId: string;
  needLabel: string;
  rawPhrase: string;
  category: string | null;
  status: "MATCHED" | "NO_FIT";
  noFitReason?: string;
  recommendations: NeedRecommendation[];
}

export interface MultiNeedMatchResult {
  status: "MATCHES_FOUND" | "NO_FIT";
  rules_version: "2.0.0";
  medical_flag: boolean;
  medical_caution?: string;
  groups: NeedMatchGroup[];
  total_evaluated: number;
}

export type MatchResult =
  | {
      status: "MATCHES_FOUND";
      rules_version: string;
      shortlist: Recommendation[];
      total_evaluated: number;
    }
  | {
      status: "NO_FIT";
      rules_version: string;
      suggestion: "BROWSE_CATALOGUE";
      reason: string;
      total_evaluated: number;
    };
