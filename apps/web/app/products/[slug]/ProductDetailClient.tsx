"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  WarningCircle,
  Question,
  Drop,
  Flask,
  Wind,
  Sun,
  Pill,
  Sparkle,
  CheckCircle,
  Check,
  FileText,
  Lifebuoy,
  BookmarkSimple,
} from "@phosphor-icons/react";
import {
  ProductRecord,
  ParsedNeeds,
  matchProducts,
  Recommendation,
  CONTROLLED_GOALS,
} from "@bodywise/shared";
import { DemoBadge, SourceTag } from "@/components/ui";
import { CustomerExperiences } from "@/components/CustomerExperiences";
import { TrialFollowupBanner } from "@/components/TrialFollowupBanner";

interface ProductDetailClientProps {
  product: ProductRecord;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Session needs state (Rule: only show "Why it matched / why it may not" when arriving from a session)
  const [sessionNeeds, setSessionNeeds] = React.useState<ParsedNeeds | null>(null);
  const [sessionRecommendation, setSessionRecommendation] = React.useState<Recommendation | null>(null);

  // Compare state
  const [isCompared, setIsCompared] = React.useState<boolean>(false);
  const [compareCount, setCompareCount] = React.useState<number>(0);

  // "Trying one of these?" local state
  const [isSavedTrial, setIsSavedTrial] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Check saved trial state
      try {
        const trialsRaw = localStorage.getItem("bodywise_saved_trials");
        if (trialsRaw) {
          const trials = JSON.parse(trialsRaw);
          if (Array.isArray(trials) && trials.some((t: { slug: string }) => t.slug === product.slug)) {
            setIsSavedTrial(true);
          }
        }
      } catch {
        // Ignore
      }

      // Check session needs
      try {
        const stored = sessionStorage.getItem("bodywise_parsed_needs");
        if (stored) {
          const parsed: ParsedNeeds = JSON.parse(stored);
          setSessionNeeds(parsed);

          // Run deterministic matcher against this product to derive reason codes
          const matchResult = matchProducts(parsed, [product]);
          if (matchResult.status === "MATCHES_FOUND" && matchResult.shortlist.length > 0) {
            setSessionRecommendation(matchResult.shortlist[0]);
          }
        }
      } catch {
        // No valid session
      }

      // Check compare state
      try {
        const compareIdsRaw = sessionStorage.getItem("bodywise_compare_ids");
        if (compareIdsRaw) {
          const ids: string[] = JSON.parse(compareIdsRaw);
          if (Array.isArray(ids)) {
            setIsCompared(ids.includes(product.id));
            setCompareCount(ids.length);
          }
        }
      } catch {
        // Ignore
      }
    }
  }, [product]);

  // Toggle compare
  const handleToggleCompare = () => {
    if (typeof window === "undefined") return;
    try {
      const compareIdsRaw = sessionStorage.getItem("bodywise_compare_ids");
      let ids: string[] = compareIdsRaw ? JSON.parse(compareIdsRaw) : [];
      if (!Array.isArray(ids)) ids = [];

      if (ids.includes(product.id)) {
        ids = ids.filter((id) => id !== product.id);
        setIsCompared(false);
      } else {
        if (ids.length >= 3) {
          ids = [...ids.slice(1), product.id];
        } else {
          ids = [...ids, product.id];
        }
        setIsCompared(true);
      }
      sessionStorage.setItem("bodywise_compare_ids", JSON.stringify(ids));
      setCompareCount(ids.length);
    } catch {
      // Ignore
    }
  };

  // "Trying one of these? Save on this device"
  const handleSaveTrial = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("bodywise_saved_trials");
      let trials = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(trials)) trials = [];
      if (!trials.some((t: { slug: string }) => t.slug === product.slug)) {
        trials.push({
          slug: product.slug,
          name: product.official_name,
          saved_at: Date.now(),
          dismissed: false,
        });
        localStorage.setItem("bodywise_saved_trials", JSON.stringify(trials));
      }
      setIsSavedTrial(true);
    } catch {
      // Ignore
    }
  };

  // Helper for Product-type Icon
  const getProductTypeIcon = (category: string) => {
    switch (category) {
      case "body_wash":
      case "face_wash":
        return <Drop className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "serum":
        return <Flask className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "shampoo":
      case "conditioner":
      case "hair_oil":
        return <Wind className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "sunscreen":
        return <Sun className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "supplement":
        return <Pill className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      default:
        return <Sparkle className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Navigation */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/products"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Catalogue</span>
          </Link>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={compareCount > 0 ? "/compare" : `/compare?ids=${product.id}`}
              className="text-xs font-bold text-brand-evergreen hover:text-brand-deep bg-surface-sage/50 hover:bg-surface-sage px-3 py-1.5 rounded-full border border-border focus-ring transition-colors"
            >
              Compare ({compareCount})
            </Link>
          </div>
        </div>
      </header>

      {/* 7-Day Follow-up Banner (shows only once per product after 7 days) */}
      <TrialFollowupBanner />

      {/* Main Content: Exact Section Order Required */}
      <main id="main-content" className="max-w-prose md:max-w-3xl mx-auto px-5 py-8 md:py-12 flex-1 w-full space-y-10">
        {/* ================= 1. HEADER (name, image, format, size) ================= */}
        <section aria-labelledby="product-header" className="p-6 md:p-8 rounded-card bg-surface border border-border shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border/70">
            <div className="flex items-center gap-2 flex-wrap">
              <DemoBadge />
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-sage text-brand-deep uppercase tracking-wider">
                {product.category.replace(/_/g, " ")}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleCompare}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors focus-ring flex items-center gap-1.5 ${
                isCompared
                  ? "bg-brand-evergreen text-surface border-brand-evergreen"
                  : "bg-surface text-brand-deep border-border hover:bg-surface-sage"
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent-lime" />
                  <span>In Comparison</span>
                </>
              ) : (
                <span>+ Add to Compare</span>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Image / Neutral Sage Placeholder */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-card bg-surface-sage/40 border border-border flex items-center justify-center shrink-0">
              {getProductTypeIcon(product.category)}
            </div>

            <div className="flex-1">
              <h1
                id="product-header"
                className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-brand-deep tracking-tight mb-2"
              >
                {product.official_name}
              </h1>
              <p className="text-sm md:text-base text-muted font-medium">
                {product.format} &bull; {product.size}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {product.supported_goals.map((gId) => {
                  const goalDef = CONTROLLED_GOALS.find((g) => g.id === gId);
                  return (
                    <span
                      key={gId}
                      className="text-xs px-2.5 py-1 rounded-full bg-paper text-charcoal border border-border"
                    >
                      {goalDef?.label || gId.replace(/_/g, " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* "Trying one of these?" Save on this device */}
          <div className="mt-5 pt-3.5 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs text-charcoal/80">
              <strong className="text-brand-deep">Trying one of these?</strong> Save to this device and we&apos;ll check in after 7 days.
            </div>
            <button
              type="button"
              onClick={handleSaveTrial}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors focus-ring flex items-center gap-1.5 self-start sm:self-auto ${
                isSavedTrial
                  ? "bg-surface-sage text-brand-deep border-brand-evergreen/40 font-bold"
                  : "bg-paper hover:bg-surface-sage text-brand-deep border-border"
              }`}
            >
              {isSavedTrial ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-evergreen" weight="bold" />
                  <span>Saved on this device</span>
                </>
              ) : (
                <>
                  <BookmarkSimple className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
                  <span>Save on this device</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ================= CORE PRODUCT SPECIFICATIONS ================= */}
        <div className="rounded-card bg-surface border border-border shadow-ambient p-6 md:p-8 space-y-8 divide-y divide-border">
          {/* ================= 2. "INTENDED USE (FROM OFFICIAL DESCRIPTION)" ================= */}
          <section aria-labelledby="intended-use" className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <h2 id="intended-use" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                Intended use (from official description)
              </h2>
            </div>
            <p className="text-sm md:text-base text-charcoal/90 leading-relaxed mb-4">
              {product.official_description}
            </p>
            {product.suitable_for && product.suitable_for.length > 0 && (
              <div className="pt-3 border-t border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Suitable for
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.suitable_for.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-full bg-surface-sage/50 text-brand-deep border border-border"
                    >
                      {item.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ================= 3. "HOW TO USE (OFFICIAL LABEL DIRECTIONS ONLY)" ================= */}
          <section aria-labelledby="how-to-use" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <h2 id="how-to-use" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                How to use (official label directions only)
              </h2>
            </div>
            <p className="text-sm md:text-base text-charcoal/90 leading-relaxed bg-paper p-4 rounded-button border border-border">
              {product.label_directions}
            </p>
          </section>

          {/* ================= 4. "INGREDIENTS" (only if sourced, else "Not verified yet") ================= */}
          <section aria-labelledby="ingredients-heading" className="pt-8 space-y-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Flask className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                <h2 id="ingredients-heading" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                  Ingredients
                </h2>
              </div>
              {product.ingredients && product.ingredients.length > 0 && product.last_verified_at ? (
                <SourceTag
                  source={product.source_url || "Packaging Label"}
                  lastVerifiedAt={product.last_verified_at}
                />
              ) : (
                <SourceTag source={null} />
              )}
            </div>

            {product.ingredients && product.ingredients.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Official packaging ingredient declaration verified from manufacturer source:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-full bg-paper text-charcoal border border-border"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-button bg-surface-sage/30 border border-border text-xs md:text-sm text-charcoal/85 flex items-start gap-2.5">
                <Question className="w-4 h-4 text-muted shrink-0 mt-0.5" weight="regular" />
                <div>
                  <strong className="font-semibold text-brand-deep block mb-0.5">
                    Not verified yet
                  </strong>
                  <span>
                    We strictly do not invent ingredients or scrape third-party blogs. A verified ingredient list from the official physical packaging will be uploaded following barcode check.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ================= 5. "CAUTIONS" (official label only) ================= */}
          <section aria-labelledby="cautions-heading" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <WarningCircle className="w-5 h-5 text-caution-text" weight="regular" aria-hidden="true" />
              <h2 id="cautions-heading" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                Cautions (official label only)
              </h2>
            </div>

            {product.cautions && product.cautions.length > 0 ? (
              <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Official Packaging Warnings &amp; Advisory
                </span>
                <ul className="text-xs md:text-sm space-y-1.5 pl-4 list-disc marker:text-caution-text">
                  {product.cautions.map((caution, idx) => (
                    <li key={idx}>{caution}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-muted italic">
                No specific cautions found on current packaging label.
              </p>
            )}
          </section>
        </div>

        {/* ================= 6. "WHY IT MATCHED / WHY IT MAY NOT" (ONLY when arriving from a session) ================= */}
        {sessionNeeds && (
          <section aria-labelledby="session-match-heading" className="p-6 md:p-8 rounded-card bg-surface border-2 border-brand-evergreen/30 shadow-card animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                <h2 id="session-match-heading" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                  Why it matched / why it may not
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-lime text-brand-deep border border-brand-deep/20">
                Active Session Recap
              </span>
            </div>

            <div className="mb-4 text-xs md:text-sm text-charcoal/85">
              <span>Based on your stated concern: </span>
              <strong className="text-brand-deep capitalize font-semibold">
                {sessionNeeds.goal?.replace(/_/g, " ")}
              </strong>
              {sessionNeeds.format_preferences.length > 0 && (
                <span> with format preference for {sessionNeeds.format_preferences.join(", ")}</span>
              )}
              .
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consider Column */}
              <div className="p-4 rounded-button bg-surface-sage/30 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
                  Consider this if...
                </h3>
                <ul className="text-xs md:text-sm text-charcoal/85 space-y-1.5 pl-4 list-disc marker:text-brand-evergreen">
                  {sessionRecommendation?.considerIf && sessionRecommendation.considerIf.length > 0 ? (
                    sessionRecommendation.considerIf.map((c, i) => <li key={i}>{c}</li>)
                  ) : (
                    <>
                      <li>Directly supports your stated target goal.</li>
                      <li>Matches your lifestyle routine and application preference.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Caution Column */}
              <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <WarningCircle className="w-3.5 h-3.5 text-caution-text" weight="regular" />
                  May not be the best fit if...
                </h3>
                <ul className="text-xs md:text-sm space-y-1.5 pl-4 list-disc marker:text-caution-text">
                  {sessionRecommendation?.mayNotFitIf && sessionRecommendation.mayNotFitIf.length > 0 ? (
                    sessionRecommendation.mayNotFitIf.map((c, i) => <li key={i}>{c}</li>)
                  ) : (
                    <>
                      <li>You prefer a different texture or format application.</li>
                      <li>You have known sensitivities to active ingredient classes.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ================= 7. "CUSTOMER EXPERIENCES" PANEL (Demo data badged) ================= */}
        <CustomerExperiences
          productSlug={product.slug}
          productId={product.id}
          productName={product.official_name}
        />

        {/* ================= 8. "NEED HELP AFTER ORDERING?" PANEL (linking to /help) ================= */}
        <section aria-labelledby="need-help" className="p-6 md:p-8 rounded-card bg-surface-sage/35 border border-brand-evergreen/30 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-brand-evergreen border border-border shadow-xs">
              <Lifebuoy className="w-5 h-5" weight="regular" aria-hidden="true" />
            </div>

            <div className="flex-1">
              <h2 id="need-help" className="font-display font-bold text-base md:text-lg text-brand-deep mb-1 tracking-tight">
                Need help after ordering?
              </h2>
              <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed mb-4">
                Experienced unexpected sensitivity, skin reaction, or received an incorrect batch? We cannot access courier logistics, but our Issue Helper prepares a structured message with batch numbers and photos for official Be Bodywise customer care.
              </p>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-evergreen text-surface hover:bg-brand-deep px-4 py-2 rounded-button focus-ring shadow-sm transition-colors active:scale-[0.98] motion-safe:transition-transform"
              >
                <span>Open Order &amp; Product Issue Helper</span>
                <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 9. DATA-PROVENANCE FOOTER ================= */}
        <section aria-labelledby="data-provenance" className="p-5 md:p-6 rounded-card bg-paper border border-border text-xs text-muted space-y-3">
          <div className="flex items-center gap-2 text-brand-deep font-bold">
            <ShieldCheck className="w-4 h-4 text-brand-evergreen" weight="regular" aria-hidden="true" />
            <h2 id="data-provenance" className="font-display font-bold text-sm text-brand-deep">
              Data Provenance &amp; Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/70">
            <div>
              <span className="block font-semibold text-brand-deep text-[11px] uppercase tracking-wider">
                Source Document
              </span>
              <span className="truncate block mt-0.5">
                {product.source_url ? (
                  <a
                    href={product.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-brand-evergreen"
                  >
                    {product.source_url}
                  </a>
                ) : (
                  "Official Packaging Record"
                )}
              </span>
            </div>

            <div>
              <span className="block font-semibold text-brand-deep text-[11px] uppercase tracking-wider">
                Last Verified
              </span>
              <span className="block mt-0.5">
                {product.last_verified_at || "Not verified yet"}
              </span>
            </div>

            <div>
              <span className="block font-semibold text-brand-deep text-[11px] uppercase tracking-wider">
                Catalog Version
              </span>
              <span className="block mt-0.5">
                {product.catalog_version}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-muted/80">
            Catalogue UUID: <code className="bg-surface px-1 py-0.5 rounded border border-border/60">{product.id}</code>
          </div>
        </section>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <div className="max-w-container mx-auto px-5 space-y-2">
          <p className="font-semibold text-brand-deep">
            Bodywise Match &bull; Independent Wellness Product Discovery
          </p>
          <p>
            Informational product finder only. No medical diagnosis or curative claims.
          </p>
        </div>
      </footer>
    </div>
  );
}
