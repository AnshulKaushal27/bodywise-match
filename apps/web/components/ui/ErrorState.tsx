import * as React from "react";
import { WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      icon = <WarningCircle className="w-8 h-8 text-error-text" />,
      title = "Something needs attention",
      description = "We couldn't retrieve the matches right now. Please check your connection or try again.",
      retryLabel = "Try again",
      onRetry,
      secondaryActionLabel,
      onSecondaryAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-card bg-surface border border-error-text/30 shadow-card max-w-lg mx-auto",
          className
        )}
        {...props}
      >
        <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mb-4 border border-error-text/20">
          {icon}
        </div>
        <h4 className="text-xl font-bold font-display text-brand-deep mb-2">
          {title}
        </h4>
        <p className="text-sm md:text-base text-charcoal/80 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              <ArrowsClockwise className="w-4 h-4 mr-2" />
              {retryLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

ErrorState.displayName = "ErrorState";
