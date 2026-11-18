import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "animate-pulse bg-surface-sage/50 border border-border/30",
          variant === "rectangular" && "rounded-card",
          variant === "circular" && "rounded-full",
          variant === "text" && "rounded-md h-4 w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
