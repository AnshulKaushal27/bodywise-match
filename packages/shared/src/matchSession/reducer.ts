/**
 * Pure Match Session Reducer
 * Handles all state transitions, conflict resolution, undo, and slot locking.
 */

import {
  MatchSessionState,
  SessionEvent,
  SessionSlots,
  Slot,
  SlotStatus,
  EventSource,
  BodyArea,
  TimeOfDay,
  Frequency,
  FragrancePref,
} from "./types";
import { CatalogueType } from "../data/typeMap";
import { checkEvidenceConsistency, validateState } from "./guard";

export function createEmptySlot<T>(defaultValue: T | null = null): Slot<T> {
  return {
    value: defaultValue,
    status: "unknown",
    source: "default",
    evidence_text: null,
    confidence: 0,
    updatedAt: Date.now(),
  };
}

export function createInitialSessionState(): MatchSessionState {
  return {
    slots: {
      needs: [],
      product_type: createEmptySlot(),
      body_area: createEmptySlot(),
      time_of_day: createEmptySlot(),
      frequency: createEmptySlot(),
      format: createEmptySlot(),
      fragrance_pref: createEmptySlot(),
      avoidances: createEmptySlot([]),
    },
    askedQuestions: [],
    questionCount: 0,
    language: "en",
    chat: {
      messages: [],
    },
    eventLog: [],
    lastActionDescription: null,
  };
}

/**
 * Updates a single slot respecting the Conflict & Lock rules:
 * - A 'guessed' value NEVER overrides a 'confirmed' one.
 * - An explicit user action ('user_text', 'question', 'chip_edit', 'chat') wins.
 * - If currently 'confirmed' with value null (meaning user explicitly removed it),
 *   a 'guessed' update will NOT re-guess it.
 */
function updateSlot<T>(
  current: Slot<T>,
  newValue: T | null,
  newStatus: SlotStatus,
  source: EventSource,
  evidence: string | null = null,
  confidence: number = 1.0,
  timestamp: number = Date.now()
): Slot<T> {
  // Lock Rule: If current slot is confirmed (including confirmed null), a guessed patch CANNOT override it
  if (current.status === "confirmed" && newStatus === "guessed") {
    return current;
  }

  return {
    value: newValue,
    status: newStatus,
    source,
    evidence_text: evidence ?? current.evidence_text,
    confidence,
    updatedAt: timestamp,
  };
}

export function matchSessionReducer(
  state: MatchSessionState,
  event: SessionEvent
): MatchSessionState {
  const timestamp = event.timestamp ?? Date.now();

  switch (event.type) {
    case "APPLY_PATCH": {
      const { source, patch, evidence = {}, status = "confirmed", confidence = 1.0 } = event;
      const newSlots: SessionSlots = { ...state.slots };
      let actionDesc: string | null = null;

      // 1. Needs
      if (patch.needs && patch.needs.length > 0) {
        // Merge or replace needs
        newSlots.needs = patch.needs.map((n) => ({
          ...n,
          status: n.status || status,
          source: n.source || source,
          evidence_text: n.evidence_text || evidence[n.concept_id] || null,
        }));
      }

      // 2. product_type with Evidence Consistency Guard (Section B.4)
      if (patch.product_type !== undefined) {
        const evidenceText = evidence["product_type"] || null;
        const consistency = checkEvidenceConsistency("product_type", patch.product_type, evidenceText);
        if (!consistency.isConsistent) {
          // Reject patch and keep previous value
          actionDesc = `Preserved product type (rejected conflicting patch for ${patch.product_type})`;
        } else {
          newSlots.product_type = updateSlot(
            newSlots.product_type,
            patch.product_type,
            status,
            source,
            evidenceText,
            confidence,
            timestamp
          );
          actionDesc = `Updated product type to ${patch.product_type || "Any"}`;
        }
      }

      // 3. body_area with Evidence Consistency Guard
      if (patch.body_area !== undefined) {
        const evidenceText = evidence["body_area"] || null;
        const consistency = checkEvidenceConsistency("body_area", patch.body_area, evidenceText);
        if (!consistency.isConsistent) {
          actionDesc = `Preserved target area (rejected conflicting patch for ${patch.body_area})`;
        } else {
          newSlots.body_area = updateSlot(
            newSlots.body_area,
            patch.body_area,
            status,
            source,
            evidenceText,
            confidence,
            timestamp
          );
          actionDesc = `Updated target area to ${patch.body_area || "Any"}`;
        }
      }

      // 4. time_of_day
      if (patch.time_of_day !== undefined) {
        newSlots.time_of_day = updateSlot(
          newSlots.time_of_day,
          patch.time_of_day,
          status,
          source,
          evidence["time_of_day"] || null,
          confidence,
          timestamp
        );
        actionDesc = `Updated time of day to ${patch.time_of_day || "Any"}`;
      }

      // 5. frequency
      if (patch.frequency !== undefined) {
        newSlots.frequency = updateSlot(
          newSlots.frequency,
          patch.frequency,
          status,
          source,
          evidence["frequency"] || null,
          confidence,
          timestamp
        );
        actionDesc = `Updated frequency to ${patch.frequency || "Any"}`;
      }

      // 6. format
      if (patch.format !== undefined) {
        newSlots.format = updateSlot(
          newSlots.format,
          patch.format,
          status,
          source,
          evidence["format"] || null,
          confidence,
          timestamp
        );
        actionDesc = `Updated format to ${patch.format || "Any"}`;
      }

      // 7. fragrance_pref
      if (patch.fragrance_pref !== undefined) {
        newSlots.fragrance_pref = updateSlot(
          newSlots.fragrance_pref,
          patch.fragrance_pref,
          status,
          source,
          evidence["fragrance_pref"] || null,
          confidence,
          timestamp
        );
        actionDesc = `Updated fragrance preference to ${patch.fragrance_pref || "Any"}`;
      }

      // 8. avoidances
      if (patch.avoidances !== undefined) {
        newSlots.avoidances = updateSlot(
          newSlots.avoidances,
          patch.avoidances,
          status,
          source,
          evidence["avoidances"] || null,
          confidence,
          timestamp
        );
        actionDesc = `Updated avoidances`;
      }

      return validateState({
        ...state,
        slots: newSlots,
        eventLog: [...state.eventLog, event],
        lastActionDescription: actionDesc,
      }).state;
    }

    case "ANSWER_QUESTION": {
      const { facetId, value, label, source } = event;
      const newSlots = { ...state.slots };
      const actionDesc = `Answered ${facetId}: ${label || String(value)}`;

      switch (facetId) {
        case "product_type":
          newSlots.product_type = updateSlot(newSlots.product_type, value as CatalogueType, "confirmed", source, label, 1.0, timestamp);
          break;
        case "body_area":
          newSlots.body_area = updateSlot(newSlots.body_area, value as BodyArea, "confirmed", source, label, 1.0, timestamp);
          break;
        case "time_of_day":
          newSlots.time_of_day = updateSlot(newSlots.time_of_day, value as TimeOfDay, "confirmed", source, label, 1.0, timestamp);
          break;
        case "frequency":
          newSlots.frequency = updateSlot(newSlots.frequency, value as Frequency, "confirmed", source, label, 1.0, timestamp);
          break;
        case "format":
          newSlots.format = updateSlot(newSlots.format, value as string, "confirmed", source, label, 1.0, timestamp);
          break;
        case "fragrance_pref":
          newSlots.fragrance_pref = updateSlot(newSlots.fragrance_pref, value as FragrancePref, "confirmed", source, label, 1.0, timestamp);
          break;
        case "avoidances":
          newSlots.avoidances = updateSlot(newSlots.avoidances, value as string[], "confirmed", source, label, 1.0, timestamp);
          break;
      }

      const updatedAsked = state.askedQuestions.includes(facetId)
        ? state.askedQuestions
        : [...state.askedQuestions, facetId];

      // Add a system line in chat when answered
      const systemMessage = {
        id: `sys_${timestamp}`,
        role: "system" as const,
        content: `You chose: ${label || value}`,
        timestamp,
      };

      return validateState({
        ...state,
        slots: newSlots,
        askedQuestions: updatedAsked,
        questionCount: state.questionCount + 1,
        chat: {
          messages: [...state.chat.messages, systemMessage],
        },
        eventLog: [...state.eventLog, event],
        lastActionDescription: actionDesc,
      }).state;
    }

    case "EDIT_CHIP": {
      const { slotKey, needId, value } = event;
      const newSlots = { ...state.slots };
      let actionDesc = `Edited ${String(slotKey)}`;

      if (slotKey === "needs" && needId) {
        newSlots.needs = newSlots.needs.map((n) =>
          n.id === needId ? { ...n, normalised_label: String(value), status: "confirmed", source: "chip_edit" } : n
        );
      } else if (slotKey in newSlots && slotKey !== "needs") {
        const nonNeedKey = slotKey as keyof Omit<SessionSlots, "needs">;
        const slot = newSlots[nonNeedKey] as Slot<unknown>;
        newSlots[nonNeedKey] = updateSlot(
          slot,
          value,
          "confirmed",
          "chip_edit",
          null,
          1.0,
          timestamp
        ) as never;
        actionDesc = `Updated ${String(slotKey)} to ${String(value) || "Any"}`;
      }

      return validateState({
        ...state,
        slots: newSlots,
        eventLog: [...state.eventLog, event],
        lastActionDescription: actionDesc,
      }).state;
    }

    case "REMOVE_CHIP": {
      const { slotKey, needId } = event;
      const newSlots = { ...state.slots };
      let actionDesc = `Removed ${String(slotKey)}`;

      if (slotKey === "needs" && needId) {
        newSlots.needs = newSlots.needs.filter((n) => n.id !== needId);
        actionDesc = `Removed need`;
      } else if (slotKey in newSlots && slotKey !== "needs") {
        // Marking it confirmed: null locks it so it cannot be guessed again!
        const nonNeedKey = slotKey as keyof Omit<SessionSlots, "needs">;
        const slot = newSlots[nonNeedKey] as Slot<unknown>;
        newSlots[nonNeedKey] = {
          ...slot,
          value: null,
          status: "confirmed", // locked as explicitly none
          source: "chip_edit",
          evidence_text: null,
          updatedAt: timestamp,
        } as never;
        actionDesc = `Removed ${String(slotKey)}`;
      }

      // Add a system line in chat
      const chatSysMsg = {
        id: `sys_remove_${timestamp}`,
        role: "system" as const,
        content: `Removed ${String(slotKey)}`,
        timestamp,
      };

      return validateState({
        ...state,
        slots: newSlots,
        chat: {
          messages: [...state.chat.messages, chatSysMsg],
        },
        eventLog: [...state.eventLog, event],
        lastActionDescription: actionDesc,
      }).state;
    }

    case "ADD_CHAT_MESSAGE": {
      // Keep at most 20 messages in session
      const updatedMessages = [...state.chat.messages, event.message].slice(-20);
      return {
        ...state,
        chat: {
          messages: updatedMessages,
        },
        eventLog: [...state.eventLog, event],
      };
    }

    case "CLEAR_CHAT": {
      return {
        ...state,
        chat: {
          messages: [],
        },
        eventLog: [...state.eventLog, event],
      };
    }

    case "SET_LANGUAGE": {
      return {
        ...state,
        language: event.language,
        eventLog: [...state.eventLog, event],
      };
    }

    case "RESET": {
      return createInitialSessionState();
    }

    case "UNDO": {
      // Rollback to state before the last state-mutating event
      if (state.eventLog.length === 0) return state;

      const previousEvents = state.eventLog.slice(0, -1);
      let replayed = createInitialSessionState();
      for (const ev of previousEvents) {
        replayed = matchSessionReducer(replayed, ev);
      }
      return {
        ...replayed,
        lastActionDescription: "Undid last action",
      };
    }

    default:
      return state;
  }
}
