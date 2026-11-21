import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { renderToStaticMarkup } from "react-dom/server";
import MatchResultsPage from "./page";

describe("Match Results Step 3 Page (apps/web/app/match/results/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(MatchResultsPage));

  it("renders Header: 'Options that match what you told us'", () => {
    expect(html).toContain("Options that match what you told us");
  });

  it("renders Sub-header one-line recap with 'Change' link", () => {
    expect(html).toContain("Looking for:");
    expect(html).toContain("Change");
    expect(html).toContain('href="/match/confirm"');
  });

  it("renders RecommendationCards with MatchLabel pill, format, size, and View details button", () => {
    expect(html).toMatch(/(Strong fit|Direct fit|Partial fit|routine)/i);
    expect(html).toContain("Liquid body wash");
    expect(html).toContain("250 mL");
  });

  it("renders 'Why it's here', 'Consider this if...', and 'May not be the best fit if...'", () => {
    expect(html).toContain("Why it&#x27;s here");
    expect(html).toContain("Consider this if...");
    expect(html).toContain("May not be the best fit if...");
  });

  it("renders Verified Facts List with SourceTag ('Source - date checked' or 'Not verified yet')", () => {
    expect(html).toContain("Verified Facts &amp; Provenance");
    expect(html).toContain("Ingredients list:");
    expect(html).toMatch(/(Source:|Not verified yet)/);
  });

  it("renders card buttons: Compare (checkbox), View details, 'This doesn't fit'", () => {
    expect(html).toContain("Compare");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("View details");
    expect(html).toContain("This doesn&#x27;t fit");
  });

  it("renders collapsible 'How we matched' panel listing ordered steps and rules version", () => {
    expect(html).toContain("How we matched these options");
    expect(html).toContain("Hard exclusions");
    expect(html).toContain("Goal fit");
    expect(html).toContain("Preference fit");
    expect(html).toContain("Deterministic tie-breaks");
    expect(html).toMatch(/Rules Version: (1\.0\.0|2\.0\.0|3\.0\.0)/);
  });

  it("renders 'What people report' strip", () => {
    expect(html).toContain("What people report");
    expect(html).toContain("Trade-off noted:");
  });

  it("renders feedback widget: 'Was this shortlist useful?' with Yes / Somewhat / No and Skip", () => {
    expect(html).toContain("Was this shortlist useful?");
    expect(html).toContain("Yes, helpful");
    expect(html).toContain("Somewhat");
    expect(html).toContain("No, not what I wanted");
  });

  it("renders bottom disclaimer: 'Informational only, not medical advice.'", () => {
    expect(html).toContain("Informational only, not medical advice.");
  });
});
