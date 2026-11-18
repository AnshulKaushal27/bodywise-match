/**
 * Matcher Engine Configuration
 * Versioned rules and scoring weights (Pure deterministic rules, Rule 2)
 */

export const RULES_VERSION = "1.0.0";

export const MATCHER_WEIGHTS = {
  /** Exact match between user goal and product supported_goals */
  EXACT_GOAL_FIT: 3,
  /** Related goal in the same domain/category */
  RELATED_GOAL_FIT: 1,
  /** Product category matches user's targeted category */
  CATEGORY_FIT: 2,
  /** Product format matches user's format preferences */
  FORMAT_MATCH: 2,
  /** User's avoidance is explicitly verified as satisfied (e.g. fragrance_free === true) */
  AVOIDANCE_SATISFIED_VERIFIED: 2,
  /** Product is compatible with current routine context */
  ROUTINE_COMPATIBLE: 1,
} as const;

export const MATCHER_THRESHOLDS = {
  /** Minimum score required to enter the shortlist */
  MIN_SCORE_FOR_FIT: 2,
  /** Score threshold to qualify for STRONG_FORMAT_FIT / STRONG_FIT */
  STRONG_FIT_SCORE: 6,
  /** Maximum number of recommended products */
  MAX_SHORTLIST_SIZE: 3,
} as const;
