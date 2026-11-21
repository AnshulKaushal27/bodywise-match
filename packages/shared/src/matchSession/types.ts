/**
 * Match Session State Types & Interfaces
 * Single source of truth for the hybrid Match experience (Section A).
 */

import { CatalogueType } from "../data/typeMap";

export type SlotStatus = "unknown" | "guessed" | "confirmed";

export type EventSource = "user_text" | "chat" | "question" | "chip_edit" | "derived" | "default";

export interface Slot<T> {
  value: T | null;
  status: SlotStatus;
  source: EventSource;
  evidence_text: string | null;
  confidence: number; // 0.0 to 1.0
  updatedAt: number;
}

export interface SessionNeed {
  id: string;
  concept_id: string;
  phrase_from_user: string;
  normalised_label: string;
  confidence: number;
  status: SlotStatus;
  source: EventSource;
  evidence_text: string | null;
}

export type BodyArea = "face" | "body" | "scalp" | "hair" | "underarm" | string;
export type TimeOfDay = "morning" | "night" | "both" | "any";
export type Frequency = "daily" | "occasional" | "any";
export type FragrancePref = "free_only" | "any";

export interface SessionSlots {
  needs: SessionNeed[];
  product_type: Slot<CatalogueType>;
  body_area: Slot<BodyArea>;
  time_of_day: Slot<TimeOfDay>;
  frequency: Slot<Frequency>;
  format: Slot<string>;
  fragrance_pref: Slot<FragrancePref>;
  avoidances: Slot<string[]>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  quickReplies?: Array<{ id: string; label: string; action: string; value: unknown }>;
  sourceTag?: {
    source: string;
    verifiedAt: string;
    url?: string;
  };
}

export type SessionFacetId =
  | "need_confirm"
  | "product_type"
  | "body_area"
  | "time_of_day"
  | "format"
  | "fragrance_pref"
  | "avoidances"
  | "frequency";

export type SessionLanguage = "en" | "hi-latn";

export interface SessionPatch {
  needs?: SessionNeed[];
  product_type?: CatalogueType | null;
  body_area?: BodyArea | null;
  time_of_day?: TimeOfDay | null;
  frequency?: Frequency | null;
  format?: string | null;
  fragrance_pref?: FragrancePref | null;
  avoidances?: string[] | null;
}

export type SessionEvent =
  | {
      type: "APPLY_PATCH";
      source: EventSource;
      patch: SessionPatch;
      evidence?: Record<string, string | null>;
      status?: SlotStatus;
      confidence?: number;
      timestamp?: number;
    }
  | {
      type: "ANSWER_QUESTION";
      facetId: SessionFacetId;
      value: unknown;
      label?: string;
      source: EventSource;
      timestamp?: number;
    }
  | {
      type: "EDIT_CHIP";
      slotKey: keyof SessionSlots;
      needId?: string;
      value: unknown;
      timestamp?: number;
    }
  | {
      type: "REMOVE_CHIP";
      slotKey: keyof SessionSlots;
      needId?: string;
      timestamp?: number;
    }
  | {
      type: "ADD_CHAT_MESSAGE";
      message: ChatMessage;
      timestamp?: number;
    }
  | {
      type: "CLEAR_CHAT";
      timestamp?: number;
    }
  | {
      type: "SET_LANGUAGE";
      language: SessionLanguage;
      timestamp?: number;
    }
  | {
      type: "RESET";
      timestamp?: number;
    }
  | {
      type: "UNDO";
      timestamp?: number;
    }
  | {
      type: "STATE_REPAIRED";
      repairReason: string;
      timestamp?: number;
    };

export interface MatchSessionState {
  slots: SessionSlots;
  askedQuestions: SessionFacetId[];
  questionCount: number;
  language: SessionLanguage;
  chat: {
    messages: ChatMessage[];
  };
  eventLog: SessionEvent[];
  lastActionDescription?: string | null;
}
