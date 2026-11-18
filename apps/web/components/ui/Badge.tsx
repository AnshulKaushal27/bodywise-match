import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-surface-sage text-brand-deep border border-brand-deep/15",
        demo:
          "bg-accent-lime text-brand-deep border border-brand-deep/20 font-bold",
        caution:
          "bg-caution-peach text-caution-text border border-caution-text/20",
        success:
          "bg-success-bg text-success-text border border-success-text/20",
        error:
          "bg-error-bg text-error-text border border-error-text/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
