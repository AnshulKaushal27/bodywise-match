"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useMatchSession } from "@/lib/matchSessionContext";
import { sendUnifiedChat, UnifiedChatResponse } from "@/lib/api";
import {
  ChatMessage,
  SessionPatch,
  DIGEST_SEED,
  ShortlistFamilyItem,
} from "@bodywise/shared";

export interface ChatPageContext {
  page: "home" | "confirm" | "results" | "products" | "product_detail" | "compare" | "help";
  focusFamilyId?: string;
  focusFamilyName?: string;
  comparedFamilyIds?: string[];
}

export function useChat() {
  const { state, dispatch, isChatOpen, setIsChatOpen } = useMatchSession();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchQuery(window.location.search);
    }
  }, [pathname]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isContextDismissed, setIsContextDismissed] = React.useState(false);
  const [proposedPatch, setProposedPatch] = React.useState<SessionPatch | null>(null);
  const [lastCandidates, setLastCandidates] = React.useState<ShortlistFamilyItem[]>([]);
  const [candidateCount, setCandidateCount] = React.useState<number>(0);
  const [localMessages, setLocalMessages] = React.useState<ChatMessage[]>(() => state.chat.messages || []);

  React.useEffect(() => {
    if (!state.chat.messages || state.chat.messages.length === 0) {
      if (localMessages.length > 0) {
        setLocalMessages([]);
      }
    } else if (state.chat.messages.length > localMessages.length) {
      setLocalMessages(state.chat.messages);
    }
  }, [state.chat.messages, localMessages.length]);

  // Derive page context from URL
  const pageContext: ChatPageContext = React.useMemo(() => {
    if (isContextDismissed) {
      return { page: "home" };
    }

    if (pathname.startsWith("/products/") && pathname !== "/products") {
      const slug = pathname.replace("/products/", "").trim();
      // Look up family in digest
      const family = DIGEST_SEED.find(
        (f) => f.familyId === slug || f.familyId.toLowerCase().includes(slug.toLowerCase())
      );
      return {
        page: "product_detail",
        focusFamilyId: family?.familyId || slug,
        focusFamilyName: family?.name || slug,
      };
    }

    if (pathname === "/compare") {
      const params = new URLSearchParams(searchQuery);
      const itemsParam = params.get("items") || "";
      const ids = itemsParam.split(",").map((s) => s.trim()).filter(Boolean);
      return {
        page: "compare",
        comparedFamilyIds: ids,
      };
    }

    if (pathname === "/help") return { page: "help" };
    if (pathname === "/match/confirm") return { page: "confirm" };
    if (pathname === "/match/results") return { page: "results" };
    if (pathname === "/products") return { page: "products" };

    return { page: "home" };
  }, [pathname, searchQuery, isContextDismissed]);

  // Context label for UI chip
  const contextLabel = React.useMemo(() => {
    if (isContextDismissed) return null;
    if (pageContext.page === "product_detail") {
      return `Asking about: ${pageContext.focusFamilyName || pageContext.focusFamilyId}`;
    }
    if (pageContext.page === "compare" && pageContext.comparedFamilyIds && pageContext.comparedFamilyIds.length > 0) {
      return `Comparing: ${pageContext.comparedFamilyIds.length} products`;
    }
    return null;
  }, [pageContext, isContextDismissed]);

  const dismissContext = React.useCallback(() => {
    setIsContextDismissed(true);
  }, []);

  const sendMessage = React.useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isLoading) return;

      setIsLoading(true);
      setError(null);

      // Append user message to state
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setLocalMessages((prev) => [...prev, userMsg]);
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: userMsg,
      });

      try {
        const response: UnifiedChatResponse = await sendUnifiedChat({
          state,
          message: trimmed,
          history: [...localMessages, userMsg],
          pageContext: {
            page: pageContext.page,
            focusFamilyId: pageContext.focusFamilyId,
            comparedFamilyIds: pageContext.comparedFamilyIds,
          },
          language: state.language,
        });

        // Assistant response message
        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response.assistantMessage,
          timestamp: Date.now(),
          quickReplies: response.quickReplies,
          sourceTag: response.sources.length > 0 ? response.sources[0] : undefined,
        };

        setLocalMessages((prev) => [...prev, assistantMsg]);
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: assistantMsg,
        });

        // Check if there are slot updates
        const patchKeys = Object.keys(response.patch || {}) as Array<keyof SessionPatch>;
        const hasSlotUpdates = patchKeys.length > 0;

        if (hasSlotUpdates) {
          // If user is on /match/confirm or /match/results, stage proposal for explicit apply button
          if (pageContext.page === "confirm" || pageContext.page === "results") {
            setProposedPatch(response.patch);
          } else {
            // On other pages, auto-apply patch to session state
            dispatch({
              type: "APPLY_PATCH",
              source: "chat",
              status: "confirmed",
              patch: response.patch,
            });
          }
        }

        setCandidateCount(response.shortlist ? response.shortlist.count : (response.candidates?.length ?? 0));
        setLastCandidates(response.candidates && response.candidates.length > 0 ? response.candidates : []);
      } catch {
        setError("Unable to get response. Switched to offline assistance.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, dispatch, state, pageContext]
  );

  const applyProposedPatch = React.useCallback(() => {
    if (!proposedPatch) return;
    dispatch({
      type: "APPLY_PATCH",
      source: "chat",
      status: "confirmed",
      patch: proposedPatch,
    });
    setProposedPatch(null);
  }, [dispatch, proposedPatch]);

  const clearChat = React.useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
    setLocalMessages([]);
    setProposedPatch(null);
    setError(null);
    setLastCandidates([]);
    setCandidateCount(0);
  }, [dispatch]);

  const getFilteredProductsUrl = React.useCallback(() => {
    const params = new URLSearchParams();
    if (state.slots.product_type.value) {
      params.set("category", String(state.slots.product_type.value));
    }
    if (state.slots.needs && state.slots.needs.length > 0) {
      const goalIds = state.slots.needs.map((n) => n.concept_id).filter(Boolean);
      if (goalIds.length > 0) {
        params.set("goal", goalIds.join(","));
      }
    }
    if (state.slots.fragrance_pref.value === "free_only") {
      params.set("fragrance", "fragrance_free");
    }
    if (state.slots.format.value) {
      params.set("format", String(state.slots.format.value));
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }, [state]);

  return {
    isChatOpen,
    setIsChatOpen,
    messages: localMessages,
    isLoading,
    error,
    pageContext,
    contextLabel,
    dismissContext,
    sendMessage,
    proposedPatch,
    applyProposedPatch,
    candidateCount,
    lastCandidates,
    clearChat,
    getFilteredProductsUrl,
  };
}
