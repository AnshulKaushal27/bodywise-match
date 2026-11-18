"use client";

import * as React from "react";
import Link from "next/link";
import { Warning, ArrowsClockwise, House } from "@phosphor-icons/react";
import { DemoBadge } from "@/components/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log non-PII diagnostic reference internally if needed
    console.error("[Bodywise Match Error Boundary]:", error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <House className="w-4 h-4" weight="regular" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>
        </div>
      </header>

      {/* Main 500 Error Notice */}
      <main
        id="main-content"
        role="alert"
        aria-live="assertive"
        className="max-w-prose mx-auto px-5 py-16 md:py-24 flex-1 w-full text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center text-error-text mx-auto shadow-sm">
          <Warning className="w-8 h-8" weight="regular" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-error-text block">
            Application Error &bull; 500
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm sm:text-base text-charcoal/80 max-w-md mx-auto leading-relaxed">
            An unexpected error occurred while rendering this page. Your intake drafts and local session records are safely preserved in your browser.
          </p>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border text-xs text-charcoal/80 text-left max-w-md mx-auto space-y-1.5">
          <p className="font-bold text-brand-deep">What you can do:</p>
          <p>&bull; Click &ldquo;Try again&rdquo; below to re-render the view.</p>
          <p>&bull; If the issue persists, return to the homepage or continue in offline mode.</p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep transition-colors focus-ring text-sm min-h-[48px] active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowsClockwise className="w-4 h-4" weight="regular" aria-hidden="true" />
            <span>Try again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center font-bold px-6 py-3 rounded-button bg-surface text-brand-evergreen border border-brand-evergreen hover:bg-surface-sage/30 transition-colors focus-ring text-sm min-h-[48px] active:scale-[0.98] motion-safe:transition-transform"
          >
            Return to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Bodywise Match &bull; Resilient Error Handling &bull; Zero data lost</p>
      </footer>
    </div>
  );
}
