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
