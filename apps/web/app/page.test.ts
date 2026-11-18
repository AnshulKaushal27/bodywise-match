import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "./page";

describe("Landing Page (apps/web/app/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(HomePage));

  it("contains skip to content link for accessibility", () => {
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to content");
  });

  it("renders Hero section with exact copy and CTAs", () => {
    expect(html).toContain("Not sure which product fits your concern?");
    expect(html).toContain(
      "Tell us what you&#x27;re looking for. We&#x27;ll ask a few quick questions and explain which Be Bodywise options may fit."
    );
    expect(html).toContain("Find my match");
    expect(html).toContain('href="/match"');
    expect(html).toContain("Browse products");
    expect(html).toContain('href="/products"');
    expect(html).toContain(
      "No diagnosis. No guaranteed results. Your photo is optional."
    );
  });

  it("renders static WebP hero background with priority, decorative alt='', and CSS gradient fallback", () => {
    // CSS gradient fallback
    expect(html).toContain("from-[#F7F7F1]");
    expect(html).toContain("to-[#DCE8D7]");
    // Decorative alt=""
    expect(html).toContain('alt=""');
    // WebP image
    expect(html).toContain(".webp");
  });

  it("renders 'How it works' section with 3 numbered cards", () => {
    expect(html).toContain("How it works");
    expect(html).toContain("Tell us what you want help choosing.");
    expect(html).toContain("Check and edit what we understood.");
    expect(html).toContain("See options with reasons and trade-offs.");
  });

  it("renders sample recommendation card badged Demo data without percentage scores", () => {
    expect(html).toContain("What a recommendation looks like");
    expect(html).toContain("Demo data");
    expect(html).toContain("Why it&#x27;s here");
    expect(html).toContain("Consider this if...");
    expect(html).toContain("May not be the best fit if...");
    expect(html).toContain("Official Packaging Label");
    expect(html).not.toMatch(/\b\d+%\s*match\b/i);
  });

  it("renders 'We keep it honest' section with 3 safeguard columns", () => {
    expect(html).toContain("We keep it honest");
    expect(html).toContain("Rules choose, AI helps listen");
    expect(html).toContain("Products are chosen by transparent rules.");
    expect(html).toContain("Facts have sources");
    expect(html).toContain("Every product fact shows where it came from and when.");
    expect(html).toContain("You stay in control");
    expect(html).toContain("Edit what we understood. Skip any question.");
  });

  it("renders 'Something went wrong with an order?' teaser card linking to /help", () => {
    expect(html).toContain("Something went wrong with an order?");
    expect(html).toContain(
      "We can&#x27;t track your parcel, but we can help you prepare the right message for official support."
    );
    expect(html).toContain('href="/help"');
  });

  it("renders Privacy/photo explainer and FAQ accordion with all 6 required questions", () => {
    expect(html).toContain("Is this medical advice?");
    expect(html).toContain("Do I need an account?");
    expect(html).toContain("Do you store my photo?");
    expect(html).toContain("How are products chosen?");
    expect(html).toContain("Are these real reviews?");
    expect(html).toContain("How do I contact support?");
  });

  it("renders deep green footer with links and mandatory disclaimer", () => {
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/safety"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain(
      "Independent prototype for a fellowship challenge; not an official Be Bodywise service."
    );
  });
});
