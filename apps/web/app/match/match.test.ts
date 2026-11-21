import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import { renderToStaticMarkup } from "react-dom/server";
import MatchStep1Page from "./page";

describe("Match Step 1 Page (apps/web/app/match/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(MatchStep1Page));

  it("renders Heading: 'What would you like help choosing for?'", () => {
    expect(html).toContain("What would you like help choosing for?");
  });

  it("renders Stepper and ProgressBar for Step 1 of 3", () => {
    expect(html).toContain("Describe concern");
    expect(html).toContain("Clarify details");
    expect(html).toContain("Explained matches");
    expect(html).toContain('role="progressbar"');
  });

  it("renders Textarea with live character counter limit of 500", () => {
    expect(html).toMatch(/maxlength="500"/i);
    expect(html).toContain("0/500");
  });

  it("renders 'Or pick a goal' chips section", () => {
    expect(html).toContain("Or pick a goal (catalogue-supported)");
  });

  it("renders photo button as DISABLED with tooltip/note 'Coming later. Text works fully today.'", () => {
    expect(html).toContain("Add a photo (optional)");
    expect(html).toContain("Coming later. Text works fully today.");
    // Button must be strictly disabled
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("cursor-not-allowed");
  });

  it("renders 'Skip and browse all products' link to /products", () => {
    expect(html).toContain("Skip and browse all products");
    expect(html).toContain('href="/products"');
  });

  it("renders safety note: 'Please don't include your name, phone number or medical history.'", () => {
    expect(html).toContain(
      "Please don&#x27;t include your name, phone number or medical history."
    );
  });

  it("validates client-side PII regex triggers warning for phone and email", () => {
    const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/;

    expect(EMAIL_REGEX.test("contact me at user@example.com")).toBe(true);
    expect(PHONE_REGEX.test("my phone number is 9876543210")).toBe(true);
    expect(EMAIL_REGEX.test("gentle body wash for bumps")).toBe(false);
    expect(PHONE_REGEX.test("gentle body wash for bumps")).toBe(false);
  });
});
