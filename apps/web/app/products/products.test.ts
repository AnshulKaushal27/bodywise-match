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

import ProductsPage from "./page";

describe("Catalogue Directory Route (apps/web/app/products/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(ProductsPage));

  it("renders header, directory title, and description", () => {
    expect(html).toContain("Catalogue Directory");
    expect(html).toContain("Browse Product Catalogue");
    expect(html).toContain("Explore verified product facts");
  });

  it("renders search input box with placeholder", () => {
    expect(html).toContain('placeholder="Search by product name, goal, format, or ingredient..."');
    expect(html).toContain('type="text"');
  });

  it("renders filter chips for Category, Format, Goal, and Fragrance", () => {
    expect(html).toContain("Filter by Attributes");
    expect(html).toContain("Category");
    expect(html).toContain("All Categories");
    expect(html).toContain("Body Wash");
    expect(html).toContain("Format");
    expect(html).toContain("All Formats");
    expect(html).toContain("Target Concern &amp; Goal");
    expect(html).toContain("All Goals");
    expect(html).toContain("Fragrance Declaration");
    expect(html).toContain("All Formulations");
    expect(html).toContain("Fragrance-Free Only");
  });

  it("renders verified product cards with format, size, and View details link", () => {
    expect(html).toContain("1% Salicylic Acid Body Wash - 250 mL");
    expect(html).toContain("Liquid body wash");
    expect(html).toContain("250 mL");
    expect(html).toContain("View details");
    expect(html).toContain('href="/products/1-salicylic-acid-body-wash"');
  });

  it("renders quick compare checkbox for each product card", () => {
    expect(html).toContain("Compare");
    expect(html).toContain('type="checkbox"');
  });

  it("renders link to comparison tool", () => {
    expect(html).toContain("Open Comparison Tool");
    expect(html).toContain('href="/compare"');
  });
});
