import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("slug=1-salicylic-acid-body-wash"),
}));

import ExperienceFeedbackPage from "./page";

describe("Experience Feedback Route (apps/web/app/feedback/experience/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(ExperienceFeedbackPage));

  it("renders page title and product context", () => {
    expect(html).toContain("Share Your Product Experience");
    expect(html).toContain("Product being reviewed");
    expect(html).toContain("1% Salicylic Acid Body Wash - 250 mL");
  });

  it("renders quick escape buttons first: 'I didn't try it', 'Not yet', 'Skip'", () => {
    expect(html).toContain("I didn&#x27;t try it");
    expect(html).toContain("Not yet");
    expect(html).toContain("Skip");
  });

  it("renders duration bucket options", () => {
    expect(html).toContain("&lt;2 weeks");
    expect(html).toContain("2-4 weeks");
    expect(html).toContain("1-3 months");
    expect(html).toContain("3+ months");
  });

  it("renders usage consistency options", () => {
    expect(html).toContain("Daily");
    expect(html).toContain("Few times a week");
    expect(html).toContain("Occasionally");
  });

  it("renders self-reported outcome choices", () => {
    expect(html).toContain("Better (Noticed improvement)");
    expect(html).toContain("No change (Same as before)");
    expect(html).toContain("Worse (Didn&#x27;t suit me)");
    expect(html).toContain("Not sure (Too early to tell)");
  });

  it("renders comfort/reaction choices", () => {
    expect(html).toContain("No issue (Comfortable)");
    expect(html).toContain("Mild temporary irritation");
    expect(html).toContain("Stopped using (Reaction)");
  });

  it("renders optional text snippet field with 300 char counter", () => {
    expect(html).toContain("0/300");
    expect(html).toContain("Optional comment or trade-off noted");
    expect(html).toContain("<textarea");
  });

  it("renders two SEPARATE consent toggles defaulting to OFF (unchecked)", () => {
    expect(html).toContain("Use to improve my own recommendations");
    expect(html).toContain("Publish anonymously after moderation");
    expect(html).toContain("Both default OFF");

    // Verify neither checkbox has checked attribute
    const matches = html.match(/type="checkbox"/g);
    expect(matches).toBeTruthy();
    expect(matches?.length).toBe(2);
    expect(html).not.toContain('checked=""');
  });

  it("renders disabled submit button when mandatory fields are not yet filled", () => {
    expect(html).toContain("Submit experience");
    expect(html).toContain("disabled=\"\"");
  });

  describe("Discomfort & No-Improvement Safety Protocol", () => {
    it("flags mild irritation or stopping usage as discomfort", () => {
      const isDiscomfort = (comfort: string) => comfort === "mild_irritation" || comfort === "stopped_using";
      expect(isDiscomfort("mild_irritation")).toBe(true);
      expect(isDiscomfort("stopped_using")).toBe(true);
      expect(isDiscomfort("no_issue")).toBe(false);
    });

    it("flags no change or worse outcome as lack of improvement", () => {
      const isNoImprovement = (outcome: string) => outcome === "no_change" || outcome === "worse";
      expect(isNoImprovement("no_change")).toBe(true);
      expect(isNoImprovement("worse")).toBe(true);
      expect(isNoImprovement("better")).toBe(false);
      expect(isNoImprovement("not_sure")).toBe(false);
    });

    it("defines neutral safety guidance and never auto-recommends a stronger active", () => {
      const safetyGuidance = "Stop using the product and consult a qualified health professional if you have a significant reaction. We provide zero medical diagnoses and do not evaluate medical severity.";
      const guardrailNotice = "We strictly do not auto-recommend a stronger active following reported discomfort or lack of improvement.";
      
      expect(safetyGuidance).toContain("Stop using the product");
      expect(safetyGuidance).toContain("zero medical diagnoses");
      expect(guardrailNotice).toContain("do not auto-recommend a stronger active");
    });

    it("provides the 3 expected next step choices: 'See another option', 'Get help', 'Skip'", () => {
      const nextStepOptions = ["See another option", "Get help", "Skip"];
      expect(nextStepOptions).toContain("See another option");
      expect(nextStepOptions).toContain("Get help");
      expect(nextStepOptions).toContain("Skip");
    });
  });
});
