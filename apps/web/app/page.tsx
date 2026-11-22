import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import {
  buttonVariants,
  Accordion,
  AccordionItemData,
} from "@/components/ui";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { SiteHeader } from "@/components/SiteHeader";
import { HashRedirect } from "@/components/HashRedirect";
import { OrderResolutionPreview } from "@/components/OrderResolutionPreview";
import { HeroRotatingWord, HeroQueryInput, HeroScanButton } from "@/components/HeroInteractive";
import { HeroProductMedia } from "@/components/HeroProductMedia";
import { CatalogueStatsStrip, CategoryBento } from "@/components/CatalogueShowcase";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ReduceMotionToggle } from "@/lib/motion";
import { AmbientFallback } from "@/components/SmokeBackground";
import { cn } from "@/lib/utils";

const SmokeBackground = dynamic(
  () => import("@/components/SmokeBackground").then((mod) => mod.SmokeBackground),
  {
    ssr: false,
    loading: () => <AmbientFallback />,
  }
);

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
        Never. Photos analyzed using our camera scanner are processed strictly in-session by our Multimodal AI to extract packaging facts and active ingredients, then immediately discarded. No user photos are ever stored or retained on disk or database.
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
        All feedback and community reports in this prototype highlight honest trade-offs and observed experiences. We never generate artificial star ratings, fake interviews, or misleading percentage &ldquo;match scores&rdquo;.
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
    <div className="min-h-screen bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep overflow-x-clip">
      {/* Client Hash Fragment Redirect for Old Anchors */}
      <HashRedirect />

      {/* Skip to Content Link (A11y Landmark) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-evergreen focus:text-white focus:font-semibold focus:rounded-button focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-evergreen"
      >
        Skip to content
      </a>

      {/* Global Header */}
      <SiteHeader />

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1 relative z-10">
        {/* Full Landing Page Ambient & WebGL Smoke Background */}
        <SmokeBackground />

        {/* Tactile Fine-Cotton Paper Grain Texture Overlay across Entire Main */}
        <div
          className="fixed inset-0 pointer-events-none select-none z-[1] opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* ================= HERO SECTION ================= */}
        <section
          id="hero-section"
          className="relative isolate overflow-hidden -mt-[68px] pt-24 pb-16 md:pt-28 md:pb-24"
        >
          {/* Static Clean Editorial Paper Base with Subtle Gradient Fallback */}
          <div
            className="absolute inset-0 pointer-events-none select-none -z-10 bg-gradient-to-b from-[#F5F9FF]/20 to-[#E3EEFC]/15"
            aria-hidden="true"
          />

          {/* Subtle Editorial Dot Matrix Pattern */}
          <div
            className="absolute inset-0 pointer-events-none select-none -z-10 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(#0B2447 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 50%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 50%, transparent 100%)",
            }}
            aria-hidden="true"
          />

          <div className="max-w-container mx-auto px-5 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Asymmetric Editorial Text & CTAs */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                {/* H1 with Rotating Highlight Category Word (Effect 1) */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight leading-[1.16] mb-5">
                  Not sure which <HeroRotatingWord /> to choose?
                </h1>

                {/* Exact Subheading */}
                <p className="text-base sm:text-lg text-charcoal/85 font-body leading-relaxed mb-6 max-w-[54ch]">
                  Tell us what you&apos;re looking for. We&apos;ll ask a few quick questions and explain which Be Bodywise options may fit.
                </p>

                {/* Hero Try It Now input (Effect 2) */}
                <HeroQueryInput />

                {/* Explanatory helper for camera scan button */}
                <p className="text-xs sm:text-sm text-charcoal/80 font-medium mb-2.5">
                  Snap or upload a photo of any bottle to find matching Be Bodywise formulas:
                </p>

                {/* Secondary Browse link and primary CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 mb-6">
                  <Link
                    href="/products"
                    className={cn(
                      "font-semibold text-sm sm:text-base px-6 h-11 active:scale-[0.98] motion-safe:transition-transform bg-surface/80 hover:bg-surface border border-border rounded-button shadow-2xs",
                      buttonVariants({ variant: "secondary", size: "default" })
                    )}
                  >
                    Browse products
                  </Link>
                  <HeroScanButton />
                </div>
              </div>

              {/* Right Column: Layered Editorial Botanical Artwork Card with Seamless Cinemagraph Video */}
              <div className="lg:col-span-5 relative w-full">
                {/* Decorative Ambient Underlay Halo Card */}
                <div
                  className="absolute -inset-2.5 sm:-inset-3.5 rounded-[26px] sm:rounded-[30px] bg-gradient-to-tr from-surface-sage/50 via-accent-lime/20 to-surface-sage/20 border border-brand-deep/10 shadow-ambient -z-10"
                  aria-hidden="true"
                />

                <HeroProductMedia />
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATALOGUE DIRECTORY BENTO & LIVE STATS STRIP ================= */}
        <section className="relative py-14 md:py-20 overflow-hidden">
          {/* Directional Smoke Stream Curling across Section */}
          <div
            className="absolute top-1/4 -right-[15%] w-[130%] h-[200px] rounded-[100px] bg-gradient-to-l from-transparent via-[#93C5FD]/25 via-[#60A5FA]/20 to-transparent blur-[80px] pointer-events-none animate-smoke-stream-2 -z-10"
            aria-hidden="true"
          />
          <div className="max-w-container mx-auto px-5">
            <CatalogueStatsStrip />
            <CategoryBento />
          </div>
        </section>

        {/* ================= ORDER ISSUE HELPER SHOWCASE ================= */}
        <section
          id="order-issue-helper-section"
          className="relative py-16 md:py-24"
          aria-labelledby="order-issue-heading"
        >
          <div className="max-w-container mx-auto px-5">
            {/* Unified Showcase Card */}
            <div className="relative rounded-[24px] bg-gradient-to-br from-surface via-[#F5F9FF] to-surface-sage/30 border border-border p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
              {/* Subtle Ambient Moving Decorative Blue Glows */}
              <div
                className="absolute -top-24 -right-12 w-96 h-96 rounded-full bg-surface-sage/50 blur-[90px] pointer-events-none -z-10 animate-smoke-3"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-[#BBD9FF]/30 blur-[90px] pointer-events-none -z-10 animate-smoke-4"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column: Context, Value Proposition & Actions */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
                  {/* Heading */}
                  <h2
                    id="order-issue-heading"
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-brand-deep tracking-tight leading-[1.2] mb-3"
                  >
                    Something went wrong with an order?
                  </h2>

                  {/* Exact Required Subtitle */}
                  <p className="text-sm sm:text-base text-charcoal/80 font-body leading-relaxed mb-6">
                    We can&apos;t track your parcel, but we can help you prepare the right message for official support.
                  </p>

                  {/* Clean, Organized Value Checklist */}
                  <div className="flex flex-col gap-3 mb-8 w-full">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen font-bold text-xs shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-brand-evergreen" weight="fill" aria-hidden="true" />
                      </div>
                      <div className="text-xs sm:text-sm text-charcoal">
                        <strong className="text-brand-deep font-semibold">Pre-written message drafts:</strong> Copy a polite, formatted email with order facts ready in 1 tap.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen font-bold text-xs shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-brand-evergreen" weight="fill" aria-hidden="true" />
                      </div>
                      <div className="text-xs sm:text-sm text-charcoal">
                        <strong className="text-brand-deep font-semibold">Evidence checklists:</strong> What photos, AWB waybills, and batch codes customer care requires.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen font-bold text-xs shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-brand-evergreen" weight="fill" aria-hidden="true" />
                      </div>
                      <div className="text-xs sm:text-sm text-charcoal">
                        <strong className="text-brand-deep font-semibold">Direct official channels:</strong> Verified customer care emails and escalation paths with zero spam.
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-6">
                    <Link
                      href="/help"
                      className={cn(
                        "w-full sm:w-auto font-semibold text-sm sm:text-base px-7 h-12 shadow-ambient active:scale-[0.98] motion-safe:transition-transform",
                        buttonVariants({ variant: "primary", size: "lg" })
                      )}
                    >
                      <span>Open order issue helper</span>
                      <ArrowRight className="ml-2 w-4 h-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </div>

                  {/* Direct Scenario Link Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-deep/8 w-full text-xs">
                    <span className="text-muted font-medium mr-1">Direct issue guides:</span>
                    <Link
                      href="/help/delayed-delivery"
                      className="px-2.5 py-1 rounded-full bg-surface hover:bg-surface-sage text-brand-deep font-semibold transition-colors border border-brand-deep/10 focus-ring shadow-2xs"
                    >
                      Delayed delivery &rarr;
                    </Link>
                    <Link
                      href="/help/damaged-package"
                      className="px-2.5 py-1 rounded-full bg-surface hover:bg-surface-sage text-brand-deep font-semibold transition-colors border border-brand-deep/10 focus-ring shadow-2xs"
                    >
                      Damaged package &rarr;
                    </Link>
                    <Link
                      href="/help/payment-uncertainty"
                      className="px-2.5 py-1 rounded-full bg-surface hover:bg-surface-sage text-brand-deep font-semibold transition-colors border border-brand-deep/10 focus-ring shadow-2xs"
                    >
                      Payment uncertainty &rarr;
                    </Link>
                  </div>
                </div>

                {/* Right Column: Live Interactive Support Draft Preview */}
                <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center w-full">
                  <OrderResolutionPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section id="faq" className="relative py-16 md:py-24" aria-labelledby="faq-heading">
          <div className="max-w-container mx-auto px-5">
            {/* FAQ Accordion */}
            <ScrollReveal className="max-w-3xl mx-auto">
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
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      {/* Deep navy background (#0B2447) per design system */}
      <footer className="relative z-20 bg-brand-deep text-white/85 py-12 border-t border-brand-deep/20" role="contentinfo">
        <div className="max-w-container mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
            {/* Col 1: Brand & Promise */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-7 h-7 rounded-button bg-white/10 border border-white/20 flex items-center justify-center text-white font-display font-bold text-[11px] tracking-tight shrink-0 shadow-2xs select-none"
                  aria-hidden="true"
                >
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
                  <Link href="/how-it-works" className="hover:text-white transition-colors focus-ring rounded">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/safeguards" className="hover:text-white transition-colors focus-ring rounded">
                    Our safeguards
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
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              <span>WCAG AA Compliant</span>
              <span>&bull;</span>
              <span>Unbiased transparent matching</span>
              <span>&bull;</span>
              <ReduceMotionToggle />
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar (reveals after scrolling past hero) */}
      <StickyMobileCta heroElementId="hero-section" />
    </div>
  );
}
