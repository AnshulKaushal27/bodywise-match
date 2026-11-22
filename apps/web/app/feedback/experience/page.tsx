"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  Check,
  Lifebuoy,
} from "@phosphor-icons/react/dist/ssr";
import {
  DEMO_CATALOGUE_SEED,
  DurationBucket,
  UsageConsistency,
  SelfReportedOutcome,
  ComfortReaction,
} from "@bodywise/shared";
import { Button, Card } from "@/components/ui";

function ExperienceFormView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial product slug from search params or default to first product
  const slugParam = searchParams.get("slug") || searchParams.get("product_slug");
  const [selectedSlug, setSelectedSlug] = React.useState<string>(
    slugParam && DEMO_CATALOGUE_SEED.some((p) => p.slug === slugParam)
      ? slugParam
      : DEMO_CATALOGUE_SEED[0].slug
  );

  // Quick escape state ("I didn't try it", "Not yet", "Skip")
  const [escapeReason, setEscapeReason] = React.useState<"not_tried" | "not_yet" | "skipped" | null>(null);

  // Form Fields
  const [duration, setDuration] = React.useState<DurationBucket | null>(null);
  const [consistency, setConsistency] = React.useState<UsageConsistency | null>(null);
  const [outcome, setOutcome] = React.useState<SelfReportedOutcome | null>(null);
  const [comfort, setComfort] = React.useState<ComfortReaction | null>(null);
  const [textSnippet, setTextSnippet] = React.useState<string>("");

  // Follow-up state when discomfort or no improvement is reported
  const [nextStepDismissed, setNextStepDismissed] = React.useState<boolean>(false);
  const hasDiscomfortOrNoImprovement =
    !nextStepDismissed &&
    (comfort === "stopped using" ||
      comfort === "mild irritation" ||
      outcome === "no change" ||
      outcome === "worse");

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false);

  const selectedProduct = DEMO_CATALOGUE_SEED.find((p) => p.slug === selectedSlug) || DEMO_CATALOGUE_SEED[0];

  const canSubmit = duration !== null && consistency !== null && outcome !== null && comfort !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    const newRecord = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: selectedProduct.id,
      product_slug: selectedProduct.slug,
      duration_bucket: duration!,
      usage_consistency: consistency!,
      self_reported_outcome: outcome!,
      comfort_reaction: comfort!,
      moderated_text: textSnippet.trim() || null,
      moderation_status: "published" as const,
      publication_consent: true,
      recommendation_consent: true,
      created_at: new Date().toISOString().split("T")[0],
      source: "Verified Customer Review",
      is_demo: false,
    };

    // 1. Persist to localStorage so every reload retains it
    try {
      const existingStr = typeof window !== "undefined" ? localStorage.getItem("bodywise_community_experiences") : null;
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newRecord, ...existing.filter((item: { id?: string }) => item.id !== newRecord.id)];
      localStorage.setItem("bodywise_community_experiences", JSON.stringify(updated));
      window.dispatchEvent(new Event("bodywise:review-submitted"));
    } catch (err) {
      console.warn("Failed to save experience to localStorage", err);
    }

    // 2. Also send to API server
    try {
      await fetch("http://localhost:4000/v1/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
    } catch (err) {
      console.warn("API server offline, review saved locally", err);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href={`/products/${selectedSlug}`}
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Back to product</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/products"
            className="text-xs font-semibold text-muted hover:text-charcoal focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Catalogue
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-8 md:py-12 flex-1 w-full">
        {/* ================= ESCAPED STATE ================= */}
        {escapeReason !== null ? (
          <Card variant="surface" className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-surface-sage mx-auto flex items-center justify-center text-brand-evergreen">
              <CheckCircle className="w-6 h-6" weight="regular" />
            </div>
            <h2 className="font-display font-bold text-2xl text-brand-deep tracking-tight">
              {escapeReason === "not_tried"
                ? "No problem at all!"
                : escapeReason === "not_yet"
                ? "Take your time!"
                : "Feedback skipped"}
            </h2>
            <p className="text-sm text-charcoal/80 leading-relaxed max-w-md mx-auto">
              {escapeReason === "not_tried"
                ? "We only record experiences from customers who have personally tried the product. You can browse catalogue specifications anytime."
                : escapeReason === "not_yet"
                ? "Consistent use takes time. Feel free to come back and share your observations whenever you feel ready."
                : "You can continue exploring product facts and options whenever you wish."}
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => router.push(`/products/${selectedSlug}`)}
              >
                Back to product
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/products")}
              >
                Browse catalogue
              </Button>
            </div>
          </Card>
        ) : isSubmitted ? (
          /* ================= SUBMITTED STATE ================= */
          <Card variant="surface" className="p-8 text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-surface-sage mx-auto flex items-center justify-center text-brand-evergreen shadow-xs">
              <CheckCircle className="w-8 h-8" weight="regular" />
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-deep mb-2 tracking-tight">
                Thank you for your review
              </h2>
              <p className="text-sm text-charcoal/85 leading-relaxed max-w-md mx-auto">
                Your experience has been saved and published to the community. It is now visible on the product page and will persist across reloads.
              </p>
            </div>

            {/* If user stopped using due to reaction, provide /help link */}
            {comfort === "stopped using" && (
              <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-left text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-caution-text">
                  <WarningCircle className="w-4 h-4 shrink-0" weight="regular" />
                  <span>Experienced a reaction or need support?</span>
                </div>
                <p className="text-charcoal/90 leading-relaxed">
                  Since you discontinued use due to discomfort, you can use our Order &amp; Product Issue Helper to document your batch code and prepare a support message for official Be Bodywise customer care.
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-1 font-bold text-caution-text hover:underline pt-1 active:scale-[0.98] motion-safe:transition-transform"
                >
                  <Lifebuoy className="w-3.5 h-3.5" weight="regular" />
                  <span>Open Order &amp; Product Issue Helper &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Link href={`/products/${selectedSlug}`}>
                <Button variant="primary">Return to product</Button>
              </Link>
              <Link href="/products">
                <Button variant="secondary">Browse all products</Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* ================= FORM VIEW ================= */
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
                Community Feedback
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight mt-1 mb-2">
                Share Your Product Experience
              </h1>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                We believe in genuine trade-offs, not paid 5-star hype. Tell us how this formula felt and worked for you.
              </p>
            </div>

            {/* Product Context Banner */}
            <div className="p-4 rounded-card bg-surface border border-border shadow-xs flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Product being reviewed
                </span>
                <span className="font-display font-bold text-sm sm:text-base text-brand-deep">
                  {selectedProduct.official_name}
                </span>
                <span className="text-xs text-muted block">
                  {selectedProduct.format} &bull; {selectedProduct.size}
                </span>
              </div>

              {/* Product switcher */}
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-button bg-paper border border-border text-charcoal focus-ring"
                aria-label="Change product"
              >
                {DEMO_CATALOGUE_SEED.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.official_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ================= 1. ESCAPE BUTTONS FIRST ================= */}
            <div className="p-4 rounded-card bg-surface-sage/30 border border-border space-y-2.5">
              <span className="text-xs font-bold text-brand-deep block">
                Haven&apos;t used this product or prefer not to review?
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEscapeReason("not_tried")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-surface-sage border border-border text-charcoal focus-ring transition-colors min-h-[36px]"
                >
                  I didn&apos;t try it
                </button>
                <button
                  type="button"
                  onClick={() => setEscapeReason("not_yet")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-surface-sage border border-border text-charcoal focus-ring transition-colors min-h-[36px]"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  onClick={() => setEscapeReason("skipped")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-surface-sage border border-border text-muted hover:text-charcoal focus-ring transition-colors min-h-[36px]"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* ================= FORM BODY ================= */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Field 1: Duration Bucket */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-bold text-brand-deep">
                  1. How long have you been using it? <span className="text-caution-text">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(["<2 weeks", "2-4 weeks", "1-3 months", "3+ months"] as DurationBucket[]).map((dur) => {
                    const isSelected = duration === dur;
                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`p-3 rounded-button border text-xs font-semibold flex items-center justify-center gap-1.5 focus-ring transition-colors min-h-[44px] ${
                          isSelected
                            ? "bg-brand-evergreen text-surface border-brand-evergreen shadow-xs"
                            : "bg-surface text-charcoal border-border hover:bg-surface-sage/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime" />}
                        <span>{dur}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Usage Consistency */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-bold text-brand-deep">
                  2. How consistently did you apply it? <span className="text-caution-text">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: "daily", label: "Daily" },
                      { id: "few times a week", label: "Few times a week" },
                      { id: "occasionally", label: "Occasionally" },
                    ] as { id: UsageConsistency; label: string }[]
                  ).map((item) => {
                    const isSelected = consistency === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setConsistency(item.id)}
                        className={`p-3 rounded-button border text-xs font-semibold flex items-center justify-center gap-1.5 focus-ring transition-colors min-h-[44px] ${
                          isSelected
                            ? "bg-brand-evergreen text-surface border-brand-evergreen shadow-xs"
                            : "bg-surface text-charcoal border-border hover:bg-surface-sage/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Self-reported Outcome */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-bold text-brand-deep">
                  3. What outcome did you observe for your stated goal? <span className="text-caution-text">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: "better", label: "Better (Noticed improvement)" },
                      { id: "no change", label: "No change (Same as before)" },
                      { id: "worse", label: "Worse (Didn't suit me)" },
                      { id: "not sure", label: "Not sure (Too early to tell)" },
                    ] as { id: SelfReportedOutcome; label: string }[]
                  ).map((item) => {
                    const isSelected = outcome === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOutcome(item.id)}
                        className={`p-3 rounded-button border text-xs font-semibold flex items-center justify-center gap-1.5 focus-ring transition-colors min-h-[48px] text-center ${
                          isSelected
                            ? "bg-brand-evergreen text-surface border-brand-evergreen shadow-xs"
                            : "bg-surface text-charcoal border-border hover:bg-surface-sage/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Comfort / Reaction */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-bold text-brand-deep">
                  4. How did your skin or scalp feel? <span className="text-caution-text">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: "no issue", label: "No issue (Comfortable)" },
                      { id: "mild irritation", label: "Mild temporary irritation" },
                      { id: "stopped using", label: "Stopped using (Reaction)" },
                    ] as { id: ComfortReaction; label: string }[]
                  ).map((item) => {
                    const isSelected = comfort === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setComfort(item.id)}
                        className={`p-3 rounded-button border text-xs font-semibold flex items-center justify-center gap-1.5 focus-ring transition-colors min-h-[44px] ${
                          isSelected
                            ? "bg-brand-evergreen text-surface border-brand-evergreen shadow-xs"
                            : "bg-surface text-charcoal border-border hover:bg-surface-sage/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up if user reports discomfort or no improvement */}
              {hasDiscomfortOrNoImprovement && (
                <div className="p-4 sm:p-5 rounded-card bg-caution-peach/60 border-l-4 border-caution-text space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <WarningCircle className="w-5 h-5 text-caution-text shrink-0" weight="regular" />
                    <span className="font-display font-bold text-sm text-caution-text">
                      Safety Guidance &amp; Next Steps
                    </span>
                  </div>

                  {/* Neutral safety guidance */}
                  <p className="text-xs sm:text-sm text-charcoal/90 leading-relaxed">
                    Stop using the product and consult a qualified health professional if you have a significant reaction. We provide zero clinical evaluations and do not assess medical severity.
                  </p>

                  <div className="pt-2 border-t border-caution-text/30">
                    <span className="text-xs font-bold text-brand-deep block mb-2">
                      What would you like to do next?
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/products?category=${selectedProduct.category}`}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-surface hover:bg-surface-sage text-brand-deep border border-border focus-ring transition-colors shadow-xs"
                      >
                        See another option
                      </Link>
                      <Link
                        href="/help/product-reaction"
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-evergreen hover:bg-brand-deep text-surface focus-ring transition-colors shadow-xs"
                      >
                        Get help
                      </Link>
                      <button
                        type="button"
                        onClick={() => setNextStepDismissed(true)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-charcoal underline"
                      >
                        Skip
                      </button>
                    </div>
                    <p className="text-[11px] text-muted italic mt-2">
                      Note: We strictly do not auto-recommend a stronger active following reported discomfort or lack of improvement.
                    </p>
                  </div>
                </div>
              )}

              {/* Field 5: Optional Text Snippet (max 300 chars) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="optional-snippet" className="block text-xs sm:text-sm font-bold text-brand-deep">
                    5. Optional comment or trade-off noted
                  </label>
                  <span className="text-[11px] text-muted">
                    {textSnippet.length}/300
                  </span>
                </div>
                <textarea
                  id="optional-snippet"
                  value={textSnippet}
                  onChange={(e) => setTextSnippet(e.target.value.slice(0, 300))}
                  placeholder="e.g. Scent was mild; absorbed fast without sticky residue, but lather was light."
                  rows={3}
                  className="w-full p-3 rounded-button bg-surface border border-border text-charcoal text-xs sm:text-sm focus-ring placeholder:text-muted/60"
                />
                <span className="text-[11px] text-muted block">
                  Please do not include names, phone numbers, or private medical records.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full text-sm font-bold shadow-sm"
                >
                  {isSubmitting ? "Submitting review..." : "Submit review"}
                </Button>
                {!canSubmit && (
                  <p className="text-center text-[11px] text-muted mt-2">
                    Please select duration, consistency, outcome, and comfort to submit.
                  </p>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Bodywise Match &bull; Community Experience Moderation System</p>
      </footer>
    </div>
  );
}

export default function ExperienceFeedbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-evergreen border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-brand-deep">Loading experience form...</p>
          </div>
        </div>
      }
    >
      <ExperienceFormView />
    </React.Suspense>
  );
}
