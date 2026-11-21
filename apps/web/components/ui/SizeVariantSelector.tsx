"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SizeVariantItem {
  variantId: string;
  size_label: string;
  price_inr?: number | null;
  sku?: string;
}

export interface SizeVariantSelectorProps {
  variants: SizeVariantItem[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  className?: string;
  label?: string;
}

export function SizeVariantSelector({
  variants,
  selectedId,
  onSelect,
  className,
  label = "Available Sizes",
}: SizeVariantSelectorProps) {
  if (!variants || variants.length <= 1) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <span className="text-xs font-semibold text-muted block uppercase tracking-wider">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2 items-center"
      >
        {variants.map((v) => {
          const isSelected = v.variantId === selectedId;
          return (
            <button
              key={v.variantId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(v.variantId)}
              className={cn(
                "px-3.5 py-1.5 rounded-button text-xs font-semibold border transition-all focus-ring min-h-[44px] flex items-center gap-2 active:scale-[0.98] motion-safe:transition-transform",
                isSelected
                  ? "bg-brand-evergreen text-surface border-brand-evergreen shadow-sm"
                  : "bg-surface-sage/30 text-charcoal border-border hover:bg-surface-sage hover:border-brand-evergreen/40"
              )}
            >
              <span>{v.size_label}</span>
              {v.price_inr !== undefined && v.price_inr !== null && (
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    isSelected ? "text-accent-lime" : "text-brand-deep"
                  )}
                >
                  ₹{v.price_inr}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
