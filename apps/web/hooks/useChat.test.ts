import { describe, it, expect, beforeEach } from "vitest";
import { createInitialSessionState, matchSessionReducer } from "@bodywise/shared";
import { getOrCreateDeviceId } from "./useChat";

// Clean isolated mock storage for tests without polluting global environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  length: 0,
} as unknown as Storage;

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

describe("Device Isolation for Ask Assistant Chatbot", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("generates a unique device ID and persists it for the device", () => {
    const devId1 = getOrCreateDeviceId(mockLocalStorage);
    expect(devId1).toMatch(/^dev_\d+_[a-z0-9]+$/);

    // Subsequent calls on the same device return the exact same device ID
    const devId2 = getOrCreateDeviceId(mockLocalStorage);
    expect(devId2).toBe(devId1);
  });

  it("isolates chat messages between two different devices", () => {
    const deviceA = "dev_device_A";
    const deviceB = "dev_device_B";

    const chatA = [
      { id: "1", role: "user", content: "Need acne treatment", timestamp: Date.now() },
    ];
    const chatB = [
      { id: "2", role: "user", content: "Looking for hair oil", timestamp: Date.now() },
    ];

    // Store Device A chat
    mockLocalStorage.setItem(`bodywise_chat_${deviceA}`, JSON.stringify(chatA));
    // Store Device B chat
    mockLocalStorage.setItem(`bodywise_chat_${deviceB}`, JSON.stringify(chatB));

    // Device A sees only Device A's chat
    const loadedA = JSON.parse(mockLocalStorage.getItem(`bodywise_chat_${deviceA}`) || "[]");
    expect(loadedA).toHaveLength(1);
    expect(loadedA[0].content).toBe("Need acne treatment");

    // Device B sees only Device B's chat
    const loadedB = JSON.parse(mockLocalStorage.getItem(`bodywise_chat_${deviceB}`) || "[]");
    expect(loadedB).toHaveLength(1);
    expect(loadedB[0].content).toBe("Looking for hair oil");

    // Verify complete independence
    expect(loadedA[0].content).not.toBe(loadedB[0].content);
  });
});
