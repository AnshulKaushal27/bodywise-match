import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
} from "@phosphor-icons/react/dist/ssr";
import { DemoBadge } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Terms of Use — Bodywise Match",
  description:
    "Plain-language terms governing the use of the Bodywise Match independent product discovery prototype.",
};

export default function TermsPage() {
  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Header */}
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
            href="/privacy"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded"
          >
            Privacy policy &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area - Reading Column 680px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full space-y-10">
        {/* Title */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
              Legal &amp; Usage Terms
            </span>
            <span className="text-xs text-muted flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last updated: November 18, 2026</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            Terms of Use
          </h1>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            These terms are written in plain, human English. By using this prototype, you agree to these clear guidelines.
          </p>
        </section>

        {/* 1. Independent Prototype */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            1. Independent Fellowship Prototype
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            Bodywise Match is an independent technical demonstration built for a fellowship challenge. It is not an official storefront, mobile app, or commercial subsidiary of Be Bodywise or Mosaic Wellness. You cannot buy products directly on this website.
          </p>
        </section>

        {/* 2. Informational Only — Not Medical Advice */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            2. Informational Discovery Only (No Medical Advice)
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            All matching outputs, product descriptions, ingredient notes, and trade-offs are provided for personal care informational discovery only. Nothing on this website constitutes medical advice, clinical diagnosis, or a prescription treatment plan. Always consult a qualified medical professional for health or skin concerns.
          </p>
        </section>

        {/* 3. Catalogue Facts & Provenance */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            3. Fact Provenance &amp; &ldquo;As-Is&rdquo; Information
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            We source catalogue facts from official packaging labels and publish provenance timestamps. Missing attributes are explicitly marked &ldquo;Not verified yet&rdquo;. While we strive for absolute accuracy, all prototype outputs are provided &ldquo;as is&rdquo; without warranties of merchantability or fitness for a particular clinical purpose.
          </p>
        </section>

        {/* 4. Trademarks & Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            4. Trademarks &amp; Intellectual Property
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            &ldquo;Be Bodywise&rdquo;, associated logos, product trademarks, and trade dress are the exclusive property of Mosaic Wellness and their respective owners. Their mention in this prototype constitutes nominative fair use for identification and technical demonstration in an academic challenge. Prototype code and architecture are open-source.
          </p>
        </section>

        {/* 5. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            5. Limitation of Liability
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            To the maximum extent permitted by applicable law, the developers of this prototype shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of this tool, purchases made on third-party websites, or personal tolerance reactions to personal care products. Always patch-test new products before use.
          </p>
        </section>

        {/* 6. Privacy & Data Rights */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-brand-deep">
            6. Privacy &amp; Data Rights
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            Your privacy is protected by default: we require zero signup, log zero free-text, and retain server session cache for 30 days maximum. You may review, export, or permanently delete your local data and server sessions at any time via <Link href="/privacy/data" className="text-brand-evergreen font-bold underline">Manage Your Data</Link>.
          </p>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter />
    </div>
  );
}
