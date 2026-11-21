import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Prohibit,
  CheckCircle,
  Sparkle,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "About Bodywise Match — Prototype Overview & Matching Principles",
  description:
    "Learn what Bodywise Match is, how our deterministic matching engine works, and our explicit boundaries as an independent fellowship prototype.",
};

export default function AboutPage() {
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
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/match"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Find my match &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area - Reading Column 680px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full space-y-12">
        {/* Title & One-Line Promise */}
        <section className="space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
            Independent Prototype
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            About Bodywise Match
          </h1>
          <p className="text-base sm:text-lg text-charcoal/90 leading-relaxed font-medium italic border-l-4 border-brand-evergreen pl-4 py-1 bg-surface-sage/30 rounded-r-button">
            &ldquo;Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.&rdquo;
          </p>
        </section>

        {/* 1. Independent Prototype Notice */}
        <section className="space-y-3 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight">
            1. An Independent Fellowship Project
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Bodywise Match is an independent product discovery prototype created for a fellowship technical challenge. It is <strong>not an official Be Bodywise service, website, or mobile application</strong>, and has no formal corporate affiliation with Mosaic Wellness.
          </p>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            All catalogue data is compiled directly from public official product descriptions, packaging labels, and verified manufacturer sources for educational and demonstration purposes.
          </p>
        </section>

        {/* 2. What Bodywise Match Is */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight">
            2. Our Product Philosophy
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Most beauty and wellness discovery quizzes feel like high-pressure sales funnels: they demand your email before showing results, ask for personal diagnostic details, push 5-star hype, and generate arbitrary &ldquo;98% match&rdquo; scores.
          </p>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            We built Bodywise Match on opposite principles:
          </p>
          <div className="divide-y divide-border border-y border-border pt-1">
            <div className="flex items-start gap-3.5 py-4">
              <CheckCircle className="w-5 h-5 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
              <div className="text-xs sm:text-sm">
                <strong className="text-brand-deep block mb-1">Value in ONE Session</strong>
                <span className="text-charcoal/85 leading-relaxed">Zero signup, zero accounts, zero passwords, and zero retention streaks. You get your match shortlist immediately without giving up your identity.</span>
              </div>
            </div>
            <div className="flex items-start gap-3.5 py-4">
              <CheckCircle className="w-5 h-5 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
              <div className="text-xs sm:text-sm">
                <strong className="text-brand-deep block mb-1">Transparent Trade-offs</strong>
                <span className="text-charcoal/85 leading-relaxed">Every recommendation includes both &ldquo;Consider this if...&rdquo; and &ldquo;May not be the best fit if...&rdquo; columns so you see honest limitations before purchasing.</span>
              </div>
            </div>
            <div className="flex items-start gap-3.5 py-4">
              <CheckCircle className="w-5 h-5 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
              <div className="text-xs sm:text-sm">
                <strong className="text-brand-deep block mb-1">Support When Things Go Wrong</strong>
                <span className="text-charcoal/85 leading-relaxed">If a product causes irritation or your parcel is delayed, our built-in issue helper prepares your notes and directs you to official support channels.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How Matching Works */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>3. How Matching Works: AI Interprets, Rules Decide</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Many AI apps let language models hallucinate product suggestions and make up clinical claims. Bodywise Match takes a strictly deterministic approach:
          </p>
          <div className="p-5 rounded-card bg-surface border border-border space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-brand-deep font-bold text-sm">
              <Sparkle className="w-4 h-4 text-brand-evergreen" weight="regular" />
              <span>Step 1: AI only listens</span>
            </div>
            <p className="text-charcoal/80 leading-relaxed">
              When you describe your concern in free-text, our parser extracts intent into a structured schema (goal, category, format preference, avoidances, routine context). The AI model is strictly prohibited from recommending products or generating health claims.
            </p>

            <div className="flex items-center gap-2 text-brand-deep font-bold text-sm pt-2 border-t border-border/60">
              <Cpu className="w-4 h-4 text-brand-evergreen" weight="regular" />
              <span>Step 2: TypeScript rules choose</span>
            </div>
            <p className="text-charcoal/80 leading-relaxed">
              A versioned, open-source TypeScript engine (<code>RULES_VERSION = &quot;1.0.0&quot;</code>) ranks products against official verified attributes:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-charcoal/85">
              <li><strong>Hard exclusions:</strong> Products with ingredients or cautions that conflict with your avoidances are removed upfront.</li>
              <li><strong>Goal fit:</strong> Exact goal matches receive 3 points; related goals receive 1 point; category fit receives 2 points.</li>
              <li><strong>Preferences:</strong> Format matches receive 2 points; verified avoidances receive 2 points.</li>
              <li><strong>Routine context:</strong> Compatible layering receives 1 point.</li>
              <li><strong>Tie-breaks:</strong> Products with more independently verified facts appear first, then alphabetical by slug.</li>
            </ol>
          </div>
        </section>

        {/* 4. What Bodywise Match Cannot Do */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Prohibit className="w-6 h-6 text-caution-text" weight="regular" />
            <span>4. What Bodywise Match Cannot Do</span>
          </h2>
          <div className="p-5 rounded-card bg-caution-peach/60 border-l-4 border-caution-text space-y-3 text-xs sm:text-sm">
            <p className="font-bold text-caution-text text-sm">
              Clear Boundaries &amp; Non-Goals:
            </p>
            <ul className="space-y-2 text-charcoal/90 leading-relaxed">
              <li>&bull; <strong>No Medical Evaluation:</strong> We cannot evaluate clinical conditions, hormonal imbalances, acne severity, or medical disorders. Always consult a licensed dermatologist or doctor.</li>
              <li>&bull; <strong>No Pharmaceutical Claims:</strong> Personal care cosmetics support hygiene and appearance; they are not pharmaceutical medications.</li>
              <li>&bull; <strong>No Live Logistics or Courier Access:</strong> We have no connection to courier delivery APIs, warehouse batch records, or live payment systems. We help you draft details to contact official support.</li>
              <li>&bull; <strong>No Photo Diagnostic Analysis:</strong> Photo upload is disabled in this prototype. We never store photos or run image classification.</li>
            </ul>
          </div>
        </section>

        {/* 5. Data Sources & Provenance */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>5. Data Sources &amp; Provenance</span>
          </h2>
          <div className="p-5 rounded-card bg-surface border border-border space-y-3 text-xs sm:text-sm">
            <p className="text-charcoal/85 leading-relaxed">
              All active product specifications, ingredient statements, how-to-use directions, and pricing in Bodywise Match are verified directly from official public listings:
            </p>
            <ul className="space-y-1.5 text-charcoal/85 pl-4 list-disc">
              <li><strong>Official Store Domain:</strong> <a href="https://bebodywise.com" target="_blank" rel="noopener noreferrer" className="text-brand-evergreen font-semibold underline">bebodywise.com</a></li>
              <li><strong>Last Full Verification Date:</strong> November 18, 2026</li>
              <li><strong>Catalogue Version:</strong> <code>1.0.0-verified</code></li>
            </ul>
            <p className="text-muted text-xs pt-2 border-t border-border/60">
              Independent prototype. Product details are taken from the official Be Bodywise website and may change. Check the official product page before buying.
            </p>
          </div>
        </section>

        {/* CTA Footer */}
        <div className="p-6 rounded-card bg-surface-sage/35 border border-border text-center space-y-3">
          <h3 className="font-display font-bold text-lg text-brand-deep tracking-tight">
            Ready to find a product that fits your goal?
          </h3>
          <p className="text-xs sm:text-sm text-charcoal/80 max-w-md mx-auto">
            Takes less than 2 minutes. No signup required.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/match"
              className="inline-flex items-center justify-center font-bold px-6 py-3 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep transition-colors focus-ring text-sm active:scale-[0.98] motion-safe:transition-transform"
            >
              Start Product Finder
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center font-bold px-6 py-3 rounded-button bg-surface text-brand-evergreen border border-brand-evergreen hover:bg-surface-sage/30 transition-colors focus-ring text-sm active:scale-[0.98] motion-safe:transition-transform"
            >
              Browse Catalogue
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <SiteFooter />
    </div>
  );
}
