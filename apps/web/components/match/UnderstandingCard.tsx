"use client";

import * as React from "react";
import {
  Sparkle,
  ArrowCounterClockwise,
  Trash,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { useMatchSession } from "@/lib/matchSessionContext";
import { selectAllChipsWithProvenance, ChipProvenance, SessionSlots } from "@bodywise/shared";
import { Card } from "@/components/ui";

interface UnderstandingCardProps {
  onMisunderstood: () => void;
  parseSource?: "llm" | "rules";
  fallbackReason?: string | null;
}

export function UnderstandingCard({
  onMisunderstood,
  parseSource = "rules",
  fallbackReason,
}: UnderstandingCardProps) {
  const { state, dispatch, highlightedSlotKey } = useMatchSession();
  const chips: ChipProvenance[] = selectAllChipsWithProvenance(state);

  // Check if multiple needs resolve to the same product type or goal domain
  const hasMultipleNeeds = state.slots.needs.length > 1;

  const handleRemoveChip = (chip: ChipProvenance) => {
    if (chip.slotKey.startsWith("need_")) {
      const needId = chip.slotKey.replace("need_", "");
      dispatch({ type: "REMOVE_CHIP", slotKey: "needs", needId });
    } else {
      dispatch({ type: "REMOVE_CHIP", slotKey: chip.slotKey as keyof SessionSlots });
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <Card variant="surface" className="p-5 sm:p-6 rounded-card border border-border shadow-ambient space-y-4">
      {/* Header: Title + "You misunderstood me" button (nowrap, moves below on mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-lg font-display font-bold text-brand-deep">
            What we understood
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Review and adjust your stated goals and preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={onMisunderstood}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-button border border-border hover:border-brand-evergreen text-muted hover:text-charcoal bg-paper text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-auto min-h-[44px] focus-ring"
        >
          <ArrowCounterClockwise className="w-3.5 h-3.5 shrink-0" weight="regular" />
          <span>You misunderstood me</span>
        </button>
      </div>

      {/* Multiple needs coverage note */}
      {hasMultipleNeeds && (
        <div className="p-3.5 rounded-button bg-surface-sage/50 border border-border text-xs text-charcoal flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
          <span>
            <strong>One product may cover both:</strong> We check formulations that combine active ingredients for multi-benefit care.
          </span>
        </div>
      )}

      {/* Chips List with Provenance & Clear Labels */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isHighlighted = highlightedSlotKey === chip.slotKey;
            return (
              <div
                key={chip.slotKey}
                className={`group relative inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-button border text-xs min-h-[44px] transition-all ${
                  isHighlighted
                    ? "ring-2 ring-accent-lime bg-accent-lime/20 border-brand-evergreen shadow-sm chip-flash-lime"
                    : chip.isGuessed
                    ? "bg-surface-sage/40 border-dashed border-border text-charcoal"
                    : "bg-paper border-border text-charcoal hover:border-brand-evergreen/40 shadow-xs"
                }`}
                title={chip.provenanceText}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-muted text-[11px] uppercase tracking-wider">
                    {chip.label}:
                  </span>
                  <span className="font-medium text-charcoal">
                    {chip.value || "Any"}
                  </span>
                </div>

                {/* Provenance Subtext Pill */}
                <span className="text-[10px] text-muted bg-surface-sage/60 px-2 py-0.5 rounded-full">
                  {chip.provenanceText}
                </span>

                {/* Remove Chip Button (44px target) */}
                {chip.canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip)}
                    className="p-1 rounded-md text-muted hover:text-error-text hover:bg-error-bg/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
                    aria-label={`Remove need: ${chip.value}`}
                  >
                    <Trash className="w-3.5 h-3.5" weight="regular" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Interpretation Tag & Provenance Line */}
      <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <Sparkle className="w-4 h-4 text-brand-evergreen" weight="fill" />
          {parseSource === "llm" ? (
            <span className="font-medium text-charcoal">
              Interpreted with AI, please check
            </span>
          ) : (
            <span className="font-medium text-charcoal">
              {isDev && fallbackReason
                ? `Interpreted with rules (AI unavailable: ${fallbackReason})`
                : "Interpreted with rules, AI is unavailable right now"}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
