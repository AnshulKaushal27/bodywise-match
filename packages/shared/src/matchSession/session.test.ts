import { describe, it, expect } from "vitest";
import {
  createInitialSessionState,
  matchSessionReducer,
} from "./reducer";
import {
  selectAllChipsWithProvenance,
  selectIsQuestionCapReached,
} from "./selectors";

describe("MatchSession Reducer & Conflict/Lock Rules", () => {
  it("initializes with clean, empty slots and zero question count", () => {
    const state = createInitialSessionState();
    expect(state.questionCount).toBe(0);
    expect(state.slots.needs).toHaveLength(0);
    expect(state.slots.product_type.value).toBeNull();
    expect(state.slots.product_type.status).toBe("unknown");
    expect(state.chat.messages).toHaveLength(0);
  });

  it("applies patch with confirmed status and evidence text", () => {
    const initial = createInitialSessionState();
    const next = matchSessionReducer(initial, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        body_area: "face",
        product_type: "moisturizer",
        frequency: "daily",
      },
      evidence: {
        body_area: "muh pe",
        product_type: "cream",
        frequency: "daily",
      },
    });

    expect(next.slots.body_area.value).toBe("face");
    expect(next.slots.body_area.status).toBe("confirmed");
    expect(next.slots.body_area.evidence_text).toBe("muh pe");
    expect(next.slots.product_type.value).toBe("moisturizer");
    expect(next.slots.frequency.value).toBe("daily");
  });

  it("Conflict Rule: A 'guessed' value NEVER overrides a 'confirmed' value", () => {
    const initial = createInitialSessionState();
    // 1. User explicitly confirmed product_type = moisturizer
    const state1 = matchSessionReducer(initial, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        product_type: "moisturizer",
      },
      evidence: { product_type: "cream" },
    });
    expect(state1.slots.product_type.value).toBe("moisturizer");
    expect(state1.slots.product_type.status).toBe("confirmed");

    // 2. An LLM or heuristic tries to patch a 'guessed' serum
    const state2 = matchSessionReducer(state1, {
      type: "APPLY_PATCH",
      source: "default",
      status: "guessed",
      patch: {
        product_type: "serum",
      },
    });

    // product_type must remain confirmed moisturizer!
    expect(state2.slots.product_type.value).toBe("moisturizer");
    expect(state2.slots.product_type.status).toBe("confirmed");
  });

  it("Lock Rule: Removing a chip locks slot to 'confirmed: null' so it is not re-guessed", () => {
    const initial = createInitialSessionState();
    const state1 = matchSessionReducer(initial, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: { format: "cream" },
    });
    expect(state1.slots.format.value).toBe("cream");

    // User removes the format chip
    const state2 = matchSessionReducer(state1, {
      type: "REMOVE_CHIP",
      slotKey: "format",
    });
    expect(state2.slots.format.value).toBeNull();
    expect(state2.slots.format.status).toBe("confirmed");

    // A subsequent guessed patch should NOT re-guess format
    const state3 = matchSessionReducer(state2, {
      type: "APPLY_PATCH",
      source: "default",
      status: "guessed",
      patch: { format: "serum" },
    });
    expect(state3.slots.format.value).toBeNull();
  });

  it("ANSWER_QUESTION advances questionCount, records facet, and appends system message in chat", () => {
    const initial = createInitialSessionState();
    const next = matchSessionReducer(initial, {
      type: "ANSWER_QUESTION",
      facetId: "time_of_day",
      value: "night",
      label: "Night / Evening",
      source: "question",
    });

    expect(next.questionCount).toBe(1);
    expect(next.askedQuestions).toContain("time_of_day");
    expect(next.slots.time_of_day.value).toBe("night");
    expect(next.slots.time_of_day.status).toBe("confirmed");
    expect(next.chat.messages).toHaveLength(1);
    expect(next.chat.messages[0].role).toBe("system");
    expect(next.chat.messages[0].content).toContain("You chose: Night / Evening");
  });

  it("Question cap: reaches cap when questionCount >= 3", () => {
    let state = createInitialSessionState();
    expect(selectIsQuestionCapReached(state)).toBe(false);

    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "body_area",
      value: "face",
      source: "question",
    });
    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "time_of_day",
      value: "night",
      source: "question",
    });
    expect(selectIsQuestionCapReached(state)).toBe(false);

    state = matchSessionReducer(state, {
      type: "ANSWER_QUESTION",
      facetId: "fragrance_pref",
      value: "free_only",
      source: "question",
    });
    expect(selectIsQuestionCapReached(state)).toBe(true);
  });

  it("UNDO restores previous state before last mutating action", () => {
    const initial = createInitialSessionState();
    const state1 = matchSessionReducer(initial, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: { body_area: "face" },
    });
    expect(state1.slots.body_area.value).toBe("face");

    const state2 = matchSessionReducer(state1, {
      type: "APPLY_PATCH",
      source: "chat",
      status: "confirmed",
      patch: { time_of_day: "night" },
    });
    expect(state2.slots.time_of_day.value).toBe("night");

    const undone = matchSessionReducer(state2, { type: "UNDO" });
    expect(undone.slots.time_of_day.value).toBeNull();
    expect(undone.slots.body_area.value).toBe("face");
  });

  it("Chat message limit: keeps at most 20 messages", () => {
    let state = createInitialSessionState();
    for (let i = 1; i <= 25; i++) {
      state = matchSessionReducer(state, {
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: `msg_${i}`,
          role: "user",
          content: `Message ${i}`,
          timestamp: Date.now() + i,
        },
      });
    }

    expect(state.chat.messages).toHaveLength(20);
    expect(state.chat.messages[0].content).toBe("Message 6");
    expect(state.chat.messages[19].content).toBe("Message 25");
  });

  it("selectAllChipsWithProvenance formats provenance correctly", () => {
    const initial = createInitialSessionState();
    const state = matchSessionReducer(initial, {
      type: "APPLY_PATCH",
      source: "user_text",
      status: "confirmed",
      patch: {
        needs: [
          {
            id: "need_1",
            concept_id: "hydration",
            phrase_from_user: "dryness",
            normalised_label: "Hydration & skin barrier",
            confidence: 0.95,
            status: "confirmed",
            source: "user_text",
            evidence_text: "dryness",
          },
        ],
        body_area: "face",
      },
      evidence: {
        body_area: "muh pe",
      },
    });

    const chips = selectAllChipsWithProvenance(state);
    expect(chips).toHaveLength(2);
    expect(chips[0].provenanceText).toBe('From your words: "dryness"');
    expect(chips[1].provenanceText).toBe('From your words: "muh pe"');
  });
});
