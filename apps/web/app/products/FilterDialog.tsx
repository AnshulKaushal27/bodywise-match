"use client";

import * as React from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import {
  ProductRecord,
  ProductFilterCriteria,
  filterProducts,
  computeFacetCounts,
  normalizeToken,
  CONTROLLED_GOALS,
} from "@bodywise/shared";
import { Button } from "@/components/ui";
import {
  CATEGORIES,
  FORMAT_OPTIONS,
  FRAGRANCE_OPTIONS,
} from "@/hooks/useProductFilters";

export interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters: ProductFilterCriteria;
  onApply: (draftFilters: ProductFilterCriteria) => void;
  products: ProductRecord[];
  triggerRef: React.RefObject<HTMLElement | null>;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  appliedFilters,
  onApply,
  products,
  triggerRef,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  const wasOpenRef = React.useRef(false);

  // Local draft state held inside the dialog until "Apply" is clicked
  const [draftCategories, setDraftCategories] = React.useState<string[]>(
    appliedFilters.categories || []
  );
  const [draftFormats, setDraftFormats] = React.useState<string[]>(
    appliedFilters.formats || []
  );
  const [draftGoals, setDraftGoals] = React.useState<string[]>(
    appliedFilters.goals || []
  );
  const [draftFragrance, setDraftFragrance] = React.useState<string>(
    appliedFilters.fragrance || "all"
  );

  // Re-initialize draft when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftCategories(appliedFilters.categories || []);
      setDraftFormats(appliedFilters.formats || []);
      setDraftGoals(appliedFilters.goals || []);
      setDraftFragrance(appliedFilters.fragrance || "all");
    }
  }, [isOpen, appliedFilters]);

  // Focus return to trigger on close (only when transitioning from open -> closed)
  React.useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (triggerRef?.current && typeof triggerRef.current.focus === "function") {
        triggerRef.current.focus();
      }
    }
  }, [isOpen, triggerRef]);

  // Escape key listener to cancel draft
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open (without layout shift)
  React.useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap inside the dialog
  React.useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialogEl = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]):not([aria-disabled="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusables = Array.from(dialogEl.querySelectorAll<HTMLElement>(focusableSelector));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const current = Array.from(dialogEl.querySelectorAll<HTMLElement>(focusableSelector));
      if (current.length === 0) return;

      const first = current[0];
      const last = current[current.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  // Current draft criteria
  const draftCriteria = React.useMemo<ProductFilterCriteria>(() => {
    return {
      search: appliedFilters.search,
      categories: draftCategories,
      formats: draftFormats,
      goals: draftGoals,
      fragrance: draftFragrance,
    };
  }, [appliedFilters.search, draftCategories, draftFormats, draftGoals, draftFragrance]);

  // Live matching count for draft selection
  const draftCount = React.useMemo(() => {
    return filterProducts(products, draftCriteria).length;
  }, [products, draftCriteria]);

  // Live facet counts for each chip
  const facetCounts = React.useMemo(() => {
    return computeFacetCounts(products, draftCriteria, {
      categories: CATEGORIES,
      formats: FORMAT_OPTIONS,
      goals: [{ id: "all" }, ...CONTROLLED_GOALS],
      fragrance: FRAGRANCE_OPTIONS,
    });
  }, [products, draftCriteria]);

  // Category toggle handler (OR within group, "all" clears)
  const toggleCategory = (catId: string) => {
    if (catId === "all") {
      setDraftCategories([]);
      return;
    }
    const norm = normalizeToken(catId);
    setDraftCategories((prev) => {
      const exists = prev.some((c) => normalizeToken(c) === norm);
      if (exists) {
        return prev.filter((c) => normalizeToken(c) !== norm);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Format toggle handler (OR within group, "all" clears)
  const toggleFormat = (fmtId: string) => {
    if (fmtId === "all") {
      setDraftFormats([]);
      return;
    }
    const lower = fmtId.toLowerCase();
    setDraftFormats((prev) => {
      const exists = prev.some((f) => f.toLowerCase() === lower);
      if (exists) {
        return prev.filter((f) => f.toLowerCase() !== lower);
      } else {
        return [...prev, fmtId];
      }
    });
  };

  // Goal toggle handler (OR within group, "all" clears)
  const toggleGoal = (goalId: string) => {
    if (goalId === "all") {
      setDraftGoals([]);
      return;
    }
    const norm = normalizeToken(goalId);
    setDraftGoals((prev) => {
      const exists = prev.some((g) => normalizeToken(g) === norm);
      if (exists) {
        return prev.filter((g) => normalizeToken(g) !== norm);
      } else {
        return [...prev, goalId];
      }
    });
  };

  // Fragrance select handler
  const setFragranceOption = (fragId: string) => {
    setDraftFragrance(fragId);
  };

  // Clear draft selections
  const handleClearDraft = () => {
    setDraftCategories([]);
    setDraftFormats([]);
    setDraftGoals([]);
    setDraftFragrance("all");
  };

  // Apply draft and close
  const handleApply = () => {
    onApply(draftCriteria);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-deep/35 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="w-full max-h-[90dvh] sm:max-h-[85dvh] sm:max-w-2xl rounded-t-[24px] sm:rounded-[18px] bg-surface shadow-[0_8px_32px_rgba(23,53,46,0.12)] border-t sm:border border-border motion-safe:animate-slide-up flex flex-col overflow-hidden outline-none"
      >
        {/* Mobile Drag Handle visual for bottom sheet */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-surface shrink-0" aria-hidden="true">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Dialog Header */}
        <div className="p-5 md:p-6 pb-4 border-b border-border/80 bg-surface shrink-0 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 id={titleId} className="text-xl md:text-2xl font-bold font-display text-brand-deep">
              Filters
            </h3>
            <p id={descId} className="text-xs md:text-sm text-muted">
              Choose what matters to you
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="p-2 -mr-2 -mt-2 rounded-full text-muted hover:text-brand-deep hover:bg-surface-sage/40 focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Dialog Body (scrolls inside dialog) */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 text-charcoal space-y-6">
          {/* 1. Category Group */}
          <fieldset className="space-y-2.5">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Category
            </legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isAll = cat.id === "all";
                const isSelected = isAll
                  ? draftCategories.length === 0
                  : draftCategories.some((c) => normalizeToken(c) === normalizeToken(cat.id));
                const count = facetCounts.categories[cat.id] ?? 0;
                const isZero = !isSelected && count === 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => !isZero && toggleCategory(cat.id)}
                    aria-disabled={isZero ? "true" : undefined}
                    title={isZero ? "No products" : undefined}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all focus-ring min-h-[44px] flex items-center gap-1.5 active:scale-[0.98] ${
                      isSelected
                        ? "bg-brand-evergreen text-surface border-brand-evergreen font-bold shadow-sm"
                        : isZero
                        ? "bg-surface-sage/10 text-muted/60 border-border/50 opacity-40 cursor-not-allowed"
                        : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" aria-hidden="true" />}
                    <span>{cat.label}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-accent-lime/90 font-medium" : "text-muted font-normal"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 2. Format Group */}
          <fieldset className="space-y-2.5 pt-2 border-t border-border/60">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const isAll = fmt.id === "all";
                const isSelected = isAll
                  ? draftFormats.length === 0
                  : draftFormats.some((f) => f.toLowerCase() === fmt.id.toLowerCase());
                const count = facetCounts.formats[fmt.id] ?? 0;
                const isZero = !isSelected && count === 0;

                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => !isZero && toggleFormat(fmt.id)}
                    aria-disabled={isZero ? "true" : undefined}
                    title={isZero ? "No products" : undefined}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all focus-ring min-h-[44px] flex items-center gap-1.5 active:scale-[0.98] ${
                      isSelected
                        ? "bg-brand-evergreen text-surface border-brand-evergreen font-bold shadow-sm"
                        : isZero
                        ? "bg-surface-sage/10 text-muted/60 border-border/50 opacity-40 cursor-not-allowed"
                        : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" aria-hidden="true" />}
                    <span>{fmt.label}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-accent-lime/90 font-medium" : "text-muted font-normal"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 3. Target Concern & Goal Group */}
          <fieldset className="space-y-2.5 pt-2 border-t border-border/60">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Target Concern & Goal
            </legend>
            <div className="flex flex-wrap gap-2">
              {/* All Goals Chip */}
              <button
                type="button"
                onClick={() => toggleGoal("all")}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all focus-ring min-h-[44px] flex items-center gap-1.5 active:scale-[0.98] ${
                  draftGoals.length === 0
                    ? "bg-brand-evergreen text-surface border-brand-evergreen font-bold shadow-sm"
                    : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                }`}
              >
                {draftGoals.length === 0 && (
                  <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" aria-hidden="true" />
                )}
                <span>All Goals</span>
                <span
                  className={`text-[11px] ${
                    draftGoals.length === 0 ? "text-accent-lime/90 font-medium" : "text-muted font-normal"
                  }`}
                >
                  {facetCounts.goals["all"] ?? 0}
                </span>
              </button>

              {CONTROLLED_GOALS.map((goal) => {
                const isSelected = draftGoals.some(
                  (g) => normalizeToken(g) === normalizeToken(goal.id)
                );
                const count = facetCounts.goals[goal.id] ?? 0;
                const isZero = !isSelected && count === 0;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => !isZero && toggleGoal(goal.id)}
                    aria-disabled={isZero ? "true" : undefined}
                    title={isZero ? "No products" : undefined}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all focus-ring min-h-[44px] flex items-center gap-1.5 active:scale-[0.98] ${
                      isSelected
                        ? "bg-brand-evergreen text-surface border-brand-evergreen font-bold shadow-sm"
                        : isZero
                        ? "bg-surface-sage/10 text-muted/60 border-border/50 opacity-40 cursor-not-allowed"
                        : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" aria-hidden="true" />
                    )}
                    <span>{goal.label}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-accent-lime/90 font-medium" : "text-muted font-normal"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 4. Fragrance Declaration Group */}
          <fieldset className="space-y-2.5 pt-2 border-t border-border/60">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Fragrance Declaration
            </legend>
            <div className="flex flex-wrap gap-2">
              {FRAGRANCE_OPTIONS.map((opt) => {
                const isSelected = draftFragrance === opt.id;
                const count = facetCounts.fragrance[opt.id] ?? 0;
                const isZero = !isSelected && count === 0;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => !isZero && setFragranceOption(opt.id)}
                    aria-disabled={isZero ? "true" : undefined}
                    title={isZero ? "No products" : undefined}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all focus-ring min-h-[44px] flex items-center gap-1.5 active:scale-[0.98] ${
                      isSelected
                        ? "bg-brand-evergreen text-surface border-brand-evergreen font-bold shadow-sm"
                        : isZero
                        ? "bg-surface-sage/10 text-muted/60 border-border/50 opacity-40 cursor-not-allowed"
                        : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" aria-hidden="true" />
                    )}
                    <span>{opt.label}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-accent-lime/90 font-medium" : "text-muted font-normal"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Dialog Footer (sticky at bottom) */}
        <div className="p-4 md:p-5 border-t border-border bg-surface shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs sm:text-sm font-semibold text-brand-evergreen hover:text-brand-deep underline focus-ring px-3 py-2 min-h-[44px] flex items-center transition-colors rounded active:scale-[0.98]"
          >
            Clear all
          </button>

          <div className="flex items-center gap-3">
            {draftCount === 0 ? (
              <Button
                variant="primary"
                onClick={handleApply}
                className="min-h-[48px] px-6 text-sm font-bold shadow-sm active:scale-[0.98]"
                aria-live="polite"
              >
                Apply (0 matches)
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleApply}
                className="min-h-[48px] px-6 text-sm font-bold shadow-sm active:scale-[0.98]"
                aria-live="polite"
              >
                Show {draftCount} {draftCount === 1 ? "product" : "products"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
