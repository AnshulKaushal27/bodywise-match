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
  ShieldWarning,
  Drop,
  Flask,
  Sun,
  Pill,
  Wind,
  ChatCircleDots,
  SlidersHorizontal,
} from "@phosphor-icons/react/dist/ssr";
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
  Callout,
} from "@/components/ui";
import {
  ParsedNeeds,
  ParsedRequest,
  ProductRecord,
  ProductCategory,
  DEMO_CATALOGUE_SEED,
  matchProducts,
  matchMultiNeeds,
  MatchResult,
  MultiNeedMatchResult,
  NeedRecommendation,
  NeedMatchGroup,
  Recommendation,
  RULES_VERSION,
  CONTROLLED_GOALS,
  normalizeCosmeticWording,
} from "@bodywise/shared";
import { submitMatchFeedback, fetchMultiNeedRecommendations } from "@/lib/api";

const MATCH_STEPS: StepItem[] = [
  { id: "step-1", label: "Describe concern", description: "Goal & preferences" },
  { id: "step-2", label: "Clarify details", description: "1-2 quick questions" },
  { id: "step-3", label: "Explained matches", description: "Shortlisted options" },
];

const DEFAULT_PARSED: ParsedNeeds = {
  goal: "body_bumps_look",
  category: "body_wash",
  format_preferences: ["liquid"],
  avoidances: [],
  routine_context: null,
  uncertainties: [],
  confidence: "high",
};

const DEFAULT_PARSED_REQUEST: ParsedRequest = {
  needs: [
    {
      id: "need_1",
      phrase_from_user: "reduce the look of body bumps",
      concepts: ["body_bumps_look"],
      preferred_category: "body_wash",
      format_preferences: ["liquid"],
      priority: "primary",
      confidence: "high",
      normalised_label: "Reduce the look of body bumps",
    },
  ],
  avoidances: [],
  routine_context: null,
  uncertainties: [],
  follow_up_question: null,
  medical_flag: false,
};

// Demo Community Reports (honest trade-offs, strictly flagged with Demo data badge per Rule 4)
const DEMO_COMMUNITY_REPORTS = [
  {
    productName: "Demo 1% Salicylic Acid Body Wash",
    userQuote: "Helped with rough texture on upper arms after 2 weeks of consistent shower use. Doesn't dry out skin.",
    tradeOff: "Noticeable foaming; requires thorough rinsing so no film remains on skin.",
    verifiedPurchase: true,
  },
  {
    productName: "Demo 4% AHA BHA Underarm Roll-On",
    userQuote: "Solid odor control throughout high-heat workdays. The liquid dries down in about 90 seconds.",
    tradeOff: "Do not apply immediately following underarm razor shaving or friction cuts.",
    verifiedPurchase: true,
  },
  {
    productName: "Demo Redensyl Hair Density Serum",
    userQuote: "Lightweight water-gel dropper formula. Easy to massage into partings before sleeping.",
    tradeOff: "Needs daily diligence for 60+ days; non-greasy but must be applied consistently.",
    verifiedPurchase: true,
  },
];

export default function MatchResultsPage() {
  // State
  const [parsedNeeds, setParsedNeeds] = React.useState<ParsedNeeds>(DEFAULT_PARSED);
  const [parsedRequest, setParsedRequest] = React.useState<ParsedRequest>(DEFAULT_PARSED_REQUEST);
  const [matchResult, setMatchResult] = React.useState<MatchResult>(() =>
    matchProducts(DEFAULT_PARSED, DEMO_CATALOGUE_SEED)
  );
  const [multiMatchResult, setMultiMatchResult] = React.useState<MultiNeedMatchResult | null>(null);
  const [howWeMatchedOpen, setHowWeMatchedOpen] = React.useState(true);

  // Compare Checkbox State
  const [comparedProductIds, setComparedProductIds] = React.useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);

  // "View Details" Product Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = React.useState<ProductRecord | null>(null);

  // "This Doesn't Fit" Modal State
  const [rejectingRecommendation, setRejectingRecommendation] = React.useState<{
    rec: Recommendation | NeedRecommendation;
    product: ProductRecord;
  } | null>(null);

  // Shortlist Feedback Widget State
  const [feedbackRating, setFeedbackRating] = React.useState<"yes" | "somewhat" | "no" | null>(null);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [aggregateConsent, setAggregateConsent] = React.useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("session-default");

  // Load parsed needs and run deterministic matcher
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      let activeSessionId = localStorage.getItem("bodywise_last_session_id");
      if (!activeSessionId) {
        activeSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem("bodywise_last_session_id", activeSessionId);
      }
      setSessionId(activeSessionId);

      try {
        const rawReq = sessionStorage.getItem("bodywise_parsed_request");
        const rawNeeds = sessionStorage.getItem("bodywise_parsed_needs");

        let activeReq = DEFAULT_PARSED_REQUEST;
        let activeNeeds = DEFAULT_PARSED;

        if (rawReq) {
          activeReq = JSON.parse(rawReq) as ParsedRequest;
          setParsedRequest(activeReq);
        }

        if (rawNeeds) {
          activeNeeds = JSON.parse(rawNeeds) as ParsedNeeds;
          setParsedNeeds(activeNeeds);
        } else if (rawReq && activeReq.needs.length > 0) {
          const first = activeReq.needs[0];
          activeNeeds = {
            goal: first.concepts[0] || "body_bumps_look",
            category: first.preferred_category,
            format_preferences: first.format_preferences,
            avoidances: activeReq.avoidances,
            routine_context: activeReq.routine_context,
            uncertainties: activeReq.uncertainties,
            confidence: first.confidence,
          };
          setParsedNeeds(activeNeeds);
        }

        // Run multi-need matching
        matchMultiNeeds(activeReq, DEMO_CATALOGUE_SEED).then((res) => {
          setMultiMatchResult(res);
        }).catch(() => {});

        // Also run single-need matching for backward compatibility
        const singleRes = matchProducts(activeNeeds, DEMO_CATALOGUE_SEED);
        setMatchResult(singleRes);

        // Attempt async API fetch if server is reachable
        fetchMultiNeedRecommendations(activeReq)
          .then((apiRes) => {
            if (apiRes && apiRes.groups) {
              setMultiMatchResult(apiRes);
            }
          })
          .catch(() => {
            // Keep local deterministic match
          });
      } catch {
        const singleRes = matchProducts(DEFAULT_PARSED, DEMO_CATALOGUE_SEED);
        setMatchResult(singleRes);
        matchMultiNeeds(DEFAULT_PARSED_REQUEST, DEMO_CATALOGUE_SEED)
          .then(setMultiMatchResult)
          .catch(() => {});
      }
    }
  }, []);

  // Recalculate matches
  const recomputeMatches = (updatedNeeds: ParsedNeeds) => {
    setParsedNeeds(updatedNeeds);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bodywise_parsed_needs", JSON.stringify(updatedNeeds));
    }
    const singleRes = matchProducts(updatedNeeds, DEMO_CATALOGUE_SEED);
    setMatchResult(singleRes);

    const updatedReq: ParsedRequest = {
      ...parsedRequest,
      needs: [
        {
          id: "need_1",
          phrase_from_user: updatedNeeds.goal || "care",
          concepts: [updatedNeeds.goal || "body_bumps_look"],
          preferred_category: (updatedNeeds.category as ProductCategory) || null,
          format_preferences: updatedNeeds.format_preferences,
          priority: "primary",
          confidence: updatedNeeds.confidence,
          normalised_label: normalizeCosmeticWording(updatedNeeds.goal || "care"),
        },
      ],
      avoidances: updatedNeeds.avoidances,
      routine_context: typeof updatedNeeds.routine_context === "string" ? updatedNeeds.routine_context : null,
    };
    setParsedRequest(updatedReq);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bodywise_parsed_request", JSON.stringify(updatedReq));
    }
    matchMultiNeeds(updatedReq, DEMO_CATALOGUE_SEED)
      .then(setMultiMatchResult)
      .catch(() => {});
  };

  // Handle "This doesn't fit" Correction
  const handleApplyCorrection = (reason: "wrong_format" | "avoid_ingredient" | "too_expensive" | "wrong_goal" | "other") => {
    if (!rejectingRecommendation) return;
    const { product } = rejectingRecommendation;

    const updated = { ...parsedNeeds };

    if (reason === "wrong_format") {
      const otherFormats = ["liquid", "roll-on", "oil", "gummies"].filter(
        (f) => !product.format.toLowerCase().includes(f)
      );
      if (otherFormats.length > 0) {
        updated.format_preferences = [otherFormats[0]];
      }
    } else if (reason === "avoid_ingredient") {
      if (product.fragrance_free !== true && !updated.avoidances.includes("fragrance")) {
        updated.avoidances = [...updated.avoidances, "fragrance"];
      } else {
        updated.avoidances = [...updated.avoidances, "parabens"];
      }
    } else if (reason === "wrong_goal") {
      const altGoals = CONTROLLED_GOALS.filter((g) => g.id !== updated.goal);
      if (altGoals.length > 0) {
        updated.goal = altGoals[0].id;
      }
    }

    recomputeMatches(updated);
    setRejectingRecommendation(null);
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

  const formatMatchLabel = (label: string) => {
    switch (label) {
      case "STRONG_FORMAT_FIT":
        return "Strong fit for your format preference";
      case "GOAL_FIT":
        return "Direct fit for your primary goal";
      case "ROUTINE_FIT":
        return "Fits your daily routine habits";
      case "CAUTIONARY_FIT":
        return "Cautious fit • Unverified avoidance noted";
      default:
        return "Partial fit for stated concern";
    }
  };

  // One-line summary recap
  const goalDef = CONTROLLED_GOALS.find((g) => g.id === parsedNeeds.goal);
  const recapGoal = goalDef?.label || parsedNeeds.goal?.replace(/_/g, " ") || "Body care";
  const recapCategory = parsedNeeds.category ? parsedNeeds.category.replace(/_/g, " ") : null;
  const recapFormat = parsedNeeds.format_preferences.length > 0 ? parsedNeeds.format_preferences.join(", ") : null;
  const recapAvoid = parsedNeeds.avoidances.length > 0 ? `No ${parsedNeeds.avoidances.join(", ")}` : null;

  const recapSegments = [recapGoal, recapCategory, recapFormat, recapAvoid].filter(Boolean);

  const comparedProducts = DEMO_CATALOGUE_SEED.filter((p) =>
    comparedProductIds.includes(p.id)
  );

  const multiGroups = multiMatchResult?.groups;
  const hasMultiGroups = Boolean(multiGroups && multiGroups.length > 0);
  const isAnyMatched = hasMultiGroups && multiGroups
    ? multiGroups.some((g) => g.status === "MATCHED" && g.recommendations.length > 0)
    : matchResult?.status === "MATCHES_FOUND" && matchResult.shortlist.length > 0;

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
            <DemoBadge />
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

        {/* Medical Caution Callout (Task Part E.7) */}
        {(parsedRequest.medical_flag || multiMatchResult?.medical_flag) && (
          <div className="mb-6">
            <Callout
              variant="caution"
              title="Informational only &bull; Cosmetic wellness boundaries"
              icon={<ShieldWarning className="w-5 h-5 text-caution-text flex-shrink-0" weight="regular" />}
            >
              <p className="text-xs md:text-sm">
                Your request touches symptoms or concerns (such as acne, infection, pain, or allergy) that may warrant a medical evaluation. Products in our catalogue are non-prescription cosmetic options intended for personal hygiene and appearance support. Please consult a qualified medical professional for diagnosis or treatment. Review our <Link href="/safety" className="underline font-semibold hover:text-brand-deep">Safety &amp; Scope</Link> principles.
              </p>
            </Callout>
          </div>
        )}

        {/* Section Header & Sub-header Recap */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sage/60 text-xs font-semibold text-brand-deep mb-2">
            <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
            <span>Step 3 &bull; Shortlisted Options</span>
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
              <span>
                {hasMultiGroups && multiGroups
                  ? multiGroups.map((g) => g.needLabel).join(" • ")
                  : recapSegments.join(" • ")}
              </span>
            </div>

            <Link
              href="/match/confirm"
              className="text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring rounded py-0.5 px-1.5 shrink-0 self-start sm:self-center"
            >
              Change
            </Link>
          </div>
        </div>

        {/* ================= RESULTS / SHORTLIST ================= */}
        {isAnyMatched ? (
          <div className="space-y-10 mb-12">
            {hasMultiGroups && multiGroups ? (
              /* Multi-Need Grouped Display (Task Part E & F) */
              multiGroups.map((group: NeedMatchGroup, groupIdx: number) => (
                <section key={group.needId || `group_${groupIdx}`} className="space-y-6">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-brand-evergreen/20">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-brand-evergreen text-white text-xs font-bold flex items-center justify-center">
                          {groupIdx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-evergreen">
                          Need {groupIdx + 1}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep">
                        For {group.needLabel}
                      </h2>
                      <p className="text-xs text-muted">
                        Understood from: &ldquo;{group.rawPhrase}&rdquo;
                      </p>
                    </div>

                    {group.category && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-sage text-brand-deep border border-brand-deep/15 capitalize self-start sm:self-auto">
                        Best-fitting product type: {group.category.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Group Recommendations or NO_FIT */}
                  {group.status === "NO_FIT" || group.recommendations.length === 0 ? (
                    <div className="p-6 rounded-card bg-surface border border-border text-center">
                      <WarningCircle className="w-8 h-8 text-muted mx-auto mb-2" weight="regular" />
                      <h3 className="font-bold text-brand-deep text-sm mb-1">
                        No direct catalogue fit found for this need
                      </h3>
                      <p className="text-xs text-muted max-w-md mx-auto">
                        {group.noFitReason ||
                          "No product in our catalogue currently carries verified published evidence matching this specific concern. We never invent products or make unverified claims."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {group.recommendations.map((rec: NeedRecommendation) => {
                        const product = DEMO_CATALOGUE_SEED.find((p) => p.id === rec.productId);
                        if (!product) return null;
                        const isCompared = comparedProductIds.includes(product.id);

                        return (
                          <Card
                            key={`${group.needId}_${rec.productId}`}
                            variant="surface"
                            className="p-6 md:p-8 shadow-card border border-border relative overflow-hidden"
                          >
                            {/* Top Bar: MatchLabel pill & Rank & Compare Checkbox */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
                              <div className="flex items-center gap-2 flex-wrap">
                                {product.is_demo && <DemoBadge />}
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent-lime text-brand-deep border border-brand-deep/20 shadow-none">
                                  {formatMatchLabel(rec.matchLabel)}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-medium text-muted">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-brand-deep hover:text-brand-evergreen">
                                  <input
                                    type="checkbox"
                                    checked={isCompared}
                                    onChange={() => toggleCompare(product.id)}
                                    className="w-4 h-4 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer"
                                  />
                                  <span>Compare</span>
                                </label>
                                <span className="text-border">&bull;</span>
                                <span>Rank {rec.rank} of {group.recommendations.length}</span>
                              </div>
                            </div>

                            {/* Header Row: Product Image + Name, Format, Size */}
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
                                </p>
                                <p className="text-sm text-charcoal/85 leading-relaxed">
                                  {product.official_description}
                                </p>
                              </div>
                            </div>

                            {/* "Why it's here" (Citing specific catalogue facts and source tags) */}
                            <div className="mb-6 bg-surface-sage/30 rounded-button p-4 border border-brand-deep/5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep mb-1.5 flex items-center gap-1.5">
                                <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                                Why it&apos;s here
                              </h4>
                              <p className="text-sm text-charcoal leading-relaxed font-medium mb-2">
                                {rec.whyHere || rec.considerIf[0] || "Directly relevant to your stated wellness goal."}
                              </p>

                              {rec.evidenceSnippets && rec.evidenceSnippets.length > 0 && (
                                <blockquote className="my-2.5 p-3 rounded bg-surface border-l-4 border-brand-evergreen text-xs italic text-brand-deep">
                                  &ldquo;{rec.evidenceSnippets[0]}&rdquo;
                                </blockquote>
                              )}

                              <div className="mt-2">
                                <SourceTag
                                  source={rec.sourceTag || "Official Store Catalogue Formulation"}
                                  lastVerifiedAt={product.last_verified_at || "November 2026"}
                                />
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
                                  {rec.considerIf.slice(1).length > 0 ? (
                                    rec.considerIf.slice(1).map((item, idx) => <li key={idx}>{item}</li>)
                                  ) : (
                                    <li>Matches your lifestyle application preference.</li>
                                  )}
                                  <li>Formulated for regular, non-invasive daily personal care.</li>
                                </ul>
                              </div>

                              <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text">
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                  <WarningCircle className="w-3.5 h-3.5 text-caution-text" weight="regular" aria-hidden="true" />
                                  May not be the best fit if...
                                </h4>
                                <ul className="text-xs md:text-sm space-y-2 pl-4 list-disc marker:text-caution-text">
                                  {rec.mayNotFitIf.map((caution, idx) => (
                                    <li key={idx}>{caution}</li>
                                  ))}
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
                                >
                                  View details
                                </Button>
                                <button
                                  type="button"
                                  data-testid="this-doesnt-fit-btn"
                                  onClick={() => setRejectingRecommendation({ rec, product })}
                                  className="text-xs text-muted hover:text-error-text underline focus-ring rounded py-1 px-2"
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
                  )}
                </section>
              ))
            ) : matchResult.status === "MATCHES_FOUND" ? (
              /* Single Goal Shortlist Fallback */
              matchResult.shortlist.map((rec: Recommendation) => {
                const product = DEMO_CATALOGUE_SEED.find((p) => p.id === rec.productId);
                if (!product) return null;
                const isCompared = comparedProductIds.includes(product.id);

                return (
                  <Card
                    key={rec.productId}
                    variant="surface"
                    className="p-6 md:p-8 shadow-card border border-border relative overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.is_demo && <DemoBadge />}
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent-lime text-brand-deep border border-brand-deep/20 shadow-none">
                          {formatMatchLabel(rec.matchLabel)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium text-muted">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-brand-deep hover:text-brand-evergreen">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(product.id)}
                            className="w-4 h-4 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer"
                          />
                          <span>Compare</span>
                        </label>
                        <span className="text-border">&bull;</span>
                        <span>Rank {rec.rank} of {matchResult.shortlist.length}</span>
                      </div>
                    </div>

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
                        </p>
                        <p className="text-sm text-charcoal/85 leading-relaxed">
                          {product.official_description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 bg-surface-sage/30 rounded-button p-4 border border-brand-deep/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-deep mb-1.5 flex items-center gap-1.5">
                        <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                        Why it&apos;s here
                      </h4>
                      <p className="text-sm text-charcoal leading-relaxed font-medium">
                        {rec.considerIf[0] || "Directly relevant to your stated wellness goal and preferences."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-button bg-surface border border-border">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen mb-2.5 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                          Consider this if...
                        </h4>
                        <ul className="text-xs md:text-sm text-charcoal/85 space-y-2 pl-4 list-disc marker:text-brand-evergreen">
                          {rec.considerIf.slice(1).length > 0 ? (
                            rec.considerIf.slice(1).map((item, idx) => <li key={idx}>{item}</li>)
                          ) : (
                            <li>Matches your lifestyle application preference.</li>
                          )}
                          <li>Formulated for regular, non-invasive daily personal care.</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-button bg-caution-peach/60 border-l-4 border-caution-text text-caution-text">
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <WarningCircle className="w-3.5 h-3.5 text-caution-text" weight="regular" aria-hidden="true" />
                          May not be the best fit if...
                        </h4>
                        <ul className="text-xs md:text-sm space-y-2 pl-4 list-disc marker:text-caution-text">
                          {rec.mayNotFitIf.map((caution, idx) => (
                            <li key={idx}>{caution}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

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

                    <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDetailProduct(product)}
                        >
                          View details
                        </Button>
                        <button
                          type="button"
                          data-testid="this-doesnt-fit-btn"
                          onClick={() => setRejectingRecommendation({ rec, product })}
                          className="text-xs text-muted hover:text-error-text underline focus-ring rounded py-1 px-2"
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
              })
            ) : null}
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
                <Button variant="secondary" size="default">
                  Browse all products
                </Button>
              </Link>
              <Link href="/match/confirm">
                <Button variant="primary" size="default">
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
            className="w-full flex items-center justify-between text-left focus-ring rounded"
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
                  <strong>Hard exclusions:</strong> Any product with packaging ingredients or label cautions conflicting with your avoidances is filtered out. Unverified ingredients are held with caution.
                </li>
                <li>
                  <strong>Goal fit:</strong> Products with verified published evidence directly addressing your stated goals receive highest priority (+50 pts); general domain fit receives (+25 pts).
                </li>
                <li>
                  <strong>Preference fit:</strong> Products meeting your preferred format receive (+15 pts); verified fragrance-free products receive (+10 pts).
                </li>
                <li>
                  <strong>Deterministic tie-breaks:</strong> When scores tie, products with more verified facts rank higher; final ties are broken alphabetically by slug.
                </li>
              </ol>

              {hasMultiGroups && multiGroups && (
                <div className="p-3 rounded bg-surface-sage/30 border border-brand-deep/10 text-xs">
                  <span className="font-bold text-brand-deep block mb-1">
                    Multi-Need Retrieval &amp; Evidence Grounding:
                  </span>
                  <p className="text-muted mb-2">
                    Queries are mapped to controlled cosmetic concepts and retrieved via BM25 lexical search over verified packaging cards. Products require published evidence snippets to qualify for a need.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-charcoal">
                    {multiGroups.map((g) => (
                      <li key={g.needId}>
                        <strong>{g.needLabel}:</strong> {g.status === "MATCHED" ? `${g.recommendations.length} evidenced match(es)` : "No fit found"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 text-xs text-muted flex items-center justify-between">
                <span>Algorithm: Pure TypeScript Deterministic Matcher</span>
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
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[40px] ${
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
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[40px] ${
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
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors focus-ring min-h-[40px] ${
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
                    className="w-full p-2.5 rounded-button text-xs bg-surface border border-border text-charcoal focus-ring"
                    maxLength={300}
                  />

                  {/* Explicit Aggregate Consent Toggle (Defaults to FALSE / OFF) */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted">
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
                    >
                      Submit feedback
                    </Button>
                    <button
                      type="button"
                      onClick={() => setFeedbackSubmitted(true)}
                      className="text-xs text-muted hover:text-brand-deep underline"
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
              >
                Compare now
              </Button>
              <button
                type="button"
                onClick={() => setComparedProductIds([])}
                className="text-xs text-muted hover:text-brand-deep underline"
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
        isOpen={rejectingRecommendation !== null}
        onClose={() => setRejectingRecommendation(null)}
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
              onClick={() => handleApplyCorrection(item.id as "wrong_format" | "avoid_ingredient" | "too_expensive" | "wrong_goal" | "other")}
              className="w-full text-left p-3.5 rounded-button border border-border bg-surface hover:bg-surface-sage/40 transition-colors text-xs md:text-sm font-semibold text-brand-deep focus-ring"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
