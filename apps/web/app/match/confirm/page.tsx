"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkle,
  Plus,
  ArrowsClockwise,
  ArrowCounterClockwise,
  CheckCircle,
  X,
  PencilSimple,
  CaretRight,
  ShieldWarning,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  Chip,
  DemoBadge,
  ProgressBar,
  Stepper,
  StepItem,
  Callout,
  Dialog,
} from "@/components/ui";
import {
  ParsedNeeds,
  ParsedRequest,
  ParsedNeed,
  ProductCategory,
  ClarifyingQuestion,
  QuestionOption,
  CONTROLLED_CONCEPTS,
  DEMO_CATALOGUE_SEED,
  selectNextQuestion,
  normalizeCosmeticWording,
} from "@bodywise/shared";
import { fetchNextQuestion } from "@/lib/api";

const MATCH_STEPS: StepItem[] = [
  { id: "step-1", label: "Describe concern", description: "Goal & preferences" },
  { id: "step-2", label: "Clarify details", description: "1-2 quick questions" },
  { id: "step-3", label: "Explained matches", description: "Shortlisted options" },
];

const CONTROLLED_FORMATS = [
  { id: "liquid", label: "Liquid rinse-off wash (shower use)" },
  { id: "roll-on", label: "Leave-on topical roll-on / serum" },
  { id: "oil", label: "Nourishing oil" },
  { id: "gummies", label: "Chewable daily gummies" },
  { id: "cream", label: "Moisturizing cream / lotion" },
];

const CONTROLLED_AVOIDANCES = [
  { id: "fragrance", label: "Fragrance / perfume" },
  { id: "sulphates", label: "Sulphates (SLS / SLES)" },
  { id: "parabens", label: "Parabens" },
  { id: "silicones", label: "Silicones" },
  { id: "essential oils", label: "Essential oils" },
  { id: "alcohol", label: "Drying alcohols" },
];

const CONTROLLED_ROUTINES = [
  { id: "morning", label: "Morning routine / start of day" },
  { id: "evening", label: "Evening / post-shower routine" },
  { id: "post-workout", label: "Post-workout / on the go" },
];

const DEFAULT_PARSED_NEEDS: ParsedNeeds = {
  goal: "body_bumps_look",
  category: "body_wash",
  format_preferences: [],
  avoidances: [],
  routine_context: null,
  uncertainties: [],
  confidence: "medium",
};

const DEFAULT_PARSED_REQUEST: ParsedRequest = {
  needs: [
    {
      id: "need_1",
      phrase_from_user: "reduce the look of body bumps",
      concepts: ["body_bumps_look"],
      preferred_category: "body_wash",
      format_preferences: [],
      priority: "primary",
      confidence: "medium",
      normalised_label: "Reduce the look of body bumps",
    },
  ],
  avoidances: [],
  routine_context: null,
  uncertainties: [],
  follow_up_question: null,
  medical_flag: false,
};

export default function MatchConfirmPage() {
  const router = useRouter();

  // State initialized with default so SSR and initial render display full UI
  const [parsedNeeds, setParsedNeeds] = React.useState<ParsedNeeds>(DEFAULT_PARSED_NEEDS);
  const [parsedRequest, setParsedRequest] = React.useState<ParsedRequest>(DEFAULT_PARSED_REQUEST);
  const [parseSource, setParseSource] = React.useState<"llm" | "rules">("rules");
  const [fallbackReason, setFallbackReason] = React.useState<string | null>(null);

  const [answeredQuestionIds, setAnsweredQuestionIds] = React.useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState<ClarifyingQuestion | null>(() => {
    const init = selectNextQuestion(DEFAULT_PARSED_NEEDS, DEMO_CATALOGUE_SEED, []);
    return init.question;
  });
  const [isQuestionLoading, setIsQuestionLoading] = React.useState(false);
  const [isSkipped, setIsSkipped] = React.useState(false);
  const [chipAnimationKey, setChipAnimationKey] = React.useState(0);

  // Modal / Add Preference Dialog State
  const [isAddPreferenceOpen, setIsAddPreferenceOpen] = React.useState(false);

  // Multi-need Dialogs
  const [isAddNeedOpen, setIsAddNeedOpen] = React.useState(false);
  const [newNeedConcept, setNewNeedConcept] = React.useState<string>(CONTROLLED_CONCEPTS[0]?.id || "oil_control");
  const [newNeedCategory, setNewNeedCategory] = React.useState<string>("any");
  const [editingNeedCategoryIndex, setEditingNeedCategoryIndex] = React.useState<number | null>(null);

  // Restore parsed request & needs from sessionStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawReq = sessionStorage.getItem("bodywise_parsed_request");
        const rawNeeds = sessionStorage.getItem("bodywise_parsed_needs");

        if (rawReq) {
          const parsed = JSON.parse(rawReq) as ParsedRequest;
          setParsedRequest(parsed);
          // Sync with parsedNeeds for single-need helpers
          if (parsed.needs && parsed.needs.length > 0) {
            const firstNeed = parsed.needs[0];
            setParsedNeeds({
              goal: firstNeed.concepts[0] || "body_bumps_look",
              category: firstNeed.preferred_category,
              format_preferences: firstNeed.format_preferences || [],
              avoidances: parsed.avoidances || [],
              routine_context: parsed.routine_context || null,
              uncertainties: parsed.uncertainties || [],
              confidence: firstNeed.confidence || "medium",
            });
          }
        } else if (rawNeeds) {
          const parsed = JSON.parse(rawNeeds) as ParsedNeeds;
          setParsedNeeds(parsed);
          setParsedRequest({
            needs: [
              {
                id: "need_1",
                phrase_from_user: parsed.goal || "Daily wellness care",
                concepts: [parsed.goal || "body_bumps_look"],
                preferred_category: (parsed.category as ProductCategory) || null,
                format_preferences: parsed.format_preferences || [],
                priority: "primary",
                confidence: parsed.confidence || "medium",
                normalised_label: normalizeCosmeticWording(parsed.goal || "Daily wellness care"),
              },
            ],
            avoidances: parsed.avoidances || [],
            routine_context: typeof parsed.routine_context === "string" ? parsed.routine_context : null,
            uncertainties: parsed.uncertainties || [],
            follow_up_question: null,
            medical_flag: false,
          });
        }

        const source = sessionStorage.getItem("bodywise_parse_source");
        if (source === "llm" || source === "rules") {
          setParseSource(source);
        }

        const reason = sessionStorage.getItem("bodywise_parse_fallback_reason");
        if (reason) {
          setFallbackReason(reason);
        }
      } catch {
        // Fallback silently
      }
    }
  }, []);

  // Fetch Next Decisive Question (at most 4 questions total)
  React.useEffect(() => {
    let isMounted = true;
    async function loadQuestion() {
      if (!parsedNeeds || isSkipped || answeredQuestionIds.length >= 4) {
        setIsQuestionLoading(false);
        setCurrentQuestion(null);
        return;
      }

      // If multi-need request has high confidence across all needs and no uncertainties, question can be skipped
      const hasUncertainties = parsedRequest.uncertainties && parsedRequest.uncertainties.length > 0;
      const allNeedsHigh = parsedRequest.needs.length > 1 && parsedRequest.needs.every((n) => n.confidence === "high");
      if (allNeedsHigh && !hasUncertainties) {
        setIsQuestionLoading(false);
        setCurrentQuestion(null);
        return;
      }

      setIsQuestionLoading(true);
      try {
        const result = await fetchNextQuestion(parsedNeeds, answeredQuestionIds);
        if (isMounted) {
          setCurrentQuestion(result.question);
        }
      } catch {
        if (isMounted) setCurrentQuestion(null);
      } finally {
        if (isMounted) setIsQuestionLoading(false);
      }
    }

    loadQuestion();
    return () => {
      isMounted = false;
    };
  }, [parsedNeeds, parsedRequest, answeredQuestionIds, isSkipped]);

  // Update ParsedRequest
  const updateParsedRequest = (updater: (prev: ParsedRequest) => ParsedRequest) => {
    setParsedRequest((prev) => {
      const updated = updater(prev);
      const firstNeed = updated.needs[0];
      const syncedNeeds: ParsedNeeds = {
        goal: firstNeed?.concepts[0] || parsedNeeds.goal,
        category: firstNeed?.preferred_category || null,
        format_preferences: firstNeed?.format_preferences || [],
        avoidances: updated.avoidances,
        routine_context: updated.routine_context,
        uncertainties: updated.uncertainties,
        confidence: firstNeed?.confidence || "medium",
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bodywise_parsed_request", JSON.stringify(updated));
        sessionStorage.setItem("bodywise_parsed_needs", JSON.stringify(syncedNeeds));
      }
      setChipAnimationKey((k) => k + 1);
      return updated;
    });
  };

  // Update legacy ParsedNeeds (for compatibility)
  const updateParsedNeeds = (updater: (prev: ParsedNeeds) => ParsedNeeds) => {
    setParsedNeeds((prev) => {
      const updated = updater(prev);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bodywise_parsed_needs", JSON.stringify(updated));
      }
      // Also update first need in parsedRequest
      setParsedRequest((prevReq) => {
        const nextNeeds = [...prevReq.needs];
        if (nextNeeds.length > 0) {
          nextNeeds[0] = {
            ...nextNeeds[0],
            preferred_category: (updated.category as ProductCategory) || null,
            format_preferences: updated.format_preferences,
            concepts: [updated.goal || "body_bumps_look"],
          };
        }
        const nextReq = {
          ...prevReq,
          needs: nextNeeds,
          avoidances: updated.avoidances,
          routine_context: typeof updated.routine_context === "string" ? updated.routine_context : null,
        };
        if (typeof window !== "undefined") {
          sessionStorage.setItem("bodywise_parsed_request", JSON.stringify(nextReq));
        }
        return nextReq;
      });
      setChipAnimationKey((k) => k + 1);
      return updated;
    });
  };

  // Answering a Follow-up Question
  const handleAnswerQuestion = (option: QuestionOption) => {
    if (!currentQuestion) return;

    updateParsedNeeds((prev) => {
      const updated = { ...prev };

      if (option.filterDimension === "format" && option.filterValue) {
        const fmt = String(option.filterValue);
        if (!updated.format_preferences.includes(fmt)) {
          updated.format_preferences = [...updated.format_preferences, fmt];
        }
      } else if (option.filterDimension === "fragrance") {
        if (option.filterValue === true && !updated.avoidances.includes("fragrance")) {
          updated.avoidances = [...updated.avoidances, "fragrance"];
        }
      } else if (option.filterDimension === "category" && option.filterValue) {
        updated.category = String(option.filterValue);
      } else if (option.filterDimension === "goal" && option.filterValue) {
        updated.goal = String(option.filterValue);
      } else if (option.filterDimension === "timing" && option.filterValue) {
        updated.routine_context = String(option.filterValue);
      }

      if (updated.confidence === "low") {
        updated.confidence = "medium";
      }

      return updated;
    });

    setAnsweredQuestionIds((prev) => [...prev, currentQuestion.id]);
  };

  const handleNotSure = () => {
    if (!currentQuestion) return;
    setAnsweredQuestionIds((prev) => [...prev, currentQuestion.id]);
  };

  const handleSkipBroad = () => {
    setIsSkipped(true);
    setCurrentQuestion(null);
  };

  const handleMisunderstoodReset = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bodywise_parsed_needs");
      sessionStorage.removeItem("bodywise_parsed_request");
      sessionStorage.removeItem("bodywise_request_id");
      sessionStorage.removeItem("bodywise_match_draft");
    }
    router.push("/match");
  };

  // Multi-need handlers
  const handleRemoveNeed = (indexToRemove: number) => {
    if (parsedRequest.needs.length <= 1) return;
    updateParsedRequest((prev) => ({
      ...prev,
      needs: prev.needs.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAddNeed = () => {
    const conceptDef = CONTROLLED_CONCEPTS.find((c) => c.id === newNeedConcept);
    const label = conceptDef?.normalised_label || conceptDef?.label || "Targeted care";
    const prefCat = newNeedCategory !== "any" ? (newNeedCategory as ProductCategory) : null;

    const newNeed: ParsedNeed = {
      id: `need_${Date.now()}`,
      phrase_from_user: label.toLowerCase(),
      concepts: [newNeedConcept],
      preferred_category: prefCat,
      format_preferences: [],
      priority: "secondary",
      confidence: "medium",
      normalised_label: label,
    };

    updateParsedRequest((prev) => ({
      ...prev,
      needs: [...prev.needs, newNeed],
    }));

    setIsAddNeedOpen(false);
  };

  const handleRemoveConceptFromNeed = (needIndex: number, conceptId: string) => {
    updateParsedRequest((prev) => {
      const nextNeeds = [...prev.needs];
      const targetNeed = nextNeeds[needIndex];
      if (targetNeed && targetNeed.concepts.length > 1) {
        nextNeeds[needIndex] = {
          ...targetNeed,
          concepts: targetNeed.concepts.filter((c) => c !== conceptId),
        };
      }
      return { ...prev, needs: nextNeeds };
    });
  };

  const handleUpdateNeedCategory = (needIndex: number, newCat: string | null) => {
    updateParsedRequest((prev) => {
      const nextNeeds = [...prev.needs];
      if (nextNeeds[needIndex]) {
        nextNeeds[needIndex] = {
          ...nextNeeds[needIndex],
          preferred_category: (newCat as ProductCategory) || null,
        };
      }
      return { ...prev, needs: nextNeeds };
    });
    setEditingNeedCategoryIndex(null);
  };

  const handleRemoveFormat = (fmt: string) => {
    updateParsedNeeds((prev) => ({
      ...prev,
      format_preferences: prev.format_preferences.filter((f) => f !== fmt),
    }));
  };

  const handleRemoveAvoidance = (avoid: string) => {
    updateParsedNeeds((prev) => ({
      ...prev,
      avoidances: prev.avoidances.filter((a) => a !== avoid),
    }));
  };

  const handleRemoveRoutine = () => {
    updateParsedNeeds((prev) => ({
      ...prev,
      routine_context: null,
    }));
  };

  const handleProceedToMatches = () => {
    router.push("/match/results");
  };

  const isLowConfidence =
    parsedRequest.needs.some((n) => n.confidence === "low") ||
    parsedNeeds.confidence === "low";
  const confidenceLabel = isLowConfidence ? "Guessing, please check" : "Clear";
  const confidenceVariant = isLowConfidence
    ? "bg-caution-peach/80 text-caution-text border-caution-text/30"
    : "bg-surface-sage text-brand-deep border-brand-deep/15";

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/match"
            className="flex items-center gap-2 text-sm font-semibold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" aria-hidden="true" />
            <span>Back to Step 1</span>
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
      <main id="main-content" className="max-w-3xl mx-auto px-5 py-8 md:py-12 flex-1 w-full">
        {/* Stepper (Step 2 of 3) */}
        <div className="mb-6">
          <Stepper steps={MATCH_STEPS} currentStepIndex={1} />
        </div>

        {/* ProgressBar */}
        <div className="mb-6">
          <ProgressBar value={66} max={100} showLabel />
        </div>

        {/* Required Small Caution Callout */}
        <div className="mb-6">
          <Callout variant="info" className="py-2.5 my-0">
            <span className="text-xs md:text-sm font-medium">
              This helps choose products. It isn&apos;t medical advice.
            </span>
          </Callout>
        </div>

        {/* Medical Caution Callout (if medical flag triggered) */}
        {parsedRequest.medical_flag && (
          <div className="mb-6">
            <Callout
              variant="caution"
              title="Cosmetic wellness boundaries"
              icon={<ShieldWarning className="w-5 h-5 text-caution-text flex-shrink-0" weight="regular" />}
            >
              <p className="text-xs md:text-sm">
                Your request mentions symptoms that may relate to an underlying condition. We recommend consulting a dermatologist or doctor for medical diagnosis. Matches below are strictly cosmetic options for appearance and daily comfort.
              </p>
            </Callout>
          </div>
        )}

        {/* Low Confidence Callout */}
        {isLowConfidence && (
          <div className="mb-6">
            <Callout
              variant="caution"
              title="We need a bit more clarity to find a good fit"
              icon={<ShieldWarning className="w-5 h-5 text-caution-text flex-shrink-0" weight="regular" />}
            >
              <p className="text-xs md:text-sm">
                {parsedRequest.uncertainties && parsedRequest.uncertainties.length > 0
                  ? parsedRequest.uncertainties[0]
                  : "Your description contained multiple potential focus areas or broad phrases. We won't guess—please answer the single question below or adjust the chips."}
              </p>
            </Callout>
          </div>
        )}

        {/* Main Card: Here's what we understood */}
        <Card variant="surface" className="p-6 md:p-8 shadow-ambient border border-border rounded-card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sage/60 text-xs font-semibold text-brand-deep">
                  <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
                  <span>Step 2 &bull; Editable Parsed Needs</span>
                </div>
                {parseSource === "llm" ? (
                  <span
                    data-testid="parse-source-tag"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-lime/40 text-brand-deep border border-brand-evergreen/20"
                  >
                    Interpreted with AI, please check
                  </span>
                ) : (
                  <span
                    data-testid="parse-source-tag"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-sage/60 text-brand-deep border border-border"
                  >
                    Interpreted with rules (AI unavailable)
                  </span>
                )}
                {process.env.NODE_ENV !== "production" && fallbackReason && (
                  <span className="text-[11px] text-muted italic ml-1">
                    ({fallbackReason})
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-brand-deep tracking-tight">
                Here&apos;s what we understood
              </h1>
            </div>

            {/* Persistent "You misunderstood me" button */}
            <button
              type="button"
              onClick={handleMisunderstoodReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep hover:text-error-text underline focus-ring rounded py-1 px-2 active:scale-[0.98] motion-safe:transition-transform"
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" weight="regular" aria-hidden="true" />
              <span>You misunderstood me</span>
            </button>
          </div>

          {/* Multi-Need Display Section (Task Part D & F) */}
          <div key={chipAnimationKey} className="space-y-4 mb-6">
            {parsedRequest.needs.map((need, idx) => {
              const displayLabel = need.normalised_label || need.phrase_from_user;
              return (
                <div
                  key={need.id || `need_${idx}`}
                  className="p-4 rounded-card bg-surface border border-border/90 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-sage text-brand-deep text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-brand-deep">
                        Need {idx + 1}: {displayLabel}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${confidenceVariant}`}>
                        {confidenceLabel}
                      </span>
                    </div>

                    {parsedRequest.needs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNeed(idx)}
                        className="text-xs text-muted hover:text-error-text inline-flex items-center gap-1 p-1 rounded focus-ring"
                        aria-label={`Remove need ${idx + 1}`}
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Remove need</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {/* Goal / Concept chips */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="uppercase tracking-wider font-bold text-muted min-w-[70px]">
                        Goal:
                      </span>
                      {need.concepts.map((conceptId) => {
                        const def = CONTROLLED_CONCEPTS.find((c) => c.id === conceptId);
                        const conceptText = def?.normalised_label || def?.label || conceptId.replace(/_/g, " ");
                        return (
                          <Chip
                            key={conceptId}
                            removable={need.concepts.length > 1}
                            onRemove={() => handleRemoveConceptFromNeed(idx, conceptId)}
                            className="bg-surface-sage/70 text-brand-deep border-brand-deep/15"
                          >
                            {conceptText}
                          </Chip>
                        );
                      })}
                    </div>

                    {/* Preferred Category */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="uppercase tracking-wider font-bold text-muted min-w-[70px]">
                        Product:
                      </span>
                      {need.preferred_category ? (
                        <span className="font-semibold text-xs text-brand-deep bg-surface-sage/50 px-2.5 py-1 rounded-full border border-brand-deep/10 flex items-center gap-1.5 capitalize">
                          <span>{need.preferred_category.replace(/_/g, " ")}</span>
                          <button
                            type="button"
                            onClick={() => setEditingNeedCategoryIndex(idx)}
                            aria-label={`Edit product category for need ${idx + 1}`}
                            className="p-0.5 rounded hover:bg-brand-deep/10 text-brand-deep focus-ring"
                          >
                            <PencilSimple className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateNeedCategory(idx, null)}
                            aria-label={`Remove product category for need ${idx + 1}`}
                            className="p-0.5 rounded hover:bg-brand-deep/10 text-brand-deep focus-ring"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-muted italic flex items-center gap-1.5">
                          <span>Any suitable product type in catalogue</span>
                          <button
                            type="button"
                            onClick={() => setEditingNeedCategoryIndex(idx)}
                            className="text-brand-evergreen underline font-medium hover:text-brand-deep ml-1"
                          >
                            Set category
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "+ Add another need" button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAddNeedOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-evergreen hover:text-brand-deep focus-ring rounded py-1.5 px-3 border border-brand-evergreen/40 bg-surface hover:bg-surface-sage/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+ Add another need</span>
              </button>
            </div>
          </div>

          {/* Formats, Avoidances, Routine Preferences */}
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              General Preferences
            </h3>

            {/* Format Group */}
            <div className="p-3 rounded-button bg-surface border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-muted min-w-[75px]">
                  Format:
                </span>
                {parsedNeeds.format_preferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedNeeds.format_preferences.map((fmt) => (
                      <Chip
                        key={fmt}
                        removable
                        onRemove={() => handleRemoveFormat(fmt)}
                        className="text-xs capitalize"
                      >
                        {fmt}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted italic">No format restriction</span>
                )}
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-surface-sage text-brand-deep border-brand-deep/10 self-start sm:self-center">
                {parsedNeeds.format_preferences.length > 0 ? "Clear" : "Flexible"}
              </span>
            </div>

            {/* Avoid Group */}
            <div className="p-3 rounded-button bg-surface border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-muted min-w-[75px]">
                  Avoid:
                </span>
                {parsedNeeds.avoidances.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedNeeds.avoidances.map((avoid) => (
                      <Chip
                        key={avoid}
                        removable
                        onRemove={() => handleRemoveAvoidance(avoid)}
                        className="text-xs bg-caution-peach/60 border-caution-text/20 text-caution-text capitalize"
                      >
                        No {avoid}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted italic">No avoidances declared</span>
                )}
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-surface-sage text-brand-deep border-brand-deep/10 self-start sm:self-center">
                {parsedNeeds.avoidances.length > 0 ? "Clear" : "Flexible"}
              </span>
            </div>

            {/* Routine Group */}
            <div className="p-3 rounded-button bg-surface border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-muted min-w-[75px]">
                  Routine:
                </span>
                {parsedNeeds.routine_context ? (
                  <Chip
                    removable
                    onRemove={handleRemoveRoutine}
                    className="text-xs capitalize"
                  >
                    {typeof parsedNeeds.routine_context === "string"
                      ? parsedNeeds.routine_context
                      : "Daily routine"}
                  </Chip>
                ) : (
                  <span className="text-xs text-muted italic">Not specified</span>
                )}
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-surface-sage text-brand-deep border-brand-deep/10 self-start sm:self-center">
                Flexible
              </span>
            </div>
          </div>

          {/* "+ Add a preference" Button */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsAddPreferenceOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring rounded py-1 px-2.5 border border-brand-evergreen/30 bg-surface hover:bg-surface-sage/20 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add a preference</span>
            </button>
            <span className="text-xs text-muted">Click any chip to remove or refine</span>
          </div>
        </Card>

        {/* ================= ONE FOLLOW-UP QUESTION CARD AT A TIME ================= */}
        {currentQuestion && !isSkipped && answeredQuestionIds.length < 4 ? (
          <Card variant="surface" className="p-6 md:p-8 shadow-ambient border-2 border-brand-evergreen/30 bg-surface rounded-card relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-lime text-brand-deep font-bold font-display text-xs flex items-center justify-center shadow-sm">
                  {answeredQuestionIds.length + 1}
                </span>
                <span className="text-xs uppercase tracking-wider font-bold text-brand-deep">
                  Clarifying question {answeredQuestionIds.length + 1} of 4
                </span>
              </div>
              <span className="text-xs text-muted font-medium">Never asks for medical/contact info</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-display text-brand-deep mb-6">
              {currentQuestion.question}
            </h2>

            {/* Large Tap-able Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleAnswerQuestion(option)}
                  className="p-4 rounded-button text-left font-semibold text-sm md:text-base text-brand-deep bg-surface-sage/40 hover:bg-surface-sage border border-brand-deep/15 hover:border-brand-evergreen transition-all duration-150 focus-ring min-h-[54px] flex items-center justify-between group active:scale-[0.98] motion-safe:transition-transform shadow-ambient"
                >
                  <span>{option.label}</span>
                  <CaretRight className="w-4 h-4 text-brand-evergreen opacity-0 group-hover:opacity-100 transition-opacity" weight="bold" />
                </button>
              ))}
            </div>

            {/* Escape Options */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
              <button
                type="button"
                onClick={handleNotSure}
                className="text-muted hover:text-brand-deep underline focus-ring rounded py-1 px-2 min-h-[44px] flex items-center active:scale-[0.98] motion-safe:transition-transform"
              >
                Not sure
              </button>
              <button
                type="button"
                onClick={handleSkipBroad}
                className="text-brand-evergreen hover:text-brand-deep font-semibold focus-ring rounded py-1 px-2 min-h-[44px] flex items-center active:scale-[0.98] motion-safe:transition-transform"
              >
                Skip, show broad options &rarr;
              </button>
            </div>
          </Card>
        ) : isQuestionLoading ? (
          <div className="p-8 text-center text-muted flex items-center justify-center gap-2">
            <ArrowsClockwise className="w-4 h-4 animate-spin text-brand-evergreen" weight="regular" />
            <span>Finding decisive question...</span>
          </div>
        ) : (
          /* Completion State: Ready to See Matches */
          <Card variant="surface" className="p-6 md:p-8 shadow-ambient border-2 border-brand-evergreen bg-surface-sage/20 rounded-card text-center">
            <div className="w-12 h-12 rounded-full bg-accent-lime text-brand-deep mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle className="w-6 h-6 text-brand-deep stroke-[2.5]" weight="regular" aria-hidden="true" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-brand-deep mb-2 tracking-tight">
              Sufficient clarity reached
            </h2>
            <p className="text-sm text-charcoal/80 max-w-md mx-auto mb-6 leading-relaxed">
              We have enough transparent details to evaluate our catalogue and explain 2&ndash;3 shortlisted options for you.
            </p>
            <Button
              variant="primary"
              size="default"
              onClick={handleProceedToMatches}
              className="font-semibold text-base px-8 h-12 shadow-ambient min-w-[200px] active:scale-[0.98] motion-safe:transition-transform"
            >
              See my options
              <ArrowRight className="ml-2 w-4 h-4" weight="bold" aria-hidden="true" />
            </Button>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Independent prototype for a fellowship challenge; not an official Be Bodywise service.</p>
      </footer>

      {/* Add Preference Controlled Dialog */}
      <Dialog
        isOpen={isAddPreferenceOpen}
        onClose={() => setIsAddPreferenceOpen(false)}
        title="Add a Preference or Avoidance"
        description="Select an attribute from our controlled vocabulary to refine your search."
      >
        <div className="space-y-5 py-2">
          {/* Formats */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-brand-deep mb-2">
              Application Formats
            </h4>
            <div className="flex flex-wrap gap-2">
              {CONTROLLED_FORMATS.map((f) => (
                <Chip
                  key={f.id}
                  selected={parsedNeeds.format_preferences.includes(f.id)}
                  onSelectChange={() => {
                    updateParsedNeeds((prev) => ({
                      ...prev,
                      format_preferences: prev.format_preferences.includes(f.id)
                        ? prev.format_preferences.filter((x) => x !== f.id)
                        : [...prev.format_preferences, f.id],
                    }));
                    setIsAddPreferenceOpen(false);
                  }}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Avoidances */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-brand-deep mb-2">
              Avoidances &amp; Sensitivities
            </h4>
            <div className="flex flex-wrap gap-2">
              {CONTROLLED_AVOIDANCES.map((a) => (
                <Chip
                  key={a.id}
                  selected={parsedNeeds.avoidances.includes(a.id)}
                  onSelectChange={() => {
                    updateParsedNeeds((prev) => ({
                      ...prev,
                      avoidances: prev.avoidances.includes(a.id)
                        ? prev.avoidances.filter((x) => x !== a.id)
                        : [...prev.avoidances, a.id],
                    }));
                    setIsAddPreferenceOpen(false);
                  }}
                  className="bg-caution-peach/60 text-caution-text"
                >
                  No {a.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Routines */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-brand-deep mb-2">
              Routine Timing
            </h4>
            <div className="flex flex-wrap gap-2">
              {CONTROLLED_ROUTINES.map((r) => (
                <Chip
                  key={r.id}
                  selected={parsedNeeds.routine_context === r.id}
                  onSelectChange={() => {
                    updateParsedNeeds((prev) => ({
                      ...prev,
                      routine_context: prev.routine_context === r.id ? null : r.id,
                    }));
                    setIsAddPreferenceOpen(false);
                  }}
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Add Need Dialog (Task Part F) */}
      <Dialog
        isOpen={isAddNeedOpen}
        onClose={() => setIsAddNeedOpen(false)}
        title="Add Another Need"
        description="Select a goal or skin concern to match additional products for."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-brand-deep block mb-1.5">
              Goal / Concern
            </label>
            <select
              value={newNeedConcept}
              onChange={(e) => setNewNeedConcept(e.target.value)}
              className="w-full p-2.5 rounded-button border border-border bg-surface text-brand-deep text-sm font-medium focus-ring"
            >
              {CONTROLLED_CONCEPTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.normalised_label || c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-brand-deep block mb-1.5">
              Preferred Product Type (Optional)
            </label>
            <select
              value={newNeedCategory}
              onChange={(e) => setNewNeedCategory(e.target.value)}
              className="w-full p-2.5 rounded-button border border-border bg-surface text-brand-deep text-sm font-medium focus-ring"
            >
              <option value="any">Any suitable product type</option>
              <option value="face_wash">Face Wash</option>
              <option value="body_wash">Body Wash</option>
              <option value="serum">Serum</option>
              <option value="sunscreen">Sunscreen</option>
              <option value="moisturizer">Moisturizer</option>
              <option value="shampoo">Shampoo</option>
              <option value="hair_oil">Hair Oil</option>
              <option value="supplement">Supplement / Gummies</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddNeedOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNeed}
            >
              Add Need
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Category for a specific Need */}
      <Dialog
        isOpen={editingNeedCategoryIndex !== null}
        onClose={() => setEditingNeedCategoryIndex(null)}
        title="Select Product Type for this Need"
        description="Choose a preferred product format or leave flexible."
      >
        <div className="grid grid-cols-2 gap-2 py-2">
          <button
            type="button"
            onClick={() => {
              if (editingNeedCategoryIndex !== null) {
                handleUpdateNeedCategory(editingNeedCategoryIndex, null);
              }
            }}
            className="p-3 rounded-button border text-sm text-center focus-ring bg-surface hover:bg-surface-sage/30 border-border text-charcoal col-span-2"
          >
            Any suitable product type (Flexible)
          </button>
          {[
            "face_wash",
            "body_wash",
            "serum",
            "sunscreen",
            "moisturizer",
            "shampoo",
            "conditioner",
            "hair_oil",
            "supplement",
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                if (editingNeedCategoryIndex !== null) {
                  handleUpdateNeedCategory(editingNeedCategoryIndex, cat);
                }
              }}
              className="p-3 rounded-button border text-sm capitalize text-center focus-ring bg-surface hover:bg-surface-sage/30 border-border text-charcoal"
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
