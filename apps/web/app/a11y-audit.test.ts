import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import { JSDOM } from "jsdom";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

import HomePage from "./page";
import MatchPage from "./match/page";
import MatchConfirmPage from "./match/confirm/page";
import MatchResultsPage from "./match/results/page";
import ProductsPage from "./products/page";
import { FilterDialog } from "./products/FilterDialog";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";
import ComparePage from "./compare/page";
import HelpPage from "./help/page";
import ExperienceFeedbackPage from "./feedback/experience/page";
import PrivacyDataPage from "./privacy/data/page";
import AboutPage from "./about/page";
import PrivacyPage from "./privacy/page";
import SafetyPage from "./safety/page";
import ContactPage from "./contact/page";
import TermsPage from "./terms/page";
import HowItWorksPage from "./how-it-works/page";
import SafeguardsPage from "./safeguards/page";
import NotFoundPage from "./not-found";
import ErrorBoundary from "./error";
import { FirstVisitNotice } from "@/components/FirstVisitNotice";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SiteFooter } from "@/components/SiteFooter";

async function runAxe(component: React.ReactElement): Promise<axe.AxeResults> {
  const html = renderToStaticMarkup(component);
  const dom = new JSDOM(
    `<!DOCTYPE html><html lang="en"><head><title>Accessibility Audit</title></head><body><main id="main">${html}</main></body></html>`,
    { runScripts: "outside-only" }
  );

  return axe.run(dom.window.document.documentElement, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      // Color contrast requires full layout rendering engine (CSS cascade, fonts, computed styles)
      // which is not available in static JSDOM; our tokens are verified in docs/design-system.md
      "color-contrast": { enabled: false },
    },
  });
}

describe("Comprehensive axe Accessibility Audit across All Views", () => {
  it("Landing Page (/) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(HomePage));
    if (results.violations.length > 0) {
      console.error("Home Page Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Step 1 Match (/match) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(MatchPage));
    if (results.violations.length > 0) {
      console.error("Match Step 1 Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Step 2 Confirm (/match/confirm) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(MatchConfirmPage));
    if (results.violations.length > 0) {
      console.error("Match Confirm Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Step 3 Results (/match/results) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(MatchResultsPage));
    if (results.violations.length > 0) {
      console.error("Match Results Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Catalogue Directory (/products) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(ProductsPage));
    if (results.violations.length > 0) {
      console.error("Products Page Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Catalogue Filter Dialog (open) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(
      React.createElement(FilterDialog, {
        isOpen: true,
        onClose: () => {},
        appliedFilters: {},
        onApply: () => {},
        products: DEMO_CATALOGUE_SEED,
        triggerRef: { current: null },
      })
    );
    if (results.violations.length > 0) {
      console.error("Filter Dialog Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Comparison Matrix (/compare) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(ComparePage));
    if (results.violations.length > 0) {
      console.error("Compare Page Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Help Center (/help) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(HelpPage));
    if (results.violations.length > 0) {
      console.error("Help Page Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Feedback Page (/feedback/experience) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(ExperienceFeedbackPage));
    if (results.violations.length > 0) {
      console.error("Feedback Page Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Data Governance (/privacy/data) has 0 WCAG AA accessibility violations", async () => {
    const results = await runAxe(React.createElement(PrivacyDataPage));
    if (results.violations.length > 0) {
      console.error("Privacy Data Axe Violations:", JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  it("Editorial Policies (/about, /privacy, /safety, /contact, /terms, /how-it-works, /safeguards) have 0 violations", async () => {
    for (const Comp of [AboutPage, PrivacyPage, SafetyPage, ContactPage, TermsPage, HowItWorksPage, SafeguardsPage]) {
      const results = await runAxe(React.createElement(Comp));
      if (results.violations.length > 0) {
        console.error("Static Policy Page Axe Violations:", JSON.stringify(results.violations, null, 2));
      }
      expect(results.violations).toEqual([]);
    }
  });

  it("Error & 404 Pages (/not-found, /error) have 0 WCAG AA violations", async () => {
    const notFoundResults = await runAxe(React.createElement(NotFoundPage));
    expect(notFoundResults.violations).toEqual([]);

    const errorResults = await runAxe(
      React.createElement(ErrorBoundary, {
        error: new Error("Test diagnostic error"),
        reset: vi.fn(),
      })
    );
    expect(errorResults.violations).toEqual([]);
  });

  it("Global Components (FirstVisitNotice, OfflineBanner, SiteFooter) have 0 violations", async () => {
    const footerResults = await runAxe(React.createElement(SiteFooter));
    expect(footerResults.violations).toEqual([]);

    const bannerResults = await runAxe(React.createElement(OfflineBanner));
    expect(bannerResults.violations).toEqual([]);

    const noticeResults = await runAxe(React.createElement(FirstVisitNotice));
    expect(noticeResults.violations).toEqual([]);
  });
});
