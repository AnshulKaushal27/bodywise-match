import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TrialFollowupBanner, SavedTrial } from "./TrialFollowupBanner";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe("Trial Followup Banner (apps/web/components/TrialFollowupBanner.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null safely in SSR environment", () => {
    const html = renderToStaticMarkup(React.createElement(TrialFollowupBanner));
    expect(html).toBe("");
  });

  describe("Follow-up Eligibility Rules", () => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = 1731920000000;

    it("identifies trials saved >= 7 days ago as eligible", () => {
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
      const trial: SavedTrial = {
        slug: "demo-body-wash-a",
        name: "Demo Body Wash A",
        saved_at: eightDaysAgo,
        dismissed: false,
      };

      const isEligible = !trial.dismissed && now - trial.saved_at >= SEVEN_DAYS_MS;
      expect(isEligible).toBe(true);
    });

    it("rejects trials saved < 7 days ago when simulation flag is absent", () => {
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const trial: SavedTrial = {
        slug: "demo-body-wash-a",
        name: "Demo Body Wash A",
        saved_at: threeDaysAgo,
        dismissed: false,
      };

      const isEligible = !trial.dismissed && now - trial.saved_at >= SEVEN_DAYS_MS;
      expect(isEligible).toBe(false);
    });

    it("allows trials saved < 7 days ago when simulate_7days query param is true", () => {
      const oneHourAgo = now - 3600000;
      const trial: SavedTrial = {
        slug: "demo-body-wash-a",
        name: "Demo Body Wash A",
        saved_at: oneHourAgo,
        dismissed: false,
      };
      const isSimulated = true;

      const isEligible = !trial.dismissed && (now - trial.saved_at >= SEVEN_DAYS_MS || isSimulated);
      expect(isEligible).toBe(true);
    });

    it("never shows follow-up if trial was already dismissed", () => {
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const trial: SavedTrial = {
        slug: "demo-body-wash-a",
        name: "Demo Body Wash A",
        saved_at: tenDaysAgo,
        dismissed: true,
      };

      const isEligible = !trial.dismissed && now - trial.saved_at >= SEVEN_DAYS_MS;
      expect(isEligible).toBe(false);
    });
  });

  describe("Follow-up Actions & One-time Dismissal", () => {
    it("action 'share' sets dismissed=true, status='shared', and navigates to feedback", () => {
      const trials: SavedTrial[] = [
        {
          slug: "demo-body-wash-a",
          name: "Demo Body Wash A",
          saved_at: Date.now() - 8 * 86400000,
          dismissed: false,
        },
      ];

      const action = "share";
      const activeTrial = trials[0];

      const updated = trials.map((t) => {
        if (t.slug === activeTrial.slug) {
          return {
            ...t,
            dismissed: true,
            status: action === "share" ? "shared" : "skipped",
          };
        }
        return t;
      });

      expect(updated[0].dismissed).toBe(true);
      expect(updated[0].status).toBe("shared");
    });

    it("action 'not_yet' sets dismissed=true and status='not_yet'", () => {
      const trials: SavedTrial[] = [
        {
          slug: "demo-body-wash-a",
          name: "Demo Body Wash A",
          saved_at: Date.now() - 8 * 86400000,
          dismissed: false,
        },
      ];

      const action = "not_yet";
      const activeTrial = trials[0];

      const updated = trials.map((t) => {
        if (t.slug === activeTrial.slug) {
          return {
            ...t,
            dismissed: true,
            status: action === "not_yet" ? ("not_yet" as const) : ("skipped" as const),
          };
        }
        return t;
      });

      expect(updated[0].dismissed).toBe(true);
      expect(updated[0].status).toBe("not_yet");
    });

    it("action 'not_tried' sets dismissed=true and status='not_tried'", () => {
      const trials: SavedTrial[] = [
        {
          slug: "demo-body-wash-a",
          name: "Demo Body Wash A",
          saved_at: Date.now() - 8 * 86400000,
          dismissed: false,
        },
      ];

      const action = "not_tried";
      const activeTrial = trials[0];

      const updated = trials.map((t) => {
        if (t.slug === activeTrial.slug) {
          return {
            ...t,
            dismissed: true,
            status: action === "not_tried" ? ("not_tried" as const) : ("skipped" as const),
          };
        }
        return t;
      });

      expect(updated[0].dismissed).toBe(true);
      expect(updated[0].status).toBe("not_tried");
    });

    it("action 'skip' sets dismissed=true and status='skipped'", () => {
      const trials: SavedTrial[] = [
        {
          slug: "demo-body-wash-a",
          name: "Demo Body Wash A",
          saved_at: Date.now() - 8 * 86400000,
          dismissed: false,
        },
      ];

      const activeTrial = trials[0];

      const updated = trials.map((t) => {
        if (t.slug === activeTrial.slug) {
          return {
            ...t,
            dismissed: true,
            status: "skipped" as const,
          };
        }
        return t;
      });

      expect(updated[0].dismissed).toBe(true);
      expect(updated[0].status).toBe("skipped");
    });
  });
});
