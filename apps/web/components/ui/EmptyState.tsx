import * as React from "react";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon = <Sparkle className="w-8 h-8 text-brand-evergreen" />,
      title,
      description,
      actionLabel,
      onAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-card bg-surface border border-border/80 shadow-card max-w-lg mx-auto",
          className
        )}
        {...props}
      >
        <div className="w-16 h-16 rounded-full bg-surface-sage/50 flex items-center justify-center mb-4 border border-brand-evergreen/10">
          {icon}
        </div>
        <h4 className="text-xl font-bold font-display text-brand-deep mb-2">
          {title}
        </h4>
        <p className="text-sm md:text-base text-muted max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
