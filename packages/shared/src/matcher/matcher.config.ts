/**
 * Matcher Engine Configuration
 * Versioned rules and scoring weights (Pure deterministic rules, Rule 2)
 * Rules Version 2.0.0 (Multi-Need RAG & Deterministic Ranking)
 */

export const RULES_VERSION = "2.0.0";

export const MATCHER_WEIGHTS = {
  /** Concept evidence match from official catalogue text (highest priority) */
  CONCEPT_EVIDENCE_MATCH: 50,
  /** Product category matches user's preferred category */
  CATEGORY_FIT: 25,
  /** Product format matches user's format preferences */
  FORMAT_MATCH: 15,
  /** Retrieval score bonus (bounded between 0 and 10) */
  RETRIEVAL_BONUS_MAX: 10,
  /** Exact match between user goal and product supported_goals */
  EXACT_GOAL_FIT: 10,
  /** Related goal in the same domain/category */
  RELATED_GOAL_FIT: 5,
  /** User's avoidance is explicitly verified as satisfied (e.g. fragrance_free === true) */
  AVOIDANCE_SATISFIED_VERIFIED: 10,
  /** Product is compatible with current routine context */
  ROUTINE_COMPATIBLE: 5,
} as const;

export const MATCHER_THRESHOLDS = {
  /** Minimum score required to enter the shortlist */
  MIN_SCORE_FOR_FIT: 2,
  /** Score threshold to qualify for STRONG_FORMAT_FIT / STRONG_FIT */
  STRONG_FIT_SCORE: 6,
  /** Maximum number of recommended products per need */
  MAX_SHORTLIST_SIZE: 3,
} as const;
