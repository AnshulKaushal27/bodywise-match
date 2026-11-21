"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useMotion } from "@/lib/motion";
import { CATALOGUE_STATS } from "@/lib/catalogueStats";
import { parseSearchToFilterParams } from "@bodywise/shared";
import { parseFilterIntent } from "@/lib/api";
import { ProductCameraModal } from "./ProductCameraModal";
import { AnimatedCameraIcon } from "./AnimatedCameraIcon";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const typed = userQuery.trim();
    if (typed) {
      try {
        sessionStorage.setItem("bodywise_match_initial_query", typed);
        sessionStorage.setItem("bodywise_match_draft", typed);
      } catch {
        // storage quota fallback
      }

      try {
        const intent = await parseFilterIntent(typed);
        const params = new URLSearchParams();
        if (intent.criteria.search) {
          params.set("q", intent.criteria.search);
        }
        if (intent.criteria.categories && intent.criteria.categories.length > 0) {
          params.set("category", intent.criteria.categories.join(","));
        }
        if (intent.criteria.goals && intent.criteria.goals.length > 0) {
          params.set("goal", intent.criteria.goals.join(","));
        }
        if (intent.criteria.formats && intent.criteria.formats.length > 0) {
          params.set("format", intent.criteria.formats.join(","));
        }
        if (intent.criteria.fragrance && intent.criteria.fragrance !== "all") {
          params.set("fragrance", intent.criteria.fragrance);
        }
        const qs = params.toString();
        router.push(qs ? `/products?${qs}` : "/products");
        return;
      } catch {
        // Fallback
        const criteria = parseSearchToFilterParams(typed);
        const params = new URLSearchParams();
        if (criteria.search) params.set("q", criteria.search);
        if (criteria.categories && criteria.categories.length > 0) params.set("category", criteria.categories.join(","));
        if (criteria.goals && criteria.goals.length > 0) params.set("goal", criteria.goals.join(","));
        if (criteria.formats && criteria.formats.length > 0) params.set("format", criteria.formats.join(","));
        if (criteria.fragrance && criteria.fragrance !== "all") params.set("fragrance", criteria.fragrance);
        const qs = params.toString();
        router.push(qs ? `/products?${qs}` : "/products");
        return;
      }
    }

    // If user submits empty, clear previous drafts and go to /products cleanly
    try {
      sessionStorage.removeItem("bodywise_match_initial_query");
      sessionStorage.removeItem("bodywise_match_draft");
      sessionStorage.removeItem("bodywise_match_goal");
    } catch {
      // storage quota fallback
    }
    router.push("/products");
  };

  const [isCameraOpen, setIsCameraOpen] = React.useState(false);

  return (
    <>
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

          {/* Camera Scan Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            aria-label="Scan a product with camera or photo"
            title="Scan a product with camera or photo"
            className="group shrink-0 p-2 text-brand-deep/70 hover:text-brand-primary hover:bg-surface-sage/80 rounded-button transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring mr-1.5"
          >
            <AnimatedCameraIcon className="w-5 h-5 text-brand-primary" />
            <span className="sr-only">Scan a product with camera</span>
          </button>

          <button
            type="submit"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep font-semibold text-sm transition-all shadow-soft active:scale-[0.98] focus-ring min-h-[44px]"
          >
            <span>Find my match</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* Visual Product Matcher Modal */}
      <ProductCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />
    </>
  );
}

export function HeroScanButton() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex items-center gap-2.5 px-4 sm:px-5 h-11 rounded-button bg-surface hover:bg-gradient-to-r hover:from-surface hover:via-surface-sage/30 hover:to-surface-sage/60 border border-brand-primary/25 hover:border-brand-primary/60 text-brand-deep font-semibold text-sm sm:text-base shadow-2xs hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-safe:transition-all duration-200 focus-ring overflow-hidden select-none"
      >
        {/* Soft Ambient Light Sheen sweep on hover */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full motion-safe:transition-transform duration-700 ease-out pointer-events-none"
        />

        {/* Tactile Icon Housing Badge with Animated Camera SVG */}
        <span className="w-7 h-7 rounded-[9px] bg-surface-sage/80 group-hover:bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary transition-colors duration-200 shrink-0 shadow-2xs">
          <AnimatedCameraIcon className="w-4 h-4 text-brand-primary" />
        </span>

        {/* Button Label */}
        <span className="font-semibold text-brand-deep group-hover:text-brand-primary transition-colors duration-150">
          Scan a product
        </span>
      </button>

      <ProductCameraModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
