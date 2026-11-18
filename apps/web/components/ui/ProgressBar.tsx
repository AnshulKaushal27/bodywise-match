import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, showLabel = false, "aria-label": ariaLabel = "Step progress", ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    return (
      <div className="w-full flex flex-col gap-1.5" ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center text-xs font-semibold text-brand-deep">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "w-full h-3 bg-surface-sage rounded-full overflow-hidden border border-border/40 p-0.5",
            className
          )}
        >
          <div
            className="h-full bg-accent-lime rounded-full transition-all duration-300 ease-out border border-brand-deep/15"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
