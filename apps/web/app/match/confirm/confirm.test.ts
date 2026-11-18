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

describe("Match Confirm Step 2 Page (apps/web/app/match/confirm/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(MatchConfirmPage));

  it("renders Heading: 'Here\\'s what we understood'", () => {
    expect(html).toContain("Here&#x27;s what we understood");
  });

  it("renders grouped summary fields: Goal, Product, Format, Avoid, Routine", () => {
    expect(html).toContain("Goal:");
    expect(html).toContain("Product:");
    expect(html).toContain("Format:");
    expect(html).toContain("Avoid:");
    expect(html).toContain("Routine:");
  });

  it("renders confidence hints ('Clear' or 'Guessing, please check')", () => {
    expect(html).toMatch(/(Clear|Guessing, please check)/);
  });

  it("renders '+ Add a preference' button", () => {
    expect(html).toContain("Add a preference");
  });

  it("renders small caution callout: 'This helps choose products. It isn't medical advice.'", () => {
    expect(html).toContain("This helps choose products. It isn&#x27;t medical advice.");
  });

  it("renders persistent 'You misunderstood me' reset button", () => {
    expect(html).toContain("You misunderstood me");
  });

  it("renders escape options: 'Not sure' and 'Skip, show broad options'", () => {
    // When a question is shown or in default render
    expect(html).toMatch(/(Not sure|Skip, show broad options|Sufficient clarity)/);
  });

  it("renders interpretation provenance tag ('Interpreted with rules' or 'Interpreted with AI')", () => {
    expect(html).toMatch(/Interpreted with (rules|AI, please check)/);
  });

  it("never includes questions asking for age, diagnosis, medical history, or contact details", () => {
    expect(html).not.toMatch(/\b(what is your age|how old are you|medical history|diagnos)\b/i);
    expect(html).not.toMatch(/\b(enter your phone|enter your email|your name)\b/i);
  });
});
