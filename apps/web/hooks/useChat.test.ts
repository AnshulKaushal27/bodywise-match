import { describe, it, expect } from "vitest";
import { createInitialSessionState, matchSessionReducer } from "@bodywise/shared";

describe("Chat message lifecycle & Clear Chat logic", () => {
  it("initializes with empty messages", () => {
    const state = createInitialSessionState();
    expect(state.chat.messages).toHaveLength(0);
  });

  it("appends user and assistant messages via ADD_CHAT_MESSAGE", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: "msg_user_1",
        role: "user",
        content: "I need a moisturizer",
        timestamp: Date.now(),
      },
    });

    state = matchSessionReducer(state, {
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: "msg_assistant_1",
        role: "assistant",
        content: "Here are matching options",
        timestamp: Date.now(),
      },
    });

    expect(state.chat.messages).toHaveLength(2);
    expect(state.chat.messages[0].content).toBe("I need a moisturizer");
    expect(state.chat.messages[1].content).toBe("Here are matching options");
  });

  it("properly clears all messages on CLEAR_CHAT", () => {
    let state = createInitialSessionState();
    state = matchSessionReducer(state, {
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: "msg_1",
        role: "user",
        content: "mujhe complaint karni hai",
        timestamp: Date.now(),
      },
    });
    expect(state.chat.messages).toHaveLength(1);

    state = matchSessionReducer(state, {
      type: "CLEAR_CHAT",
    });

    expect(state.chat.messages).toHaveLength(0);
    expect(state.chat.messages).toEqual([]);
  });
});
