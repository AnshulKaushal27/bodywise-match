import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCameraModal } from "./ProductCameraModal";

describe("ProductCameraModal Component", () => {
  it("renders null when isOpen is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(ProductCameraModal, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );
    expect(html).toBe("");
  });

  it("renders modal structure, trust banner, and presets when isOpen is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(ProductCameraModal, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    // Modal title & subtitle
    expect(html).toContain("Visual Product Matcher");
    expect(html).toContain("Scan any product bottle to find equivalent Be Bodywise formulas");

    // Camera & Upload tabs
    expect(html).toContain("Live Camera");
    expect(html).toContain("Upload / Photo");

    // Preset chips
    expect(html).toContain("Minimalist 2% Salicylic Acid Face Wash");
    expect(html).toContain("Minimalist 10% Niacinamide Serum");
    expect(html).toContain("Minimalist SPF 50 Multi-Vitamin Sunscreen");
    expect(html).toContain("Sebamed Anti-Dandruff Shampoo");
  });
});
