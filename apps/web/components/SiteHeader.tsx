"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  className?: string;
}

// Shared size tokens for header action buttons:
// 48px min-height (h-12), identical width/min-width, 12px radius (rounded-button),
// text-sm (14px, never below), font-semibold, 44px+ touch target.
const headerButtonBase =
  "min-h-[48px] h-12 w-[128px] sm:w-[132px] min-w-[128px] sm:min-w-[132px] text-sm font-semibold rounded-button px-3 sm:px-4 py-2 inline-flex items-center justify-center transition-all duration-150 focus-ring select-none active:scale-[0.98] motion-safe:transition-transform whitespace-nowrap";

export function SiteHeader({ className }: SiteHeaderProps) {
  let pathname = "";
  try {
    pathname = usePathname() || "";
  } catch {
    pathname = "";
  }
  const isHelpActive = pathname === "/help" || pathname?.startsWith("/help/");

  return (
    <header
      className={cn(
        "sticky top-0 z-30 backdrop-blur-md bg-paper/60 transition-colors",
        className
      )}
    >
      <div className="max-w-container mx-auto px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-ring rounded-button p-1"
            aria-label="Bodywise Match Home"
          >
            <Image
              src="/logo.png"
              alt="Bodywise Match Logo"
              width={32}
              height={32}
              priority
              unoptimized
              className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-bold text-brand-deep text-base sm:text-lg tracking-tight hidden sm:inline">
              Bodywise Match
            </span>
          </Link>
        </div>

        {/* Header Action Navigation (Help + Find my match) */}
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-2.5 sm:gap-3 shrink-0"
        >
          {/* Help (Secondary button-style link) */}
          <Link
            href="/help"
            aria-current={isHelpActive ? "page" : undefined}
            className={cn(
              headerButtonBase,
              isHelpActive
                ? "bg-surface-sage text-brand-deep border-[1.5px] border-brand-evergreen shadow-2xs"
                : "bg-surface text-brand-evergreen border-[1.5px] border-brand-evergreen hover:bg-surface-sage active:bg-surface-sage/80"
            )}
          >
            Help
          </Link>

          {/* Find my match (Primary filled evergreen action button) */}
          <Link
            href="/match"
            className={cn(
              headerButtonBase,
              "bg-brand-evergreen text-white hover:bg-brand-deep active:bg-brand-deep shadow-soft border-[1.5px] border-brand-evergreen"
            )}
          >
            Find my match
          </Link>
        </nav>
      </div>
    </header>
  );
}
