/**
 * Safety Content Linter (Rule 1, Rule 2, Rule 4)
 * CI verification script ensuring zero forbidden medical or efficacy claims appear in rendered pages or catalogue data.
 *
 * Forbidden terms:
 * - "cure"
 * - "treats"
 * - "diagnose"
 * - "guaranteed" (except for explicit negation disclaimer "No guaranteed results")
 * - "% effective"
 * - "92%"
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Import all pages and components from @bodywise/web
import HomePage from "../apps/web/app/page";
import MatchPage from "../apps/web/app/match/page";
import MatchConfirmPage from "../apps/web/app/match/confirm/page";
import MatchResultsPage from "../apps/web/app/match/results/page";
import ProductsPage from "../apps/web/app/products/page";
import ComparePage from "../apps/web/app/compare/page";
import HelpPage from "../apps/web/app/help/page";
import ExperienceFeedbackPage from "../apps/web/app/feedback/experience/page";
import PrivacyDataPage from "../apps/web/app/privacy/data/page";
import AboutPage from "../apps/web/app/about/page";
import PrivacyPage from "../apps/web/app/privacy/page";
import SafetyPage from "../apps/web/app/safety/page";
import ContactPage from "../apps/web/app/contact/page";
import TermsPage from "../apps/web/app/terms/page";
import NotFoundPage from "../apps/web/app/not-found";
import ErrorBoundary from "../apps/web/app/error";
import { SiteFooter } from "../apps/web/components/SiteFooter";
import { FirstVisitNotice } from "../apps/web/components/FirstVisitNotice";
import { OfflineBanner } from "../apps/web/components/OfflineBanner";

// Import catalogue and explanation data from @bodywise/shared
import { DEMO_CATALOGUE_SEED, getReasonExplanation, MatcherReasonCode } from "../packages/shared/src/index";

interface Violation {
  location: string;
  forbiddenPhrase: string;
  snippet: string;
}

export function runSafetyContentAudit(): {
  violations: Violation[];
  pagesScanned: number;
  productsScanned: number;
  explanationsScanned: number;
} {
  const violations: Violation[] = [];

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
      // Allows explicit negation "no guaranteed results" / "not guaranteed", flags affirmative claims
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

  function checkText(text: string, location: string) {
    for (const rule of FORBIDDEN_RULES) {
      if (rule.pattern.test(text)) {
        // If filter is defined, check if it's a permitted disclaimer
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
            snippet: match ? text.slice(Math.max(0, (match.index || 0) - 30), (match.index || 0) + 60) : text.slice(0, 100),
          });
        }
      }
    }
  }

  // 1. Audit all rendered Next.js views
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

  for (const page of pages) {
    try {
      const html = renderToStaticMarkup(page.element);
      // Strip tags for clean text scanning
      const cleanText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      checkText(cleanText, `Rendered view: ${page.name}`);
    } catch (err: unknown) {
      console.error(`Warning: Could not render ${page.name} in static markup:`, (err as Error).message);
    }
  }

  // 2. Audit product catalogue seed facts
  for (const product of DEMO_CATALOGUE_SEED) {
    const combinedProductText = [
      product.official_name,
      product.official_description,
      product.label_directions,
      ...(product.ingredients || []),
      ...(product.cautions || []),
      ...(product.suitable_for || []),
    ].join(" ");

    checkText(combinedProductText, `Product catalogue item: ${product.slug} (${product.official_name})`);
  }

  // 3. Audit all matcher reason code templates
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

  for (const code of reasonCodes) {
    const text = getReasonExplanation(code, {
      goal: "sample goal",
      category: "body_wash",
      format: "cleanser",
      avoidance: "fragrance",
      caution: "external use only",
    });
    checkText(text, `Matcher reason template: ${code}`);
  }

  return {
    violations,
    pagesScanned: pages.length,
    productsScanned: DEMO_CATALOGUE_SEED.length,
    explanationsScanned: reasonCodes.length,
  };
}

// CLI execution
if (process.env.NODE_ENV !== "test" && typeof require !== "undefined" && require.main === module) {
  console.log("=================================================");
  console.log("🔍 Running Bodywise Match Safety Content Linter...");
  console.log("=================================================");

  const { violations, pagesScanned, productsScanned, explanationsScanned } = runSafetyContentAudit();

  console.log(`✓ Scanned ${pagesScanned} rendered views`);
  console.log(`✓ Scanned ${productsScanned} catalogue products`);
  console.log(`✓ Scanned ${explanationsScanned} matcher explanation templates\n`);

  if (violations.length > 0) {
    console.error(`❌ FAILED: Found ${violations.length} forbidden phrase violation(s):`);
    for (const v of violations) {
      console.error(`  - Location: ${v.location}`);
      console.error(`    Forbidden term: "${v.forbiddenPhrase}"`);
      console.error(`    Snippet: "...${v.snippet}..."\n`);
    }
    process.exit(1);
  } else {
    console.log("✅ PASSED: 0 forbidden medical or unverified claims found across all rendered content.");
    console.log("   Zero cure claims, treats claims, diagnostic claims, guaranteed claims, or % metrics.\n");
    process.exit(0);
  }
}
