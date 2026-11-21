"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MagnifyingGlass, Play, Pause } from "@phosphor-icons/react";
import { useMotion } from "@/lib/motion";
import { CATALOGUE_STATS } from "@/lib/catalogueStats";

// Verified sample queries known to match real catalogue products
const VERIFIED_QUERIES = [
  "salicylic acid body wash for back acne",
  "niacinamide serum for dark spots and open pores",
  "anti-dandruff shampoo for flaky scalp",
  "broad spectrum sunscreen with no white cast",
  "chehre ke daag dhabbe aur tanning ke liye serum",
];

// Shared observer-backed state for user pause toggle of hero motion
const heroRotationListeners = new Set<(paused: boolean) => void>();
let isHeroRotationPausedGlobal = false;

function useHeroRotationPausedState() {
  const [paused, setPaused] = React.useState(isHeroRotationPausedGlobal);
  React.useEffect(() => {
    const l = (p: boolean) => setPaused(p);
    heroRotationListeners.add(l);
    return () => {
      heroRotationListeners.delete(l);
    };
  }, []);
  return {
    isPaused: paused,
    togglePaused: () => {
      const next = !isHeroRotationPausedGlobal;
      isHeroRotationPausedGlobal = next;
      setPaused(next);
      heroRotationListeners.forEach((listener) => listener(next));
    },
  };
}

export function HeroRotatingWord() {
  const { isMotionOn, isTabVisible } = useMotion();
  const { isPaused } = useHeroRotationPausedState();
  const words = CATALOGUE_STATS.heroWords;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const shouldAnimate =
    isMotionOn && isTabVisible && !isPaused && !isHovered && !isFocused;

  React.useEffect(() => {
    if (!shouldAnimate || words.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 250);
    }, 2600);

    return () => clearInterval(timer);
  }, [shouldAnimate, words.length]);

  const currentWord = words[currentIndex] || "product";

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Screen-reader accessible full category announcement */}
      <span className="sr-only">
        Not sure which {words.join(", ")} to choose?
      </span>

      {/* Visual Rotating Word with Lime Highlighter Swipe */}
      <span
        aria-hidden="true"
        data-hero-rotating-word
        className="relative inline-block px-2.5 py-0.5 mx-1 min-w-[135px] sm:min-w-[170px] text-center font-display font-bold text-brand-deep select-none"
      >
        {/* Lime Highlighter Underlay Swipe */}
        <span
          className={`absolute inset-0 bg-accent-lime rounded-md -z-10 transition-transform duration-[450ms] origin-left ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isTransitioning ? "scale-x-0" : "scale-x-100"
          }`}
          style={{ transformOrigin: "left center" }}
        />

        {/* Word with fade/slide */}
        <span
          className={`inline-block transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isTransitioning ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {currentWord}
        </span>
      </span>
    </span>
  );
}

export function HeroQueryInput() {
  const router = useRouter();
  const { isMotionOn, isTabVisible } = useMotion();
  const { isPaused, togglePaused } = useHeroRotationPausedState();
  const [userQuery, setUserQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [placeholderText, setPlaceholderText] = React.useState(VERIFIED_QUERIES[0]);

  // Animated typewriter placeholder loop
  React.useEffect(() => {
    // If motion is off, user has entered text, or field is focused: freeze on first query
    if (!isMotionOn || !isTabVisible || isFocused || userQuery.trim().length > 0) {
      if (!isMotionOn) setPlaceholderText(VERIFIED_QUERIES[0]);
      return;
    }

    let isMounted = true;
    let queryIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    function step() {
      if (!isMounted) return;
      const targetQuery = VERIFIED_QUERIES[queryIndex];

      if (!isDeleting) {
        // Typing forward
        charIndex++;
        setPlaceholderText(targetQuery.slice(0, charIndex));

        if (charIndex >= targetQuery.length) {
          // Pause at end of sentence
          isDeleting = true;
          timeoutId = setTimeout(step, 1600);
          return;
        }
        timeoutId = setTimeout(step, 45);
      } else {
        // Deleting backward
        charIndex--;
        setPlaceholderText(targetQuery.slice(0, charIndex));

        if (charIndex <= 0) {
          isDeleting = false;
          queryIndex = (queryIndex + 1) % VERIFIED_QUERIES.length;
          timeoutId = setTimeout(step, 400);
          return;
        }
        timeoutId = setTimeout(step, 20);
      }
    }

    timeoutId = setTimeout(step, 800);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isMotionOn, isTabVisible, isFocused, userQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveQuery = (userQuery.trim() || placeholderText).trim();
    if (!effectiveQuery) return;

    try {
      sessionStorage.setItem("bodywise_match_initial_query", effectiveQuery);
    } catch {
      // storage quota fallback
    }

    router.push(`/match?q=${encodeURIComponent(effectiveQuery)}`);
  };

  return (
    <form
      id="hero-query-form"
      onSubmit={handleSubmit}
      className="w-full max-w-xl mb-6 relative group"
      role="search"
      aria-label="Find product matches by concern or ingredient"
    >
      <div className="relative flex items-center rounded-button bg-surface border-2 border-brand-deep/15 shadow-ambient transition-all duration-200 focus-within:border-brand-evergreen focus-within:shadow-card p-1.5 sm:p-2">
        <MagnifyingGlass
          className="w-5 h-5 text-brand-evergreen ml-2.5 shrink-0"
          aria-hidden="true"
        />

        <input
          id="hero-query-input"
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? "" : placeholderText}
          aria-label="Describe what you want help choosing"
          className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-charcoal placeholder:text-muted/70 focus:outline-none min-h-[44px]"
        />

        <button
          type="submit"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep font-semibold text-sm transition-all shadow-soft active:scale-[0.98] focus-ring min-h-[44px]"
        >
          <span>Find my match</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-muted">
        <span>Try: salicylic acid, niacinamide, or dandruff shampoo</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Zero login &bull; Instant results</span>
          {isMotionOn && (
            <button
              type="button"
              onClick={togglePaused}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted hover:text-brand-deep hover:bg-surface-sage/50 focus-ring transition-colors"
              aria-label={isPaused ? "Resume category rotation" : "Pause category rotation"}
              title={isPaused ? "Resume rotation" : "Pause rotation"}
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-brand-evergreen" weight="fill" aria-hidden="true" />
              ) : (
                <Pause className="w-3 h-3 text-brand-evergreen" weight="fill" aria-hidden="true" />
              )}
              <span className="hidden md:inline">{isPaused ? "Resume" : "Pause"}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
