import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import ComparePage from "./page";

describe("Product Comparison Route (apps/web/app/compare/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(ComparePage));

  it("renders page header, title, and description", () => {
    expect(html).toContain("Side-by-Side Comparison");
    expect(html).toContain("Compare Product Specifications");
    expect(html).toContain("Compare up to 3 Be Bodywise products");
  });

  it("renders 'Print / Save as PDF' action button", () => {
    expect(html).toContain("Print / Save as PDF");
  });

  it("renders 'Show only differences' toggle control", () => {
    expect(html).toContain("Show only differences");
    expect(html).toContain('type="checkbox"');
  });

  it("renders visible mobile horizontal scroll hint", () => {
    expect(html).toContain("Swipe horizontally to compare columns");
    expect(html).toContain("Sticky labels locked");
  });

  it("renders table in an overflow-x-auto container with sticky first column", () => {
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("sticky left-0");
    expect(html).toContain("Attributes");
  });

  it("renders aligned comparison rows: format, size, goals, ingredients, fragrance-free, price, source/date", () => {
    expect(html).toContain("Format");
    expect(html).toContain("Size");
    expect(html).toContain("Supported Goals");
    expect(html).toContain("Ingredients");
    expect(html).toContain("Fragrance-Free");
    expect(html).toContain("Price (INR)");
    expect(html).toContain("Source / Date");
  });

  it("renders 'Not verified yet' for unverified or missing data, never hidden", () => {
    expect(html).toContain("Not verified yet");
  });

  it("renders quick-switch select dropdowns to swap products in comparison slots", () => {
    expect(html).toContain("<select");
    expect(html).toContain("1% Salicylic Acid Body Wash - 250 mL");
  });
});
