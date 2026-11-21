import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  EnvelopeSimple,
  ArrowSquareOut,
  Phone,
  Question,
  Code,
} from "@phosphor-icons/react/dist/ssr";

import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Contact & Support — Bodywise Match",
  description:
    "How to reach the fellowship prototype team and official Be Bodywise customer care channels.",
};

export default function ContactPage() {
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "fellowship-prototype@example.com";

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
            href="/help"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Help centre &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area - Reading Column 680px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full space-y-12">
        {/* Title */}
        <section className="space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
            Support &amp; Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            Contact &amp; Support
          </h1>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Please review the channels below to ensure your message reaches the correct team.
          </p>
        </section>

        {/* 1. Technical Prototype Contact */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Code className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>1. Technical &amp; Prototype Inquiries</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            For code feedback, bug reports, algorithmic evaluations, or reviewer questions regarding this fellowship submission, please reach out directly:
          </p>

          <div className="p-5 rounded-card bg-surface border border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-sage flex items-center justify-center text-brand-evergreen shrink-0">
                <EnvelopeSimple className="w-5 h-5" weight="regular" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Fellowship Maintainer Email
                </span>
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-mono text-sm sm:text-base font-bold text-brand-deep hover:text-brand-evergreen underline focus-ring rounded"
                >
                  {contactEmail}
                </a>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed pt-2 border-t border-border/60">
              Note: This inbox is monitored for technical and architectural feedback relating to the Bodywise Match web app and matching engine.
            </p>
          </div>
        </section>

        {/* 2. Official Be Bodywise Customer Care */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <ArrowSquareOut className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>2. Official Be Bodywise Customer Support</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Because this application is an independent prototype, <strong>we cannot access your live retail orders, track couriers, modify deliveries, or issue refunds</strong>. For official purchase and order support, please contact the official Be Bodywise care team:
          </p>

          <div className="space-y-3">
            {/* Official Website */}
            <div className="p-4 rounded-card bg-surface border border-border flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs sm:text-sm text-brand-deep block">
                  Official Storefront
                </strong>
                <span className="text-xs text-muted">Browse live products, bundles, and verified FAQs</span>
              </div>
              <a
                href="https://bebodywise.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 rounded"
              >
                <span>bebodywise.com</span>
                <ArrowSquareOut className="w-3.5 h-3.5" weight="regular" />
              </a>
            </div>

            {/* Official Email */}
            <div className="p-4 rounded-card bg-surface border border-border flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs sm:text-sm text-brand-deep block">
                  Official Care Desk Email
                </strong>
                <span className="text-xs text-muted">For damaged goods, payments, or order issues</span>
              </div>
              <a
                href="mailto:support@bebodywise.com"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 rounded"
              >
                <span>support@bebodywise.com</span>
                <EnvelopeSimple className="w-3.5 h-3.5" weight="regular" />
              </a>
            </div>

            {/* Official WhatsApp / Phone */}
            <div className="p-4 rounded-card bg-surface border border-border flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs sm:text-sm text-brand-deep block">
                  WhatsApp &amp; Phone Support
                </strong>
                <span className="text-xs text-muted">Monday to Saturday: 10:00 AM – 7:00 PM IST</span>
              </div>
              <a
                href="tel:+918000082323"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 rounded"
              >
                <span>+91 80000 82323</span>
                <Phone className="w-3.5 h-3.5" weight="regular" />
              </a>
            </div>
          </div>
        </section>

        {/* 3. Issue Helper Banner */}
        <section className="p-5 rounded-card bg-surface-sage/35 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Question className="w-5 h-5 text-brand-evergreen shrink-0" weight="regular" />
            <h3 className="font-display font-bold text-sm sm:text-base text-brand-deep tracking-tight">
              Need help preparing your details before contacting support?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            Our interactive Order &amp; Product Issue Helper organizes your dates, photos, and messages into an official support email template stored strictly on your device.
          </p>
          <div className="pt-1">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep font-bold text-xs focus-ring transition-colors active:scale-[0.98] motion-safe:transition-transform"
            >
              <span>Open Issue Helper</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <SiteFooter />
    </div>
  );
}
