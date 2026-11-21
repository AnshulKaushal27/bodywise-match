import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/products",
}));

import ProductsPage from "./page";
import { FilterDialog } from "./FilterDialog";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

describe("Catalogue Directory Route (apps/web/app/products/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(ProductsPage));

  it("renders header, directory title, and description", () => {
    expect(html).toContain("Catalogue Directory");
    expect(html).toContain("Browse Product Catalogue");
    expect(html).toContain("Explore verified product facts");
  });

  it("renders search input box with placeholder and min-h-[52px]", () => {
    expect(html).toContain('placeholder="Search by product name, goal, format, or ingredient..."');
    expect(html).toContain('type="text"');
    expect(html).toContain("min-h-[52px]");
  });

  it("renders the secondary 'Filters' button with dialog accessibility attributes", () => {
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Filters");
  });

  it("does NOT render the old always-open filter card on the page", () => {
    expect(html).not.toContain("Filter by Attributes");
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

  describe("FilterDialog Component", () => {
    const dialogHtml = renderToStaticMarkup(
      React.createElement(FilterDialog, {
        isOpen: true,
        onClose: vi.fn(),
        appliedFilters: {},
        onApply: vi.fn(),
        products: DEMO_CATALOGUE_SEED,
        triggerRef: { current: null },
      })
    );

    it("renders dialog header, title, description, and close button", () => {
      expect(dialogHtml).toContain("Filters");
      expect(dialogHtml).toContain("Choose what matters to you");
      expect(dialogHtml).toContain('aria-label="Close filters"');
      expect(dialogHtml).toContain('role="dialog"');
      expect(dialogHtml).toContain('aria-modal="true"');
    });

    it("renders the four filter attribute groups with counts", () => {
      expect(dialogHtml).toContain("Category");
      expect(dialogHtml).toContain("All Categories");
      expect(dialogHtml).toContain("Body Wash");
      expect(dialogHtml).toContain("Format");
      expect(dialogHtml).toContain("All Formats");
      expect(dialogHtml).toContain("Target Concern &amp; Goal");
      expect(dialogHtml).toContain("All Goals");
      expect(dialogHtml).toContain("Fragrance Declaration");
      expect(dialogHtml).toContain("All Formulations");
      expect(dialogHtml).toContain("Fragrance-Free Only");
    });

    it("renders sticky footer with Clear all and Show N products button", () => {
      expect(dialogHtml).toContain("Clear all");
      expect(dialogHtml).toContain("Show");
      expect(dialogHtml).toContain("products");
    });
  });
});
