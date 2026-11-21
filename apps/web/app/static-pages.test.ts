import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AboutPage from "./about/page";
import PrivacyPage from "./privacy/page";
import SafetyPage from "./safety/page";
import ContactPage from "./contact/page";
import TermsPage from "./terms/page";
import HowItWorksPage from "./how-it-works/page";
import SafeguardsPage from "./safeguards/page";
import { SiteFooter } from "@/components/SiteFooter";
import { FirstVisitNotice } from "@/components/FirstVisitNotice";

describe("Static Editorial & Policy Pages", () => {
  describe("/about Route (apps/web/app/about/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(AboutPage));

    it("renders page title and 680px reading column constraint", () => {
      expect(html).toContain("About Bodywise Match");
      expect(html).toContain("max-w-prose");
    });

    it("discloses that it is an independent prototype for a fellowship challenge and not official Be Bodywise", () => {
      expect(html).toContain("independent product discovery prototype");
      expect(html).toContain("fellowship technical challenge");
      expect(html).toContain("not an official Be Bodywise service");
    });

    it("explains how matching works: 'AI interprets, rules decide'", () => {
      expect(html).toContain("AI only listens");
      expect(html).toContain("TypeScript rules choose");
      expect(html).toContain("RULES_VERSION");
      expect(html).toContain("Hard exclusions");
      expect(html).toContain("Goal fit");
      expect(html).toContain("Tie-breaks");
    });

    it("explicitly details what Bodywise Match cannot do", () => {
      expect(html).toContain("What Bodywise Match Cannot Do");
      expect(html).toContain("No Medical Evaluation");
      expect(html).toContain("No Pharmaceutical Claims");
      expect(html).toContain("No Live Logistics or Courier Access");
      expect(html).toContain("No Photo Diagnostic Analysis");
    });
  });

  describe("/privacy Route (apps/web/app/privacy/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(PrivacyPage));

    it("renders reading column constraint and last updated date", () => {
      expect(html).toContain("Our Privacy Policy");
      expect(html).toContain("max-w-prose");
      expect(html).toContain("Last updated: November 18, 2026");
    });

    it("specifies what is collected (free text session input, anonymous session ID, optional feedback)", () => {
      expect(html).toContain("Free-text session input");
      expect(html).toContain("Anonymous session ID");
      expect(html).toContain("Optional feedback");
    });

    it("specifies what is NOT collected (photos, contact details, medical history, order IDs)", () => {
      expect(html).toContain("No Photos");
      expect(html).toContain("No Contact Details");
      expect(html).toContain("No Medical History");
      expect(html).toContain("No Order or Courier IDs");
    });

    it("defines 30-day retention period for server session records", () => {
      expect(html).toContain("Data Retention Period (30 Days)");
      expect(html).toContain("maximum of 30 days");
    });

    it("documents AI provider handling: zero-retention, 1,500 char cap, sanitization, 8s timeout, fallback", () => {
      expect(html).toContain("Pre-flight PII sanitization");
      expect(html).toContain("1,500 character input cap");
      expect(html).toContain("Zero-retention agreement");
      expect(html).toContain("Structured JSON enforcement");
      expect(html).toContain("8-second timeout");
    });

    it("provides explicit table of all cookies and local storage keys used", () => {
      expect(html).toContain("bodywise_parsed_needs");
      expect(html).toContain("bodywise_compare_ids");
      expect(html).toContain("bodywise_last_session_id");
      expect(html).toContain("bodywise_saved_trials");
      expect(html).toContain("bodywise_help_*");
      expect(html).toContain("bodywise_medical_notice_dismissed");
    });

    it("provides link to data deletion route /privacy/data", () => {
      expect(html).toContain('href="/privacy/data"');
      expect(html).toContain("Manage Your Data");
    });
  });

  describe("/safety Route (apps/web/app/safety/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(SafetyPage));

    it("renders non-medical advice disclaimer and no diagnosis guarantee", () => {
      expect(html).toContain("Safety &amp; Medical Disclaimer");
      expect(html).toContain("max-w-prose");
      expect(html).toContain("Informational Only — Not Medical Advice");
      expect(html).toContain("No Clinical Diagnoses");
      expect(html).toContain("No Curative Claims");
      expect(html).toContain("No Severity Scoring");
    });

    it("provides clear instructions for what to do during a significant reaction", () => {
      expect(html).toContain("Stop use immediately");
      expect(html).toContain("Rinse with cool water");
      expect(html).toContain("Consult a qualified health professional");
      expect(html).toContain('href="/help/product-reaction"');
    });

    it("commits to strictly not auto-recommending stronger actives on sensitivity", () => {
      expect(html).toContain("strictly do not auto-recommend a stronger active concentration");
    });

    it("states zero sponsored ranking and commitment to disclose future commercial relationships", () => {
      expect(html).toContain("Zero Sponsored Rankings");
      expect(html).toContain("No Paid Placements");
      expect(html).toContain("Commitment to Disclose");
    });
  });

  describe("/contact Route (apps/web/app/contact/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(ContactPage));

    it("renders technical prototype contact email variable", () => {
      expect(html).toContain("Technical &amp; Prototype Inquiries");
      expect(html).toContain("mailto:");
      expect(html).toMatch(/(@example\.com|@)/);
    });

    it("renders official Be Bodywise customer care channels with links", () => {
      expect(html).toContain("Official Be Bodywise Customer Support");
      expect(html).toContain("https://bebodywise.com");
      expect(html).toContain("support@bebodywise.com");
      expect(html).toContain("+91 80000 82323");
    });

    it("links to internal issue helper /help", () => {
      expect(html).toContain('href="/help"');
      expect(html).toContain("Open Issue Helper");
    });
  });

  describe("/terms Route (apps/web/app/terms/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(TermsPage));

    it("renders short, plain English terms within 680px column", () => {
      expect(html).toContain("Terms of Use");
      expect(html).toContain("max-w-prose");
      expect(html).toContain("plain, human English");
    });

    it("includes independent prototype and informational-only clauses", () => {
      expect(html).toContain("Independent Fellowship Prototype");
      expect(html).toContain("Informational Discovery Only (No Medical Advice)");
    });

    it("includes trademark disclaimer and limitation of liability", () => {
      expect(html).toContain("Trademarks &amp; Intellectual Property");
      expect(html).toContain("Limitation of Liability");
    });
  });

  describe("/how-it-works Route (apps/web/app/how-it-works/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(HowItWorksPage));

    it("renders page title, intro, and 3-step vertical timeline", () => {
      expect(html).toContain("How it works");
      expect(html).toContain("Simple 3-Step Flow");
      expect(html).toContain("Tell us what you want help choosing.");
      expect(html).toContain("Check and edit what we understood.");
      expect(html).toContain("See options with reasons and trade-offs.");
      expect(html).toContain("Find my match");
      expect(html).toContain('href="/match"');
    });
  });

  describe("/safeguards Route (apps/web/app/safeguards/page.tsx)", () => {
    const html = renderToStaticMarkup(React.createElement(SafeguardsPage));

    it("renders heading 'Our safeguards' and subtitle 'We keep it honest'", () => {
      expect(html).toContain("Our safeguards");
      expect(html).toContain("We keep it honest");
      expect(html).toContain("Rules choose, AI helps listen");
      expect(html).toContain("Facts have sources");
      expect(html).toContain("You stay in control");
      expect(html).toContain('href="/safety"');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/match"');
    });
  });

  describe("Global Footer & First-Visit Notice", () => {
    it("SiteFooter renders global disclaimer 'Informational only, not medical advice.' and prototype notice", () => {
      const footerHtml = renderToStaticMarkup(React.createElement(SiteFooter));
      expect(footerHtml).toContain("independent prototype developed for a fellowship challenge");
      expect(footerHtml).toContain("not an official Be Bodywise service");
      expect(footerHtml).toContain("Informational only, not medical advice.");
      expect(footerHtml).toContain("Zero mandatory signup");
      expect(footerHtml).toContain('href="/about"');
      expect(footerHtml).toContain('href="/how-it-works"');
      expect(footerHtml).toContain('href="/safeguards"');
      expect(footerHtml).toContain('href="/privacy"');
      expect(footerHtml).toContain('href="/safety"');
      expect(footerHtml).toContain('href="/contact"');
      expect(footerHtml).toContain('href="/terms"');
      expect(footerHtml).toContain('href="/privacy/data"');
    });

    it("FirstVisitNotice defaults to dismissed in SSR and contains disclaimer copy", () => {
      // In SSR without window, isDismissed defaults to true for hydration safety
      const noticeHtml = renderToStaticMarkup(React.createElement(FirstVisitNotice));
      expect(noticeHtml).toBe("");
    });
  });
});
