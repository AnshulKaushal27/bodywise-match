import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { renderToStaticMarkup } from "react-dom/server";
import MatchConfirmPage from "./page";

describe("Match Confirm Hybrid Flow Page (apps/web/app/match/confirm/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(MatchConfirmPage));

  it("renders Understanding section heading", () => {
    expect(html).toMatch(/What we understood/i);
  });

  it("renders persistent 'You misunderstood me' reset action", () => {
    expect(html).toContain("You misunderstood me");
  });

  it("renders Guided Question Card with secondary 'Prefer to type? Chat instead' action", () => {
    expect(html).toContain("Prefer to type? Chat instead");
  });

  it("renders 'See' matches button", () => {
    expect(html).toMatch(/See \d+ matches/);
  });

  it("renders Live Shortlist candidate preview", () => {
    expect(html).toContain("Live Shortlist");
  });

  it("renders interpretation provenance tag ('Interpreted with rules' or 'Interpreted with AI')", () => {
    expect(html).toMatch(/Interpreted with (rules|AI)/);
  });

  it("never includes questions asking for age, diagnosis, medical history, or contact details", () => {
    expect(html).not.toMatch(/\b(what is your age|how old are you|medical history|diagnos)\b/i);
    expect(html).not.toMatch(/\b(enter your phone|enter your email|your name)\b/i);
  });
});
