import * as React from "react";
import { CheckCircle, Warning, WarningCircle, Info, X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export type ToastType = "info" | "success" | "caution" | "error";

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

const icons: Record<ToastType, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-brand-evergreen" />,
  success: <CheckCircle className="w-5 h-5 text-success-text" />,
  caution: <Warning className="w-5 h-5 text-caution-text" />,
  error: <WarningCircle className="w-5 h-5 text-error-text" />,
};

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  title,
  message,
  onDismiss,
  className,
}) => {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl bg-surface border border-border shadow-soft min-w-[300px] max-w-md animate-slide-up transition-all",
        className
      )}
    >
      <div className="pt-0.5">{icons[type]}</div>
      <div className="flex-1 flex flex-col gap-0.5">
        <h6 className="font-semibold text-sm text-brand-deep">{title}</h6>
        {message && <p className="text-xs text-charcoal leading-relaxed">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 -mr-1 -mt-1 text-muted hover:text-brand-deep rounded-full focus-ring"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
