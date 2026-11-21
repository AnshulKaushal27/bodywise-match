"use client";

import * as React from "react";
import {
  ChatCircleText,
  ArrowRight,
  Info,
  CheckCircle,
  CaretRight,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { useMatchSession } from "@/lib/matchSessionContext";
import { fetchNextSessionQuestion, SelectNextQuestionResult } from "@/lib/api";
import { formatCategoryLabel } from "@bodywise/shared";
import { Button, Card } from "@/components/ui";

interface GuidedQuestionCardProps {
  candidateCount: number;
  onSeeMatches: () => void;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function GuidedQuestionCard({
  candidateCount,
  onSeeMatches,
  triggerButtonRef,
}: GuidedQuestionCardProps) {
  const { state, dispatch, setIsChatOpen } = useMatchSession();
  const [questionData, setQuestionData] = React.useState<SelectNextQuestionResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastAnswerSource, setLastAnswerSource] = React.useState<string | null>(null);

  // Load next question whenever session state changes
  React.useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetchNextSessionQuestion(state).then((res) => {
      if (!isCancelled) {
        setQuestionData(res);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [state]);

  // Track if recent answer was from chat
  React.useEffect(() => {
    const lastEvent = state.eventLog[state.eventLog.length - 1];
    if (lastEvent && lastEvent.type === "APPLY_PATCH" && lastEvent.source === "chat") {
      setLastAnswerSource("chat");
      const t = setTimeout(() => setLastAnswerSource(null), 3000);
      return () => clearTimeout(t);
    }
  }, [state.eventLog]);

  const handleSelectOption = (option: { id: string; value: unknown; label: string; isAny?: boolean }) => {
    if (!questionData || questionData.done || !questionData.facet) return;

    dispatch({
      type: "ANSWER_QUESTION",
      facetId: questionData.facet,
      value: option.value,
      label: option.label,
      source: "question",
    });
  };

  const handleSkipQuestion = () => {
    if (!questionData || questionData.done || !questionData.facet) return;

    dispatch({
      type: "ANSWER_QUESTION",
      facetId: questionData.facet,
      value: null,
      label: "Skipped",
      source: "question",
    });
  };

  // Derive summary of already known slots for header right-side chips (Humanized, Section D.1)
  const knownSummary: string[] = [];
  if (state.slots.product_type.value && state.slots.product_type.status === "confirmed") {
    knownSummary.push(formatCategoryLabel(state.slots.product_type.value));
  }
  if (state.slots.body_area.value && state.slots.body_area.status === "confirmed" && state.slots.body_area.source !== "derived") {
    knownSummary.push(state.slots.body_area.value === "face" ? "Face" : state.slots.body_area.value === "body" ? "Body" : state.slots.body_area.value);
  }
  if (state.slots.frequency.value && state.slots.frequency.status === "confirmed") {
    knownSummary.push(state.slots.frequency.value === "daily" ? "Daily" : "Occasional");
  }
  if (state.slots.time_of_day.value && state.slots.time_of_day.status === "confirmed") {
    const tod = state.slots.time_of_day.value;
    knownSummary.push(tod === "morning" ? "Morning" : tod === "night" ? "Evening" : "Day & night");
  }

  const questionNum = Math.min(state.questionCount + 1, 3);
  const isCapReached = state.questionCount >= 3 || (questionData && questionData.done);

  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5 rounded-card border border-border shadow-ambient">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-evergreen">
            {isCapReached ? "Questions complete" : `Quick question ${questionNum} of up to 3`}
          </span>
          {lastAnswerSource === "chat" && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-deep bg-accent-lime/40 px-2 py-0.5 rounded-full">
              <Sparkle className="w-3 h-3 text-brand-evergreen" weight="fill" />
              <span>Answered in chat</span>
            </span>
          )}
        </div>

        {/* Read-only Already Known Chips */}
        {knownSummary.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted overflow-x-auto py-0.5">
            <span className="shrink-0 font-medium text-[11px]">Already know:</span>
            {knownSummary.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-full bg-surface-sage border border-border text-[11px] font-semibold text-brand-deep capitalize shrink-0"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="h-4 w-40 bg-border/60 animate-pulse rounded" />
          <div className="h-6 w-3/4 bg-border/60 animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <div className="h-12 bg-border/40 animate-pulse rounded-button" />
            <div className="h-12 bg-border/40 animate-pulse rounded-button" />
          </div>
        </div>
      ) : isCapReached ? (
        <div className="p-5 rounded-button bg-surface-sage/50 border border-border text-center sm:text-left space-y-3">
          <div className="flex items-center gap-2 text-brand-evergreen font-bold text-base">
            <CheckCircle className="w-5 h-5 text-brand-evergreen shrink-0" weight="fill" />
            <span>You're all set!</span>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            We have enough details to match products tailored to your preferences.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="default"
              onClick={onSeeMatches}
              disabled={candidateCount === 0}
              className="w-full sm:w-auto min-h-[44px]"
              aria-label="See top matches"
            >
              <span>See top matches</span>
              <ArrowRight className="w-4 h-4 ml-1.5" weight="bold" />
            </Button>
          </div>
        </div>
      ) : questionData && questionData.question ? (
        <div className="space-y-4">
          {/* Question Title */}
          <h3
            tabIndex={-1}
            className="text-lg sm:text-xl font-display font-bold text-brand-deep leading-snug"
          >
            {questionData.question}
          </h3>

          {/* Why We're Asking Line */}
          {questionData.whyAsking && (
            <p className="text-xs text-muted flex items-start sm:items-center gap-2 bg-surface-sage/40 p-3 rounded-button border border-border leading-relaxed">
              <Info className="w-4 h-4 text-brand-evergreen shrink-0 mt-0.5 sm:mt-0" weight="regular" />
              <span>{questionData.whyAsking}</span>
            </p>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {questionData.options?.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`p-3.5 rounded-button border text-left text-sm font-semibold transition-all min-h-[48px] flex items-center justify-between gap-2 ${
                  opt.isAny
                    ? "bg-surface-sage/30 border-border text-muted hover:bg-surface-sage/60 hover:text-charcoal"
                    : "bg-paper border-border text-charcoal hover:border-brand-evergreen hover:bg-surface-sage/20 hover:shadow-xs"
                } focus-ring`}
              >
                <span>{opt.label}</span>
                <CaretRight className="w-4 h-4 text-muted shrink-0" weight="regular" />
              </button>
            ))}
          </div>

          {/* Skip / Not sure link */}
          <div className="pt-1 flex items-center justify-between text-xs text-muted">
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="hover:underline hover:text-charcoal min-h-[44px] py-2 inline-flex items-center focus-ring rounded"
            >
              Skip this question
            </button>
          </div>
        </div>
      ) : null}

      {/* Action Footer: Primary & Secondary Buttons */}
      <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Secondary: Prefer to type? Chat instead */}
        <button
          ref={triggerButtonRef as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-button border border-brand-evergreen/40 text-brand-evergreen bg-paper hover:bg-surface-sage font-semibold text-sm transition-colors min-h-[44px] focus-ring order-2 sm:order-1"
        >
          <ChatCircleText className="w-4 h-4" weight="regular" />
          <span>Prefer to type? Chat instead</span>
        </button>

        {/* Primary: See N matches (ALWAYS VISIBLE) */}
        <Button
          variant="primary"
          size="default"
          onClick={onSeeMatches}
          disabled={candidateCount === 0}
          className="min-h-[44px] order-1 sm:order-2"
          aria-label={`See ${candidateCount} ${candidateCount === 1 ? "match" : "matches"}`}
        >
          <span>See {candidateCount} {candidateCount === 1 ? "match" : "matches"}</span>
          <ArrowRight className="w-4 h-4 ml-1.5" weight="bold" />
        </Button>
      </div>
    </Card>
  );
}
