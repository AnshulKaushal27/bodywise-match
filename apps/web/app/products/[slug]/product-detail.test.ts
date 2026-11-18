import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  notFound: vi.fn(),
}));

import { ProductDetailClient } from "./ProductDetailClient";

describe("Product Detail Route (apps/web/app/products/[slug])", () => {
  const sampleProduct = DEMO_CATALOGUE_SEED[0]; // Demo Body Wash A
  const html = renderToStaticMarkup(
    React.createElement(ProductDetailClient, { product: sampleProduct })
  );

  it("renders Section 1: Header with name, format, size, category, and Demo data badge", () => {
    expect(html).toContain("Demo Body Wash A");
    expect(html).toContain("Liquid Body Cleanser");
    expect(html).toContain("200ml");
    expect(html).toContain("Demo data");
    expect(html).toContain("body wash");
    expect(html).toContain("+ Add to Compare");
  });

  it("renders Section 2: 'Intended use (from official description)'", () => {
    expect(html).toContain("Intended use (from official description)");
    expect(html).toContain(sampleProduct.official_description);
  });

  it("renders Section 3: 'How to use (official label directions only)'", () => {
    expect(html).toContain("How to use (official label directions only)");
    expect(html).toContain(sampleProduct.label_directions);
  });

  it("renders Section 4: 'Ingredients' (shows 'Not verified yet' when null)", () => {
    expect(html).toContain("Ingredients");
    expect(html).toContain("Not verified yet");
  });

  it("renders Section 5: 'Cautions (official label only)' with packaging warnings", () => {
    expect(html).toContain("Cautions (official label only)");
    expect(html).toContain("For external use only.");
    expect(html).toContain("Avoid contact with eyes; rinse immediately if contact occurs.");
  });

  it("omits 'Why it matched / why it may not' when NOT arriving from a session", () => {
    // In server-rendered static markup without active sessionStorage, this section is omitted
    expect(html).not.toContain("Why it matched / why it may not");
  });

  it("renders Section 7: 'Customer experiences' panel badged with Demo data", () => {
    expect(html).toContain("Customer experiences");
    expect(html).toContain("Self-reported by");
    expect(html).toContain("Demo data");
  });

  it("renders Section 8: 'Need help after ordering?' panel linking to /help", () => {
    expect(html).toContain("Need help after ordering?");
    expect(html).toContain('href="/help"');
    expect(html).toContain("Open Order &amp; Product Issue Helper");
  });

  it("renders Section 9: Data-provenance footer showing source_url, last_verified_at, catalog_version", () => {
    expect(html).toContain("Data Provenance &amp; Verification");
    expect(html).toContain("Source Document");
    expect(html).toContain("Last Verified");
    expect(html).toContain("Catalog Version");
    expect(html).toContain(sampleProduct.catalog_version);
    expect(html).toContain(sampleProduct.id);
  });

  it("ensures sections appear in exact requested hierarchical order", () => {
    const intendedIdx = html.indexOf("Intended use (from official description)");
    const howToUseIdx = html.indexOf("How to use (official label directions only)");
    const ingredientsIdx = html.indexOf("Ingredients");
    const cautionsIdx = html.indexOf("Cautions (official label only)");
    const customerExpIdx = html.indexOf("Customer experiences");
    const needHelpIdx = html.indexOf("Need help after ordering?");
    const provenanceIdx = html.indexOf("Data Provenance &amp; Verification");

    expect(intendedIdx).toBeGreaterThan(-1);
    expect(howToUseIdx).toBeGreaterThan(intendedIdx);
    expect(ingredientsIdx).toBeGreaterThan(howToUseIdx);
    expect(cautionsIdx).toBeGreaterThan(ingredientsIdx);
    expect(customerExpIdx).toBeGreaterThan(cautionsIdx);
    expect(needHelpIdx).toBeGreaterThan(customerExpIdx);
    expect(provenanceIdx).toBeGreaterThan(needHelpIdx);
  });
});
