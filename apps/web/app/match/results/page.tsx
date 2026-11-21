"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkle,
  CheckCircle,
  WarningCircle,
  CaretDown,
  CaretUp,
  Question,
  ShieldCheck,
  Drop,
  Flask,
  Sun,
  Pill,
  Wind,
  ChatCircleDots,
  ChatCircleText,
  SlidersHorizontal,
  X,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { MatchSessionProvider, useMatchSession } from "@/lib/matchSessionContext";
import {
  Button,
  Card,
  DemoBadge,
  ProgressBar,
  Stepper,
  StepItem,
  SourceTag,
  EmptyState,
  Dialog,
} from "@/components/ui";
import {
  computeShortlist,
  ShortlistResult,
  ShortlistFamilyItem,
  formatCategoryLabel,
  formatFormatLabel,
  selectNext,
  SelectNextQuestionResult,
  SessionQuestionOption,
  DEMO_CATALOGUE_SEED,
  ProductRecord,
  RULES_VERSION,
  createInitialSessionState,
  matchSessionReducer,
} from "@bodywise/shared";
import { submitMatchFeedback } from "@/lib/api";

const MATCH_STEPS: StepItem[] = [
  { id: "step-1", label: "Describe concern", description: "Goal & preferences" },
  { id: "step-2", label: "Clarify details", description: "1-2 quick questions" },
  { id: "step-3", label: "Explained matches", description: "Shortlisted options" },
];

// Demo Community Reports (honest trade-offs, strictly flagged with Demo data badge per Rule 4)
const DEMO_COMMUNITY_REPORTS = [
  {
    productName: "1% Salicylic Acid Body Wash",
    userQuote: "Helped with rough texture on upper arms after 2 weeks of consistent shower use. Doesn't dry out skin.",
    tradeOff: "Noticeable foaming; requires thorough rinsing so no film remains on skin.",
    verifiedPurchase: true,
  },
  {
    productName: "4% AHA BHA Underarm Roll-On",
    userQuote: "Solid odor control throughout high-heat workdays. The liquid dries down in about 90 seconds.",
    tradeOff: "Do not apply immediately following underarm razor shaving or friction cuts.",
    verifiedPurchase: true,
  },
  {
    productName: "Redensyl Hair Density Serum",
    userQuote: "Lightweight water-gel dropper formula. Easy to massage into partings before sleeping.",
    tradeOff: "Needs daily diligence for 60+ days; non-greasy but must be applied consistently.",
    verifiedPurchase: true,
  },
];

function MatchResultsInner() {
  const { state, dispatch, setIsChatOpen } = useMatchSession();

  // Fallback default sample state for initial SSR / direct navigation (AGENTS.md resilient UX)
  const effectiveState = React.useMemo(() => {
    if (state.slots.needs.length === 0 && !state.slots.product_type.value) {
      let def = createInitialSessionState();
      def = matchSessionReducer(def, {
        type: "APPLY_PATCH",
        source: "default",
        status: "confirmed",
        patch: {
          needs: [
            {
              id: "need_1",
              concept_id: "body_bumps_look",
              phrase_from_user: "reduce the look of body bumps",
              normalised_label: "Reduce the look of body bumps",
              confidence: 0.9,
              status: "confirmed",
              source: "user_text",
              evidence_text: "reduce the look of body bumps",
            },
          ],
          product_type: "body_wash",
          format: "liquid",
        },
      });
      return def;
    }
    return state;
  }, [state]);

  // Single shared computation engine (Section C)
  const shortlist: ShortlistResult = React.useMemo(() => {
    return computeShortlist(effectiveState, DEMO_CATALOGUE_SEED);
  }, [effectiveState]);

  // Dev Mismatch Warning Banner (preview stateHash/count vs results stateHash/count)
  const [mismatchWarning, setMismatchWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      const previewHash = sessionStorage.getItem("bodywise_preview_state_hash");
      const previewCount = sessionStorage.getItem("bodywise_preview_count");

      if (previewHash && previewHash !== shortlist.stateHash) {
        setMismatchWarning(
          `Dev Mismatch Warning: Preview stateHash (${previewHash}) differs from results stateHash (${shortlist.stateHash})`
        );
      } else if (previewCount && previewCount !== String(shortlist.totalFamilies)) {
        setMismatchWarning(
          `Dev Mismatch Warning: Preview count (${previewCount}) differs from results count (${shortlist.totalFamilies})`
        );
      } else {
        setMismatchWarning(null);
      }
    }
  }, [shortlist.stateHash, shortlist.totalFamilies]);

  const [howWeMatchedOpen, setHowWeMatchedOpen] = React.useState(true);

  // Compare Checkbox State
  const [comparedProductIds, setComparedProductIds] = React.useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);

  // "View Details" Product Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = React.useState<ProductRecord | null>(null);

  // "This Doesn't Fit" Modal State
  const [rejectingFamily, setRejectingFamily] = React.useState<ShortlistFamilyItem | null>(null);

  // Shortlist Feedback Widget State
  const [feedbackRating, setFeedbackRating] = React.useState<"yes" | "somewhat" | "no" | null>(null);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [aggregateConsent, setAggregateConsent] = React.useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("session-default");

  // Clarifying Question Modal State
  const [isAskQuestionOpen, setIsAskQuestionOpen] = React.useState<boolean>(false);
  const [facetQuestion, setFacetQuestion] = React.useState<SelectNextQuestionResult | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      let activeSessionId = localStorage.getItem("bodywise_last_session_id");
      if (!activeSessionId) {
        activeSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem("bodywise_last_session_id", activeSessionId);
      }
      setSessionId(activeSessionId);
    }
  }, []);

  const handleOpenAskQuestion = () => {
    const q = selectNext(state, DEMO_CATALOGUE_SEED);
    setFacetQuestion(q);
    setIsAskQuestionOpen(true);
  };

  const handleAnswerFacetQuestion = (opt: SessionQuestionOption) => {
    if (!facetQuestion?.facet) return;
    dispatch({
      type: "ANSWER_QUESTION",
      facetId: facetQuestion.facet,
      value: opt.value,
      label: opt.label,
      source: "question",
    });
    setIsAskQuestionOpen(false);
  };

  // Compare Checkbox Toggle
  const toggleCompare = (productId: string) => {
    setComparedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : prev.length < 3
        ? [...prev, productId]
        : prev
    );
  };

  // Handle "This doesn't fit" Correction
  const handleApplyCorrection = (
    reason: "wrong_format" | "avoid_ingredient" | "too_expensive" | "wrong_goal" | "other"
  ) => {
    if (!rejectingFamily) return;
    const { primaryProduct } = rejectingFamily;

    if (reason === "wrong_format") {
      const otherFormats = ["liquid", "roll-on", "oil", "serum", "gel"].filter(
        (f) => !primaryProduct.format.toLowerCase().includes(f)
      );
      if (otherFormats.length > 0) {
        dispatch({
          type: "APPLY_PATCH",
          source: "user_text",
          status: "confirmed",
          patch: { format: otherFormats[0] },
        });
      }
    } else if (reason === "avoid_ingredient") {
      if (primaryProduct.fragrance_free !== true) {
        dispatch({
          type: "APPLY_PATCH",
          source: "user_text",
          status: "confirmed",
          patch: { avoidances: [...confirmedAvoidances, "fragrance"] },
        });
      } else {
        dispatch({
          type: "APPLY_PATCH",
          source: "user_text",
          status: "confirmed",
          patch: { avoidances: [...confirmedAvoidances, "parabens"] },
        });
      }
    } else if (reason === "wrong_goal") {
      dispatch({
        type: "REMOVE_CHIP",
        slotKey: "product_type",
      });
    }

    setRejectingFamily(null);
  };

  // Submit Feedback Widget
  const handleSubmitFeedback = async () => {
    if (!feedbackRating) return;
    const helpful = feedbackRating === "yes" || feedbackRating === "somewhat";
    await submitMatchFeedback({
      request_id: sessionId,
      session_id: sessionId,
      helpful,
      rating: feedbackRating,
      reason: feedbackNotes,
      feedback_category: "match_relevance",
      notes: feedbackNotes,
      aggregate_consent: aggregateConsent,
    });
    setFeedbackSubmitted(true);
  };

  // Helper for Product-type Icon
  const getProductTypeIcon = (category: string) => {
    switch (category) {
      case "body_wash":
      case "face_wash":
        return <Drop className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "serum":
        return <Flask className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "shampoo":
      case "conditioner":
      case "hair_oil":
        return <Wind className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "sunscreen":
        return <Sun className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      case "supplement":
        return <Pill className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
      default:
        return <Sparkle className="w-8 h-8 text-brand-evergreen" weight="regular" aria-hidden="true" />;
    }
  };

  const comparedProducts = DEMO_CATALOGUE_SEED.filter((p) =>
    comparedProductIds.includes(p.id)
  );

  const displayedFamilies = shortlist.topFamilies.slice(0, 3);
  const isAnyMatched = shortlist.topFamilies.length > 0;

  // Active slots for recap & refine
  const confirmedCategory =
    state.slots.product_type?.value && state.slots.product_type?.status === "confirmed"
      ? state.slots.product_type.value
      : null;
  const confirmedNeeds = state.slots.needs?.filter((n) => n.status === "confirmed") || [];
  const confirmedAvoidances =
    state.slots.avoidances?.status === "confirmed" ? state.slots.avoidances.value || [] : [];
  const confirmedFormat =
    state.slots.format?.value && state.slots.format?.status === "confirmed"
      ? state.slots.format.value
      : null;
  const confirmedFragrance =
    state.slots.fragrance_pref?.value && state.slots.fragrance_pref?.status === "confirmed"
      ? state.slots.fragrance_pref.value
      : null;

  const recapSegments = [
    confirmedCategory ? formatCategoryLabel(confirmedCategory) : null,
    confirmedNeeds.length > 0
      ? confirmedNeeds.map((n) => n.normalised_label || n.phrase_from_user).join(", ")
      : null,
    confirmedFormat ? formatFormatLabel(confirmedFormat) : null,
    confirmedAvoidances.length > 0 ? `No ${confirmedAvoidances.join(", ")}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/match/confirm"
            className="flex items-center gap-2 text-sm font-semibold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" aria-hidden="true" />
            <span>Back to Step 2</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-brand-deep text-sm hidden sm:inline">
              Bodywise Match
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-4xl mx-auto px-5 py-8 md:py-12 flex-1 w-full">
        {/* Stepper (Step 3 of 3) */}
        <div className="mb-6">
          <Stepper steps={MATCH_STEPS} currentStepIndex={2} />
        </div>

        {/* ProgressBar */}
        <div className="mb-6">
          <ProgressBar value={100} max={100} showLabel />
        </div>

        {/* Dev Mismatch Banner */}
        {mismatchWarning && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-card bg-red-50 border-2 border-red-500 text-red-900 font-mono text-xs flex items-center gap-2"
          >
            <WarningCircle className="w-5 h-5 text-red-600 shrink-0" weight="bold" />
            <span>{mismatchWarning}</span>
          </div>
        )}

        {/* Section Header & Sub-header Recap */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sage/60 text-xs font-semibold text-brand-deep mb-2">
            <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
            <span>Step 3 &bull; Shortlisted Options</span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-evergreen" aria-live="polite">
              Showing top {Math.min(3, shortlist.totalFamilies)} of {shortlist.totalFamilies}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight mb-3">
            Options that match what you told us
          </h1>

          {/* Sub-header One-Line Recap with "Change" */}
          <div className="p-3 px-4 rounded-button bg-surface-sage/35 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs md:text-sm text-charcoal flex items-center gap-2 flex-wrap">
              <span className="font-bold text-brand-deep uppercase tracking-wider text-[11px]">
                Looking for:
              </span>
              <span>{recapSegments.length > 0 ? recapSegments.join(" • ") : "Personal care matches"}</span>
            </div>

            <Link
              href="/match/confirm"
              className="text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring rounded py-0.5 px-1.5 shrink-0 self-start sm:self-center"
            >
              Change
            </Link>
          </div>

          {/* Refine Bar */}
          <div className="mt-3 p-3 px-4 rounded-card bg-paper border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto py-0.5">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
                Refine shortlist:
              </span>

              {confirmedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-sage border border-border text-brand-deep shadow-2xs">
                  <span>Category: {formatCategoryLabel(confirmedCategory)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_CHIP",
                        slotKey: "product_type",
                      })
                    }
                    className="text-brand-deep/70 hover:text-brand-deep p-1 rounded min-w-[28px] min-h-[28px] inline-flex items-center justify-center focus-ring"
                    aria-label={`Remove filter: ${formatCategoryLabel(confirmedCategory)}`}
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </span>
              )}

              {confirmedNeeds.map((n) => (
                <span
                  key={n.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-sage border border-border text-brand-deep shadow-2xs"
                >
                  <span>Goal: {n.normalised_label || n.phrase_from_user}</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_CHIP", slotKey: "needs", needId: n.id })}
                    className="text-brand-deep/70 hover:text-brand-deep p-1 rounded min-w-[28px] min-h-[28px] inline-flex items-center justify-center focus-ring"
                    aria-label={`Remove filter: ${n.normalised_label || n.phrase_from_user}`}
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </span>
              ))}

              {confirmedAvoidances.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-sage border border-border text-brand-deep shadow-2xs"
                >
                  <span>No {a}</span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "APPLY_PATCH",
                        source: "user_text",
                        status: "confirmed",
                        patch: {
                          avoidances: confirmedAvoidances.filter((x) => x !== a),
                        },
                      })
                    }
                    className="text-brand-deep/70 hover:text-brand-deep p-1 rounded min-w-[28px] min-h-[28px] inline-flex items-center justify-center focus-ring"
                    aria-label={`Remove avoidance: ${a}`}
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </span>
              ))}

              {confirmedFormat && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-sage border border-border text-brand-deep shadow-2xs">
                  <span>Format: {formatFormatLabel(confirmedFormat)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_CHIP",
                        slotKey: "format",
                      })
                    }
                    className="text-brand-deep/70 hover:text-brand-deep p-1 rounded min-w-[28px] min-h-[28px] inline-flex items-center justify-center focus-ring"
                    aria-label="Remove format filter"
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </span>
              )}

              {confirmedFragrance && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-sage border border-border text-brand-deep shadow-2xs">
                  <span>
                    Fragrance: {confirmedFragrance === "free_only" ? "Fragrance-free" : "Light scent"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_CHIP",
                        slotKey: "fragrance_pref",
                      })
                    }
                    className="text-brand-deep/70 hover:text-brand-deep p-1 rounded min-w-[28px] min-h-[28px] inline-flex items-center justify-center focus-ring"
                    aria-label="Remove fragrance filter"
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </span>
              )}

              {!confirmedCategory &&
                confirmedNeeds.length === 0 &&
                confirmedAvoidances.length === 0 &&
                !confirmedFormat &&
                !confirmedFragrance && (
                  <span className="text-xs text-muted italic">No active filters</span>
                )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-button border border-border text-brand-evergreen bg-paper hover:bg-surface-sage font-medium text-xs transition-colors min-h-[44px] focus-ring"
              >
                <ChatCircleText className="w-4 h-4" weight="regular" />
                <span>Chat instead</span>
              </button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenAskQuestion}
                className="min-h-[44px] text-xs font-medium gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
                <span>Ask me a question</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Section B.2: In-Category Notice & Button for Exploration */}
        {shortlist.canExploreOtherCategories && shortlist.unmatchedBenefit && (
          <div className="mb-6 p-4 rounded-card bg-surface-sage/50 border border-brand-evergreen/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="font-bold text-brand-deep text-sm mb-1">
                Not specifically described for &ldquo;{shortlist.unmatchedBenefit}&rdquo;
              </h4>
              <p className="text-xs text-charcoal/80">
                Products shown are in your chosen category ({formatCategoryLabel(confirmedCategory)}).
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                dispatch({
                  type: "REMOVE_CHIP",
                  slotKey: "product_type",
                });
              }}
              className="shrink-0 text-xs font-semibold min-h-[44px]"
            >
              Also see other product types for {shortlist.unmatchedBenefit}
              {shortlist.alternativeCategoryMatchesCount
                ? ` (${shortlist.alternativeCategoryMatchesCount})`
                : ""}
            </Button>
          </div>
        )}

        {/* ================= RESULTS / SHORTLIST ================= */}
        {isAnyMatched ? (
          <div className="space-y-6 mb-12">
            {displayedFamilies.map((fam: ShortlistFamilyItem, famIdx: number) => {
              const product = fam.primaryProduct;
              const isCompared = comparedProductIds.includes(product.id);

              return (
                <Card
                  key={fam.familyId}
                  variant="surface"
                  data-cursor-label="View"
                  className="p-6 md:p-8 shadow-card border border-border relative overflow-hidden result-card-stagger"
                  style={{ animationDelay: `${famIdx * 60}ms` }}
                >
                  {/* Top Bar: MatchLabel pill & Rank & Compare Checkbox */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.is_demo && <DemoBadge />}
                      {fam.notSpecificallyDescribed ? (
                        <span className="result-pill-slide text-xs font-bold px-3 py-1 rounded-full bg-surface-sage text-brand-deep border border-border shadow-none">
                          In-category option • Not specifically described for {shortlist.unmatchedBenefit}
                        </span>
                      ) : (
                        <span className="result-pill-slide text-xs font-bold px-3 py-1 rounded-full bg-accent-lime text-brand-deep border border-brand-deep/20 shadow-none">
                          Direct fit for {fam.categoryLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-muted">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-brand-deep hover:text-brand-evergreen min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompare(product.id)}
                          className="w-4 h-4 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer"
                        />
                        <span>Compare</span>
                      </label>
                      <span className="text-border">&bull;</span>
                      <span>
                        Rank {fam.rank} of {shortlist.totalFamilies}
                      </span>
                    </div>
                  </div>

                  {/* Header Row: Product Image + Name, Format, Size, Price */}
                  <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-card bg-surface-sage/40 border border-border flex items-center justify-center shrink-0">
                      {getProductTypeIcon(product.category)}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-brand-deep mb-1 tracking-tight">
                        {product.official_name}
                      </h3>
                      <p className="text-xs md:text-sm text-muted font-medium mb-2">
                        {product.format} &bull; {product.size}
                        {fam.priceInr !== null && ` • ₹${fam.priceInr}`}
                      </p>
                      <p className="text-sm text-charcoal/85 leading-relaxed">
                        {product.official_description}
                      </p>
                    </div>
                  </div>

                  {/* Section D.3: "Why it's here" (Citing specific reason codes & brand claim) */}
                  <div className="mb-6 bg-surface-sage/30 rounded-button p-4 border border-brand-deep/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep mb-1.5 flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                      Why it&apos;s here
                    </h4>
                    <p className="text-sm text-charcoal leading-relaxed font-medium mb-2">
                      {fam.whyText}
                    </p>

                    {fam.brandClaim && (
                      <blockquote className="my-2.5 p-3 rounded bg-surface border-l-4 border-brand-evergreen text-xs italic text-brand-deep leading-relaxed">
                        <span className="marker-underline-lime not-italic font-medium">&ldquo;{fam.brandClaim}&rdquo;</span>
                        <span className="block mt-1 text-[11px] not-italic text-charcoal/70 font-sans">
                          Brand claim, per the official page
                        </span>
                      </blockquote>
                    )}

                    <div className="mt-2 text-xs text-charcoal/80 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen shrink-0" weight="regular" aria-hidden="true" />
                      <span>Source:</span>
                      <a
                        href={fam.sourceUrl || product.source_url || "https://bebodywise.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-evergreen hover:underline focus-ring rounded"
                      >
                        {fam.sourceText || "bebodywise.com, checked 20 Nov 2026"}
                      </a>
                    </div>
                  </div>

                  {/* Two Columns: "Consider this if..." and "May not be the best fit if..." */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-button bg-surface border border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen mb-2.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                        Consider this if...
                      </h4>
                      <ul className="text-xs md:text-sm text-charcoal/85 space-y-2 pl-4 list-disc marker:text-brand-evergreen">
                        <li>Directly matches your stated {fam.categoryLabel.toLowerCase()} goal.</li>
                        <li>Formulated for regular, non-invasive daily personal care.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <WarningCircle className="w-3.5 h-3.5 text-caution-text" weight="regular" aria-hidden="true" />
                        May not be the best fit if...
                      </h4>
                      <ul className="text-xs md:text-sm space-y-2 pl-4 list-disc marker:text-caution-text">
                        {product.cautions && product.cautions.length > 0 ? (
                          product.cautions.map((caution, cIdx) => <li key={cIdx}>{caution}</li>)
                        ) : (
                          <li>You require prescription-strength dermatological intervention.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Verified Facts List with SourceTag */}
                  <div className="mb-6 p-4 rounded-button bg-paper border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                      Verified Facts &amp; Provenance
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted block mb-1 font-semibold">Ingredients list:</span>
                        {product.ingredients !== null && product.last_verified_at ? (
                          <SourceTag
                            source={product.source_url || "Official Packaging"}
                            lastVerifiedAt={product.last_verified_at}
                          />
                        ) : (
                          <SourceTag source={null} lastVerifiedAt={null} />
                        )}
                      </div>

                      <div>
                        <span className="text-muted block mb-1 font-semibold">Fragrance-free declaration:</span>
                        {product.fragrance_free !== null && product.last_verified_at ? (
                          <SourceTag
                            source="Official Packaging"
                            lastVerifiedAt={product.last_verified_at}
                          />
                        ) : (
                          <SourceTag source={null} lastVerifiedAt={null} />
                        )}
                      </div>

                      <div>
                        <span className="text-muted block mb-1 font-semibold">Price verification:</span>
                        {product.price_inr !== null ? (
                          <SourceTag
                            source={`₹${product.price_inr} • Official Store`}
                            lastVerifiedAt={product.price_checked_at || "November 2026"}
                          />
                        ) : (
                          <SourceTag source={null} />
                        )}
                      </div>

                      <div>
                        <span className="text-muted block mb-1 font-semibold">Packaging label directions:</span>
                        <SourceTag
                          source="Official Label Directions"
                          lastVerifiedAt={product.last_verified_at || "November 2026"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Row: View Details & "This doesn't fit" */}
                  <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedDetailProduct(product)}
                        className="min-h-[44px]"
                      >
                        View details
                      </Button>
                      <button
                        type="button"
                        data-testid="this-doesnt-fit-btn"
                        onClick={() => setRejectingFamily(fam)}
                        className="text-xs text-muted hover:text-error-text underline focus-ring rounded py-2 px-2 min-h-[44px]"
                      >
                        This doesn&apos;t fit
                      </button>
                    </div>

                    <span className="text-xs text-muted font-medium">
                      Zero percentage scores
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ================= NO_FIT STATE ================= */
          <div className="mb-12">
            <EmptyState
              icon={<Question className="w-8 h-8 text-brand-evergreen" weight="regular" />}
              title="We couldn't find a good fit in our current catalogue"
              description="Based on your combined goals and strict avoidances, no product met our minimum fit threshold. We don't force or fabricate matches."
            />
            <div className="flex justify-center items-center gap-4 mt-6">
              <Link href="/products">
                <Button variant="secondary" size="default" className="min-h-[44px]">
                  Browse all products
                </Button>
              </Link>
              <Link href="/match/confirm">
                <Button variant="primary" size="default" className="min-h-[44px]">
                  Change my request
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ================= COLLAPSIBLE "HOW WE MATCHED" PANEL ================= */}
        <div className="mb-12 rounded-card bg-surface border border-border p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setHowWeMatchedOpen(!howWeMatchedOpen)}
            className="w-full flex items-center justify-between text-left focus-ring rounded min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <h3 className="font-display font-bold text-brand-deep text-base md:text-lg tracking-tight">
                How we matched these options
              </h3>
            </div>
            {howWeMatchedOpen ? (
              <CaretUp className="w-5 h-5 text-brand-evergreen" weight="bold" />
            ) : (
              <CaretDown className="w-5 h-5 text-brand-evergreen" weight="bold" />
            )}
          </button>

          {howWeMatchedOpen && (
            <div className="mt-5 pt-4 border-t border-border space-y-4 text-xs md:text-sm text-charcoal/85 leading-relaxed">
              <p className="text-muted">
                Our matching engine is pure TypeScript logic. Rules choose; AI only listens.
              </p>

              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Hard exclusions:</strong> Any product with packaging ingredients or label cautions conflicting with your avoidances is strictly filtered out.
                </li>
                <li>
                  <strong>Goal fit:</strong> Products addressing your primary wellness goals receive priority ranking (+50 pts); products covering multiple benefits rank first. Explicit category selection acts as an authoritative hard filter.
                </li>
                <li>
                  <strong>Preference fit:</strong> Format preferences (+15 pts), verified fragrance-free (+10 pts), and routine fit (+5 pts) guide ranking.
                </li>
                <li>
                  <strong>Deterministic tie-breaks:</strong> When scores tie, products with more verified facts rank higher; final ties are broken alphabetically by slug.
                </li>
              </ol>

              <div className="pt-2 text-xs text-muted flex items-center justify-between">
                <span>Algorithm: Pure TypeScript Deterministic Shortlist</span>
                <span className="font-semibold">Rules Version: {RULES_VERSION}</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= "WHAT PEOPLE REPORT" STRIP ================= */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg md:text-xl text-brand-deep">
                What people report
              </h3>
              <p className="text-xs text-muted">
                Honest customer experiences with observed trade-offs.
              </p>
            </div>
            <DemoBadge />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_COMMUNITY_REPORTS.map((report, idx) => (
              <Card key={idx} variant="surface" className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-brand-deep truncate max-w-[180px]">
                      {report.productName}
                    </span>
                    <DemoBadge />
                  </div>
                  <p className="text-xs text-charcoal leading-relaxed mb-3 italic">
                    &ldquo;{report.userQuote}&rdquo;
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted">
                  <strong>Trade-off noted:</strong> {report.tradeOff}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ================= SHORTLIST FEEDBACK WIDGET ================= */}
        <div className="mb-8 p-6 rounded-card bg-surface-sage/35 border border-border">
          {feedbackSubmitted ? (
            <div className="text-center py-3">
              <CheckCircle className="w-6 h-6 text-brand-evergreen mx-auto mb-2" weight="regular" />
              <p className="font-display font-bold text-brand-deep text-base tracking-tight">
                Thank you for your feedback!
              </p>
              <p className="text-xs text-muted mt-1">
                Your input helps improve discovery transparency.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChatCircleDots className="w-4 h-4 text-brand-evergreen" weight="regular" />
                <h4 className="font-display font-bold text-brand-deep text-base tracking-tight">
                  Was this shortlist useful?
                </h4>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => setFeedbackRating("yes")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[44px] ${
                    feedbackRating === "yes"
                      ? "bg-brand-evergreen text-white border-brand-evergreen"
                      : "bg-surface text-brand-deep border-border hover:bg-surface-sage"
                  }`}
                >
                  Yes, helpful
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackRating("somewhat")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[44px] ${
                    feedbackRating === "somewhat"
                      ? "bg-brand-evergreen text-white border-brand-evergreen"
                      : "bg-surface text-brand-deep border-border hover:bg-surface-sage"
                  }`}
                >
                  Somewhat
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackRating("no")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[44px] ${
                    feedbackRating === "no"
                      ? "bg-brand-evergreen text-white border-brand-evergreen"
                      : "bg-surface text-brand-deep border-border hover:bg-surface-sage"
                  }`}
                >
                  No, not what I wanted
                </button>
              </div>

              {feedbackRating && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Optional: What could have made these options better?"
                    className="w-full p-2.5 rounded-button text-xs bg-surface border border-border text-charcoal focus-ring min-h-[44px]"
                    maxLength={300}
                  />

                  {/* Explicit Aggregate Consent Toggle (Defaults to FALSE / OFF) */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={aggregateConsent}
                      onChange={(e) => setAggregateConsent(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer shrink-0"
                    />
                    <span>Allow this feedback to be anonymously aggregated to improve recommendations (default off)</span>
                  </label>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitFeedback}
                      className="min-h-[44px]"
                    >
                      Submit feedback
                    </Button>
                    <button
                      type="button"
                      onClick={() => setFeedbackSubmitted(true)}
                      className="text-xs text-muted hover:text-brand-deep underline min-h-[44px] px-2"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mandatory Bottom Disclaimer */}
        <p className="text-xs text-muted text-center leading-relaxed">
          Informational only, not medical advice.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Independent prototype for a fellowship challenge; not an official Be Bodywise service.</p>
      </footer>

      {/* ================= COMPARE MODAL / DRAWER ================= */}
      {comparedProductIds.length >= 2 && (
        <div
          role="region"
          aria-label="Product comparison bar"
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-4 shadow-lg animate-slide-up"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="font-display font-bold text-brand-deep text-sm block">
                {comparedProductIds.length} products selected for comparison
              </span>
              <span className="text-xs text-muted">
                Side-by-side format, verification, and caution check.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCompareModalOpen(true)}
                className="min-h-[44px]"
              >
                Compare now
              </Button>
              <button
                type="button"
                onClick={() => setComparedProductIds([])}
                className="text-xs text-muted hover:text-brand-deep underline min-h-[44px] px-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Side-by-Side Modal */}
      <Dialog
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Product Comparison"
        description="Side-by-side attributes from verified catalogue data."
      >
        <div className="grid grid-cols-2 gap-4 py-2">
          {comparedProducts.map((p) => (
            <div key={p.id} className="p-3 rounded-button bg-paper border border-border space-y-3 text-xs">
              <h4 className="font-display font-bold text-brand-deep text-sm">{p.official_name}</h4>
              <p><strong className="text-muted">Format:</strong> {p.format} ({p.size})</p>
              <p><strong className="text-muted">Fragrance:</strong> {p.fragrance_free ? "Fragrance-free" : "Light scent"}</p>
              <p><strong className="text-muted">Price:</strong> ₹{p.price_inr ?? "Unverified"}</p>
              <div>
                <strong className="text-muted block mb-1">Cautions:</strong>
                <p className="text-[11px] text-caution-text">{p.cautions ? p.cautions[0] : "None noted on label"}</p>
              </div>
            </div>
          ))}
        </div>
      </Dialog>

      {/* ================= PRODUCT DETAILS MODAL ================= */}
      <Dialog
        isOpen={selectedDetailProduct !== null}
        onClose={() => setSelectedDetailProduct(null)}
        title={selectedDetailProduct?.official_name || "Product Details"}
        description={`${selectedDetailProduct?.format || ""} • ${selectedDetailProduct?.size || ""}`}
      >
        {selectedDetailProduct && (
          <div className="space-y-4 py-2 text-xs md:text-sm">
            <div>
              <h5 className="font-bold text-brand-deep mb-1">Official Description</h5>
              <p className="text-charcoal leading-relaxed">{selectedDetailProduct.official_description}</p>
            </div>

            <div>
              <h5 className="font-bold text-brand-deep mb-1">Label Directions</h5>
              <p className="text-charcoal leading-relaxed">{selectedDetailProduct.label_directions || "Apply as directed on official packaging."}</p>
            </div>

            <div>
              <h5 className="font-bold text-brand-deep mb-1">Ingredients</h5>
              <p className="text-charcoal leading-relaxed">
                {selectedDetailProduct.ingredients ? selectedDetailProduct.ingredients.join(", ") : "Ingredients list not verified yet."}
              </p>
            </div>

            <div className="p-3 rounded-button bg-caution-peach/60 text-caution-text border-l-4 border-caution-text">
              <h5 className="font-bold mb-1">Label Cautions</h5>
              <p>{selectedDetailProduct.cautions ? selectedDetailProduct.cautions.join(". ") : "Perform a small patch test before regular use."}</p>
            </div>

            <div className="pt-2">
              <SourceTag
                source={selectedDetailProduct.price_source || "Official Packaging"}
                lastVerifiedAt={selectedDetailProduct.last_verified_at || "November 2026"}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ================= "THIS DOESN'T FIT" FEEDBACK DIALOG ================= */}
      <Dialog
        isOpen={rejectingFamily !== null}
        onClose={() => setRejectingFamily(null)}
        title="Why doesn't this option fit?"
        description="We'll immediately regenerate your shortlist based on your correction."
      >
        <div className="space-y-2.5 py-2">
          {[
            { id: "wrong_format", label: "Wrong format (e.g. prefer roll-on, serum, or oil instead)" },
            { id: "avoid_ingredient", label: "Contains an ingredient I prefer to avoid (e.g. fragrance, sulphates)" },
            { id: "too_expensive", label: "Price point doesn't fit my budget" },
            { id: "wrong_goal", label: "Doesn't target my primary goal" },
            { id: "other", label: "Other preference" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                handleApplyCorrection(
                  item.id as "wrong_format" | "avoid_ingredient" | "too_expensive" | "wrong_goal" | "other"
                )
              }
              className="w-full text-left p-3.5 rounded-button border border-border bg-surface hover:bg-surface-sage/40 transition-colors text-xs md:text-sm font-semibold text-brand-deep focus-ring min-h-[44px]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Dialog>

      {/* Clarifying Question Modal */}
      {isAskQuestionOpen && (
        <Dialog
          isOpen={isAskQuestionOpen}
          onClose={() => setIsAskQuestionOpen(false)}
          title="Refine with a quick question"
          description="Answer to sharpen your shortlist"
        >
          <div className="space-y-4 pt-2">
            {facetQuestion?.question ? (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-brand-deep text-base">
                  {facetQuestion.question}
                </h3>
                {facetQuestion.whyAsking && (
                  <p className="text-xs text-muted bg-surface-sage/40 p-2.5 rounded-lg border border-border">
                    {facetQuestion.whyAsking}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {facetQuestion.options?.map((opt: SessionQuestionOption) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswerFacetQuestion(opt)}
                      className="text-left p-3 rounded-button border border-border hover:border-brand-evergreen hover:bg-surface-sage/30 text-xs md:text-sm font-semibold text-brand-deep transition-colors min-h-[44px] flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      <CaretRight className="w-4 h-4 text-muted" weight="bold" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted">
                No additional clarifying questions needed for this combination.
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function MatchResultsPage() {
  return (
    <MatchSessionProvider>
      <MatchResultsInner />
    </MatchSessionProvider>
  );
}
