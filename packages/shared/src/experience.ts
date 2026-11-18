import { z } from "zod";

export const DurationBucketSchema = z.enum([
  "<2 weeks",
  "2-4 weeks",
  "1-3 months",
  "3+ months",
]);
export type DurationBucket = z.infer<typeof DurationBucketSchema>;

export const UsageConsistencySchema = z.enum([
  "daily",
  "few times a week",
  "occasionally",
]);
export type UsageConsistency = z.infer<typeof UsageConsistencySchema>;

export const SelfReportedOutcomeSchema = z.enum([
  "better",
  "no change",
  "worse",
  "not sure",
]);
export type SelfReportedOutcome = z.infer<typeof SelfReportedOutcomeSchema>;

export const ComfortReactionSchema = z.enum([
  "no issue",
  "mild irritation",
  "stopped using",
]);
export type ComfortReaction = z.infer<typeof ComfortReactionSchema>;

export const ModerationStatusSchema = z.enum([
  "published",
  "pending",
  "rejected",
]);
export type ModerationStatus = z.infer<typeof ModerationStatusSchema>;

export const CustomerExperienceRecordSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  product_slug: z.string(),
  duration_bucket: DurationBucketSchema,
  usage_consistency: UsageConsistencySchema,
  self_reported_outcome: SelfReportedOutcomeSchema,
  comfort_reaction: ComfortReactionSchema,
  moderated_text: z.string().nullable(),
  moderation_status: ModerationStatusSchema,
  publication_consent: z.boolean(),
  recommendation_consent: z.boolean().optional(),
  created_at: z.string(),
  source: z.string(),
  is_demo: z.boolean().default(true),
});
export type CustomerExperienceRecord = z.infer<typeof CustomerExperienceRecordSchema>;

export const ExperienceSubmissionSchema = z.object({
  product_slug: z.string().min(1, "Product slug is required"),
  product_id: z.string().optional(),
  duration_bucket: DurationBucketSchema,
  usage_consistency: UsageConsistencySchema,
  self_reported_outcome: SelfReportedOutcomeSchema,
  comfort_reaction: ComfortReactionSchema,
  optional_text: z.string().max(300, "Maximum 300 characters allowed").optional().nullable(),
  consent_recommendations: z.boolean().default(false),
  consent_publication: z.boolean().default(false),
});
export type ExperienceSubmission = z.infer<typeof ExperienceSubmissionSchema>;
