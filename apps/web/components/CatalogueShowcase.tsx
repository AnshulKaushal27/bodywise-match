"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { CATALOGUE_STATS } from "@/lib/catalogueStats";
import { useMotion } from "@/lib/motion";
import { ScrollReveal } from "@/components/ScrollReveal";

function CategoryIcon({ id }: { id: string }) {
  const stroke = "currentColor";
  const strokeWidth = "1.5";

  switch (id) {
    case "body_wash":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <path d="M9 3h6v3H9z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 6h10a2 2 0 012 2v11a3 3 0 01-3 3H8a3 3 0 01-3-3V8a2 2 0 012-2z" strokeLinejoin="round" />
          <path d="M12 11v6m-3-3h6" strokeLinecap="round" />
        </svg>
      );
    case "face_wash":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
          <path d="M9 9h.01M15 9h.01" strokeLinecap="round" strokeWidth="2.5" />
          <path d="M12 2v2m8 8h2M2 12h2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );
    case "serum":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <path d="M10 2h4v3h-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5h8a2 2 0 012 2v12a3 3 0 01-3 3H9a3 3 0 01-3-3V7a2 2 0 012-2z" strokeLinejoin="round" />
          <path d="M12 10v7m0 0l-2-2m2 2l2-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shampoo":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <path d="M10 4h4v3h-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 7h12l-1.5 13a2 2 0 01-2 1.8H9.5a2 2 0 01-2-1.8L6 7z" strokeLinejoin="round" />
          <path d="M9.5 12c1.5 1 3.5 1 5 0m-5 4c1.5 1 3.5 1 5 0" strokeLinecap="round" />
        </svg>
      );
    case "sunscreen":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" strokeLinecap="round" />
        </svg>
      );
    case "supplement":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className="w-6 h-6">
          <rect x="5" y="4" width="14" height="16" rx="7" transform="rotate(45 12 12)" strokeLinejoin="round" />
          <path d="M7 12l10 0" strokeLinecap="round" />
        </svg>
      );
  }
}

// 900ms count-up component
function CountUpNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { isMotionOn } = useMotion();
  const [val, setVal] = React.useState(isMotionOn ? 0 : target);
  const ref = React.useRef<HTMLSpanElement>(null);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!isMotionOn) {
      setVal(target);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const duration = 900;
            const startTime = performance.now();

            const frame = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // easeOutExpo
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              setVal(Math.round(eased * target));

              if (progress < 1) {
                requestAnimationFrame(frame);
              }
            };

            requestAnimationFrame(frame);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMotionOn, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

// Live Catalogue Stats Strip
export function CatalogueStatsStrip() {
  const { totalProducts, categoriesCount, percentVerified } = CATALOGUE_STATS;

  return (
    <ScrollReveal className="w-full mb-14">
      <div id="catalogue-stats-strip" className="rounded-card bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="grid grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto text-center md:text-left">
          {/* Stat 1: Products */}
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl sm:text-3xl text-brand-deep">
              <CountUpNumber target={totalProducts} />
            </span>
            <span className="text-xs sm:text-sm text-muted font-medium">Verified products</span>
          </div>

          {/* Stat 2: Categories */}
          <div className="flex flex-col border-x border-border/80 px-4 sm:px-8">
            <span className="font-display font-bold text-2xl sm:text-3xl text-brand-deep">
              <CountUpNumber target={categoriesCount} />
            </span>
            <span className="text-xs sm:text-sm text-muted font-medium">Active categories</span>
          </div>

          {/* Stat 3: Source Verification */}
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl sm:text-3xl text-brand-deep">
              <CountUpNumber target={percentVerified} suffix="%" />
            </span>
            <span className="text-xs sm:text-sm text-muted font-medium">Facts with dates</span>
          </div>
        </div>

        {/* Subtext provenance commitment */}
        <div className="flex items-center gap-3 bg-surface-sage/40 px-4 py-2.5 rounded-button border border-brand-deep/8 shrink-0">
          <ShieldCheck className="w-5 h-5 text-brand-evergreen shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-brand-deep">
            Every fact shows where it came from.
          </span>
        </div>
      </div>
    </ScrollReveal>
  );
}

// Category Tiles Bento Grid
export function CategoryBento() {
  const categories = CATALOGUE_STATS.realCategories;

  return (
    <section id="category-bento-grid" className="w-full mb-16" aria-labelledby="browse-categories-heading">
      <ScrollReveal className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block mb-1">
            Verified Directory
          </span>
          <h2
            id="browse-categories-heading"
            className="text-2xl sm:text-3xl font-bold font-display text-brand-deep tracking-tight"
          >
            Explore by product category
          </h2>
        </div>

        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-evergreen hover:text-brand-deep hover:underline focus-ring px-2.5 py-1.5 rounded"
        >
          <span>View all products</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </ScrollReveal>

      {/* Asymmetric / scrollable row on mobile; Bento grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory sm:snap-none -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar">
        {categories.map((cat, index) => {
          // Asymmetric bento styling: 1st card spans 2 cols on lg if desired
          const isFeatured = index === 0;

          return (
            <ScrollReveal
              key={cat.id}
              delayMs={index * 60}
              className={`shrink-0 w-[240px] sm:w-auto snap-center ${
                isFeatured ? "lg:col-span-2" : ""
              }`}
            >
              <Link
                href={`/products?category=${encodeURIComponent(cat.id)}`}
                data-cursor="explore"
                className={`group block h-full p-5 sm:p-6 rounded-card bg-surface border border-border hover:border-brand-evergreen transition-all duration-200 hover:-translate-y-1 shadow-card hover:shadow-elevated focus-ring relative overflow-hidden`}
              >
                {/* Subtle top-right accent badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-button bg-surface-sage/70 group-hover:bg-accent-lime/60 text-brand-evergreen group-hover:text-brand-deep flex items-center justify-center transition-colors border border-brand-deep/8">
                    <CategoryIcon id={cat.id} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-paper text-xs font-bold text-muted group-hover:text-brand-deep transition-colors">
                    {cat.count} {cat.count === 1 ? "product" : "products"}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-brand-deep mb-1 group-hover:text-brand-evergreen transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-charcoal/70 leading-relaxed mb-4">
                  {cat.description}
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-evergreen group-hover:underline">
                  <span>Browse {cat.word}s</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
