/**
 * Pure Selectors for MatchSessionState
 */

import { MatchSessionState, Slot, SessionNeed, SlotStatus } from "./types";
import { formatCategoryLabel } from "../data/categories";

export interface ChipProvenance {
  slotKey: string;
  label: string;
  value: string;
  status: SlotStatus;
  provenanceText: string;
  canRemove: boolean;
  isGuessed: boolean;
}

export function formatAreaLabel(area: string | null | undefined): string {
  if (!area) return "Any";
  switch (area.toLowerCase()) {
    case "face":
      return "Face";
    case "body":
      return "Body";
    case "scalp":
      return "Scalp";
    case "hair":
      return "Hair";
    case "underarm":
    case "underarms":
      return "Underarm";
    default:
      return area.charAt(0).toUpperCase() + area.slice(1);
  }
}

export function formatFormatLabel(format: string | null | undefined): string {
  if (!format) return "Any";
  return format
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function selectIsQuestionCapReached(state: MatchSessionState, maxQuestions = 3): boolean {
  return state.questionCount >= maxQuestions;
}

export function selectConfirmedNeeds(state: MatchSessionState): SessionNeed[] {
  return state.slots.needs.filter((n) => n.status === "confirmed");
}

export function selectAnsweredFacetMap(state: MatchSessionState): Record<string, string> {
  const map: Record<string, string> = {};
  const { slots } = state;

  if (slots.product_type.value && slots.product_type.status === "confirmed") {
    map["product_type"] = slots.product_type.value;
  }
  if (slots.body_area.value && slots.body_area.status === "confirmed") {
    map["body_area"] = slots.body_area.value;
  }
  if (slots.time_of_day.value && slots.time_of_day.status === "confirmed") {
    map["time_of_day"] = slots.time_of_day.value;
  }
  if (slots.frequency.value && slots.frequency.status === "confirmed") {
    map["frequency"] = slots.frequency.value;
  }
  if (slots.format.value && slots.format.status === "confirmed") {
    map["format"] = slots.format.value;
  }
  if (slots.fragrance_pref.value && slots.fragrance_pref.status === "confirmed") {
    map["fragrance_pref"] = slots.fragrance_pref.value;
  }
  return map;
}

export function getProvenanceLabel(slot: Slot<unknown>): string {
  if (slot.source === "derived") {
    return "Derived from category";
  }
  if (slot.status === "guessed") {
    return "Guessed, please check";
  }
  if (slot.source === "user_text" && slot.evidence_text) {
    return `From your words: "${slot.evidence_text}"`;
  }
  if (slot.source === "question" || slot.source === "chip_edit") {
    return "You chose this";
  }
  if (slot.source === "chat") {
    return slot.evidence_text ? `From chat: "${slot.evidence_text}"` : "From chat";
  }
  return "Selected";
}

export function selectAllChipsWithProvenance(state: MatchSessionState): ChipProvenance[] {
  const chips: ChipProvenance[] = [];
  const { slots } = state;

  // 1. Category (Highest Priority)
  if (slots.product_type.value) {
    chips.push({
      slotKey: "product_type",
      label: "Category",
      value: formatCategoryLabel(slots.product_type.value),
      status: slots.product_type.status,
      provenanceText: getProvenanceLabel(slots.product_type),
      canRemove: true,
      isGuessed: slots.product_type.status === "guessed",
    });
  }

  // 2. Needs / Concerns
  for (const need of slots.needs) {
    chips.push({
      slotKey: `need_${need.id}`,
      label: "Concern",
      value: need.normalised_label || need.phrase_from_user,
      status: need.status,
      provenanceText: need.status === "guessed"
        ? "Guessed, please check"
        : need.evidence_text
        ? `From your words: "${need.evidence_text}"`
        : "You chose this",
      canRemove: true,
      isGuessed: need.status === "guessed",
    });
  }

  // 3. Body Area (Hidden when derived from category!)
  if (slots.body_area.value && slots.body_area.source !== "derived") {
    chips.push({
      slotKey: "body_area",
      label: "Area",
      value: formatAreaLabel(slots.body_area.value),
      status: slots.body_area.status,
      provenanceText: getProvenanceLabel(slots.body_area),
      canRemove: true,
      isGuessed: slots.body_area.status === "guessed",
    });
  }

  // 4. Time of Day
  if (slots.time_of_day.value && slots.time_of_day.value !== "any") {
    const tod = slots.time_of_day.value;
    const formattedTod = tod === "morning" ? "Morning" : tod === "night" ? "Evening" : "Day & night";
    chips.push({
      slotKey: "time_of_day",
      label: "Time",
      value: formattedTod,
      status: slots.time_of_day.status,
      provenanceText: getProvenanceLabel(slots.time_of_day),
      canRemove: true,
      isGuessed: slots.time_of_day.status === "guessed",
    });
  }

  // 5. Frequency
  if (slots.frequency.value && slots.frequency.value !== "any") {
    chips.push({
      slotKey: "frequency",
      label: "Frequency",
      value: slots.frequency.value === "daily" ? "Daily" : "Occasional",
      status: slots.frequency.status,
      provenanceText: getProvenanceLabel(slots.frequency),
      canRemove: true,
      isGuessed: slots.frequency.status === "guessed",
    });
  }

  // 6. Format (if not redundant with category)
  if (slots.format.value && slots.format.source !== "derived") {
    chips.push({
      slotKey: "format",
      label: "Format",
      value: formatFormatLabel(slots.format.value),
      status: slots.format.status,
      provenanceText: getProvenanceLabel(slots.format),
      canRemove: true,
      isGuessed: slots.format.status === "guessed",
    });
  }

  // 7. Fragrance Preference
  if (slots.fragrance_pref.value === "free_only") {
    chips.push({
      slotKey: "fragrance_pref",
      label: "Fragrance",
      value: "Fragrance-free only",
      status: slots.fragrance_pref.status,
      provenanceText: getProvenanceLabel(slots.fragrance_pref),
      canRemove: true,
      isGuessed: slots.fragrance_pref.status === "guessed",
    });
  }

  return chips;
}
