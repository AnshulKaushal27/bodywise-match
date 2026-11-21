"use client";

import * as React from "react";
import { Copy, ShieldCheck, CheckCircle, ChatCircleText } from "@phosphor-icons/react";

export function OrderResolutionPreview() {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"delayed" | "damaged" | "payment">("delayed");

  const sampleDrafts = {
    delayed: {
      tag: "Delayed delivery",
      shortTag: "Delayed",
      subject: "Urgent: Order #BW-89241 Delivery Delay (AWB: 1482910)",
      body: "Hi Be Bodywise Team,\n\nI am writing regarding order #BW-89241 placed on Nov 14. The package has remained in transit without a courier scan for 4 days past the promised delivery SLA.\n\nAttached are:\n• Official invoice PDF\n• Courier tracking screenshot with current waybill\n\nCould you please escalate with the courier or initiate a priority reshipment?",
      checklist: ["Courier AWB verified", "Delivery SLA quoted", "Invoice attached"],
    },
    damaged: {
      tag: "Damaged package",
      shortTag: "Damaged",
      subject: "Damaged Package Notice: Order #BW-92104 (Seal Broken)",
      body: "Hi Be Bodywise Team,\n\nI received order #BW-92104 today, but the outer packaging was crushed and the bottle seal was broken with visible leakage.\n\nAttached are 3 unboxing photos showing:\n• Outer shipping label & batch number\n• Broken container seal & leaking product\n\nPlease advise on replacement dispatch.",
      checklist: ["Unboxing photos ready", "Batch number noted", "Damage documented"],
    },
    payment: {
      tag: "Payment inquiry",
      shortTag: "Payment",
      subject: "Payment Deducted but No Order Confirmation: UPI Ref #829104",
      body: "Hi Be Bodywise Team,\n\nAmount of ₹899 was debited from my account via UPI (Ref: 8291048291), but I have not received an order confirmation email or SMS.\n\nAttached is my payment debit receipt with bank reference and timestamp. Please confirm if the order was created.",
      checklist: ["Bank UPI Ref noted", "Timestamp verified", "Debit receipt attached"],
    },
  };

  const current = sampleDrafts[activeTab];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-[500px] mx-auto select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-subtle-float {
          animation: subtleFloat 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-subtle-float {
            animation: none !important;
          }
        }
      `}} />

      {/* Ambient Lighting Glow Blooms Behind Card */}
      <div
        className="absolute -top-8 -right-8 w-56 h-56 rounded-full bg-surface-sage/50 blur-[50px] -z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 -left-8 w-52 h-52 rounded-full bg-accent-lime/20 blur-[50px] -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Resolution Showcase Card */}
      <div className="rounded-card bg-surface border border-brand-deep/12 shadow-elevated overflow-hidden animate-subtle-float">
        {/* Top Window Bar */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-surface-sage border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-primary animate-pulse" aria-hidden="true" />
            <span className="font-display font-bold text-xs text-brand-deep tracking-tight flex items-center gap-1.5">
              <ChatCircleText className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
              <span>Support Draft Preview</span>
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-accent-lime/70 text-[10px] font-bold text-brand-deep border border-brand-deep/10">
            Ready to send
          </span>
        </div>

        {/* Interactive Scenario Tab Strip */}
        <div className="px-3.5 sm:px-4 py-2 bg-surface border-b border-border/60 flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-medium text-muted shrink-0 mr-1 hidden sm:inline">Scenario:</span>
          {(["delayed", "damaged", "payment"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap focus-ring ${
                activeTab === tab
                  ? "bg-brand-evergreen text-white shadow-2xs"
                  : "bg-paper text-charcoal/80 hover:bg-surface-sage/60 border border-border"
              }`}
            >
              <span className="sm:hidden">{sampleDrafts[tab].shortTag}</span>
              <span className="hidden sm:inline">{sampleDrafts[tab].tag}</span>
            </button>
          ))}
        </div>

        {/* Message Draft Header Metadata */}
        <div className="px-4 sm:px-5 pt-3.5 pb-2.5 bg-surface border-b border-border/40 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-muted">
            <span className="font-semibold text-charcoal w-12 sm:w-14 shrink-0 text-[11px] sm:text-xs">To:</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-brand-evergreen bg-surface-sage/40 px-2 py-0.5 rounded border border-brand-deep/8 truncate">
              official Be Bodywise customer care
            </span>
          </div>
          <div className="flex items-start gap-2 text-muted">
            <span className="font-semibold text-charcoal w-12 sm:w-14 shrink-0 pt-0.5 text-[11px] sm:text-xs">Subject:</span>
            <span className="font-medium text-brand-deep text-[11px] sm:text-xs leading-snug line-clamp-2">
              {current.subject}
            </span>
          </div>
        </div>

        {/* Email Message Content Body */}
        <div className="p-4 sm:p-5 bg-paper/60 font-body text-[11px] sm:text-xs text-charcoal leading-relaxed whitespace-pre-line border-b border-border/40 max-h-[160px] sm:max-h-none overflow-y-auto">
          {current.body}
        </div>

        {/* Checkmarks Strip */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-surface-sage/30 border-b border-border/40 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-brand-deep">
          {current.checklist.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-evergreen" weight="fill" aria-hidden="true" />
              <span>{item}</span>
            </span>
          ))}
        </div>

        {/* Card Footer: 1-Tap Copy Action */}
        <div className="p-3 sm:p-3.5 bg-surface flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-evergreen shrink-0" aria-hidden="true" />
            <span className="truncate">100% private &bull; Generated locally</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold bg-surface-sage hover:bg-surface-sage/80 text-brand-deep border border-brand-deep/12 transition-all active:scale-[0.98] focus-ring shrink-0"
            aria-label="Copy sample draft template"
          >
            <Copy className="w-3.5 h-3.5 text-brand-evergreen" aria-hidden="true" />
            <span>{copied ? "Copied!" : "Copy draft"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
