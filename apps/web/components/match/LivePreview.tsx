"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, Sparkle, WarningCircle, Trash, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { useMatchSession } from "@/lib/matchSessionContext";
import { fetchSessionPreview, PreviewFamily } from "@/lib/api";
import { Button, Card } from "@/components/ui";

interface LivePreviewProps {
  onSeeMatches: () => void;
  candidateCount: number;
}

export function LivePreview({ onSeeMatches, candidateCount }: LivePreviewProps) {
  const { state, dispatch } = useMatchSession();
  const [topFamilies, setTopFamilies] = React.useState<PreviewFamily[]>([]);
  const [canExploreOther, setCanExploreOther] = React.useState<boolean>(false);
  const [unmatchedBenefit, setUnmatchedBenefit] = React.useState<string | null>(null);

  // Animated shortlist count transition (Effect 6)
  const [displayCount, setDisplayCount] = React.useState(candidateCount);
  React.useEffect(() => {
    if (displayCount === candidateCount) return;
    const diff = candidateCount - displayCount;
    const step = diff > 0 ? 1 : -1;
    const timer = setTimeout(() => {
      setDisplayCount((prev) => prev + step);
    }, 40);
    return () => clearTimeout(timer);
  }, [candidateCount, displayCount]);

  React.useEffect(() => {
    let isCancelled = false;

    fetchSessionPreview(state).then((res) => {
      if (!isCancelled) {
        setTopFamilies(res.familiesTop);
        setCanExploreOther(Boolean(res.canExploreOtherCategories));
        setUnmatchedBenefit(res.unmatchedBenefit || null);

        try {
          sessionStorage.setItem("bodywise_preview_state_hash", res.stateHash);
          sessionStorage.setItem("bodywise_preview_count", String(res.count));
        } catch {
          // Storage fallback
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [state]);

  const isZero = candidateCount === 0;

  // Identify most restrictive chip when zero matches
  let limitingChipKey: string | null = null;
  let limitingChipLabel: string | null = null;
  if (isZero) {
    if (state.slots.fragrance_pref.value === "free_only") {
      limitingChipKey = "fragrance_pref";
      limitingChipLabel = "Fragrance-free";
    } else if (state.slots.format.value) {
      limitingChipKey = "format";
      limitingChipLabel = `Format: ${state.slots.format.value}`;
    } else if (state.slots.time_of_day.value && state.slots.time_of_day.value !== "any") {
      limitingChipKey = "time_of_day";
      limitingChipLabel = `Time: ${state.slots.time_of_day.value}`;
    }
  }

  const handleRemoveLimitingChip = () => {
    if (limitingChipKey) {
      dispatch({ type: "REMOVE_CHIP", slotKey: limitingChipKey as "fragrance_pref" | "format" | "time_of_day" });
    }
  };

  const handleClearCategoryFilter = () => {
    dispatch({ type: "REMOVE_CHIP", slotKey: "product_type" });
  };

  return (
    <>
      {/* Desktop Sticky Sidebar (>= 1024px) */}
      <div className="hidden lg:block sticky top-20 space-y-4">
        <Card variant="surface" className="p-5 rounded-card border border-border shadow-ambient space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkle className="w-4 h-4 text-brand-evergreen" weight="fill" />
              <h3 className="font-display font-bold text-brand-deep text-base">
                Live Shortlist
              </h3>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-sage text-brand-deep border border-border transition-all duration-150 inline-block"
              aria-live="polite"
            >
              {displayCount} {displayCount === 1 ? "product fits" : "products fit"}
            </span>
          </div>

          {/* Benefit Not Specifically Described Alert & Alternative Exploration (Rule 4) */}
          {canExploreOther && unmatchedBenefit && (
            <div className="p-3.5 rounded-button bg-surface-sage/60 border border-border text-xs text-charcoal space-y-2">
              <p className="leading-relaxed">
                <strong>In-category options:</strong> None of our current products in this category specifically claim &ldquo;{unmatchedBenefit}&rdquo;. We show reliable all-round options below.
              </p>
              <button
                type="button"
                onClick={handleClearCategoryFilter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-paper border border-brand-evergreen/40 text-brand-evergreen font-semibold hover:bg-surface-sage transition-colors text-xs min-h-[44px] focus-ring"
              >
                <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" />
                <span>Also see other product types for {unmatchedBenefit}</span>
              </button>
            </div>
          )}

          {/* Zero candidates state */}
          {isZero ? (
            <div className="p-4 rounded-button bg-error-bg/20 border border-error-text/30 space-y-3 text-xs text-charcoal">
              <div className="flex items-center gap-1.5 font-bold text-error-text">
                <WarningCircle className="w-4 h-4 shrink-0" weight="bold" />
                <span>No products fit all filters</span>
              </div>
              <p className="text-muted leading-relaxed">
                Relaxing one preference will unlock matching formulas.
              </p>
              {limitingChipLabel && (
                <button
                  type="button"
                  onClick={handleRemoveLimitingChip}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-button bg-paper border border-error-text/30 text-error-text font-semibold hover:bg-error-bg/10 transition-colors min-h-[44px] focus-ring"
                >
                  <Trash className="w-3.5 h-3.5" weight="regular" />
                  <span>Remove {limitingChipLabel}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Top candidates updating live:
              </p>

              <div className="space-y-2.5">
                {topFamilies.map((fam, idx) => (
                  <div
                    key={fam.familyId}
                    className="p-3 rounded-button bg-paper border border-border hover:border-brand-evergreen/40 flex items-center gap-3 transition-colors shadow-2xs"
                  >
                    {/* Explicitly numbered from 1 (Section C.5) */}
                    <span className="text-xs font-bold text-brand-deep w-4 shrink-0">
                      {idx + 1}.
                    </span>

                    <div className="w-10 h-10 rounded-button bg-surface-sage border border-border flex items-center justify-center text-brand-evergreen shrink-0 overflow-hidden relative">
                      {fam.imageUrl ? (
                        <Image
                          src={fam.imageUrl}
                          alt={fam.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold uppercase">
                          {fam.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-charcoal truncate">
                        {fam.name}
                      </h4>
                      <p className="text-[11px] text-muted">
                        <span className="font-medium text-brand-evergreen">{fam.categoryLabel || fam.category}</span>
                        {fam.benefitsCovered && fam.benefitsCovered.length > 0 && (
                          <span> &bull; {fam.benefitsCovered[0]}</span>
                        )}
                        {fam.notSpecificallyDescribed && (
                          <span className="text-caution-text"> &bull; Not specifically described</span>
                        )}
                      </p>
                    </div>
                    {fam.priceInr !== null && fam.priceInr !== undefined && (
                      <span className="text-xs font-bold text-charcoal shrink-0">
                        ₹{fam.priceInr}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button (Section C.3) */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="default"
              onClick={onSeeMatches}
              disabled={isZero}
              className="w-full min-h-[44px]"
              aria-label="See top matches"
            >
              <span>See top matches</span>
              <ArrowRight className="w-4 h-4 ml-1.5" weight="bold" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Mobile Sticky Bottom Bar (< 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border p-3 px-4 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-charcoal inline-block transition-all duration-150">
            {displayCount} {displayCount === 1 ? "product fits" : "products fit"}
          </span>
          <p className="text-[11px] text-muted">
            {isZero ? "No fits right now" : "Deterministic catalogue matches"}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onSeeMatches}
          disabled={isZero}
          className="min-h-[44px] px-5"
          aria-label="See top matches"
        >
          <span>See top matches</span>
          <ArrowRight className="w-4 h-4 ml-1.5" weight="bold" />
        </Button>
      </div>
    </>
  );
}
