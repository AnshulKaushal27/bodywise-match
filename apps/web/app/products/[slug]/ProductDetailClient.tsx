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
  ArrowSquareOut,
  CaretRight,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import {
  ProductRecord,
  ParsedNeeds,
  matchProducts,
  Recommendation,
  CONTROLLED_GOALS,
  DEMO_CATALOGUE_SEED,
} from "@bodywise/shared";
import { CustomerExperiences } from "@/components/CustomerExperiences";
import { TrialFollowupBanner } from "@/components/TrialFollowupBanner";
import { useOptionalMatchSession } from "@/lib/matchSessionContext";

interface ProductDetailClientProps {
  product: ProductRecord;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const matchSession = useOptionalMatchSession();
  const setIsChatOpen = matchSession?.setIsChatOpen || (() => {});

  // Session needs state (Rule: only show "Why it matched / why it may not" when arriving from a session)
  const [sessionNeeds, setSessionNeeds] = React.useState<ParsedNeeds | null>(null);
  const [sessionRecommendation, setSessionRecommendation] = React.useState<Recommendation | null>(null);

  // Compare state
  const [isCompared, setIsCompared] = React.useState<boolean>(false);
  const [compareCount, setCompareCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
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

  // 3 Related products from verified DEMO_CATALOGUE_SEED to populate sidebar
  const relatedProducts = React.useMemo(() => {
    const sameCat = DEMO_CATALOGUE_SEED.filter(
      (p) => p.category === product.category && p.id !== product.id
    );
    if (sameCat.length >= 3) {
      return sameCat.slice(0, 3);
    }
    const sameGoal = DEMO_CATALOGUE_SEED.filter(
      (p) =>
        p.id !== product.id &&
        !sameCat.some((sc) => sc.id === p.id) &&
        p.supported_goals.some((g) => product.supported_goals.includes(g))
    );
    return [...sameCat, ...sameGoal].slice(0, 3);
  }, [product]);

  const categoryDisplay = product.category.replace(/_/g, " ");

  // Helper for Product-type Icon
  const getProductTypeIcon = (category: string) => {
    switch (category) {
      case "body_wash":
      case "face_wash":
        return <Drop className="w-10 h-10 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "serum":
      case "roll_on":
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
      {/* Editorial Breadcrumbs & Quick Back Sub-Bar */}
      <section
        aria-label="Breadcrumb navigation"
        className="border-b border-border bg-surface/70 backdrop-blur-sm sticky top-16 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-muted overflow-x-auto whitespace-nowrap py-1">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-evergreen hover:text-brand-deep transition-colors focus-ring rounded px-1.5 py-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
              <span>Catalogue</span>
            </Link>
            <CaretRight className="w-3 h-3 text-text-muted/60 shrink-0" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="capitalize hover:text-brand-deep transition-colors focus-ring rounded px-1"
            >
              {categoryDisplay}
            </Link>
            <CaretRight className="w-3 h-3 text-text-muted/60 shrink-0" />
            <span className="font-semibold text-brand-deep truncate max-w-[200px] sm:max-w-xs">
              {product.official_name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={compareCount > 0 ? "/compare" : `/compare?ids=${product.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-sage/70 hover:bg-surface-sage text-brand-deep font-semibold text-xs border border-border focus-ring transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-brand-evergreen" />
              <span>Compare ({compareCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7-Day Follow-up Banner (shows only once per product after 7 days) */}
      <TrialFollowupBanner />

      {/* Main Content Area: Responsive 12-Column Desktop Grid Filling All Surroundings */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT / MAIN CONTENT COLUMN (8 Columns on Desktop) ================= */}
          <div className="lg:col-span-8 space-y-8">
            {/* ================= 1. HEADER (name, image, format, size) ================= */}
            <section
              id="product-header"
              aria-labelledby="product-title-heading"
              className="p-6 sm:p-8 rounded-card bg-surface border border-border shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-sage text-brand-deep uppercase tracking-wider">
                    {categoryDisplay}
                  </span>
                  {product.price_inr && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-deep text-surface">
                      ₹{product.price_inr}
                    </span>
                  )}
                  {product.fragrance_free && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper text-brand-evergreen border border-border">
                      Fragrance-Free
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={product.source_url || `https://bebodywise.com/product/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-primary text-white hover:bg-brand-deep px-4 py-2 rounded-button shadow-xs transition-colors focus-ring active:scale-[0.98]"
                  >
                    <span>Buy on Be Bodywise</span>
                    <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" />
                  </a>

                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    className={`text-xs font-bold px-3.5 py-2 rounded-button border transition-colors focus-ring flex items-center gap-1.5 ${
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
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Image Preview with Neutral Sage Container */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-card bg-surface-sage/40 border border-border flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.official_name}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    getProductTypeIcon(product.category)
                  )}
                </div>

                <div className="flex-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    {product.brand_line || "Be Bodywise"}
                  </span>
                  <h1
                    id="product-title-heading"
                    className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-deep tracking-tight mb-2 leading-tight"
                  >
                    {product.official_name}
                  </h1>
                  <p className="text-sm md:text-base text-muted font-medium">
                    {product.format} &bull; {product.size}
                  </p>

                  {/* Supported Goals Chips */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.supported_goals.map((gId) => {
                      const goalDef = CONTROLLED_GOALS.find((g) => g.id === gId);
                      return (
                        <span
                          key={gId}
                          className="text-xs px-3 py-1 rounded-full bg-paper text-charcoal border border-border font-medium inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-evergreen shrink-0" />
                          <span>{goalDef?.label || gId.replace(/_/g, " ")}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ================= CORE PRODUCT SPECIFICATIONS ================= */}
            <div className="rounded-card bg-surface border border-border shadow-ambient p-6 sm:p-8 space-y-8 divide-y divide-border">
              {/* ================= 2. "INTENDED USE" ================= */}
              <section id="intended-use" aria-labelledby="intended-use-heading" className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                  <h2
                    id="intended-use-heading"
                    className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight"
                  >
                    Intended use
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
                          className="text-xs px-2.5 py-1 rounded-full bg-surface-sage/50 text-brand-deep border border-border capitalize"
                        >
                          {item.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ================= 3. "HOW TO USE" ================= */}
              <section id="how-to-use" aria-labelledby="how-to-use-heading" className="pt-8 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                  <h2
                    id="how-to-use-heading"
                    className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight"
                  >
                    How to use
                  </h2>
                </div>
                <div className="text-sm md:text-base text-charcoal/90 leading-relaxed bg-paper p-5 rounded-button border border-border">
                  <p className="whitespace-pre-line">{product.label_directions}</p>
                </div>
              </section>

              {/* ================= 4. "INGREDIENTS" ================= */}
              <section id="ingredients-heading" aria-labelledby="ingredients-title" className="pt-8 space-y-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Flask className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                    <h2
                      id="ingredients-title"
                      className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight"
                    >
                      Ingredients
                    </h2>
                  </div>
                  {product.ingredients && (
                    <span className="text-xs text-text-muted font-medium">
                      {product.ingredients.length} verified components
                    </span>
                  )}
                </div>

                {product.ingredients && product.ingredients.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-3 py-1.5 rounded-full border border-border ${
                            idx % 2 === 0
                              ? "bg-surface-sage/40 text-brand-deep font-semibold"
                              : "bg-paper text-charcoal font-normal"
                          }`}
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
                        A verified ingredient list from packaging will be updated once confirmed.
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* ================= 5. "CAUTIONS" ================= */}
              <section id="cautions-heading" aria-labelledby="cautions-title" className="pt-8 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <WarningCircle className="w-5 h-5 text-caution-text" weight="regular" aria-hidden="true" />
                  <h2
                    id="cautions-title"
                    className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight"
                  >
                    Cautions &amp; Advisory
                  </h2>
                </div>

                {product.cautions && product.cautions.length > 0 ? (
                  <div className="p-4 sm:p-5 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      Packaging Warnings &amp; Patch Test Guidance
                    </span>
                    <ul className="text-xs md:text-sm space-y-2 pl-4 list-disc marker:text-caution-text">
                      {product.cautions.map((caution, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {caution}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted italic">
                    No specific cautions listed for this formula. Always perform a patch test prior to initial application.
                  </p>
                )}
              </section>
            </div>

            {/* ================= 6. "WHY IT MATCHED / WHY IT MAY NOT" (ONLY when arriving from a session) ================= */}
            {sessionNeeds && (
              <section
                aria-labelledby="session-match-heading"
                className="rounded-card bg-surface border border-border shadow-ambient overflow-hidden animate-fade-in"
              >
                <div className="p-6 md:p-7 bg-gradient-to-r from-surface-sky/60 via-surface to-surface border-b border-border/80">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-sage flex items-center justify-center text-brand-evergreen">
                        <Sparkle className="w-4 h-4" weight="fill" aria-hidden="true" />
                      </div>
                      <h2
                        id="session-match-heading"
                        className="font-display font-bold text-xl md:text-2xl text-brand-deep tracking-tight"
                      >
                        Why it matched / why it may not
                      </h2>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent-sky text-brand-deep border border-brand-deep/15">
                      Match Analysis
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-charcoal/80 pt-1">
                    <span>Evaluated against your goal:</span>
                    <span className="font-bold text-brand-deep bg-surface px-2.5 py-0.5 rounded-full border border-border capitalize">
                      {sessionNeeds.goal?.replace(/_/g, " ")}
                    </span>
                    {sessionNeeds.format_preferences.length > 0 && (
                      <span className="text-muted hidden sm:inline">
                        &bull; Preferred format: {sessionNeeds.format_preferences.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Positive / Fit Column */}
                  <div className="p-5 rounded-2xl bg-surface-sage/30 border border-brand-evergreen/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-brand-evergreen/15">
                        <div className="w-5 h-5 rounded-full bg-brand-evergreen text-surface flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" weight="bold" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-deep">
                          Consider this if...
                        </h3>
                      </div>
                      <ul className="text-xs md:text-sm text-charcoal/90 space-y-2.5">
                        {sessionRecommendation?.considerIf && sessionRecommendation.considerIf.length > 0 ? (
                          sessionRecommendation.considerIf.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-brand-evergreen font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">{c}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-brand-evergreen font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">Directly supports your stated target goal.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-brand-evergreen font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">Matches your lifestyle routine and application preference.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Trade-off / Caution Column */}
                  <div className="p-5 rounded-2xl bg-caution-peach/40 border border-caution-text/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-caution-text/15">
                        <div className="w-5 h-5 rounded-full bg-caution-text text-surface flex items-center justify-center shrink-0">
                          <WarningCircle className="w-3 h-3" weight="bold" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-caution-text">
                          May not be the best fit if...
                        </h3>
                      </div>
                      <ul className="text-xs md:text-sm text-charcoal/90 space-y-2.5">
                        {sessionRecommendation?.mayNotFitIf && sessionRecommendation.mayNotFitIf.length > 0 ? (
                          sessionRecommendation.mayNotFitIf.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-caution-text font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">{c}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-caution-text font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">You prefer a different texture or format application.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-caution-text font-bold text-xs mt-0.5">&bull;</span>
                              <span className="leading-relaxed">You have known sensitivities to active ingredient classes.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= 7. "CUSTOMER EXPERIENCES" PANEL (Demo data badged) ================= */}
            <div id="experiences-section">
              <CustomerExperiences
                productSlug={product.slug}
                productId={product.id}
                productName={product.official_name}
              />
            </div>

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
                    Official Brand Catalogue (Verified)
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

              <div className="pt-2 text-[11px] text-muted/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/60">
                <div>
                  Catalogue UUID: <code className="bg-surface px-1 py-0.5 rounded border border-border/60">{product.id}</code>
                </div>
                <div>
                  <a
                    href={`mailto:feedback@bodywisematch.org?subject=Data%20Error%20Report%20for%20${product.slug}`}
                    className="text-brand-evergreen font-semibold underline hover:text-brand-deep focus-ring rounded"
                  >
                    Report a data error
                  </a>
                </div>
              </div>

              <p className="pt-2 text-[11px] text-muted leading-relaxed">
                Independent prototype. Product details are taken from the official Be Bodywise website and verified against packaging. Check the official product page before buying.
              </p>
            </section>
          </div>

          {/* ================= RIGHT COLUMN / STICKY SIDEBAR (4 Columns on Desktop - COMPLETELY FILLS SURROUNDINGS) ================= */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* 1. Quick Purchase & Actions Card */}
            <div className="rounded-card bg-surface border border-border shadow-card p-6 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-sage text-brand-deep uppercase tracking-wider">
                  {categoryDisplay}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {product.size}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-brand-deep">
                    ₹{product.price_inr ?? "N/A"}
                  </span>
                  <span className="text-xs text-text-muted">
                    inclusive of all taxes
                  </span>
                </div>
                <p className="text-xs text-charcoal/80 mt-1">
                  Format: <strong className="text-brand-deep font-semibold">{product.format}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={product.source_url || `https://bebodywise.com/product/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] rounded-button bg-brand-primary hover:bg-brand-deep text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-soft transition-all duration-150 focus-ring active:scale-[0.98]"
                >
                  <span>Buy on Be Bodywise</span>
                  <ArrowSquareOut className="w-4 h-4" weight="bold" />
                </a>

                <button
                  type="button"
                  onClick={handleToggleCompare}
                  className={`w-full min-h-[44px] rounded-button text-xs font-bold border transition-all duration-150 focus-ring flex items-center justify-center gap-2 ${
                    isCompared
                      ? "bg-brand-evergreen text-white border-brand-evergreen shadow-xs"
                      : "bg-surface-sage/50 text-brand-deep border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                  }`}
                >
                  {isCompared ? (
                    <>
                      <Check className="w-4 h-4 text-accent-lime" weight="bold" />
                      <span>In Comparison ({compareCount})</span>
                    </>
                  ) : (
                    <>
                      <span>+ Add to Comparison</span>
                    </>
                  )}
                </button>

                {/* Ask Assistant Pill */}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="w-full min-h-[42px] rounded-button bg-paper hover:bg-surface-sage/60 text-brand-deep border border-border text-xs font-semibold flex items-center justify-center gap-2 transition-colors focus-ring"
                >
                  <Sparkle className="w-4 h-4 text-brand-evergreen" weight="bold" />
                  <span>Ask Assistant about this product</span>
                </button>
              </div>

              {/* Fact Verification Badges */}
              <div className="pt-4 border-t border-border/70 space-y-2 text-xs text-charcoal/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-evergreen shrink-0" weight="bold" />
                  <span>100% verified packaging formulation facts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-evergreen shrink-0" weight="bold" />
                  <span>Official Be Bodywise direct link (zero markup)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-text-muted shrink-0" weight="bold" />
                  <span>No login, account, or signup required</span>
                </div>
              </div>
            </div>

            {/* 2. "More in [Category]" - 3 Related Products from Catalogue */}
            {relatedProducts.length > 0 && (
              <div className="rounded-card bg-surface border border-border shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-brand-deep tracking-tight">
                      More in {categoryDisplay}
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Explore alternative options in this category
                    </p>
                  </div>
                  <Link
                    href={`/products?category=${encodeURIComponent(product.category)}`}
                    className="text-xs font-bold text-brand-evergreen hover:text-brand-deep hover:underline"
                  >
                    View all &rarr;
                  </Link>
                </div>

                <div className="space-y-3">
                  {relatedProducts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/products/${rel.slug}`}
                      className="group p-2.5 rounded-xl border border-border hover:border-brand-evergreen/40 hover:bg-surface-sage/30 flex items-center gap-3 transition-all duration-150 focus-ring"
                    >
                      <div className="w-12 h-12 rounded-lg bg-surface-sage/40 border border-border shrink-0 overflow-hidden flex items-center justify-center">
                        {rel.image_url ? (
                          <img
                            src={rel.image_url}
                            alt={rel.official_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                            loading="lazy"
                          />
                        ) : (
                          getProductTypeIcon(rel.category)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-brand-deep group-hover:text-brand-evergreen transition-colors truncate">
                          {rel.official_name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {rel.format}
                        </p>
                        <p className="text-xs font-bold text-brand-deep mt-0.5">
                          ₹{rel.price_inr ?? "N/A"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Section Navigation (Table of Contents) */}
            <div className="rounded-card bg-surface border border-border p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                Quick Page Navigation
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <a
                  href="#product-header"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Overview
                </a>
                <a
                  href="#intended-use"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Intended use
                </a>
                <a
                  href="#how-to-use"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Directions
                </a>
                <a
                  href="#ingredients-heading"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Ingredients
                </a>
                <a
                  href="#cautions-heading"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Cautions
                </a>
                <a
                  href="#experiences-section"
                  className="px-2.5 py-1 rounded-full bg-paper hover:bg-surface-sage text-charcoal border border-border transition-colors"
                >
                  Customer reports
                </a>
              </div>
            </div>

            {/* 4. Routine Reassurance & Safety Disclaimer Card */}
            <div className="rounded-card bg-surface-sage/30 border border-brand-evergreen/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-evergreen" weight="bold" />
                <h4 className="font-display font-bold text-xs text-brand-deep uppercase tracking-wider">
                  Honest Formulation Promise
                </h4>
              </div>
              <p className="text-xs text-charcoal/80 leading-relaxed">
                Bodywise Match ranks products using pure deterministic TypeScript rules against verified packaging data. No artificial match percentages, fake reviews, or medical claims.
              </p>
              <div className="pt-2 border-t border-brand-evergreen/15 text-[11px] text-text-muted flex items-center justify-between">
                <span>Patch test recommended</span>
                <Link href="/help" className="text-brand-evergreen font-semibold hover:underline">
                  Support Guide &rarr;
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Action Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border p-3 px-4 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-deep truncate">{product.official_name}</p>
          <p className="text-[11px] text-muted">₹{product.price_inr} &bull; {product.size}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={product.source_url || `https://bebodywise.com/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3.5 py-1.5 rounded-button text-xs font-bold bg-brand-primary text-white hover:bg-brand-deep transition-colors focus-ring flex items-center gap-1.5"
          >
            <span>Buy</span>
            <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" />
          </a>
          <button
            type="button"
            onClick={handleToggleCompare}
            className={`min-h-[44px] px-3 py-1.5 rounded-button text-xs font-bold border transition-colors focus-ring flex items-center gap-1 ${
              isCompared
                ? "bg-brand-evergreen text-surface border-brand-evergreen"
                : "bg-surface-sage/50 text-brand-deep border-border hover:bg-surface-sage"
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent-lime" />
                <span>Compared</span>
              </>
            ) : (
              <span>+ Compare</span>
            )}
          </button>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
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
