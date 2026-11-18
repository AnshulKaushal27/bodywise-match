import * as React from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepItem[];
  currentStepIndex: number; // 0-based
  onStepClick?: (index: number) => void;
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStepIndex, onStepClick, ...props }, ref) => {
    return (
      <nav aria-label="Progress" ref={ref} className={cn("w-full py-2", className)} {...props}>
        <ol className="flex items-center justify-between w-full relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isUpcoming = idx > currentStepIndex;
            const isClickable = Boolean(onStepClick && isCompleted);

            return (
              <li
                key={step.id}
                className={cn(
                  "relative flex flex-col items-center flex-1 text-center group",
                  idx !== steps.length - 1 && "after:content-[''] after:w-full after:h-[2px] after:absolute after:top-5 after:left-1/2 after:-z-10",
                  idx !== steps.length - 1 && (isCompleted ? "after:bg-brand-evergreen" : "after:bg-border")
                )}
              >
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(idx)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${idx + 1}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                  className={cn(
                    "w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 z-10 focus-ring select-none",
                    isCompleted &&
                      "bg-brand-evergreen text-white hover:bg-brand-deep cursor-pointer",
                    isCurrent &&
                      "bg-accent-lime text-brand-deep border-2 border-brand-deep font-bold ring-4 ring-surface-sage/50 scale-105",
                    isUpcoming &&
                      "bg-surface text-muted border border-border cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      "text-xs md:text-sm font-medium tracking-tight",
                      isCurrent && "text-brand-deep font-bold",
                      isCompleted && "text-brand-deep",
                      isUpcoming && "text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="hidden md:block text-[11px] text-muted">
                      {step.description}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Stepper.displayName = "Stepper";
