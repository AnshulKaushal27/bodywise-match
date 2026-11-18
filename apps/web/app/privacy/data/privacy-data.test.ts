import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import PrivacyDataPage from "./page";

describe("Privacy & Data Management Route (apps/web/app/privacy/data/page.tsx)", () => {
  const html = renderToStaticMarkup(React.createElement(PrivacyDataPage));

  it("renders page header and privacy description", () => {
    expect(html).toContain("Your Privacy &amp; Data Management");
    expect(html).toContain("User Control Center");
    expect(html).toContain("Inspect, export, or permanently erase all data stored in your local browser");
  });

  it("renders Section 1: Local Data Stored on this Device with key categories", () => {
    expect(html).toContain("1. Local Data Stored on this Device");
    expect(html).toContain("Stated Concern &amp; Goals");
    expect(html).toContain("Product Comparison Shortlist");
    expect(html).toContain("Saved Product Trials");
    expect(html).toContain("Help Centre Drafts &amp; Checklists");
    expect(html).toContain("Inspect Raw JSON Storage");
  });

  it("renders Section 2: Export and Delete Local Data buttons", () => {
    expect(html).toContain("2. Export or Delete Local Data");
    expect(html).toContain("Export my local data (JSON)");
    expect(html).toContain("Delete all local data");
  });

  it("renders Section 3: Delete Server Session by ID form", () => {
    expect(html).toContain("3. Delete Server Session by ID");
    expect(html).toContain("Anonymous Session / Request ID");
    expect(html).toContain("Delete server session");
    expect(html).toContain("placeholder=\"e.g. session_1731920192_abcde\"");
  });

  it("renders honesty & privacy safeguards banner", () => {
    expect(html).toContain("Honesty &amp; Privacy Safeguards");
    expect(html).toContain("zero signup required");
    expect(html).toContain("redact request bodies");
  });

  it("disables export and delete buttons when storage is initially empty", () => {
    // Buttons should have disabled attribute in SSR empty state
    expect(html).toContain("disabled=\"\"");
  });
});
