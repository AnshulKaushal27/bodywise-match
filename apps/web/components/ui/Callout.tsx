import * as React from "react";
import { Info, Warning, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type CalloutVariant = "info" | "caution" | "success" | "error";

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CalloutVariant;
  title?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<
  CalloutVariant,
  { container: string; border: string; title: string; text: string; defaultIcon: React.ReactNode }
> = {
  info: {
    container: "bg-surface-sage/40 text-charcoal",
    border: "border-l-brand-evergreen",
    title: "text-brand-deep",
    text: "text-charcoal",
    defaultIcon: <Info className="w-5 h-5 text-brand-evergreen flex-shrink-0" aria-hidden="true" />,
  },
  caution: {
    container: "bg-caution-peach text-caution-text",
    border: "border-l-caution-text",
    title: "text-caution-text font-bold",
    text: "text-caution-text",
    defaultIcon: <Warning className="w-5 h-5 text-caution-text flex-shrink-0" aria-hidden="true" />,
  },
  success: {
    container: "bg-success-bg text-success-text",
    border: "border-l-success-text",
    title: "text-success-text font-bold",
    text: "text-success-text",
    defaultIcon: <CheckCircle className="w-5 h-5 text-success-text flex-shrink-0" aria-hidden="true" />,
  },
  error: {
    container: "bg-error-bg text-error-text",
    border: "border-l-error-text",
    title: "text-error-text font-bold",
    text: "text-error-text",
    defaultIcon: <WarningCircle className="w-5 h-5 text-error-text flex-shrink-0" aria-hidden="true" />,
  },
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = "info", title, icon, children, ...props }, ref) => {
    const style = variantStyles[variant];

    return (
      <div
        ref={ref}
        role={variant === "error" ? "alert" : "region"}
        className={cn(
          "rounded-r-card rounded-l-sm p-4 border-l-4 transition-all duration-150 flex gap-3.5 my-3",
          style.container,
          style.border,
          className
        )}
        {...props}
      >
        <div className="pt-0.5">{icon || style.defaultIcon}</div>
        <div className="flex-1 flex flex-col gap-1 text-sm leading-relaxed">
          {title && <h5 className={cn("font-semibold text-sm", style.title)}>{title}</h5>}
          <div className={cn(style.text)}>{children}</div>
        </div>
      </div>
    );
  }
);

Callout.displayName = "Callout";
