import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How It Works — Bodywise Match",
  description:
    "Three simple steps: describe your concern, review what we understood, and see explained product matches with reasons and trade-offs.",
  alternates: {
    canonical: "/how-it-works",
  },
};

const STEPS = [
  {
    number: 1,
    title: "Tell us what you want help choosing.",
    body: "Describe your body, hair, or underarm goal in plain words. We extract the essentials into a clear summary without saving free-text or evaluating medical conditions.",
    footnote: "Free-text is never logged",
  },
  {
    number: 2,
    title: "Check and edit what we understood.",
    body: "Review your editable parsed summary. We ask one single clarifying question at a time to split candidate choices, never requesting age or medical history.",
    footnote: "Always editable \u2022 Skip anytime",
  },
  {
    number: 3,
    title: "See options with reasons and trade-offs.",
    body: "Explore 2\u20133 shortlisted products chosen by transparent TypeScript rules. Read why each product appears, what to consider, and when it may not fit.",
    footnote: "No percentage \u201cmatch scores\u201d",
  },
];

export default function HowItWorksPage() {
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

      {/* Main content — reading column max 680-720px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full">
        {/* Title block */}
        <section className="mb-12 md:mb-16">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-2 block">
            Simple 3-Step Flow
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight mb-3">
            How it works
          </h1>
          <p className="text-sm md:text-base text-charcoal/80 max-w-[54ch]">
            Clear discovery in one session. No signup, no streaks, no unnecessary quizzes.
          </p>
        </section>

        {/* Vertical numbered timeline */}
        <ol className="relative border-l-2 border-brand-deep/15 ml-5 space-y-10 mb-14">
          {STEPS.map((step) => (
            <li key={step.number} className="relative pl-8">
              {/* Number circle on the line */}
              <div
                className="absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-accent-lime text-brand-deep font-bold font-display flex items-center justify-center text-lg shadow-ambient border border-brand-deep/10"
                aria-hidden="true"
              >
                {step.number}
              </div>

              <h2 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-2 leading-snug">
                {step.title}
              </h2>
              <p className="text-sm text-charcoal/80 leading-relaxed mb-3">
                {step.body}
              </p>
              <div className="text-xs font-medium text-brand-evergreen flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{step.footnote}</span>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/match"
            className={cn("font-semibold", buttonVariants({ variant: "primary", size: "default" }))}
          >
            Find my match
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
