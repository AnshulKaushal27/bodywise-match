"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Camera,
  ArrowRight,
  Warning,
  WarningCircle,
  ArrowsClockwise,
  Sparkle,
  Clock,
  ShieldCheck,
  CaretRight,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  Chip,
  ProgressBar,
  Skeleton,
  Stepper,
  StepItem,
} from "@/components/ui";
import {
  fetchCatalogueGoals,
  parseMatchConcern,
  pingServerHealth,
  GoalItem,
  FALLBACK_CATALOGUE_GOALS,
} from "@/lib/api";

// --- Form Validation Schema ---
const MatchStep1Schema = z
  .object({
    concern: z.string().max(500, "Maximum 500 characters allowed"),
    selectedGoalId: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.concern && data.concern.trim().length >= 3) ||
      Boolean(data.selectedGoalId),
    {
      message: "Please describe what you are looking for or select a goal chip.",
      path: ["concern"],
    }
  );

type MatchStep1Values = z.infer<typeof MatchStep1Schema>;

// Stepper Configuration (Step 1 of 3)
const MATCH_STEPS: StepItem[] = [
  { id: "step-1", label: "Describe concern", description: "Goal & preferences" },
  { id: "step-2", label: "Clarify details", description: "1-2 quick questions" },
  { id: "step-3", label: "Explained matches", description: "Shortlisted options" },
];

// Rotating Placeholder Examples (No treatment claims per Rule 1)
const ROTATING_EXAMPLES = [
  "I want help choosing a body wash for rough, bumpy skin",
  "Looking for an underarm roll-on that controls odor all day without perfume",
  "Need a gentle daily cleanser for dry skin that feels tight after showers",
  "Looking for something to help with visible hairline thinning along my parting",
  "Daily non-greasy sunscreen that doesn't feel heavy or leave white marks",
  "Chewable gummies to support hair strand fullness and daily comfort",
];

// PII Detection Regex (Rule 8)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/;

export default function MatchStep1Page() {
  const router = useRouter();

  // State
  const [goals, setGoals] = React.useState<GoalItem[]>(FALLBACK_CATALOGUE_GOALS);
  const [loadingGoals, setLoadingGoals] = React.useState(true);
  const [selectedGoal, setSelectedGoal] = React.useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

  // Parsing & Server Wake-Up State
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [isServerWakingUp, setIsServerWakingUp] = React.useState(false);
  const [wakeUpCountdown, setWakeUpCountdown] = React.useState(60);

  // Active countdown timer when server is waking up
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isServerWakingUp && isParsing) {
      setWakeUpCountdown(60);
      interval = setInterval(() => {
        setWakeUpCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      setWakeUpCountdown(60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isServerWakingUp, isParsing]);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MatchStep1Values>({
    resolver: zodResolver(MatchStep1Schema),
    defaultValues: {
      concern: "",
      selectedGoalId: "",
    },
    mode: "onChange",
  });

  const concernText = watch("concern") || "";
  const charCount = concernText.length;

  // Real-time client-side PII detection
  const hasEmail = EMAIL_REGEX.test(concernText);
  const hasPhone = PHONE_REGEX.test(concernText);
  const hasPiiWarning = hasEmail || hasPhone;

  // Rotating placeholder interval
  React.useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Restore draft from sessionStorage on mount (never server)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedDraft = sessionStorage.getItem("bodywise_match_draft");
        if (savedDraft) {
          setValue("concern", savedDraft, { shouldValidate: true });
        }
        const savedGoal = sessionStorage.getItem("bodywise_match_goal");
        if (savedGoal) {
          setSelectedGoal(savedGoal);
          setValue("selectedGoalId", savedGoal, { shouldValidate: true });
        }
      } catch {
        // Ignore sessionStorage restrictions if blocked
      }
    }
  }, [setValue]);

  // Persist draft to sessionStorage on change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("bodywise_match_draft", concernText);
      } catch {
        // Ignore
      }
    }
  }, [concernText]);

  // Load catalogue-supported goals from API & warm up sleeping server
  React.useEffect(() => {
    pingServerHealth();
    let isMounted = true;
    async function loadGoals() {
      try {
        const data = await fetchCatalogueGoals();
        if (isMounted && data.length > 0) {
          setGoals(data);
        }
      } finally {
        if (isMounted) setLoadingGoals(false);
      }
    }
    loadGoals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Goal Chip selection
  const handleToggleGoal = (goal: GoalItem) => {
    if (selectedGoal === goal.id) {
      // Deselect
      setSelectedGoal(null);
      setValue("selectedGoalId", "");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bodywise_match_goal");
      }
    } else {
      // Select
      setSelectedGoal(goal.id);
      setValue("selectedGoalId", goal.id, { shouldValidate: true });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bodywise_match_goal", goal.id);
      }
      // If user hasn't typed anything yet, pre-populate text with goal label
      if (!concernText.trim()) {
        const prefill = `I'm looking for a product to support ${goal.label.toLowerCase()}`;
        setValue("concern", prefill, { shouldValidate: true });
      }
    }
  };

  // Form submission: calls /v1/match/parse
  const onSubmit = async (values: MatchStep1Values) => {
    if (hasPiiWarning) return;

    setIsParsing(true);
    setParseError(null);
    setIsServerWakingUp(false);

    // Timeout alert for Render free tier sleep
    const wakeUpTimer = setTimeout(() => {
      setIsServerWakingUp(true);
    }, 4500);

    const inputQuery =
      values.concern.trim() ||
      (selectedGoal
        ? goals.find((g) => g.id === selectedGoal)?.label || ""
        : "");

    try {
      const result = await parseMatchConcern(inputQuery);
      clearTimeout(wakeUpTimer);

      // Persist parsed needs for Step 2 in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bodywise_hybrid_match_session");
        sessionStorage.setItem(
          "bodywise_parsed_needs",
          JSON.stringify(result.parsed_needs)
        );
        if (result.parsed_request) {
          sessionStorage.setItem(
            "bodywise_parsed_request",
            JSON.stringify(result.parsed_request)
          );
        }
        sessionStorage.setItem("bodywise_user_raw_input", inputQuery);
        sessionStorage.setItem("bodywise_request_id", result.request_id);
        sessionStorage.setItem(
          "bodywise_parse_source",
          result.source || (result.strategy === "B" ? "llm" : "rules")
        );
        if (result.fallback_reason) {
          sessionStorage.setItem("bodywise_parse_fallback_reason", result.fallback_reason);
        } else {
          sessionStorage.removeItem("bodywise_parse_fallback_reason");
        }
        if (result.error_category) {
          sessionStorage.setItem("bodywise_parse_error_category", result.error_category);
        } else {
          sessionStorage.removeItem("bodywise_parse_error_category");
        }
      }

      // Navigate to Step 2 (Clarifying questions / summary)
      router.push("/match/confirm");
    } catch (err: unknown) {
      clearTimeout(wakeUpTimer);
      const errMsg =
        err instanceof Error
          ? err.message
          : "We encountered an issue understanding your request. Please try again.";
      setParseError(errMsg);
    } finally {
      setIsParsing(false);
    }
  };

  // Fallback to manual questionnaire if server is asleep or fails
  const handleManualFallback = () => {
    if (typeof window !== "undefined") {
      // Create minimal default parsed needs so user can proceed
      const defaultNeeds = {
        goal: selectedGoal || "gentle_daily_cleansing",
        category: null,
        format_preferences: [],
        avoidances: [],
        routine_context: null,
        uncertainties: [],
        confidence: "medium" as const,
        evidence_text: {
          user_concern: concernText.slice(0, 150),
        },
      };
      sessionStorage.setItem(
        "bodywise_parsed_needs",
        JSON.stringify(defaultNeeds)
      );
      sessionStorage.setItem("bodywise_request_id", "manual-fallback-session");
    }
    router.push("/match/confirm");
  };

  const isContinueDisabled =
    (concernText.trim().length < 3 && !selectedGoal) ||
    hasPiiWarning ||
    isParsing;

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" aria-hidden="true" />
            <span>Back to home</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-brand-deep text-sm hidden sm:inline">
              Bodywise Match
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-3xl mx-auto px-5 py-8 md:py-12 flex-1 w-full">
        {/* Stepper (Step 1 of 3) */}
        <div className="mb-6">
          <Stepper steps={MATCH_STEPS} currentStepIndex={0} />
        </div>

        {/* ProgressBar */}
        <div className="mb-8">
          <ProgressBar value={33} max={100} showLabel />
        </div>

        {/* Card Container */}
        <Card variant="surface" className="p-6 md:p-8 shadow-ambient border border-border rounded-card relative">
          {/* Section Heading */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sage/60 text-xs font-semibold text-brand-deep mb-2">
              <Sparkle className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <span>Step 1 &bull; Concern Intake</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-brand-deep tracking-tight mb-2">
              What would you like help choosing for?
            </h1>
            <p className="text-sm text-charcoal/80 leading-relaxed max-w-[54ch]">
              Describe what you&apos;re looking for in plain language, or pick a goal from our catalogue below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Textarea with Live Counter and Rotating Placeholder */}
            <div>
              <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="concern-input"
                    className="text-xs uppercase tracking-wider font-bold text-brand-deep"
                  >
                    Describe your goal or concern
                  </label>
                  <span
                    id="char-counter"
                    aria-live="polite"
                    className={`text-xs font-medium ${
                      charCount > 450 ? "text-error-text font-bold" : "text-muted"
                    }`}
                  >
                    {charCount}/500
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="concern-input"
                  rows={4}
                  maxLength={500}
                  {...register("concern")}
                  disabled={isParsing}
                  placeholder={ROTATING_EXAMPLES[placeholderIndex]}
                  aria-invalid={Boolean(errors.concern)}
                  aria-describedby={
                    errors.concern
                      ? "concern-error char-counter privacy-note"
                      : "char-counter privacy-note"
                  }
                  className="w-full rounded-button border border-border p-3.5 text-sm md:text-base text-charcoal placeholder:text-muted/65 focus-ring bg-surface transition-colors disabled:opacity-60 resize-y min-h-[110px]"
                />
              </div>

              {errors.concern && (
                <p id="concern-error" className="text-xs text-error-text mt-2 font-medium flex items-center gap-1.5" role="alert">
                  <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="regular" aria-hidden="true" />
                  <span>{errors.concern.message}</span>
                </p>
              )}
            </div>

            {/* Client-side PII Warning Banner */}
            {hasPiiWarning && (
              <div
                role="alert"
                className="p-3.5 rounded-button bg-caution-peach border-l-4 border-caution-text text-caution-text flex items-start gap-3 text-xs md:text-sm"
              >
                <Warning className="w-5 h-5 shrink-0 text-caution-text mt-0.5" weight="regular" aria-hidden="true" />
                <div>
                  <p className="font-bold mb-0.5">Privacy Notice: Contact information detected</p>
                  <p>
                    We noticed an email address or phone number in your text. We strictly never store personal contact info or medical records. Please remove it before continuing.
                  </p>
                </div>
              </div>
            )}

            {/* "Or pick a goal" Chips (Catalogue-Supported Only) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase tracking-wider font-bold text-brand-deep">
                  Or pick a goal (catalogue-supported)
                </span>
                {selectedGoal && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGoal(null);
                      setValue("selectedGoalId", "");
                      if (typeof window !== "undefined") {
                        sessionStorage.removeItem("bodywise_match_goal");
                      }
                    }}
                    className="text-xs text-brand-evergreen hover:underline focus-ring rounded"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {loadingGoals ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-9 w-40 rounded-full" />
                  <Skeleton className="h-9 w-32 rounded-full" />
                  <Skeleton className="h-9 w-48 rounded-full" />
                  <Skeleton className="h-9 w-36 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Supported Goals">
                  {goals.map((g) => {
                    const isSelected = selectedGoal === g.id;
                    return (
                      <Chip
                        key={g.id}
                        selected={isSelected}
                        onSelectChange={() => handleToggleGoal(g)}
                        className="text-xs md:text-sm"
                      >
                        {g.label}
                      </Chip>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Photo Button (DISABLED in MVP per Rule 5 with Tooltip/Note) */}
            <div className="pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative group inline-block">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-describedby="photo-tooltip"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-button text-xs font-semibold border border-border/80 bg-surface text-muted cursor-not-allowed opacity-60 min-h-[44px]"
                  >
                    <Camera className="w-4 h-4 text-muted" aria-hidden="true" />
                    <span>Add a photo (optional)</span>
                  </button>
                  <p id="photo-tooltip" className="text-[11px] text-muted mt-1 font-medium">
                    Coming later. Text works fully today.
                  </p>
                </div>

                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
                  <span>Your draft is saved in this browser only</span>
                </div>
              </div>
            </div>

            {/* Parsing / Skeleton State */}
            {isParsing && (
              <div
                role="status"
                aria-live="polite"
                className="p-5 rounded-button bg-surface-sage/30 border border-brand-evergreen/20 space-y-3"
              >
                <div className="flex items-center gap-2.5 text-brand-deep font-semibold text-sm">
                  <ArrowsClockwise className="w-4 h-4 animate-spin text-brand-evergreen" weight="regular" aria-hidden="true" />
                  <span>Understanding your request...</span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
            )}

            {/* Server Wake-Up Notice with Countdown (Render Free Tier resilience) */}
            {isServerWakingUp && isParsing && (
              <div
                role="alert"
                aria-live="polite"
                className="p-4 rounded-button bg-surface-sage border border-brand-deep/20 text-brand-deep text-xs md:text-sm space-y-3 animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-brand-evergreen shrink-0 mt-0.5 animate-pulse" weight="regular" aria-hidden="true" />
                  <div>
                    <p className="font-bold">
                      Waking up our server, this can take up to a minute ({wakeUpCountdown}s)
                    </p>
                    <p className="text-charcoal/80 text-xs mt-0.5 leading-relaxed">
                      Our cloud service is spinning up from cold sleep. Your draft is kept safely right here on this device.
                    </p>
                  </div>
                </div>

                {/* Progress bar of countdown */}
                <div className="w-full bg-surface/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-evergreen h-1.5 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((60 - wakeUpCountdown) / 60) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-evergreen text-white hover:bg-brand-deep focus-ring min-h-[44px] active:scale-[0.98] motion-safe:transition-transform"
                  >
                    <ArrowsClockwise className="w-3.5 h-3.5" weight="regular" aria-hidden="true" />
                    <span>Retry now</span>
                  </button>
                  <span className="text-border" aria-hidden="true">&bull;</span>
                  <button
                    type="button"
                    onClick={handleManualFallback}
                    className="text-xs font-semibold text-brand-deep underline hover:text-brand-evergreen focus-ring rounded py-2 min-h-[44px] active:scale-[0.98] motion-safe:transition-transform"
                  >
                    Continue with manual questions instead &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Error State Banner */}
            {parseError && !isParsing && (
              <div
                role="alert"
                className="p-4 rounded-button bg-error-bg border border-error-text/30 text-error-text text-xs md:text-sm space-y-2"
              >
                <div className="flex items-start gap-2">
                  <Warning className="w-4 h-4 shrink-0 mt-0.5" weight="regular" aria-hidden="true" />
                  <p className="font-semibold">{parseError}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    className="text-xs font-bold underline hover:opacity-80"
                  >
                    Try again
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={handleManualFallback}
                    className="text-xs font-bold underline hover:opacity-80"
                  >
                    Proceed manually
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={isContinueDisabled}
                className="w-full sm:w-auto font-semibold text-base px-8 h-12 shadow-ambient min-w-[160px] active:scale-[0.98] motion-safe:transition-transform"
              >
                {isParsing ? "Reading your request..." : "Continue"}
                <ArrowRight className="ml-2 w-4 h-4" weight="bold" aria-hidden="true" />
              </Button>

              <Link
                href="/products"
                className="text-sm font-semibold text-brand-evergreen hover:underline focus-ring px-2 py-1.5 rounded inline-flex items-center gap-1 active:scale-[0.98] motion-safe:transition-transform"
              >
                <span>Skip and browse all products</span>
                <CaretRight className="w-4 h-4" weight="bold" aria-hidden="true" />
              </Link>
            </div>

            {/* Required Safety & Privacy Note */}
            <p
              id="privacy-note"
              className="text-xs text-muted text-center pt-2 leading-relaxed"
            >
              Please don&apos;t include your name, phone number or medical history.
            </p>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Independent prototype for a fellowship challenge; not an official Be Bodywise service.</p>
      </footer>
    </div>
  );
}
