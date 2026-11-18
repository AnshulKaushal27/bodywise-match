import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import heroBgDesktop from "@/public/hero-bg-desktop.webp";
import heroBgMobile from "@/public/hero-bg-mobile.webp";
import {
  ArrowRight,
  ShieldCheck,
  Sparkle,
  SlidersHorizontal,
  UserCheck,
  CheckCircle,
  WarningCircle,
  Question,
  Lock,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  buttonVariants,
  DemoBadge,
  Card,
  SourceTag,
  Accordion,
  AccordionItemData,
} from "@/components/ui";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { cn } from "@/lib/utils";

const FAQ_ITEMS: AccordionItemData[] = [
  {
    id: "faq-1",
    title: "Is this medical advice?",
    content: (
      <p>
        No. Bodywise Match is an informational product discovery tool for cosmetic and personal care products. We do not provide medical diagnosis, clinical severity scores, or treatment plans. Allowed wording is strictly transparent (e.g. &ldquo;may be relevant to your stated goal&rdquo;). If you are experiencing acute pain, persistent rashes, or clinical skin conditions, please consult a qualified healthcare professional or dermatologist.
      </p>
    ),
  },
  {
    id: "faq-2",
    title: "Do I need an account?",
    content: (
      <p>
        No. All value arrives in one single session with zero signup required. We do not require an email address, phone number, password, or profile to discover product matches, review ingredients, or prepare support notes.
      </p>
    ),
  },
  {
    id: "faq-3",
    title: "Do you store my photo?",
    content: (
      <p>
        Never. Photo uploads are completely disabled in this MVP prototype (shown with a visible &ldquo;Coming later&rdquo; disabled affordance). When photo guidance features launch in future releases, images will be processed strictly in-session and never stored or shared.
      </p>
    ),
  },
  {
    id: "faq-4",
    title: "How are products chosen?",
    content: (
      <p>
        Products are chosen by a deterministic, pure TypeScript rules engine (versioned logic). The rules match your stated wellness goals, application format preferences, and ingredient avoidances against verified facts in the catalogue. AI only helps interpret your initial free-text description into structured criteria; it never decides matches, invents products, or alters prices.
      </p>
    ),
  },
  {
    id: "faq-5",
    title: "Are these real reviews?",
    content: (
      <p>
        All sample feedback, customer reports, and demonstration data in this prototype are explicitly marked with a &ldquo;Demo data&rdquo; badge. We never generate artificial star ratings, fake interviews, or misleading percentage &ldquo;match scores&rdquo;.
      </p>
    ),
  },
  {
    id: "faq-6",
    title: "How do I contact support?",
    content: (
      <p>
        For issues with live orders, shipping, courier tracking, or official returns, you can visit our Order &amp; Product Issue Helper to prepare the exact details required for support, or reach out to the official Be Bodywise customer care team directly via their official website or app.
      </p>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Skip to Content Link (A11y Landmark) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-evergreen focus:text-white focus:font-semibold focus:rounded-button focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-evergreen"
      >
        Skip to content
      </a>

      {/* Global Header */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-ring rounded-button p-1"
              aria-label="Bodywise Match Home"
            >
              <div className="w-8 h-8 rounded-full bg-brand-evergreen flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-brand-deep transition-colors">
                BM
              </div>
              <span className="font-display font-bold text-brand-deep text-lg tracking-tight">
                Bodywise Match
              </span>
            </Link>
          </div>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-charcoal hover:text-brand-evergreen focus-ring px-2 py-1 rounded"
            >
              How it works
            </a>
            <a
              href="#recommendation-preview"
              className="text-sm font-medium text-charcoal hover:text-brand-evergreen focus-ring px-2 py-1 rounded"
            >
              Sample Match
            </a>
            <a
              href="#honest-rules"
              className="text-sm font-medium text-charcoal hover:text-brand-evergreen focus-ring px-2 py-1 rounded"
            >
              Our Safeguards
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-charcoal hover:text-brand-evergreen focus-ring px-2 py-1 rounded"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <Link
              href="/match"
              className={cn("hidden sm:inline-flex font-semibold", buttonVariants({ variant: "primary", size: "sm" }))}
            >
              Find my match
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section
          id="hero-section"
          className="relative bg-paper overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border"
        >
          {/* Static Compressed WebP Hero Background Gradient Fallback */}
          <div
            className="absolute inset-0 pointer-events-none select-none -z-10 bg-gradient-to-b from-[#F7F7F1] to-[#DCE8D7]"
            aria-hidden="true"
          />

          {/* Decorative Warm Editorial Ambient Lighting (Lime & Sage) */}
          <div
            className="absolute top-[-40px] right-[-60px] w-80 h-80 md:w-96 md:h-96 rounded-full bg-surface-sage/40 blur-3xl -z-10 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-[-50px] left-[-80px] w-72 h-72 md:w-96 md:h-96 rounded-full bg-accent-lime/30 blur-3xl -z-10 pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-container mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Asymmetric Editorial Text & CTAs */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                {/* Context Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-sage/70 border border-brand-deep/10 text-xs font-semibold text-brand-deep mb-6">
                  <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
                  <span>Calm &bull; Non-diagnostic &bull; Zero signup</span>
                </div>

                {/* H1 reduced to text-4xl md:text-5xl (does not shout) */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight leading-[1.16] mb-5">
                  Not sure which product fits your concern?
                </h1>

                {/* Exact Subheading */}
                <p className="text-base sm:text-lg text-charcoal/85 font-body leading-relaxed mb-8 max-w-[54ch]">
                  Tell us what you&apos;re looking for. We&apos;ll ask a few quick questions and explain which Be Bodywise options may fit.
                </p>

                {/* CTAs with 44px min target and tactile :active */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-6">
                  <Link
                    href="/match"
                    className={cn(
                      "w-full sm:w-auto font-semibold text-base px-8 h-12 shadow-ambient active:scale-[0.98] motion-safe:transition-transform",
                      buttonVariants({ variant: "primary", size: "lg" })
                    )}
                  >
                    <span>Find my match</span>
                    <ArrowRight className="ml-2 w-5 h-5 shrink-0" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/products"
                    className={cn(
                      "w-full sm:w-auto font-semibold text-base px-6 h-12 active:scale-[0.98] motion-safe:transition-transform",
                      buttonVariants({ variant: "secondary", size: "lg" })
                    )}
                  >
                    Browse products
                  </Link>
                </div>

                {/* Exact Trust Line */}
                <p className="text-xs sm:text-sm text-muted font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-evergreen shrink-0" aria-hidden="true" />
                  <span>No diagnosis. No guaranteed results. Your photo is optional.</span>
                </p>
              </div>

              {/* Right Column: Editorial Botanical Artwork Card */}
              <div className="lg:col-span-5 relative w-full">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5] w-full rounded-card overflow-hidden shadow-ambient border border-brand-deep/10 bg-surface-sage/30">
                  {/* Desktop WebP Hero Image */}
                  <Image
                    src={heroBgDesktop}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="hidden sm:block object-cover object-center"
                  />
                  {/* Mobile WebP Hero Image */}
                  <Image
                    src={heroBgMobile}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="block sm:hidden object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS SECTION ================= */}
        <section
          id="how-it-works"
          className="bg-surface-sage/35 border-b border-border py-16 md:py-24"
          aria-labelledby="how-it-works-heading"
        >
          <div className="max-w-container mx-auto px-5">
            <div className="max-w-2xl mb-12 md:mb-16">
              <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-2 block">
                Simple 3-Step Flow
              </span>
              <h2
                id="how-it-works-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight"
              >
                How it works
              </h2>
              <p className="text-sm md:text-base text-charcoal/80 mt-2 max-w-[54ch]">
                Clear discovery in one session. No signup, no streaks, no unnecessary quizzes.
              </p>
            </div>

            {/* Editorial Numbered Timeline Grid (Breathes without cookie-cutter card boxes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
              {/* Step 1 */}
              <div className="flex flex-col justify-between pt-4 border-t-2 border-brand-deep/20 md:border-t-0 md:pt-0">
                <div>
                  <div className="w-10 h-10 rounded-full bg-accent-lime text-brand-deep font-bold font-display flex items-center justify-center text-lg mb-5 shadow-ambient border border-brand-deep/10">
                    1
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-2.5 leading-snug">
                    Tell us what you want help choosing.
                  </h3>
                  <p className="text-sm text-charcoal/80 leading-relaxed mb-6">
                    Describe your body, hair, or underarm goal in plain words. We extract the essentials into a clear summary without saving free-text or evaluating medical conditions.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/70 text-xs font-medium text-brand-evergreen flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Free-text is never logged</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col justify-between pt-4 border-t-2 border-brand-deep/20 md:border-t-0 md:pt-0">
                <div>
                  <div className="w-10 h-10 rounded-full bg-accent-lime text-brand-deep font-bold font-display flex items-center justify-center text-lg mb-5 shadow-ambient border border-brand-deep/10">
                    2
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-2.5 leading-snug">
                    Check and edit what we understood.
                  </h3>
                  <p className="text-sm text-charcoal/80 leading-relaxed mb-6">
                    Review your editable parsed summary. We ask one single clarifying question at a time to split candidate choices, never requesting age or medical history.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/70 text-xs font-medium text-brand-evergreen flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Always editable &bull; Skip anytime</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col justify-between pt-4 border-t-2 border-brand-deep/20 md:border-t-0 md:pt-0">
                <div>
                  <div className="w-10 h-10 rounded-full bg-accent-lime text-brand-deep font-bold font-display flex items-center justify-center text-lg mb-5 shadow-ambient border border-brand-deep/10">
                    3
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-2.5 leading-snug">
                    See options with reasons and trade-offs.
                  </h3>
                  <p className="text-sm text-charcoal/80 leading-relaxed mb-6">
                    Explore 2&ndash;3 shortlisted products chosen by transparent TypeScript rules. Read why each product appears, what to consider, and when it may not fit.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/70 text-xs font-medium text-brand-evergreen flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>No percentage &ldquo;match scores&rdquo;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHAT A RECOMMENDATION LOOKS LIKE ================= */}
        <section
          id="recommendation-preview"
          className="bg-paper py-16 md:py-24 border-b border-border"
          aria-labelledby="recommendation-heading"
        >
          <div className="max-w-container mx-auto px-5">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-2 block">
                Honest Transparency
              </span>
              <h2
                id="recommendation-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight"
              >
                What a recommendation looks like
              </h2>
              <p className="text-sm md:text-base text-charcoal/80 mt-2">
                Every shortlisted option highlights verified packaging claims, honest considerations, and safety cautions.
              </p>
            </div>

            {/* Example Recommendation Card Badged Demo Data */}
            <div className="max-w-xl mx-auto">
              <Card variant="surface" className="p-6 md:p-8 shadow-card border border-border relative overflow-hidden">
                {/* Header row with Demo Badge & Match Label */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <DemoBadge />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-sage text-brand-deep border border-brand-deep/10">
                      Strong Format Fit
                    </span>
                  </div>
                  <span className="text-xs text-muted font-medium">Rank 1 of 3</span>
                </div>

                {/* Product Name & Format */}
                <div className="mb-5">
                  <h3 className="font-display font-bold text-xl md:text-2xl text-brand-deep mb-1">
                    Demo 1% Salicylic Acid Body Wash
                  </h3>
                  <p className="text-xs md:text-sm text-muted">
                    Liquid rinse-off wash &bull; 250 ml &bull; Daily shower use
                  </p>
                </div>

                {/* Why it's here */}
                <div className="mb-5 bg-surface-sage/30 rounded-button p-4 border border-brand-deep/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep mb-1.5 flex items-center gap-1.5">
                    <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
                    Why it&apos;s here
                  </h4>
                  <p className="text-sm text-charcoal leading-relaxed">
                    Directly addresses your stated goal to reduce the look of body bumps on arms and back. Matches your preference for a liquid shower format and fragrance-free formulation.
                  </p>
                </div>

                {/* Consider this if... */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Consider this if...
                  </h4>
                  <ul className="text-sm text-charcoal/85 space-y-1.5 pl-4 list-disc marker:text-brand-evergreen">
                    <li>You want gentle daily chemical exfoliation without abrasive physical scrubbing.</li>
                    <li>You prefer completely unscented, fragrance-free body products for sensitive skin.</li>
                  </ul>
                </div>

                {/* May not be the best fit if... */}
                <div className="mb-6 p-3.5 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <WarningCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    May not be the best fit if...
                  </h4>
                  <ul className="text-xs md:text-sm space-y-1 pl-4 list-disc marker:text-caution-text">
                    <li>You have active open cuts, sunburned, or broken skin.</li>
                    <li>You are looking for leave-on facial active serums (this is formulated for rinse-off body use).</li>
                  </ul>
                </div>

                {/* Provenance Source Tag */}
                <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
                  <SourceTag source="Official Packaging Label" lastVerifiedAt="November 2026" />
                  <span className="text-xs text-muted font-medium">Zero percentage scores</span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ================= WE KEEP IT HONEST SECTION ================= */}
        <section
          id="honest-rules"
          className="bg-surface border-b border-border py-16 md:py-24"
          aria-labelledby="honest-rules-heading"
        >
          <div className="max-w-container mx-auto px-5">
            <div className="max-w-2xl mb-12">
              <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-2 block">
                Core Guardrails
              </span>
              <h2
                id="honest-rules-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight"
              >
                We keep it honest
              </h2>
              <p className="text-sm md:text-base text-charcoal/80 mt-2 max-w-[54ch]">
                We believe health and wellness decisions deserve factual certainty over algorithmic hype.
              </p>
            </div>

            {/* Asymmetric 2-Column Grid (Lead Rule on Left, Stacked Rules on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Lead Feature Rule: Rules choose, AI helps listen */}
              <div className="lg:col-span-5 p-7 md:p-8 rounded-card bg-surface-sage/40 border border-brand-deep/10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-accent-lime text-brand-deep flex items-center justify-center mb-6 shadow-ambient border border-brand-deep/10">
                    <SlidersHorizontal className="w-6 h-6" weight="regular" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-brand-deep mb-2">
                    Rules choose, AI helps listen
                  </h3>
                  <p className="text-sm font-semibold text-brand-evergreen mb-3">
                    Products are chosen by transparent rules.
                  </p>
                  <p className="text-sm text-charcoal/80 leading-relaxed">
                    Deterministic TypeScript logic decides which products match. An LLM may only extract intent into a structured schema—it never invents products, ingredients, or claims.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-brand-deep/10 text-xs font-semibold text-brand-deep flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-evergreen" aria-hidden="true" />
                  <span>Pure TypeScript matcher &bull; Zero hallucinated products</span>
                </div>
              </div>

              {/* Stacked Rules 2 & 3 */}
              <div className="lg:col-span-7 flex flex-col justify-between divide-y divide-border rounded-card bg-paper border border-border p-7 md:p-8">
                {/* Rule 2 */}
                <div className="pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen shrink-0 mt-0.5 border border-brand-deep/10">
                      <ShieldCheck className="w-5 h-5" weight="regular" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-1">
                        Facts have sources
                      </h3>
                      <p className="text-sm font-semibold text-brand-evergreen mb-2">
                        Every product fact shows where it came from and when.
                      </p>
                      <p className="text-sm text-charcoal/80 leading-relaxed">
                        Ingredients, directions, and cautions are pulled directly from verified packaging labels. If an attribute has not been verified yet, we label it explicitly as &ldquo;Not verified yet&rdquo;.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen shrink-0 mt-0.5 border border-brand-deep/10">
                      <UserCheck className="w-5 h-5" weight="regular" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-1">
                        You stay in control
                      </h3>
                      <p className="text-sm font-semibold text-brand-evergreen mb-2">
                        Edit what we understood. Skip any question.
                      </p>
                      <p className="text-sm text-charcoal/80 leading-relaxed">
                        No forced questionnaire funnels or locked steps. You can refine your parsed summary, skip non-essential questions, and see the exact reasoning behind every shortlist.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ORDER ISSUE HELPER TEASER CARD ================= */}
        {/* Peach-free, Sage background per specification */}
        <section className="bg-paper py-12 md:py-16 border-b border-border">
          <div className="max-w-container mx-auto px-5">
            <div className="rounded-card bg-surface-sage/50 border border-border p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-sage text-brand-deep flex items-center justify-center shrink-0 border border-brand-deep/10">
                  <Question className="w-5 h-5 text-brand-evergreen" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep mb-1">
                    Something went wrong with an order?
                  </h3>
                  <p className="text-sm md:text-base text-charcoal/80 max-w-2xl leading-relaxed">
                    We can&apos;t track your parcel, but we can help you prepare the right message for official support.
                  </p>
                </div>
              </div>

              <Link href="/help" className="shrink-0 w-full md:w-auto">
                <Button variant="secondary" size="default" className="w-full md:w-auto font-semibold">
                  Open order issue helper &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= PRIVACY & PHOTO EXPLAINER + FAQ ACCORDION ================= */}
        <section id="faq" className="bg-paper py-16 md:py-24" aria-labelledby="faq-heading">
          <div className="max-w-container mx-auto px-5">
            {/* Privacy & Photo Explainer Box */}
            <div className="max-w-3xl mx-auto mb-12 p-6 rounded-card bg-surface border border-border">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base md:text-lg text-brand-deep mb-1">
                    Privacy First &bull; No Mandatory Photos or Accounts
                  </h3>
                  <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed mb-3">
                    We respect your boundaries. You can use Bodywise Match with complete anonymity. Free-text inputs are never stored in log records, and photo uploads are intentionally disabled in this prototype (marked &ldquo;Coming later&rdquo;).
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-brand-evergreen">
                    <span className="px-2 py-0.5 rounded bg-surface-sage/70">No Account Required</span>
                    <span className="px-2 py-0.5 rounded bg-surface-sage/70">Zero Request Logging</span>
                    <span className="px-2 py-0.5 rounded bg-surface-sage/70">Photo Uploads Disabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen mb-1 block">
                  Common Questions
                </span>
                <h2
                  id="faq-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight"
                >
                  Frequently Asked Questions
                </h2>
              </div>

              <Accordion items={FAQ_ITEMS} defaultOpenId="faq-1" />
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      {/* Deep green background (#17352E) per design system */}
      <footer className="bg-brand-deep text-white/85 py-12 border-t border-brand-deep/20" role="contentinfo">
        <div className="max-w-container mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
            {/* Col 1: Brand & Promise */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-accent-lime text-brand-deep font-bold font-display flex items-center justify-center text-xs">
                  BM
                </div>
                <span className="font-display font-bold text-white text-lg tracking-tight">
                  Bodywise Match
                </span>
              </div>
              <p className="text-xs md:text-sm text-white/70 max-w-md leading-relaxed mb-4">
                Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.
              </p>
              <div className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded bg-white/10 text-white/90">
                Independent Fellowship Challenge
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="font-display font-semibold text-white text-sm mb-3">Discovery</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li>
                  <Link href="/match" className="hover:text-white transition-colors focus-ring rounded">
                    Find my match
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white transition-colors focus-ring rounded">
                    Browse catalogue
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white transition-colors focus-ring rounded">
                    Order issue helper
                  </Link>
                </li>
                <li>
                  <Link href="/design-system" className="hover:text-white transition-colors focus-ring rounded">
                    Design system tokens
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Trust */}
            <div>
              <h4 className="font-display font-semibold text-white text-sm mb-3">Trust &amp; Policies</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors focus-ring rounded">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors focus-ring rounded">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="hover:text-white transition-colors focus-ring rounded">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors focus-ring rounded">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors focus-ring rounded">
                    Terms of use
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom disclaimer row */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60 text-center md:text-left">
            <p>
              Independent prototype for a fellowship challenge; not an official Be Bodywise service. Informational only, not medical advice.
            </p>
            <div className="flex items-center gap-4">
              <span>WCAG AA Compliant</span>
              <span>&bull;</span>
              <span>All sample data marked &ldquo;Demo data&rdquo;</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar (reveals after scrolling past hero) */}
      <StickyMobileCta heroElementId="hero-section" />
    </div>
  );
}
