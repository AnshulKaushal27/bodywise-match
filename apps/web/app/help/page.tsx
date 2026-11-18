"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lifebuoy,
  Clock,
  Warning,
  Package,
  Calendar,
  CreditCard,
  ChatCircleDots,
  ShieldWarning,
  Trash,
  ArrowSquareOut,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  HELP_ISSUES,
  OFFICIAL_SUPPORT_CHANNELS,
} from "@bodywise/shared";
import { DemoBadge, Card } from "@/components/ui";

export default function HelpLandingPage() {
  const [clearedNotice, setClearedNotice] = React.useState<boolean>(false);

  const handleClearLocalData = () => {
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("bodywise_help_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        setClearedNotice(true);
        setTimeout(() => setClearedNotice(false), 4000);
      } catch {
        // Ignore
      }
    }
  };

  const getIssueIcon = (id: string) => {
    switch (id) {
      case "delayed-delivery":
        return <Clock className="w-5 h-5 text-brand-evergreen" weight="regular" />;
      case "failed-delivery":
        return <Warning className="w-5 h-5 text-brand-evergreen" weight="regular" />;
      case "damaged-package":
        return <Package className="w-5 h-5 text-caution-text" weight="regular" />;
      case "near-expiry":
        return <Calendar className="w-5 h-5 text-brand-evergreen" weight="regular" />;
      case "payment-uncertainty":
        return <CreditCard className="w-5 h-5 text-brand-evergreen" weight="regular" />;
      case "unresolved-support":
        return <ChatCircleDots className="w-5 h-5 text-brand-evergreen" weight="regular" />;
      case "product-reaction":
        return <ShieldWarning className="w-5 h-5 text-caution-text" weight="regular" />;
      default:
        return <Lifebuoy className="w-5 h-5 text-brand-evergreen" weight="regular" />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Navigation */}
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
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/products"
            className="text-xs font-semibold text-muted hover:text-charcoal focus-ring px-2 py-1 rounded"
          >
            Browse Products
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-container mx-auto px-5 py-8 md:py-12 flex-1 w-full space-y-8">
        {/* Title & Intro */}
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
            Official Resolution Assistant
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display text-brand-deep tracking-tight mt-1 mb-3">
            Need help with an order or product?
          </h1>
          <p className="text-sm md:text-base text-charcoal/80 leading-relaxed">
            Prepare your details clearly before contacting customer care. We give you exact checklists, message templates, and official direct channels.
          </p>
        </div>

        {/* Required Callout in Sage */}
        <div className="p-4 md:p-5 rounded-card bg-surface-sage border border-brand-evergreen/30 text-xs md:text-sm text-charcoal/90 leading-relaxed shadow-xs flex items-start gap-3">
          <Lifebuoy className="w-5 h-5 text-brand-evergreen shrink-0 mt-0.5" weight="regular" aria-hidden="true" />
          <div>
            <strong className="font-bold text-brand-deep block mb-0.5">
              Honest Logistics Boundary
            </strong>
            <p>
              We can&apos;t check your order, courier, payment or batch here. We can help you get your details ready and point you to official support.
            </p>
          </div>
        </div>

        {/* Local Storage Cleared Feedback Toast */}
        {clearedNotice && (
          <div className="p-3.5 rounded-button bg-success-bg border border-success-text/30 text-success-text text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" weight="regular" />
            <span>All local help drafts and checklist items have been cleared from this browser.</span>
          </div>
        )}

        {/* ================= 7 ISSUE CARDS GRID ================= */}
        <section aria-labelledby="issues-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="issues-heading" className="font-display font-bold text-lg sm:text-xl text-brand-deep tracking-tight">
              Select Your Issue Category
            </h2>
            <button
              type="button"
              onClick={handleClearLocalData}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-error-text underline focus-ring py-1 px-1.5 rounded active:scale-[0.98] motion-safe:transition-transform"
              title="Clears saved order and checklist drafts in this browser"
            >
              <Trash className="w-3.5 h-3.5" weight="regular" />
              <span>Clear my local data</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HELP_ISSUES.map((issue) => (
              <Card
                key={issue.id}
                variant="surface"
                className="p-5 md:p-6 border border-border shadow-sm hover:shadow-card hover:border-brand-evergreen/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-card bg-surface-sage/50 border border-border/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getIssueIcon(issue.id)}
                    </div>
                    <span className="text-[11px] font-semibold text-muted">
                      {issue.checklist.length} checklist items
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base md:text-lg text-brand-deep mb-2 group-hover:text-brand-evergreen transition-colors tracking-tight">
                    <Link href={`/help/${issue.slug}`} className="focus-ring rounded">
                      {issue.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-charcoal/80 leading-relaxed mb-4">
                    {issue.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/70 mt-auto flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    Message template included
                  </span>
                  <Link
                    href={`/help/${issue.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-evergreen hover:text-brand-deep group-hover:translate-x-0.5 transition-transform focus-ring px-1.5 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
                  >
                    <span>Prepare details</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="regular" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ================= OFFICIAL SUPPORT CHANNELS BOX ================= */}
        <section aria-labelledby="official-channels" className="p-6 md:p-8 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-evergreen" weight="regular" aria-hidden="true" />
              <h2 id="official-channels" className="font-display font-bold text-lg md:text-xl text-brand-deep tracking-tight">
                Official Be Bodywise Support Channels
              </h2>
            </div>
            <span className="text-[11px] text-muted">
              Source: Official brand help directory
            </span>
          </div>

          <p className="text-xs md:text-sm text-charcoal/80 leading-relaxed">
            All customer inquiries regarding order status, damaged parcels, and payments must be resolved through Be Bodywise&apos;s verified communication channels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {OFFICIAL_SUPPORT_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-button bg-paper border border-border flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-display font-bold text-sm text-brand-deep tracking-tight">
                      {ch.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-sage text-brand-deep">
                      {ch.type}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/80 leading-relaxed mb-2">
                    {ch.description}
                  </p>
                  <div className="text-[11px] text-muted space-y-0.5 pt-2 border-t border-border/60">
                    <div><strong>Best for:</strong> {ch.recommended_for}</div>
                    <div>Source: {ch.source} (checked {ch.last_checked})</div>
                  </div>
                </div>

                <a
                  href={ch.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-surface hover:bg-surface-sage border border-border text-brand-evergreen py-2 px-3 rounded-button focus-ring transition-colors shadow-xs active:scale-[0.98] motion-safe:transition-transform"
                >
                  <span>Open {ch.name}</span>
                  <ArrowSquareOut className="w-3.5 h-3.5" weight="regular" />
                </a>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted pt-2 border-t border-border/60 italic">
            Note: We do not receive commissions, affiliate kickbacks, or tracking access from customer support interactions.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <div className="max-w-container mx-auto px-5 space-y-2">
          <p className="font-semibold text-brand-deep">
            Bodywise Match &bull; Independent Resolution Assistant
          </p>
          <p>
            Zero claims of live order tracking, batch authenticity, or ticket status. Data stored in your local browser only.
          </p>
        </div>
      </footer>
    </div>
  );
}
