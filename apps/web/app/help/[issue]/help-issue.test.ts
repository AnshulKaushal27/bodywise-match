import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HELP_ISSUES } from "@bodywise/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { HelpIssueClient } from "./HelpIssueClient";

describe("Help Issue Dynamic Detail (apps/web/app/help/[issue]/HelpIssueClient.tsx)", () => {
  describe("Damaged or leaking package (/help/damaged-package)", () => {
    const config = HELP_ISSUES.find((i) => i.slug === "damaged-package")!;
    const html = renderToStaticMarkup(React.createElement(HelpIssueClient, { issueConfig: config }));

    it("renders title, checklist, user fields, and message template", () => {
      expect(html).toContain("Damaged or leaking package");
      expect(html).toContain("1. Step-by-Step Verification Checklist");
      expect(html).toContain("Captured clear photographs of outer cardboard box");
      expect(html).toContain("2. Prepare Your Specific Details");
      expect(html).toContain("Order ID");
      expect(html).toContain("Batch Code (from bottle bottom)");
      expect(html).toContain("3. Generated Support Message Template");
      expect(html).toContain("Copy Message");
    });

    it("obeys specific rule: never label a batch fake or expired from a photo", () => {
      expect(html).toContain("Never apply liquid from a shattered bottle");
      expect(html).toContain("We cannot label a batch counterfeit, fake, or expired from photos");
    });
  });

  describe("Payment uncertainty (/help/payment-uncertainty)", () => {
    const config = HELP_ISSUES.find((i) => i.slug === "payment-uncertainty")!;
    const html = renderToStaticMarkup(React.createElement(HelpIssueClient, { issueConfig: config }));

    it("helps user list wallet credit, discount, amount charged, and status with NO reconciliation claims", () => {
      expect(html).toContain("Total Amount Debited (INR)");
      expect(html).toContain("Wallet Credit Used");
      expect(html).toContain("Coupon Code Applied");
      expect(html).toContain("Bank Reference / UTR Number");
      expect(html).toContain("Order Status Observed");
      expect(html).toContain("We do not have access to payment gateway logs or merchant banking systems");
    });
  });

  describe("Product reaction or tolerability (/help/product-reaction)", () => {
    const config = HELP_ISSUES.find((i) => i.slug === "product-reaction")!;
    const html = renderToStaticMarkup(React.createElement(HelpIssueClient, { issueConfig: config }));

    it("obeys specific rule: neutral text 'Stop using the product and consult a qualified health professional if you have a significant reaction.'", () => {
      expect(html).toContain(
        "Stop using the product and consult a qualified health professional if you have a significant reaction."
      );
      expect(html).toContain("We provide zero clinical evaluations");
      expect(html).not.toContain("this will fix");
    });
  });

  describe("Unresolved support request (/help/unresolved-support)", () => {
    const config = HELP_ISSUES.find((i) => i.slug === "unresolved-support")!;
    const html = renderToStaticMarkup(React.createElement(HelpIssueClient, { issueConfig: config }));

    it("renders support escalation template with prior contact dates and issue summary", () => {
      expect(html).toContain("Previous Ticket ID / Subject");
      expect(html).toContain("Initial Contact Date");
      expect(html).toContain("Last Follow-Up Date");
      expect(html).toContain("Brief Summary of Unresolved Matter");
      expect(html).toContain("Escalation Request: Follow-up on Ticket");
    });
  });

  describe("Common features across all issues", () => {
    const config = HELP_ISSUES[0];
    const html = renderToStaticMarkup(React.createElement(HelpIssueClient, { issueConfig: config }));

    it("renders 'Clear my local data' button and official support channels", () => {
      expect(html).toContain("Clear my local data");
      expect(html).toContain("Official Email Support");
      expect(html).toContain("Official WhatsApp Support");
    });
  });
});
