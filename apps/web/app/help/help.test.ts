import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import HelpLandingPage from "./page";

describe("Help Center Landing (apps/web/app/help/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(HelpLandingPage));

  it("renders Title: 'Need help with an order or product?'", () => {
    expect(html).toContain("Need help with an order or product?");
  });

  it("renders Required Callout in Sage stating logistics boundary", () => {
    expect(html).toContain(
      "We can&#x27;t check your order, courier, payment or batch here. We can help you get your details ready and point you to official support."
    );
  });

  it("renders all 7 specific issue cards with direct navigation links", () => {
    expect(html).toContain("Delayed delivery");
    expect(html).toContain('href="/help/delayed-delivery"');

    expect(html).toContain("Failed delivery attempt");
    expect(html).toContain('href="/help/failed-delivery"');

    expect(html).toContain("Damaged or leaking package");
    expect(html).toContain('href="/help/damaged-package"');

    expect(html).toContain("Near-expiry concern");
    expect(html).toContain('href="/help/near-expiry"');

    expect(html).toContain("Payment uncertainty");
    expect(html).toContain('href="/help/payment-uncertainty"');

    expect(html).toContain("Unresolved support request");
    expect(html).toContain('href="/help/unresolved-support"');

    expect(html).toContain("Product reaction or tolerability");
    expect(html).toContain('href="/help/product-reaction"');
  });

  it("renders Official Support Channels box with source and last_checked metadata", () => {
    expect(html).toContain("Official Be Bodywise Support Channels");
    expect(html).toContain("Official Email Support");
    expect(html).toContain("support@bebodywise.com");
    expect(html).toContain("Official WhatsApp Support");
    expect(html).toContain("Be Bodywise Customer Care Portal");
    expect(html).toContain("checked 2026-11-01");
  });

  it("renders 'Clear my local data' button", () => {
    expect(html).toContain("Clear my local data");
  });
});
