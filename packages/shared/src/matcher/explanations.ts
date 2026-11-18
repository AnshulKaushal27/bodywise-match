/**
 * Deterministic Explanation Templates
 * Non-diagnostic, non-curative explanations rendered directly by the UI (Rule 1 & Rule 2).
 */

import { MatcherReasonCode } from "./types";

export interface ExplanationContext {
  goal?: string;
  category?: string;
  format?: string;
  avoidance?: string;
  caution?: string;
}

export const EXPLANATION_TEMPLATES: Record<
  MatcherReasonCode,
  (ctx?: ExplanationContext) => string
> = {
  EXACT_GOAL_MATCH: (ctx) =>
    ctx?.goal
      ? `May be relevant to your stated goal for ${ctx.goal} based on official product specifications.`
      : "May be relevant to your primary stated goal based on declared product functions.",

  RELATED_GOAL_MATCH: (ctx) =>
    ctx?.goal
      ? `Supports complementary skin or scalp aspects related to ${ctx.goal}.`
      : "Supports complementary aspects related to your stated goal.",

  CATEGORY_FIT: (ctx) =>
    ctx?.category
      ? `Appears in your shortlist because it belongs to your requested ${ctx.category} category.`
      : "Appears in your shortlist because it aligns with your preferred product category.",

  FORMAT_PREFERENCE_MET: (ctx) =>
    ctx?.format
      ? `Matches your format preference for a ${ctx.format} formulation.`
      : "Matches your preferred product format and application style.",

  AVOIDANCE_SATISFIED_VERIFIED: (ctx) =>
    ctx?.avoidance
      ? `Verified to exclude ${ctx.avoidance} according to official label specifications.`
      : "Verified to satisfy your declared ingredient avoidance preferences.",

  UNVERIFIED_AVOIDANCE: (ctx) =>
    ctx?.avoidance
      ? `We couldn't verify whether this formulation excludes ${ctx.avoidance}. Check physical packaging before applying.`
      : "We couldn't verify this avoidance against official records. Please check physical packaging.",

  ROUTINE_COMPATIBLE: () =>
    "Designed for routine layering without obvious active ingredient overlap or known friction.",

  MISSING_FACTS_NOTED: () =>
    "Some product attributes remain unverified in the current catalogue version.",

  CONCEPT_EVIDENCE_MATCH: (ctx) =>
    ctx?.goal
      ? `Matches evidence for ${ctx.goal} documented directly in official product label specifications.`
      : "Matches verified evidence documented directly in official product label specifications.",

  CAUTION_APPLIED: (ctx) =>
    ctx?.caution
      ? `Label caution: ${ctx.caution}`
      : "Official label cautions apply; patch test before full application.",
};

export function getReasonExplanation(
  code: MatcherReasonCode,
  ctx?: ExplanationContext
): string {
  const templateFn = EXPLANATION_TEMPLATES[code];
  if (!templateFn) {
    return "Here is why this appears in your shortlist.";
  }
  return templateFn(ctx);
}
