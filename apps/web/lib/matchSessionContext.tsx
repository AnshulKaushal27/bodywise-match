"use client";

import * as React from "react";
import {
  MatchSessionState,
  SessionEvent,
  createInitialSessionState,
  matchSessionReducer,
  extractPatchViaRules,
  SessionNeed,
} from "@bodywise/shared";

interface MatchSessionContextValue {
  state: MatchSessionState;
  dispatch: (event: SessionEvent) => void;
  undo: () => void;
  clearData: () => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  highlightedSlotKey: string | null;
  toastMessage: string | null;
  dismissToast: () => void;
}

const MatchSessionContext = React.createContext<MatchSessionContextValue | null>(null);

const SESSION_STORAGE_KEY = "bodywise_hybrid_match_session";

export function MatchSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MatchSessionState>(() => createInitialSessionState());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [highlightedSlotKey, setHighlightedSlotKey] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Initialize from sessionStorage or migrate previous intake
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.slots) {
          setState(parsed);
          setIsInitialized(true);
          return;
        }
      }

      // Check legacy intake data in sessionStorage
      const rawInput = sessionStorage.getItem("bodywise_user_raw_input");
      const savedParsedReq = sessionStorage.getItem("bodywise_parsed_request");

      let initialState = createInitialSessionState();

      if (rawInput && rawInput.trim().length > 0) {
        const rules = extractPatchViaRules(rawInput);
        initialState = matchSessionReducer(initialState, {
          type: "APPLY_PATCH",
          source: "user_text",
          status: "confirmed",
          patch: rules.patch,
          evidence: rules.evidence,
        });
        initialState = matchSessionReducer(initialState, {
          type: "SET_LANGUAGE",
          language: rules.detectedLanguage,
        });
      } else if (savedParsedReq) {
        try {
          const parsedObj = JSON.parse(savedParsedReq);
          if (parsedObj.needs && Array.isArray(parsedObj.needs)) {
            const needs: SessionNeed[] = parsedObj.needs.map((n: Record<string, unknown>, idx: number) => {
              const concepts = Array.isArray(n.concepts) ? (n.concepts as string[]) : [];
              const phrase = typeof n.phrase_from_user === "string" ? n.phrase_from_user : "";
              const label = typeof n.normalised_label === "string" ? n.normalised_label : phrase;
              const id = typeof n.id === "string" ? n.id : `need_${idx + 1}`;
              return {
                id,
                concept_id: (concepts[0] as string) || "hydration",
                phrase_from_user: phrase,
                normalised_label: label,
                confidence: 0.9,
                status: "confirmed",
                source: "user_text",
                evidence_text: phrase || null,
              };
            });
            initialState = matchSessionReducer(initialState, {
              type: "APPLY_PATCH",
              source: "user_text",
              status: "confirmed",
              patch: {
                needs,
                avoidances: parsedObj.avoidances || [],
              },
            });
          }
        } catch {
          // Keep empty initial state
        }
      }

      setState(initialState);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(initialState));
    } catch {
      // In SSR or sandboxes where sessionStorage is unavailable
    }
    setIsInitialized(true);
  }, []);

  // Sync to sessionStorage on state changes
  React.useEffect(() => {
    if (!isInitialized) return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota or sandboxed
    }
  }, [state, isInitialized]);

  const dispatch = React.useCallback((event: SessionEvent) => {
    setState((prev) => {
      const next = matchSessionReducer(prev, event);

      // Trigger undo toast for mutating actions
      if (next.lastActionDescription && event.type !== "UNDO" && event.type !== "ADD_CHAT_MESSAGE") {
        setToastMessage(`${next.lastActionDescription}. Undo`);
      }

      // Highlight slot if applicable
      if (event.type === "APPLY_PATCH") {
        if (event.patch.time_of_day) setHighlightedSlotKey("time_of_day");
        else if (event.patch.body_area) setHighlightedSlotKey("body_area");
        else if (event.patch.product_type) setHighlightedSlotKey("product_type");
        else if (event.patch.frequency) setHighlightedSlotKey("frequency");
        else if (event.patch.format) setHighlightedSlotKey("format");
      } else if (event.type === "ANSWER_QUESTION") {
        setHighlightedSlotKey(event.facetId);
      }

      return next;
    });
  }, []);

  // Remove highlight after 2 seconds
  React.useEffect(() => {
    if (!highlightedSlotKey) return;
    const t = setTimeout(() => setHighlightedSlotKey(null), 2000);
    return () => clearTimeout(t);
  }, [highlightedSlotKey]);

  // Dismiss toast after 5 seconds
  React.useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const undo = React.useCallback(() => {
    dispatch({ type: "UNDO" });
    setToastMessage(null);
  }, [dispatch]);

  const clearData = React.useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem("bodywise_user_raw_input");
      sessionStorage.removeItem("bodywise_parsed_request");
      sessionStorage.removeItem("bodywise_parsed_needs");
    } catch {
      // Storage unavailable or disabled
    }
    setState(createInitialSessionState());
    setToastMessage("Cleared your match session data.");
  }, []);

  const dismissToast = React.useCallback(() => {
    setToastMessage(null);
  }, []);

  return (
    <MatchSessionContext.Provider
      value={{
        state,
        dispatch,
        undo,
        clearData,
        isChatOpen,
        setIsChatOpen,
        highlightedSlotKey,
        toastMessage,
        dismissToast,
      }}
    >
      {children}
    </MatchSessionContext.Provider>
  );
}

export function useOptionalMatchSession(): MatchSessionContextValue | null {
  return React.useContext(MatchSessionContext);
}

export function useMatchSession(): MatchSessionContextValue {
  const context = React.useContext(MatchSessionContext);
  if (!context) {
    throw new Error("useMatchSession must be used within a MatchSessionProvider");
  }
  return context;
}

