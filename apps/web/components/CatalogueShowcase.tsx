"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { CATALOGUE_STATS } from "@/lib/catalogueStats";
import { useMotion } from "@/lib/motion";
import { ScrollReveal } from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

function CategoryIcon({ id, className = "w-6 h-6" }: { id: string; className?: string }) {
  const stroke = "currentColor";
  const strokeWidth = "1.75";

  switch (id) {
    case "body_wash":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <path d="M10 2h4v3h-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 5v3" strokeLinecap="round" />
          <path d="M14 3.5h3a1.5 1.5 0 011.5 1.5v0" strokeLinecap="round" />
          <path d="M7 8h10a2 2 0 012 2v9a3 3 0 01-3 3H8a3 3 0 01-3-3v-9a2 2 0 012-2z" strokeLinejoin="round" />
          <path d="M8 15c1.5-1 3-1 4.5 0s3 1 4.5 0" strokeLinecap="round" />
          <path d="M10 12h4" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "face_wash":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <rect x="7" y="8" width="10" height="13" rx="3" strokeLinejoin="round" />
          <path d="M10 4h4v4h-4z" strokeLinejoin="round" />
          <path d="M12 2v2" strokeLinecap="round" />
          <path d="M14 4h3a1.5 1.5 0 011.5 1.5" strokeLinecap="round" />
          <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
          <circle cx="13.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
          <circle cx="11" cy="18" r="0.8" fill="currentColor" stroke="none" opacity="0.4" />
        </svg>
      );
    case "serum":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <path d="M10 3h4v3h-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2v1" strokeLinecap="round" />
          <path d="M8 6h8a2 2 0 012 2v11a3 3 0 01-3 3H9a3 3 0 01-3-3V8a2 2 0 012-2z" strokeLinejoin="round" />
          <path d="M12 10v6" strokeLinecap="round" />
          <path d="M12 18.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shampoo":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <path d="M10 3h4v3h-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 6h10l-1 14a2 2 0 01-2 2H10a2 2 0 01-2-2L7 6z" strokeLinejoin="round" />
          <path d="M9 11c1.5 1 3 1 4.5 0" strokeLinecap="round" />
          <path d="M10.5 15c1.5 1 3 1 4.5 0" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "sunscreen":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5" strokeLinecap="round" />
          <path d="M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" strokeLinecap="round" opacity="0.75" />
        </svg>
      );
    case "supplement":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} className={className} aria-hidden="true">
          <rect x="5.5" y="4.5" width="13" height="15" rx="6.5" transform="rotate(45 12 12)" strokeLinejoin="round" />
          <path d="M8 12l8 0" strokeLinecap="round" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" opacity="0.7" />
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
    <section id="category-bento-grid" className="w-full mb-16 scroll-mt-24" aria-labelledby="browse-categories-heading">
      <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-sky/80 border border-brand-primary/15 text-brand-primary text-xs font-bold tracking-wide uppercase mb-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" weight="bold" aria-hidden="true" />
            <span>Verified Catalogue Directory</span>
          </div>
          <h2
            id="browse-categories-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight"
          >
            Explore by product category
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl mt-1.5 leading-relaxed">
            Clinically backed formulations organized by targeted wellness routines. Every product links directly to lab-verified facts and caution labels.
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-button bg-surface border border-border hover:border-brand-primary hover:bg-surface-sky/40 text-brand-deep hover:text-brand-primary text-sm font-semibold transition-all duration-200 shadow-sm group shrink-0 focus-ring"
        >
          <span>View all {CATALOGUE_STATS.totalProducts} products</span>
          <ArrowRight className="w-4 h-4 text-brand-primary transition-transform group-hover:translate-x-1" weight="bold" aria-hidden="true" />
        </Link>
      </ScrollReveal>

      {/* 4-column Bento grid: Row 1 has two 2-column flagship cards; Row 2 has four 1-column cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat, index) => {
          const isHero = index < 2;

          return (
            <ScrollReveal
              key={cat.id}
              delayMs={index * 50}
              className={cn(
                "h-full",
                isHero ? "lg:col-span-2" : "lg:col-span-1"
              )}
            >
              <Link
                href={`/products?category=${encodeURIComponent(cat.id)}`}
                data-cursor="explore"
                className={cn(
                  "group relative flex flex-col justify-between h-full rounded-card border transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated focus-ring overflow-hidden",
                  isHero
                    ? "p-6 sm:p-7 bg-gradient-to-br from-surface via-surface to-surface-sky/25 border-border hover:border-brand-primary/40 shadow-card"
                    : "p-5 sm:p-6 bg-surface border-border/90 hover:border-brand-primary/40 shadow-xs"
                )}
              >
                {/* Subtle top edge hairline on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Ambient corner light on hover */}
                <div
                  className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-surface-sky/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Card Top Row: Icon Badge + Badges & Count */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-button flex items-center justify-center transition-all duration-200 border shadow-2xs group-hover:scale-105",
                          isHero ? "w-13 h-13 p-3" : "w-11 h-11 p-2.5",
                          cat.theme?.iconBg || "bg-surface-sky",
                          cat.theme?.iconColor || "text-brand-primary",
                          cat.theme?.badgeBorder || "border-brand-primary/20"
                        )}
                      >
                        <CategoryIcon id={cat.id} className={isHero ? "w-7 h-7" : "w-6 h-6"} />
                      </div>

                      {isHero && cat.badge && (
                        <span
                          className={cn(
                            "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            cat.theme?.badgeBorder || "border-border",
                            cat.theme?.badgeText || "text-brand-deep",
                            cat.theme?.iconBg || "bg-surface-sky"
                          )}
                        >
                          {cat.badge}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper border border-border/80 text-xs font-bold text-brand-deep shadow-2xs group-hover:border-brand-primary/30 transition-colors shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                      <span>{cat.count} {cat.count === 1 ? "product" : "products"}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={cn(
                      "font-display font-bold text-brand-deep tracking-tight group-hover:text-brand-primary transition-colors",
                      isHero ? "text-xl sm:text-2xl mb-2" : "text-lg mb-1.5"
                    )}
                  >
                    {cat.label}
                  </h3>

                  <p
                    className={cn(
                      "text-charcoal/75 leading-relaxed",
                      isHero ? "text-sm sm:text-base mb-4" : "text-xs sm:text-sm mb-3 line-clamp-2"
                    )}
                  >
                    {cat.description}
                  </p>

                  {/* Active Highlight Tags */}
                  {cat.highlights && cat.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {cat.highlights.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 rounded-md bg-surface-sky/60 border border-brand-primary/10 text-[11px] font-medium text-brand-deep/90"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action CTA Footer with proper pluralization */}
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-primary group-hover:text-brand-primary-hover group-hover:underline pt-2 border-t border-border/50">
                  <span>{cat.pluralAction || `Browse ${cat.word}s`}</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1.5"
                    weight="bold"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
