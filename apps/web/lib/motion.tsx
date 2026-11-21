"use client";

import * as React from "react";

export const MOTION_TOKENS = {
  durations: {
    fast: "150ms",
    normal: "250ms",
    moderate: "400ms",
    slow: "700ms",
  },
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  stagger: 60, // ms
} as const;

interface MotionContextType {
  isMotionOn: boolean;
  toggleMotion: () => void;
  isReducedPreference: boolean;
  isTabVisible: boolean;
}

const MotionContext = React.createContext<MotionContextType>({
  isMotionOn: true,
  toggleMotion: () => {},
  isReducedPreference: false,
  isTabVisible: true,
});

const STORAGE_KEY = "bodywise_motion_preference";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [isReducedPreference, setIsReducedPreference] = React.useState(false);
  const [userOverride, setUserOverride] = React.useState<"on" | "off" | null>(null);
  const [isTabVisible, setIsTabVisible] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Read OS preference and stored override on mount
  React.useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedPreference(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsReducedPreference(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "on" || stored === "off") {
        setUserOverride(stored);
      }
    } catch {
      // localStorage may be disabled
    }

    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Determine active motion status: user override takes precedence over OS preference
  const isMotionOn = mounted
    ? userOverride !== null
      ? userOverride === "on"
      : !isReducedPreference
    : true;

  // Sync data-motion attribute to document element
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-motion", isMotionOn ? "on" : "off");
    }
  }, [isMotionOn]);

  const toggleMotion = React.useCallback(() => {
    setUserOverride((prev) => {
      const next = prev === "off" || (prev === null && isReducedPreference) ? "on" : "off";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // storage fallback
      }
      return next;
    });
  }, [isReducedPreference]);

  return (
    <MotionContext.Provider
      value={{
        isMotionOn,
        toggleMotion,
        isReducedPreference,
        isTabVisible,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* Button micro-interactions: 150ms hover lift 1px and :active scale 0.98 */
        html[data-motion="on"] button:not([disabled]):not([data-no-motion]),
        html[data-motion="on"] a.rounded-button:not([disabled]),
        html[data-motion="on"] a[role="button"]:not([disabled]) {
          transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        html[data-motion="on"] button:not([disabled]):not([data-no-motion]):hover,
        html[data-motion="on"] a.rounded-button:not([disabled]):hover {
          transform: translateY(-1px);
        }
        html[data-motion="on"] button:not([disabled]):not([data-no-motion]):active,
        html[data-motion="on"] a.rounded-button:not([disabled]):active {
          transform: translateY(0) scale(0.98);
        }

        /* Chips: pop (scale 1.04 to 1) on select and check icon fade in */
        @keyframes chipPopAnim {
          0% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes checkFadeInAnim {
          0% { opacity: 0; transform: scale(0.75); }
          100% { opacity: 1; transform: scale(1); }
        }
        html[data-motion="on"] [role="checkbox"][aria-checked="true"],
        html[data-motion="on"] button[aria-pressed="true"] {
          animation: chipPopAnim 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        html[data-motion="on"] [role="checkbox"][aria-checked="true"] svg,
        html[data-motion="on"] button[aria-pressed="true"] svg {
          animation: checkFadeInAnim 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Lime outline flash for updated chips on confirm page (600ms) */
        @keyframes limeChipFlash {
          0% { box-shadow: 0 0 0 0 rgba(217, 238, 155, 0); }
          30% { box-shadow: 0 0 0 3px rgba(217, 238, 155, 0.95); }
          100% { box-shadow: 0 0 0 0 rgba(217, 238, 155, 0); }
        }
        html[data-motion="on"] .chip-flash-lime {
          animation: limeChipFlash 600ms cubic-bezier(0.16, 1, 0.3, 1) 1;
        }

        /* Results card staggered entry (60ms stagger) */
        @keyframes cardStaggerIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html[data-motion="on"] .result-card-stagger {
          animation: cardStaggerIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Match label pill slide in */
        @keyframes pillSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        html[data-motion="on"] .result-pill-slide {
          animation: pillSlideIn 350ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Marker underline for quoted evidence in results */
        .marker-underline-lime {
          background-image: linear-gradient(120deg, rgba(217, 238, 155, 0.7) 0%, rgba(217, 238, 155, 0.7) 100%);
          background-repeat: no-repeat;
          background-size: 100% 40%;
          background-position: 0 90%;
        }

        /* Skeletons shimmer while loading (stops under reduced motion) */
        @keyframes skeletonShimmerAnim {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        html[data-motion="on"] .skeleton-shimmer {
          background: linear-gradient(90deg, #E2E8E4 25%, #EFF4F0 50%, #E2E8E4 75%);
          background-size: 200% 100%;
          animation: skeletonShimmerAnim 1.6s infinite ease-in-out;
        }
        html[data-motion="off"] .skeleton-shimmer {
          animation: none !important;
          background: #E2E8E4;
        }

        /* Global Kill Switch: When motion is off or reduced */
        html[data-motion="off"] *,
        html[data-motion="off"] *::before,
        html[data-motion="off"] *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `}} />
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  return React.useContext(MotionContext);
}

export function ReduceMotionToggle({ className }: { className?: string }) {
  const { isMotionOn, toggleMotion } = useMotion();

  return (
    <button
      type="button"
      onClick={toggleMotion}
      aria-pressed={!isMotionOn}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[44px] ${
        !isMotionOn
          ? "bg-accent-lime text-brand-deep border-brand-deep/20 font-bold"
          : "bg-surface-sage/40 hover:bg-surface-sage text-brand-deep border-brand-deep/10"
      } ${className || ""}`}
    >
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          !isMotionOn ? "bg-amber-600" : "bg-brand-primary"
        }`}
        aria-hidden="true"
      />
      <span>Motion: {isMotionOn ? "Normal" : "Reduced"}</span>
    </button>
  );
}
