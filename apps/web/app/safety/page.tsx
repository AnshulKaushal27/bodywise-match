import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldWarning,
  WarningCircle,
  Sparkle,
  Scales,
} from "@phosphor-icons/react/dist/ssr";
import { DemoBadge } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Safety & Medical Disclaimer — Bodywise Match",
  description:
    "Plain-language safety standards, non-diagnostic boundaries, reaction guidance, and our guarantee of zero sponsored rankings.",
};

export default function SafetyPage() {
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
            href="/help/product-reaction"
            className="text-xs font-bold text-caution-text hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Report reaction helper &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area - Reading Column 680px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full space-y-12">
        {/* Title */}
        <section className="space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
            Health &amp; Product Boundaries
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            Safety &amp; Medical Disclaimer
          </h1>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Personal care and cosmetic wellness products interact directly with your skin, hair, and body. We maintain strict safety boundaries to ensure you make informed, safe choices.
          </p>
        </section>

        {/* 1. Not Medical Advice & No Diagnosis */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <ShieldWarning className="w-6 h-6 text-caution-text" weight="regular" />
            <span>1. Informational Only — Not Medical Advice</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Bodywise Match is an <strong>informational product discovery tool</strong>, not a medical clinic, diagnostic service, or healthcare provider.
          </p>
          <div className="p-5 rounded-card bg-caution-peach/60 border-l-4 border-caution-text space-y-3 text-xs sm:text-sm">
            <p className="font-bold text-caution-text text-sm">
              Our Non-Negotiable Medical Boundaries:
            </p>
            <ul className="space-y-2 text-charcoal/90 leading-relaxed">
              <li>&bull; <strong>No Clinical Diagnoses:</strong> We never evaluate, score, or assess underlying medical conditions like chronic eczema, cystic acne, fungal infections, hormonal hair shedding, or psoriasis.</li>
              <li>&bull; <strong>No Curative Claims:</strong> We never say &ldquo;this product will fix X&rdquo;. We only highlight cautious relevance (&ldquo;may be relevant to your stated goal&rdquo;).</li>
              <li>&bull; <strong>No Severity Scoring:</strong> We do not assess how severe your condition is or prescribe pharmaceutical concentrations.</li>
            </ul>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            If you have persistent pain, inflamed cystic lesions, blistering, or sudden hair thinning, stop searching cosmetic products online and consult a qualified general physician or licensed dermatologist.
          </p>
        </section>

        {/* 2. What To Do for a Significant Reaction */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <WarningCircle className="w-6 h-6 text-caution-text" weight="regular" />
            <span>2. What to Do If You Experience a Reaction</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Active ingredients (such as AHAs, BHAs, retinoids, or essential oils) can occasionally trigger skin tolerance reactions or allergies. If you experience discomfort or irritation:
          </p>

          <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-charcoal/85">
            <li>
              <strong>Stop use immediately:</strong> Discontinue applying the product to your skin, scalp, or hair. Do not attempt to &ldquo;push through&rdquo; burning, stinging, or redness.
            </li>
            <li>
              <strong>Rinse with cool water:</strong> Wash the area gently with plain cool or lukewarm water. Do not apply harsh soaps, scrubs, or other active chemical exfoliants over sensitized skin.
            </li>
            <li>
              <strong>Consult a qualified health professional:</strong> If redness, swelling, hives, itching, or irritation does not subside, or if you notice any difficulty breathing or facial swelling, seek professional medical care immediately.
            </li>
            <li>
              <strong>Document batch and purchase details:</strong> Note the batch number, manufacturing date, and packaging photos. You can prepare structured notes using our <Link href="/help/product-reaction" className="text-brand-evergreen font-bold underline">Product Reaction Helper</Link> before reaching out to official customer support.
            </li>
          </ol>

          <div className="p-4 rounded-card bg-surface border border-border text-xs sm:text-sm text-charcoal/85 space-y-2">
            <strong className="text-brand-deep block font-bold">
              Our Safety Guardrail on Sensitivity:
            </strong>
            <p className="text-xs text-charcoal/80 leading-relaxed">
              When users report discomfort or no improvement in our feedback forms, we <strong>strictly do not auto-recommend a stronger active concentration</strong>. We guide users toward neutral soothing guidance, alternative gentle formats, or our support helper.
            </p>
          </div>
        </section>

        {/* 3. Patch Testing Guidance */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Sparkle className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>3. Recommended Patch Testing Protocol</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Before applying any new personal care formula (especially exfoliating body washes, facial serums, or leave-on hair actives) across large surface areas, perform a 24-hour patch test:
          </p>
          <div className="p-4 rounded-card bg-surface-sage/35 border border-border text-xs sm:text-sm space-y-2 text-charcoal/85">
            <p>1. Apply a pea-sized amount to clean skin on your inner forearm or behind the ear.</p>
            <p>2. Leave it undisturbed for 24 hours (unless burning or redness develops immediately, in which case rinse off at once).</p>
            <p>3. If no erythema, itchiness, or irritation occurs after 24 hours, the formula is generally suitable for routine use according to official label directions.</p>
          </div>
        </section>

        {/* 4. Zero Sponsored Rankings & Commercial Disclosure */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Scales className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>4. Zero Sponsored Rankings &amp; Commercial Independence</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Our product shortlist order is calculated entirely by deterministic TypeScript functions based on your stated concerns, format preferences, and verified label attributes.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-charcoal/85 leading-relaxed">
            <li>&bull; <strong>No Paid Placements:</strong> No brand or merchant can pay to boost a product in search results or appear in shortlists.</li>
            <li>&bull; <strong>No Hidden Affiliate Bias:</strong> Ranking weights are stored in open configuration files (<code>matcher.config.ts</code>), not tuned to maximize affiliate margins.</li>
            <li>&bull; <strong>Commitment to Disclose:</strong> If this prototype ever enters into a future commercial affiliation, retail partnership, or sponsored relationship, it will be prominently, clearly, and conspicuously disclosed on every affected recommendation card and product detail view.</li>
          </ul>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter />
    </div>
  );
}
