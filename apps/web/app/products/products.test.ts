import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/products",
}));

import ProductsPage from "./page";
import { FilterDialog } from "./FilterDialog";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

describe("Catalogue Directory Route (apps/web/app/products/page.tsx)", () => {
  it("renders header, directory title, and description", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("Catalogue Directory");
    expect(html).toContain("Browse Product Catalogue");
    expect(html).toContain("Explore verified product facts");
  });

  it("renders search input box with placeholder and min-h-[52px]", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain('placeholder="Search by product name, goal, format, or ingredient..."');
    expect(html).toContain('type="text"');
    expect(html).toContain("min-h-[52px]");
  });

  it("renders the secondary 'Filters' button with dialog accessibility attributes", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Filters");
  });

  it("does NOT render the old always-open filter card on the page", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).not.toContain("Filter by Attributes");
  });

  it("renders verified product cards with format, size, and View details link", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("1% Salicylic Acid Body Wash - 250 mL");
    expect(html).toContain("Liquid body wash");
    expect(html).toContain("250 mL");
    expect(html).toContain("View details");
    expect(html).toContain('href="/products/1-salicylic-acid-body-wash"');
  });

  it("renders quick compare checkbox for each product card", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("Compare");
    expect(html).toContain('type="checkbox"');
  });

  it("renders link to comparison tool", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("Open Comparison Tool");
    expect(html).toContain('href="/compare"');
  });

  it("does not show separation divider when no filters are active", () => {
    mockSearchParams = new URLSearchParams();
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).not.toContain("Other Catalogue Products");
    expect(html).not.toContain("Outside active filter");
  });

  it("displays matching products AND non-matching products with separation when filters are active", () => {
    mockSearchParams = new URLSearchParams("category=roll_on");
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("Showing <strong class=\"text-brand-deep\">19</strong>");
    expect(html).toContain("matching active filters");
    expect(html).toContain("88 other in catalogue");
    expect(html).toContain("Matching Filters");
    // Separation divider
    expect(html).toContain("Other Catalogue Products");
    expect(html).toContain("(88)");
    expect(html).toContain("Outside active filter");
  });

  it("shows friendly callout and all other products under separation when 0 products match active filter", () => {
    mockSearchParams = new URLSearchParams("q=completelyunmatchedterm999");
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    expect(html).toContain("No products match your active filters");
    expect(html).toContain("Other Catalogue Products");
    expect(html).toContain("(107)");
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
