import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
import ComparePage from "./compare/page";
import HelpPage from "./help/page";
import ExperienceFeedbackPage from "./feedback/experience/page";
import PrivacyDataPage from "./privacy/data/page";
import AboutPage from "./about/page";
import PrivacyPage from "./privacy/page";
import SafetyPage from "./safety/page";
import ContactPage from "./contact/page";
import TermsPage from "./terms/page";
import NotFoundPage from "./not-found";
import ErrorBoundary from "./error";
import { FirstVisitNotice } from "@/components/FirstVisitNotice";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SiteFooter } from "@/components/SiteFooter";

import {
  DEMO_CATALOGUE_SEED,
  getReasonExplanation,
  MatcherReasonCode,
} from "@bodywise/shared";

interface Violation {
  location: string;
  forbiddenPhrase: string;
  snippet: string;
}

const FORBIDDEN_RULES = [
  {
    name: "cure",
    pattern: /\bcures?\b/i,
  },
  {
    name: "treats",
    pattern: /\btreats?\b/i,
  },
  {
    name: "diagnose",
    pattern: /\bdiagnos(e|ing)\b/i,
  },
  {
    name: "guaranteed",
    // Strictly allows explicit refusal disclaimer "no guaranteed results", flags any affirmative or marketing claim
    pattern: /\bguaranteed\b/i,
    filter: (matchText: string) => !matchText.toLowerCase().includes("no guaranteed results"),
  },
  {
    name: "% effective",
    pattern: /%\s*effective\b/i,
  },
  {
    name: "92%",
    pattern: /\b92%/i,
  },
];

function checkText(text: string, location: string): Violation[] {
  const violations: Violation[] = [];
  for (const rule of FORBIDDEN_RULES) {
    if (rule.pattern.test(text)) {
      if (rule.filter) {
        const match = text.match(rule.pattern);
        if (match && rule.filter(text)) {
          violations.push({
            location,
            forbiddenPhrase: rule.name,
            snippet: text.slice(Math.max(0, (match.index || 0) - 30), (match.index || 0) + 60),
          });
        }
      } else {
        const match = text.match(rule.pattern);
        violations.push({
          location,
          forbiddenPhrase: rule.name,
          snippet: match
            ? text.slice(Math.max(0, (match.index || 0) - 30), (match.index || 0) + 60)
            : text.slice(0, 100),
        });
      }
    }
  }
  return violations;
}

describe("Safety & Regulatory Compliance Content Audit (CI Guardrail)", () => {
  const pages: Array<{ name: string; element: React.ReactElement }> = [
    { name: "HomePage (/)", element: React.createElement(HomePage) },
    { name: "MatchPage (/match)", element: React.createElement(MatchPage) },
    { name: "MatchConfirmPage (/match/confirm)", element: React.createElement(MatchConfirmPage) },
    { name: "MatchResultsPage (/match/results)", element: React.createElement(MatchResultsPage) },
    { name: "ProductsPage (/products)", element: React.createElement(ProductsPage) },
    { name: "ComparePage (/compare)", element: React.createElement(ComparePage) },
    { name: "HelpPage (/help)", element: React.createElement(HelpPage) },
    { name: "ExperienceFeedbackPage (/feedback/experience)", element: React.createElement(ExperienceFeedbackPage) },
    { name: "PrivacyDataPage (/privacy/data)", element: React.createElement(PrivacyDataPage) },
    { name: "AboutPage (/about)", element: React.createElement(AboutPage) },
    { name: "PrivacyPage (/privacy)", element: React.createElement(PrivacyPage) },
    { name: "SafetyPage (/safety)", element: React.createElement(SafetyPage) },
    { name: "ContactPage (/contact)", element: React.createElement(ContactPage) },
    { name: "TermsPage (/terms)", element: React.createElement(TermsPage) },
    { name: "NotFoundPage (/not-found)", element: React.createElement(NotFoundPage) },
    {
      name: "ErrorBoundary (/error)",
      element: React.createElement(ErrorBoundary, {
        error: new Error("Test fallback"),
        reset: () => {},
      }),
    },
    { name: "SiteFooter", element: React.createElement(SiteFooter) },
    { name: "FirstVisitNotice", element: React.createElement(FirstVisitNotice) },
    { name: "OfflineBanner", element: React.createElement(OfflineBanner) },
  ];

  it.each(pages)("asserts $name contains 0 forbidden phrases ('cure', 'treats', 'diagnose', 'guaranteed', '% effective', '92%')", ({ name, element }) => {
    const html = renderToStaticMarkup(element);
    const cleanText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const violations = checkText(cleanText, name);
    if (violations.length > 0) {
      console.error(`Safety Violation in ${name}:`, violations);
    }
    expect(violations).toEqual([]);
  });

  it("asserts catalogue seed records contain 0 forbidden medical or efficacy claims", () => {
    const violations: Violation[] = [];
    for (const prod of DEMO_CATALOGUE_SEED) {
      const combined = [
        prod.official_name,
        prod.official_description,
        prod.label_directions,
        ...(prod.ingredients || []),
        ...(prod.cautions || []),
      ].join(" ");
      violations.push(...checkText(combined, `Catalogue: ${prod.slug}`));
    }
    expect(violations).toEqual([]);
  });

  it("asserts reason explanation templates contain 0 forbidden phrases", () => {
    const reasonCodes: MatcherReasonCode[] = [
      "EXACT_GOAL_MATCH",
      "RELATED_GOAL_MATCH",
      "CATEGORY_FIT",
      "FORMAT_PREFERENCE_MET",
      "AVOIDANCE_SATISFIED_VERIFIED",
      "UNVERIFIED_AVOIDANCE",
      "ROUTINE_COMPATIBLE",
      "MISSING_FACTS_NOTED",
      "CAUTION_APPLIED",
    ];

    const violations: Violation[] = [];
    for (const code of reasonCodes) {
      const text = getReasonExplanation(code, {
        goal: "sample goal",
        category: "serum",
        format: "solution",
        avoidance: "fragrance",
        caution: "external use only",
      });
      violations.push(...checkText(text, `Explanation: ${code}`));
    }
    expect(violations).toEqual([]);
  });
});
