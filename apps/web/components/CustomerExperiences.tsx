"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChatCircleDots,
  Warning,
  Info,
  CheckCircle,
  MinusCircle,
  XCircle,
  Clock,
  ArrowClockwise,
  Flag,
  Sparkle,
} from "@phosphor-icons/react";
import {
  CustomerExperienceRecord,
  getPublishedExperiencesForProduct,
} from "@bodywise/shared";
import { DemoBadge, EmptyState, Dialog } from "@/components/ui";

interface CustomerExperiencesProps {
  productSlug: string;
  productId?: string;
  productName: string;
  initialExperiences?: CustomerExperienceRecord[];
}

export function CustomerExperiences({
  productSlug,
  productId: _productId,
  productName: _productName,
  initialExperiences,
}: CustomerExperiencesProps) {
  // Get filtered experiences: ONLY published AND publication_consent === true
  const experiences = React.useMemo(() => {
    if (initialExperiences) {
      return initialExperiences.filter(
        (exp) =>
          exp.moderation_status === "published" &&
          exp.publication_consent === true
      );
    }
    return getPublishedExperiencesForProduct(productSlug);
  }, [initialExperiences, productSlug]);

  const totalCount = experiences.length;

  // Report modal state
  const [reportingExpId, setReportingExpId] = React.useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = React.useState<boolean>(false);

  // Compute date range if any
  const dateRangeStr = React.useMemo(() => {
    if (experiences.length === 0) return "Recent";
    const dates = experiences
      .map((e) => new Date(e.created_at).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);
    if (dates.length === 0) return "Recent";
    const earliest = new Date(dates[0]).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const latest = new Date(dates[dates.length - 1]).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    return earliest === latest ? earliest : `${earliest} – ${latest}`;
  }, [experiences]);

  // Aggregate 3 columns: Positive, Neutral, Negative (NOT star scores!)
  const breakdown = React.useMemo(() => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const exp of experiences) {
      if (exp.comfort_reaction === "stopped using" || exp.self_reported_outcome === "worse") {
        negative++;
      } else if (exp.self_reported_outcome === "better") {
        positive++;
      } else {
        // 'no change' or 'not sure'
        neutral++;
      }
    }

    const posPct = totalCount > 0 ? Math.round((positive / totalCount) * 100) : 0;
    const neuPct = totalCount > 0 ? Math.round((neutral / totalCount) * 100) : 0;
    const negPct = totalCount > 0 ? Math.round((negative / totalCount) * 100) : 0;

    return { positive, neutral, negative, posPct, neuPct, negPct };
  }, [experiences, totalCount]);

  const sourceName = experiences[0]?.source || "Beta User Cohort";

  return (
    <section
      aria-labelledby="customer-experiences-heading"
      className="p-6 md:p-8 rounded-card bg-surface border border-border shadow-sm space-y-6"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <ChatCircleDots className="w-5 h-5 text-brand-evergreen" aria-hidden="true" />
          <h2
            id="customer-experiences-heading"
            className="font-display font-bold text-lg md:text-xl text-brand-deep"
          >
            Customer experiences
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge />
          <Link
            href={`/feedback/experience?slug=${encodeURIComponent(productSlug)}`}
            className="text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-1.5 py-1 rounded"
          >
            Share your experience &rarr;
          </Link>
        </div>
      </div>

      {/* Mandatory Experience Banner */}
      <div className="p-3.5 rounded-button bg-surface-sage/35 border border-border flex items-start gap-2.5 text-xs text-charcoal/90">
        <Info className="w-4 h-4 text-brand-evergreen shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Transparency Notice:</strong> Self-reported experiences are not proof a product works and may differ for you. We show unfiltered feedback and trade-offs rather than curated star ratings or promotional claims.
        </p>
      </div>

      {/* Header Meta: "Self-reported by N customers, source, date range" */}
      <div className="text-xs md:text-sm text-muted font-medium flex items-center flex-wrap gap-x-2 gap-y-1">
        <span>
          Self-reported by <strong className="text-brand-deep font-bold">{totalCount}</strong>{" "}
          {totalCount === 1 ? "customer" : "customers"}
        </span>
        <span>&bull;</span>
        <span>Source: <strong className="text-charcoal font-semibold">{sourceName}</strong></span>
        <span>&bull;</span>
        <span>Date range: <strong className="text-charcoal font-semibold">{dateRangeStr}</strong></span>
      </div>

      {/* ================= CONDITIONAL BODY STATES ================= */}
      {totalCount === 0 ? (
        /* N = 0: EmptyState "No verified community data yet." */
        <div className="py-8 px-4 rounded-button bg-paper border border-border text-center">
          <EmptyState
            title="No verified community data yet."
            description="Be the first to share your experience with this product. All submitted reports undergo verification before publication."
          />
          <div className="mt-5 flex justify-center">
            <Link
              href={`/feedback/experience?slug=${encodeURIComponent(productSlug)}`}
              className="inline-flex items-center gap-2 text-xs font-bold bg-brand-evergreen text-surface hover:bg-brand-deep px-4 py-2 rounded-full focus-ring transition-colors shadow-sm"
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span>Share your experience</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* N >= 5 vs N < 5 */}
          {totalCount >= 5 ? (
            /* Three columns/bars for positive, neutral, negative built with native SVG/CSS (NOT star scores!) */
            <div className="p-4 md:p-5 rounded-button bg-paper border border-border space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Self-Reported Outcome Summary (N = {totalCount})
                </span>
                <span className="text-[11px] text-muted italic">
                  {totalCount < 10
                    ? "Zero star scores • Confirmed trend requires min 10 consented reports"
                    : "Zero star scores • Minimum 10 consented reports met"}
                </span>
              </div>

              {/* Native CSS / SVG 3-Segment Progress Bar */}
              <div
                className="w-full h-4 rounded-full overflow-hidden flex bg-border/40 shadow-inner"
                role="progressbar"
                aria-label="Community outcome distribution"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={breakdown.posPct}
              >
                {breakdown.positive > 0 && (
                  <div
                    style={{ width: `${breakdown.posPct}%` }}
                    className="bg-brand-evergreen transition-all"
                    title={`Positive: ${breakdown.positive} (${breakdown.posPct}%)`}
                  />
                )}
                {breakdown.neutral > 0 && (
                  <div
                    style={{ width: `${breakdown.neuPct}%` }}
                    className="bg-surface-sage border-x border-surface transition-all"
                    title={`Neutral: ${breakdown.neutral} (${breakdown.neuPct}%)`}
                  />
                )}
                {breakdown.negative > 0 && (
                  <div
                    style={{ width: `${breakdown.negPct}%` }}
                    className="bg-caution-text transition-all"
                    title={`Negative: ${breakdown.negative} (${breakdown.negPct}%)`}
                  />
                )}
              </div>

              {/* 3 Native Columns with Counts and Explanations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Positive Column */}
                <div className="p-3 rounded-button bg-surface border border-border flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-base text-brand-deep">
                        {breakdown.positive}
                      </span>
                      <span className="text-xs text-muted">({breakdown.posPct}%)</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-deep block mt-0.5">
                      Positive
                    </span>
                    <span className="text-[11px] text-muted leading-tight block">
                      Noticed intended improvement
                    </span>
                  </div>
                </div>

                {/* Neutral Column */}
                <div className="p-3 rounded-button bg-surface border border-border flex items-start gap-2.5">
                  <MinusCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" weight="regular" />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-base text-brand-deep">
                        {breakdown.neutral}
                      </span>
                      <span className="text-xs text-muted">({breakdown.neuPct}%)</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-deep block mt-0.5">
                      Neutral
                    </span>
                    <span className="text-[11px] text-muted leading-tight block">
                      No change or too early
                    </span>
                  </div>
                </div>

                {/* Negative Column */}
                <div className="p-3 rounded-button bg-surface border border-border flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-caution-text shrink-0 mt-0.5" weight="regular" />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-base text-caution-text">
                        {breakdown.negative}
                      </span>
                      <span className="text-xs text-muted">({breakdown.negPct}%)</span>
                    </div>
                    <span className="text-xs font-semibold text-caution-text block mt-0.5">
                      Negative
                    </span>
                    <span className="text-[11px] text-muted leading-tight block">
                      Worse outcome or stopped
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* N < 5: "Too few reports to summarise" */
            <div className="p-4 rounded-button bg-paper border border-border flex items-center gap-3 text-xs md:text-sm text-charcoal/85">
              <Warning className="w-4 h-4 text-muted shrink-0" weight="regular" aria-hidden="true" />
              <div>
                <strong className="font-bold text-brand-deep block">
                  Too few reports to summarise
                </strong>
                <span className="text-muted text-xs">
                  We require at least 5 moderated community submissions before generating aggregate outcome breakdown bars. Individual verified cards are shown below.
                </span>
              </div>
            </div>
          )}

          {/* List of Individual Experience Cards */}
          <div className="space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block">
              Moderated Customer Reports ({experiences.length})
            </span>

            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="p-4 sm:p-5 rounded-button bg-paper border border-border space-y-3 transition-colors hover:border-brand-evergreen/40"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Demo data badge in lime per Rule 4 */}
                    <DemoBadge />

                    {/* Outcome Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        exp.self_reported_outcome === "better"
                          ? "bg-surface-sage text-brand-deep"
                          : exp.self_reported_outcome === "worse"
                          ? "bg-caution-peach text-caution-text"
                          : "bg-surface text-charcoal border border-border"
                      }`}
                    >
                      Outcome: {exp.self_reported_outcome}
                    </span>

                    {/* Comfort / Reaction Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        exp.comfort_reaction === "no issue"
                          ? "bg-surface text-muted border border-border"
                          : exp.comfort_reaction === "stopped using"
                          ? "bg-caution-peach text-caution-text font-bold"
                          : "bg-caution-peach/60 text-caution-text"
                      }`}
                    >
                      Comfort: {exp.comfort_reaction}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted">
                    {exp.created_at}
                  </span>
                </div>

                {/* Duration & Usage consistency info */}
                <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
                    <span>Duration: <strong className="text-charcoal font-semibold">{exp.duration_bucket}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ArrowClockwise className="w-3.5 h-3.5 text-brand-evergreen" weight="regular" />
                    <span>Usage: <strong className="text-charcoal font-semibold">{exp.usage_consistency}</strong></span>
                  </span>
                </div>

                {/* Moderated Text Snippet */}
                {exp.moderated_text && (
                  <p className="text-xs sm:text-sm text-charcoal leading-relaxed italic bg-surface p-3 rounded border border-border/70">
                    “{exp.moderated_text}”
                  </p>
                )}

                {/* Card Footer: "Report this" action */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted">
                  <span>Verified submission &bull; Identity anonymous</span>

                  <button
                    type="button"
                    onClick={() => setReportingExpId(exp.id)}
                    className="inline-flex items-center gap-1 text-muted hover:text-error-text underline focus-ring py-0.5 px-1 rounded"
                  >
                    <Flag className="w-3 h-3" weight="regular" />
                    <span>Report this</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Report Modal Dialog */}
      <Dialog
        isOpen={Boolean(reportingExpId)}
        onClose={() => {
          setReportingExpId(null);
          setReportSubmitted(false);
        }}
        title="Report Customer Submission"
        description="Flag a report that appears suspicious, abusive, promotional, or contains personal medical information."
      >
        {reportSubmitted ? (
          <div className="text-center py-4 space-y-2">
            <CheckCircle className="w-8 h-8 text-brand-evergreen mx-auto" weight="regular" />
            <h4 className="font-display font-bold text-brand-deep text-sm">
              Thank you for reporting
            </h4>
            <p className="text-xs text-muted">
              Our moderation team will review this report against our honesty and privacy standards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-charcoal/80">
              Why are you flagging this customer experience?
            </p>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded bg-paper cursor-pointer hover:bg-surface-sage/30">
                <input type="radio" name="report-reason" defaultChecked className="text-brand-evergreen" />
                <span>Suspected fake or sponsored promotional language</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-paper cursor-pointer hover:bg-surface-sage/30">
                <input type="radio" name="report-reason" className="text-brand-evergreen" />
                <span>Makes medical or diagnostic curative claims</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-paper cursor-pointer hover:bg-surface-sage/30">
                <input type="radio" name="report-reason" className="text-brand-evergreen" />
                <span>Abusive, offensive, or contains personal data</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingExpId(null)}
                className="px-3 py-1.5 text-xs text-muted hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setReportSubmitted(true)}
                className="px-4 py-1.5 text-xs font-bold bg-brand-evergreen text-surface rounded-full hover:bg-brand-deep"
              >
                Submit flag
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
