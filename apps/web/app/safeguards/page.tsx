import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Our Safeguards — Bodywise Match",
  description:
    "How Bodywise Match keeps product matching honest: deterministic rules, verified sources, and full user control. No AI-invented products, no fake reviews.",
  alternates: {
    canonical: "/safeguards",
  },
};

const SAFEGUARDS = [
  {
    icon: SlidersHorizontal,
    title: "Rules choose, AI helps listen",
    subtitle: "Products are chosen by transparent rules.",
    body: "Deterministic TypeScript logic decides which products match. An LLM may only extract intent into a structured schema\u2014it never invents products, ingredients, or claims.",
    footnote: "Pure TypeScript matcher \u2022 Zero hallucinated products",
  },
  {
    icon: ShieldCheck,
    title: "Facts have sources",
    subtitle: "Every product fact shows where it came from and when.",
    body: "Ingredients, directions, and cautions are pulled directly from verified packaging labels. If an attribute has not been verified yet, we label it explicitly as \u201cNot verified yet\u201d.",
    footnote: "Official packaging labels \u2022 Timestamped verification",
  },
  {
    icon: UserCheck,
    title: "You stay in control",
    subtitle: "Edit what we understood. Skip any question.",
    body: "No forced questionnaire funnels or locked steps. You can refine your parsed summary, skip non-essential questions, and see the exact reasoning behind every shortlist.",
    footnote: "Zero mandatory signup \u2022 Full transparency",
  },
];

export default function SafeguardsPage() {
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

          <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
            Bodywise Match
          </span>

          <Link
            href="/match"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Find my match &rarr;
          </Link>
        </div>
      </header>

      {/* Main content — reading column max 720px */}
      <main id="main-content" className="max-w-[720px] mx-auto px-5 py-10 md:py-16 flex-1 w-full">
        {/* Title block */}
        <section className="mb-12 md:mb-16">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-2 block">
            Core Guardrails
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight mb-2">
            Our safeguards
          </h1>
          <p className="font-display font-semibold text-lg md:text-xl text-brand-evergreen mb-2">
            We keep it honest
          </p>
          <p className="text-sm md:text-base text-charcoal/80 max-w-[54ch]">
            We believe health and wellness decisions deserve factual certainty over algorithmic hype.
          </p>
        </section>

        {/* Alternating two-column rows with icons */}
        <div className="space-y-6 md:space-y-8 mb-14">
          {SAFEGUARDS.map((item, idx) => {
            const Icon = item.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.title}
                className={`flex flex-col sm:flex-row items-start gap-5 p-6 md:p-8 rounded-card border border-border ${
                  isEven ? "bg-surface-sage/30" : "bg-surface"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-accent-lime text-brand-deep flex items-center justify-center shrink-0 shadow-ambient border border-brand-deep/10">
                  <Icon className="w-6 h-6" weight="regular" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-xl text-brand-deep mb-1">
                    {item.title}
                  </h2>
                  <p className="text-sm font-semibold text-brand-evergreen mb-2">
                    {item.subtitle}
                  </p>
                  <p className="text-sm text-charcoal/80 leading-relaxed mb-3">
                    {item.body}
                  </p>
                  <div className="text-xs font-semibold text-brand-deep flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-brand-evergreen"
                      aria-hidden="true"
                    />
                    <span>{item.footnote}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom plain links */}
        <nav aria-label="Related pages" className="border-t border-border pt-8 flex flex-wrap gap-6 text-sm font-medium">
          <Link
            href="/safety"
            className="text-brand-evergreen hover:text-brand-deep focus-ring rounded transition-colors min-h-[44px] inline-flex items-center"
          >
            Safety information
          </Link>
          <Link
            href="/privacy"
            className="text-brand-evergreen hover:text-brand-deep focus-ring rounded transition-colors min-h-[44px] inline-flex items-center"
          >
            Privacy
          </Link>
          <Link
            href="/match"
            className="text-brand-evergreen hover:text-brand-deep focus-ring rounded transition-colors min-h-[44px] inline-flex items-center"
          >
            Find my match &rarr;
          </Link>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}
