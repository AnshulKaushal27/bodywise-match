import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Pulse } from "@phosphor-icons/react/dist/ssr";

import { SiteFooter } from "@/components/SiteFooter";
import { StatusClient } from "./StatusClient";

export const metadata = {
  title: "System & Service Status — Bodywise Match",
  description:
    "Live system health monitoring, deterministic rules version, product catalogue status, and service diagnostics for Bodywise Match.",
};

export default function StatusPage() {
  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/match"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Find my match &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="max-w-container mx-auto px-5 py-10 md:py-14 flex-1 w-full space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-evergreen bg-brand-sage/30 px-2.5 py-1 rounded-full">
            <Pulse className="w-3.5 h-3.5" weight="regular" />
            <span>Live Health &amp; Provenance</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-brand-deep tracking-tight">
            System & Service Status
          </h1>
          <p className="text-sm md:text-base text-foreground/80 max-w-2xl leading-relaxed">
            Real-time diagnostics covering the REST API, deterministic matching rules version,
            product catalogue fact provenance, and privacy safeguards.
          </p>
        </div>

        {/* Client-side Live Status Component */}
        <StatusClient />
      </main>

      <SiteFooter />
    </div>
  );
}
