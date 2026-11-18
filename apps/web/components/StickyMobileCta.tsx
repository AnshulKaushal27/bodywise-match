"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "./ui/Button";
import { cn } from "@/lib/utils";

interface StickyMobileCtaProps {
  heroElementId?: string;
}

export function StickyMobileCta({ heroElementId = "hero-section" }: StickyMobileCtaProps) {
  const [showSticky, setShowSticky] = React.useState(false);

  React.useEffect(() => {
    const heroEl = document.getElementById(heroElementId);
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when hero is scrolled past (not intersecting)
        setShowSticky(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    observer.observe(heroEl);

    return () => {
      observer.disconnect();
    };
  }, [heroElementId]);

  if (!showSticky) return null;

  return (
    <div
      role="complementary"
      aria-label="Quick match actions"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border p-3 px-4 shadow-lg transition-transform duration-300 ease-in-out"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-lime/60 flex items-center justify-center text-brand-deep">
            <Sparkle className="w-4 h-4 text-brand-evergreen" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-brand-deep">Ready to explore?</span>
            <span className="text-[11px] text-muted leading-tight">No signup • 2 mins</span>
          </div>
        </div>
        <Link
          href="/match"
          className={cn(
            "flex-1 max-w-[180px] text-sm font-semibold py-2.5 h-11 min-h-[44px]",
            buttonVariants({ variant: "primary", size: "default" })
          )}
        >
          Find my match
          <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
