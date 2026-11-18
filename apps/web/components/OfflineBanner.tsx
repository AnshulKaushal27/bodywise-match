"use client";

import * as React from "react";
import { WifiSlash, WifiHigh, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const [justReconnected, setJustReconnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker in production or standard browsing
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // SW registered
        })
        .catch(() => {
          // Ignore registration failures in private/sandboxed envs
        });
    }

    // Set initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (!isOffline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-brand-evergreen text-white px-4 py-2.5 border-b-2 border-accent-lime text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-sm z-50 animate-slide-up"
      >
        <div className="flex items-center gap-2 max-w-container mx-auto w-full">
          <WifiHigh className="w-4 h-4 text-accent-lime shrink-0" aria-hidden="true" />
          <span>You&#x27;re back online. Syncing catalogue updates.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-brand-deep text-surface px-4 py-2.5 border-b-2 border-accent-lime text-xs sm:text-sm font-medium shadow-sm z-50 animate-slide-up"
    >
      <div className="max-w-container mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <WifiSlash className="w-4 h-4 text-accent-lime shrink-0" aria-hidden="true" />
          <span className="font-semibold">
            You&#x27;re offline, your answers are saved on this device.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <span className="text-[11px] text-surface-sage hidden md:inline">
            Cached shell active
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-lime text-brand-deep hover:bg-surface focus-ring transition-colors min-h-[36px]"
          >
            <ArrowsClockwise className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    </div>
  );
}
