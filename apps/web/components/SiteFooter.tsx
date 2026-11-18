import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Info } from "@phosphor-icons/react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-brand-deep text-surface pt-12 pb-8 mt-auto">
      <div className="max-w-container mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg md:text-xl text-surface tracking-tight">
                Bodywise Match
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent-lime text-brand-deep">
                Demo data
              </span>
            </div>
            <p className="text-xs sm:text-sm text-surface-sage/90 max-w-prose leading-relaxed">
              Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-surface-sage/80 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              <Info className="w-3.5 h-3.5 text-accent-lime shrink-0" />
              <span>Independent Fellowship Challenge Prototype</span>
            </div>
          </div>

          {/* Col 2: Discovery */}
          <div>
            <h4 className="font-display font-bold text-surface text-sm mb-3">
              Discovery
            </h4>
            <ul className="space-y-2 text-xs text-surface-sage/80">
              <li>
                <Link href="/match" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Find my match
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Browse catalogue
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Compare products
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Order &amp; product helper
                </Link>
              </li>
              <li>
                <Link href="/design-system" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Design tokens
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  System status
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Trust & Policies */}
          <div>
            <h4 className="font-display font-bold text-surface text-sm mb-3">
              Trust &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs text-surface-sage/80">
              <li>
                <Link href="/about" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/privacy/data" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Manage your data
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Safety &amp; medical notice
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-surface transition-colors focus-ring rounded py-0.5 inline-block">
                  Terms of use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Footer Disclaimer Row */}
        <div className="pt-8 space-y-3 text-xs text-surface-sage/70">
          <div className="p-4 rounded-button bg-white/5 border border-white/10 text-xs leading-relaxed space-y-1.5">
            <p className="font-bold text-surface flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-lime shrink-0" />
              <span>Global Disclaimer &bull; Informational only, not medical advice.</span>
            </p>
            <p>
              Bodywise Match is an independent prototype developed for a fellowship challenge and is not an official Be Bodywise service, website, or storefront. We do not provide medical diagnosis, clinical severity scoring, treatment plans, or promises of medical remedies. Products are matched deterministically based on stated preferences and verified official product labels; zero sponsored placement or affiliate rankings are used.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-surface-sage/60 text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} Bodywise Match Prototype &bull; Independent submission for Mosaic Fellowship.
            </p>
            <div className="flex items-center gap-3">
              <span>WCAG AA 4.5:1 Contrast</span>
              <span>&bull;</span>
              <span>Reading column 680px</span>
              <span>&bull;</span>
              <span>Zero mandatory signup</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
