"use client";

import * as React from "react";
import Link from "next/link";
import { X, ShieldWarning } from "@phosphor-icons/react";

export function FirstVisitNotice() {
  const [isDismissed, setIsDismissed] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("bodywise_medical_notice_dismissed");
      if (stored !== "true") {
        setIsDismissed(false);
      }
    } catch {
      // In private browsing or storage-disabled environments, default to dismissed
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("bodywise_medical_notice_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Medical disclaimer and prototype notice"
      className="bg-brand-deep text-surface border-b-2 border-accent-lime px-4 py-3 shadow-sm relative z-50 animate-fade-in"
    >
      <div className="max-w-container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldWarning
            className="w-5 h-5 text-accent-lime shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-display font-bold text-surface tracking-tight block sm:inline mr-2">
              Informational only, not medical advice.
            </span>
            <span className="text-surface-sage/90">
              Bodywise Match is an independent fellowship prototype. It does not provide medical diagnosis, clinical severity scoring, or treatment plans. Consult a doctor or dermatologist for medical conditions.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <Link
            href="/safety"
            className="text-xs font-semibold text-accent-lime hover:underline focus-ring px-2 py-1 rounded"
          >
            Learn more
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold bg-accent-lime text-brand-deep hover:bg-surface focus-ring transition-colors"
          >
            Understood
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss medical disclaimer notice"
            className="p-1.5 rounded-full text-surface-sage hover:text-surface focus-ring min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
