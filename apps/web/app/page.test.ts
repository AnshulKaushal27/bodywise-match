import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

import HomePage from "./page";

describe("Landing Page (apps/web/app/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(HomePage));

  it("contains skip to content link for accessibility", () => {
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to content");
  });

  it("renders Hero section with exact copy and CTAs", () => {
    expect(html).toContain("Not sure which");
    expect(html).toContain("to choose?");
    expect(html).toContain(
      "Tell us what you&#x27;re looking for. We&#x27;ll ask a few quick questions and explain which Be Bodywise options may fit."
    );
    expect(html).toContain("Find my match");
    expect(html).toContain('href="/match"');
    expect(html).toContain("Browse products");
    expect(html).toContain('href="/products"');
    expect(html).toContain("Scan a product");
    expect(html).toContain("Snap or upload a photo of any bottle to find matching Be Bodywise formulas:");
  });

  it("renders static WebP hero background with priority, alt text, and CSS gradient fallback", () => {
    // CSS gradient fallback
    expect(html).toContain("from-[#F5F9FF]");
    expect(html).toContain("to-[#E3EEFC]");
    // Image alt text
    expect(html).toContain('alt="Be Bodywise verified skincare products and clean formulations"');
    // WebP image
    expect(html).toContain(".webp");
  });

  it("renders header with Help and Find my match buttons, without FAQ link", () => {
    expect(html).toContain('href="/help"');
    expect(html).toContain("Help");
    expect(html).toContain('href="/match"');
    expect(html).toContain("Find my match");
    expect(html).not.toContain('href="/#faq"');
  });

  it("does not render removed anchor sections or sample recommendation card", () => {
    expect(html).not.toContain('id="how-it-works"');
    expect(html).not.toContain('id="recommendation-preview"');
    expect(html).not.toContain('id="honest-rules"');
    expect(html).not.toContain("What a recommendation looks like");
    expect(html).not.toContain("Privacy First");
  });

  it("renders 'Something went wrong with an order?' teaser card linking to /help", () => {
    expect(html).toContain("Something went wrong with an order?");
    expect(html).toContain(
      "We can&#x27;t track your parcel, but we can help you prepare the right message for official support."
    );
    expect(html).toContain('href="/help"');
  });

  it("renders FAQ accordion with all 6 required questions", () => {
    expect(html).toContain("Is this medical advice?");
    expect(html).toContain("Do I need an account?");
    expect(html).toContain("Do you store my photo?");
    expect(html).toContain("How are products chosen?");
    expect(html).toContain("Are these real reviews?");
    expect(html).toContain("How do I contact support?");
  });

  it("renders deep green footer with links and mandatory disclaimer", () => {
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain('href="/safeguards"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/safety"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain(
      "Independent prototype for a fellowship challenge; not an official Be Bodywise service."
    );
  });
});
