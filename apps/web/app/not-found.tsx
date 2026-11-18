import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "@phosphor-icons/react";
import { DemoBadge } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/match"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Find match &rarr;
          </Link>
        </div>
      </header>

      {/* Main 404 Content (680px reading column) */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-16 md:py-24 flex-1 w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen mx-auto shadow-sm">
          <Compass className="w-8 h-8" weight="regular" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
            404 Error &bull; Page Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            We couldn&#x27;t find this page
          </h1>
          <p className="text-sm sm:text-base text-charcoal/80 max-w-md mx-auto leading-relaxed">
            The link you clicked may be broken or the URL may have moved. You can start fresh or browse all products below.
          </p>
        </div>

        <div className="p-5 rounded-card bg-surface border border-border text-left space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-deep block">
            Suggested Next Steps
          </span>
          <ul className="space-y-2 text-xs sm:text-sm text-charcoal/85">
            <li>
              &bull; <Link href="/match" className="text-brand-evergreen font-bold underline">Take the 3-Step Match Intake</Link> &mdash; describe your concern in plain words.
            </li>
            <li>
              &bull; <Link href="/products" className="text-brand-evergreen font-bold underline">Explore the Product Catalogue</Link> &mdash; filter by category, format, or avoidance.
            </li>
            <li>
              &bull; <Link href="/help" className="text-brand-evergreen font-bold underline">Visit the Issue Helper</Link> &mdash; prepare details for courier or product questions.
            </li>
          </ul>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center font-bold px-6 py-3 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep transition-colors focus-ring text-sm min-h-[48px] active:scale-[0.98] motion-safe:transition-transform"
          >
            Return to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center font-bold px-6 py-3 rounded-button bg-surface text-brand-evergreen border border-brand-evergreen hover:bg-surface-sage/30 transition-colors focus-ring text-sm min-h-[48px] active:scale-[0.98] motion-safe:transition-transform"
          >
            Browse All Products
          </Link>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
