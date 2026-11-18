import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none select-none min-h-[48px] px-6 py-3 text-base active:scale-[0.98] motion-safe:transition-transform",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-evergreen text-white hover:bg-brand-deep active:bg-brand-deep shadow-soft",
        secondary:
          "bg-surface text-brand-evergreen border-[1.5px] border-brand-evergreen hover:bg-surface-sage/30 active:bg-surface-sage/50",
        ghost:
          "bg-transparent text-brand-evergreen hover:underline underline-offset-4 active:text-brand-deep p-2 min-h-[44px]",
      },
      size: {
        default: "min-h-[48px] px-6 py-3 text-base",
        sm: "min-h-[44px] px-4 py-2 text-sm",
        lg: "min-h-[52px] px-8 py-3.5 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <CircleNotch className="mr-2 h-4 w-4 animate-spin text-current" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
