/**
 * Matcher Engine Configuration
 * Versioned rules and scoring weights (Pure deterministic rules, Rule 2)
 * Rules Version 3.0.0 (Priority Hierarchy, Hard Category Filter & Single Shared Computation)
 */

export const RULES_VERSION = "3.0.0";

/**
 * Question Selector Facet Weights (Section E)
 * Tier 1: Category 1.0 (asked only if unknown)
 * Tier 2: Benefit / sub-concept 0.9
 * Tier 3: Area & Time-of-day 0.5, Format 0.4 (skipped if implied), Fragrance 0.3
 */
export const QUESTION_FACET_WEIGHTS = {
  category: 1.0,
  product_type: 1.0,
  benefit: 0.9,
  need_confirm: 0.9,
  body_area: 0.5,
  time_of_day: 0.5,
  format: 0.4,
  fragrance: 0.3,
  fragrance_pref: 0.3,
  frequency: 0.3,
  avoidances: 0.3,
} as const;

export const MATCHER_WEIGHTS = {
  /** Concept evidence match from official catalogue text (Tier 2 Benefit) */
  CONCEPT_EVIDENCE_MATCH: 50,
  /** Product category matches user's preferred category (Tier 1 is hard filter; ranking bonus when multiple) */
  CATEGORY_FIT: 30,
  /** Product format matches user's format preferences (Tier 3) */
  FORMAT_MATCH: 15,
  /** Retrieval score bonus (bounded between 0 and 10) */
  RETRIEVAL_BONUS_MAX: 10,
  /** Exact match between user goal and product supported_goals */
  EXACT_GOAL_FIT: 50,
  /** Related goal in the same domain/category */
  RELATED_GOAL_FIT: 20,
  /** User's avoidance is explicitly verified as satisfied (e.g. fragrance_free === true) */
  AVOIDANCE_SATISFIED_VERIFIED: 10,
  /** Product is compatible with current routine context (Tier 3) */
  ROUTINE_COMPATIBLE: 5,
  /** Routine context time of day match */
  TIME_OF_DAY_MATCH: 5,
} as const;

export const MATCHER_THRESHOLDS = {
  /** Minimum score required to enter the shortlist */
  MIN_SCORE_FOR_FIT: 2,
  /** Score threshold to qualify for STRONG_FORMAT_FIT / STRONG_FIT */
  STRONG_FIT_SCORE: 6,
  /** Maximum number of recommended products per need */
  MAX_SHORTLIST_SIZE: 3,
} as const;
