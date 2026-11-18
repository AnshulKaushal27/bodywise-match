"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkle, X, Clock } from "@phosphor-icons/react/dist/ssr";

export interface SavedTrial {
  slug: string;
  name: string;
  saved_at: number;
  dismissed?: boolean;
  status?: "pending" | "shared" | "not_yet" | "not_tried" | "skipped";
}

export function TrialFollowupBanner() {
  const router = useRouter();
  const [activeTrial, setActiveTrial] = React.useState<SavedTrial | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("bodywise_saved_trials");
      if (!raw) return;

      const trials: SavedTrial[] = JSON.parse(raw);
      if (!Array.isArray(trials)) return;

      // Check query param for simulating 7 days in demo/tests
      const isSimulated = new URLSearchParams(window.location.search).get("simulate_7days") === "true";
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // Find the first trial that is eligible (>= 7 days or simulated, and NOT dismissed)
      const eligible = trials.find(
        (t) => !t.dismissed && (now - t.saved_at >= SEVEN_DAYS_MS || isSimulated)
      );

      if (eligible) {
        setActiveTrial(eligible);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleAction = (action: "share" | "not_yet" | "not_tried" | "skip") => {
    if (!activeTrial || typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("bodywise_saved_trials");
      const trials: SavedTrial[] = raw ? JSON.parse(raw) : [];

      // Update this trial: mark dismissed so it is NEVER shown again for this product
      const updated = trials.map((t) => {
        if (t.slug === activeTrial.slug) {
          return {
            ...t,
            dismissed: true,
            status: action === "share" ? "shared" : action === "not_yet" ? "not_yet" : action === "not_tried" ? "not_tried" : "skipped",
          };
        }
        return t;
      });

      localStorage.setItem("bodywise_saved_trials", JSON.stringify(updated));
      setActiveTrial(null);

      if (action === "share") {
        router.push(`/feedback/experience?slug=${encodeURIComponent(activeTrial.slug)}`);
      }
    } catch {
      setActiveTrial(null);
    }
  };

  if (!activeTrial) return null;

  return (
    <div
      role="region"
      aria-label="Product follow-up check-in"
      className="bg-brand-deep text-surface px-4 py-3.5 border-b-2 border-accent-lime shadow-md animate-slide-up"
    >
      <div className="max-w-container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkle className="w-5 h-5 text-accent-lime shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-display font-bold text-sm sm:text-base text-surface tracking-tight">
              How did it go with {activeTrial.name}?
            </p>
            <p className="text-xs text-surface-sage/90 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>You marked this product as trying 7+ days ago on this device.</span>
            </p>
          </div>
        </div>

        {/* Buttons: Share, Not yet, I didn't try it, Skip */}
        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
          <button
            type="button"
            onClick={() => handleAction("share")}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-accent-lime text-brand-deep hover:bg-surface focus-ring transition-colors"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => handleAction("not_yet")}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-evergreen text-surface hover:bg-brand-evergreen/80 border border-surface-sage/30 focus-ring transition-colors"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={() => handleAction("not_tried")}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-evergreen text-surface hover:bg-brand-evergreen/80 border border-surface-sage/30 focus-ring transition-colors"
          >
            I didn&apos;t try it
          </button>
          <button
            type="button"
            onClick={() => handleAction("skip")}
            aria-label="Skip check-in"
            className="p-1.5 rounded-full text-surface-sage hover:text-surface focus-ring"
            title="Skip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
