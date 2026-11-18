import * as React from "react";
import { ShieldCheck, Question } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface SourceTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  source?: string | null;
  lastVerifiedAt?: string | null;
}

export const SourceTag = React.forwardRef<HTMLSpanElement, SourceTagProps>(
  ({ className, source, lastVerifiedAt, ...props }, ref) => {
    const isVerified = Boolean(source && lastVerifiedAt);

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border select-none",
          isVerified
            ? "bg-surface text-text-charcoal border-border"
            : "bg-surface-sage/50 text-muted border-border italic",
          className
        )}
        {...props}
      >
        {isVerified ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
            <span>
              Source: <strong className="font-semibold text-brand-deep">{source}</strong>
              <span className="text-muted"> (verified {lastVerifiedAt})</span>
            </span>
          </>
        ) : (
          <>
            <Question className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
            <span>Not verified yet</span>
          </>
        )}
      </span>
    );
  }
);

SourceTag.displayName = "SourceTag";
