/**
 * Evidence Consistency Guard & State Validator
 * Section B.4 & B.5 of Bodywise Match Guardrails.
 *
 * 1. Evidence Consistency Guard: Re-runs category detection on evidence text.
 *    Rejects patches where the slot value contradicts its own evidence (e.g., face_wash with "body wash").
 * 2. State Validator: Detects and repairs impossible combinations (area vs category conflict,
 *    duplicate needs, orphan evidence).
 */

import { MatchSessionState, SessionSlots, SessionEvent } from "./types";
import { detectExplicitCategories, CatalogueCategoryId } from "../data/categories";
import { isAreaConflictingWithCategory, getImplicationsForCategory } from "../data/categoryMap";

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  reason?: string;
  correctedValue?: unknown;
}

/**
 * Checks if a proposed slot value is consistent with its cited evidence text.
 */
export function checkEvidenceConsistency(
  slotKey: string,
  value: unknown,
  evidenceText: string | null | undefined
): ConsistencyCheckResult {
  if (!evidenceText || typeof evidenceText !== "string" || !evidenceText.trim()) {
    return { isConsistent: true };
  }

  // 1. Category / Product Type Evidence Guard
  if (slotKey === "product_type" || slotKey === "category") {
    if (!value || typeof value !== "string") {
      return { isConsistent: true };
    }

    const detected = detectExplicitCategories(evidenceText);
    if (detected.length > 0) {
      const matchingDetected = detected.find((d) => d.categoryId === value);
      if (!matchingDetected) {
        return {
          isConsistent: false,
          reason: `Evidence text "${evidenceText}" indicates category "${detected[0].categoryId}", conflicting with proposed value "${value}".`,
          correctedValue: detected[0].categoryId,
        };
      }
    }
  }

  // 2. Body Area Evidence Guard
  if (slotKey === "body_area") {
    if (value === "body" && /\b(face|chehra|muh|facial)\b/i.test(evidenceText)) {
      return {
        isConsistent: false,
        reason: `Evidence text "${evidenceText}" indicates face, conflicting with body area "body".`,
      };
    }
    if (value === "face" && /\b(body|badan|back|pith|legs|arms)\b/i.test(evidenceText)) {
      return {
        isConsistent: false,
        reason: `Evidence text "${evidenceText}" indicates body, conflicting with face area "face".`,
      };
    }
  }

  return { isConsistent: true };
}

/**
 * Validates the entire session state and repairs impossible combinations.
 * Priority Rules:
 * 1. An explicit category ALWAYS beats an inferred or conflicting area.
 * 2. Implied slots are automatically derived with source: 'derived'.
 * 3. Duplicate needs are deduplicated.
 * 4. Orphan evidence on empty slots is cleared.
 */
export function validateState(state: MatchSessionState): {
  state: MatchSessionState;
  repaired: boolean;
  repairEvents: SessionEvent[];
} {
  let hasRepairs = false;
  const repairEvents: SessionEvent[] = [];
  const slots: SessionSlots = { ...state.slots };

  // 1. Deduplicate needs
  const seenConcepts = new Set<string>();
  const uniqueNeeds = [];
  for (const need of slots.needs) {
    if (need.concept_id) {
      if (!seenConcepts.has(need.concept_id)) {
        seenConcepts.add(need.concept_id);
        uniqueNeeds.push(need);
      } else {
        hasRepairs = true;
        repairEvents.push({
          type: "STATE_REPAIRED",
          timestamp: Date.now(),
          repairReason: `Removed duplicate need for concept "${need.concept_id}".`,
        });
      }
    } else {
      uniqueNeeds.push(need);
    }
  }
  slots.needs = uniqueNeeds;

  // 2. Area vs Category Conflict Resolution
  const categoryVal = slots.product_type.value as CatalogueCategoryId | null;
  const areaVal = slots.body_area.value;

  if (categoryVal) {
    const implications = getImplicationsForCategory(categoryVal);

    if (areaVal && isAreaConflictingWithCategory(categoryVal, areaVal)) {
      // Explicit category beats inferred area!
      hasRepairs = true;
      const repairedArea = implications?.derivedBodyArea || null;
      slots.body_area = {
        ...slots.body_area,
        value: repairedArea,
        source: "derived",
        status: repairedArea ? "confirmed" : "unknown",
        evidence_text: null,
      };
      repairEvents.push({
        type: "STATE_REPAIRED",
        timestamp: Date.now(),
        repairReason: `Resolved area conflict: Category "${categoryVal}" does not allow area "${areaVal}". Repaired to "${repairedArea}".`,
      });
    } else if (!areaVal && implications?.derivedBodyArea) {
      // Automatically derive implied body area
      slots.body_area = {
        ...slots.body_area,
        value: implications.derivedBodyArea,
        source: "derived",
        status: "confirmed",
        evidence_text: null,
      };
    }
  }

  // 3. Clear orphan evidence on empty slots
  const slotKeys: Array<Exclude<keyof SessionSlots, "needs">> = [
    "product_type",
    "body_area",
    "time_of_day",
    "frequency",
    "format",
    "fragrance_pref",
    "avoidances",
  ];

  for (const k of slotKeys) {
    const slot = slots[k];
    if (
      slot &&
      (slot.value === null || (Array.isArray(slot.value) && slot.value.length === 0)) &&
      slot.evidence_text !== null
    ) {
      hasRepairs = true;
      (slots as unknown as Record<string, unknown>)[k] = {
        ...slot,
        evidence_text: null,
      };
      repairEvents.push({
        type: "STATE_REPAIRED",
        timestamp: Date.now(),
        repairReason: `Cleared orphan evidence on empty slot "${k}".`,
      });
    }
  }

  const updatedState: MatchSessionState = {
    ...state,
    slots,
    eventLog: hasRepairs ? [...state.eventLog, ...repairEvents] : state.eventLog,
  };

  return {
    state: updatedState,
    repaired: hasRepairs,
    repairEvents,
  };
}
