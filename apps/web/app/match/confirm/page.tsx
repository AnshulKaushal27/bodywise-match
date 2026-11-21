"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Stepper,
  StepItem,
} from "@/components/ui";
import {
  MatchSessionProvider,
  useMatchSession,
} from "@/lib/matchSessionContext";
import { UnderstandingCard } from "@/components/match/UnderstandingCard";
import { GuidedQuestionCard } from "@/components/match/GuidedQuestionCard";
import { LivePreview } from "@/components/match/LivePreview";
import { getCandidateFamiliesForSession, DEMO_CATALOGUE_SEED } from "@bodywise/shared";

const MATCH_STEPS: StepItem[] = [
  { id: "step-1", label: "Describe concern", description: "Goal & preferences" },
  { id: "step-2", label: "Clarify details", description: "1-2 quick questions" },
  { id: "step-3", label: "Explained matches", description: "Shortlisted options" },
];

function MatchConfirmInner() {
  const router = useRouter();
  const { state, undo, toastMessage, dismissToast } = useMatchSession();
  const [isMisunderstoodOpen, setIsMisunderstoodOpen] = React.useState(false);
  const [rewriteQuery, setRewriteQuery] = React.useState("");
  const [parseSource, setParseSource] = React.useState<"llm" | "rules">("rules");
  const [fallbackReason, setFallbackReason] = React.useState<string | null>(null);

  const chatTriggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Read parse source and fallback reason from storage on mount
  React.useEffect(() => {
    try {
      const src = sessionStorage.getItem("bodywise_parse_source");
      if (src === "llm" || src === "rules") {
        setParseSource(src);
      }
      const reason = sessionStorage.getItem("bodywise_parse_fallback_reason");
      if (reason) setFallbackReason(reason);
    } catch {
      // Storage unavailable in current environment
    }
  }, []);

  // Compute live candidate family count via Single Shared Engine
  const candidateFamilies = React.useMemo(() => {
    return getCandidateFamiliesForSession(state, DEMO_CATALOGUE_SEED);
  }, [state]);

  const candidateCount = candidateFamilies.length;

  const handleSeeMatches = () => {
    // Navigate to step 3 (/match/results)
    router.push("/match/results");
  };

  const handleMisunderstoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewriteQuery.trim()) return;

    sessionStorage.setItem("bodywise_user_raw_input", rewriteQuery);
    setIsMisunderstoodOpen(false);
    // Restart match flow with rewritten query
    router.push("/match");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between pb-24 lg:pb-12">
      {/* Header */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-charcoal focus-ring px-2 py-1 rounded-lg min-h-[44px]"
            aria-label="Back to concern input"
          >
            <ArrowLeft className="w-4 h-4" weight="bold" />
            <span className="hidden sm:inline">Back to concern</span>
          </Link>

          <span className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
            Bodywise Match
          </span>

          <div className="flex items-center gap-2" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {/* Stepper (Step 2 Active) */}
        <div className="mb-6 sm:mb-8">
          <Stepper steps={MATCH_STEPS} currentStepIndex={1} />
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Understanding Card + Guided Question Card */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Understanding Card */}
            <UnderstandingCard
              onMisunderstood={() => setIsMisunderstoodOpen(true)}
              parseSource={parseSource}
              fallbackReason={fallbackReason}
            />

            {/* 2. Primary Guided Question Card */}
            <GuidedQuestionCard
              candidateCount={candidateCount}
              onSeeMatches={handleSeeMatches}
              triggerButtonRef={chatTriggerRef}
            />
          </div>

          {/* Right Column: Sticky Live Preview */}
          <div className="lg:col-span-4">
            <LivePreview
              onSeeMatches={handleSeeMatches}
              candidateCount={candidateCount}
            />
          </div>
        </div>
      </main>

      {/* Undo Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-paper px-4 py-2.5 rounded-xl shadow-lg border border-border flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={undo}
            className="font-bold text-accent-lime hover:underline px-1.5 py-0.5 rounded focus-ring"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={dismissToast}
            className="text-muted hover:text-paper p-1 rounded min-h-[32px] min-w-[32px] flex items-center justify-center focus-ring"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" weight="bold" />
          </button>
        </div>
      )}

      {/* "You misunderstood me" Modal */}
      {isMisunderstoodOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rewrite your concern"
          className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-paper rounded-card max-w-md w-full p-6 border border-border shadow-modal space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display font-bold text-charcoal text-base">
                Let's get this right
              </h3>
              <button
                type="button"
                onClick={() => setIsMisunderstoodOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-charcoal min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Describe your goal or routine in your own words. We will re-analyze your needs from scratch.
            </p>

            <form onSubmit={handleMisunderstoodSubmit} className="space-y-4">
              <textarea
                value={rewriteQuery}
                onChange={(e) => setRewriteQuery(e.target.value)}
                placeholder="e.g. I need a gentle daily moisturizer for dry skin with no fragrance..."
                rows={3}
                className="w-full p-3 rounded-button border border-border bg-surface text-charcoal text-sm placeholder:text-muted focus-ring leading-relaxed"
                aria-label="Rewritten goal description"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMisunderstoodOpen(false)}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!rewriteQuery.trim()}
                  className="min-h-[44px]"
                >
                  <span>Re-analyze</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchConfirmPage() {
  return (
    <MatchSessionProvider>
      <MatchConfirmInner />
    </MatchSessionProvider>
  );
}
