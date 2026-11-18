import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { CustomerExperiences } from "./CustomerExperiences";

describe("CustomerExperiences Component (apps/web/components/CustomerExperiences.tsx)", () => {
  describe("When N >= 5 (Full summary bars and individual reports)", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerExperiences, {
        productSlug: "demo-body-wash-a",
        productName: "Demo Body Wash A",
      })
    );

    it("renders Header: 'Self-reported by N customers, source, date range'", () => {
      expect(html).toContain("Self-reported by");
      expect(html).toContain("6"); // 6 published with consent=true
      expect(html).toContain("customers");
      expect(html).toContain("Source:");
      expect(html).toContain("Beta User Cohort");
      expect(html).toContain("Date range:");
    });

    it("renders native SVG/CSS 3 columns/bars for positive, neutral, negative with counts and NO star scores", () => {
      expect(html).toContain("role=\"progressbar\"");
      expect(html).toContain("Positive");
      expect(html).toContain("Neutral");
      expect(html).toContain("Negative");
      expect(html).toContain("Zero star scores");
      expect(html).not.toContain("★★★★★");
      expect(html).not.toContain("5-star");
    });

    it("renders required transparency banner", () => {
      expect(html).toContain(
        "Self-reported experiences are not proof a product works and may differ for you."
      );
    });

    it("renders Demo data badge in lime for sample items", () => {
      expect(html).toContain("Demo data");
    });

    it("renders 'Report this' and 'Share your experience' links", () => {
      expect(html).toContain("Report this");
      expect(html).toContain("Share your experience");
      expect(html).toContain('href="/feedback/experience?slug=demo-body-wash-a"');
    });

    it("strictly filters out records with publication_consent = false or moderation_status != 'published'", () => {
      expect(html).not.toContain("Should not appear because consent is false");
      expect(html).not.toContain("Should not appear because pending moderation");
    });
  });

  describe("When N < 5 ('Too few reports to summarise' with cards only)", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerExperiences, {
        productSlug: "demo-exfoliating-wash-b",
        productName: "Demo Exfoliating Wash B",
      })
    );

    it("shows 'Too few reports to summarise' callout instead of outcome bars", () => {
      expect(html).toContain("Too few reports to summarise");
      expect(html).not.toContain("role=\"progressbar\"");
    });

    it("lists individual cards with duration, consistency, and comfort", () => {
      expect(html).toContain("Moderated Customer Reports (3)");
      expect(html).toContain("Duration:");
      expect(html).toContain("Usage:");
      expect(html).toContain("Comfort:");
    });
  });

  describe("When N = 0 (EmptyState 'No verified community data yet.')", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerExperiences, {
        productSlug: "demo-scalp-oil-d",
        productName: "Demo Scalp Oil D",
      })
    );

    it("renders EmptyState with 'No verified community data yet.'", () => {
      expect(html).toContain("No verified community data yet.");
      expect(html).toContain("Share your experience");
    });

    it("still renders the mandatory transparency notice banner", () => {
      expect(html).toContain(
        "Self-reported experiences are not proof a product works and may differ for you."
      );
    });
  });
});
