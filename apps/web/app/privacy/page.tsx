import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Database,
  Trash,
  Lock,
  Calendar,
  Stack,
} from "@phosphor-icons/react/dist/ssr";
import { DemoBadge } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy — Bodywise Match",
  description:
    "Plain-language explanation of what data is collected, what is never collected, our 30-day retention period, AI privacy safeguards, and how to delete your data.",
};

export default function PrivacyPage() {
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
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/privacy/data"
            className="text-xs font-bold text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Manage my data &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area - Reading Column 680px */}
      <main id="main-content" className="max-w-prose mx-auto px-5 py-10 md:py-16 flex-1 w-full space-y-12">
        {/* Title & Last Updated */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-widest font-bold text-brand-evergreen block">
              Privacy &amp; Data Safeguards
            </span>
            <span className="text-xs text-muted flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" weight="regular" />
              <span>Last updated: November 18, 2026</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
            Our Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            We believe you should not have to trade your personal privacy to find a suitable skincare, haircare, or personal hygiene product. This policy explains what happens to your data in plain words.
          </p>
        </section>

        {/* 1. What We Collect vs. What We Do NOT Collect */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight">
            1. What We Collect vs. What We Never Collect
          </h2>

          <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm">
            {/* What is collected */}
            <div className="p-5 rounded-card bg-surface border border-border space-y-3">
              <h3 className="font-bold text-sm text-brand-deep flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-evergreen" weight="regular" />
                <span>What is collected (strictly for your session):</span>
              </h3>
              <ul className="space-y-2 text-charcoal/85 leading-relaxed">
                <li>
                  &bull; <strong>Free-text session input:</strong> When you describe your concern (e.g. &ldquo;rough, bumpy skin on arms&rdquo;), we process this text ephemerally in-memory to extract categories and format preferences. Server loggers redact request bodies so free text is never written to disk or logs.
                </li>
                <li>
                  &bull; <strong>Anonymous session ID:</strong> A client-generated random string (e.g. <code>session_1731...</code>) stored in your browser so you can navigate through the 3-step match flow.
                </li>
                <li>
                  &bull; <strong>Optional feedback:</strong> If you rate a recommendation (&ldquo;Was this shortlist useful?&rdquo;), we store the rating and optional note. Community aggregation requires explicit consent.
                </li>
              </ul>
            </div>

            {/* What is NOT collected */}
            <div className="p-5 rounded-card bg-surface-sage/30 border border-border space-y-3">
              <h3 className="font-bold text-sm text-brand-deep flex items-center gap-2">
                <XCircle className="w-4 h-4 text-caution-text" weight="regular" />
                <span>What is NOT collected:</span>
              </h3>
              <ul className="space-y-2 text-charcoal/85 leading-relaxed">
                <li>
                  &bull; <strong>No Photos:</strong> Photo upload is disabled in this prototype. We do not accept, upload, or store user photos.
                </li>
                <li>
                  &bull; <strong>No Contact Details:</strong> We never ask for your name, phone number, email address, physical address, or social accounts.
                </li>
                <li>
                  &bull; <strong>No Medical History:</strong> We never request age, clinical conditions, prescription drug history, or doctor records.
                </li>
                <li>
                  &bull; <strong>No Order or Courier IDs:</strong> We have zero connection to courier tracking, payment gateways, or warehouse systems.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Retention Period */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Lock className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>2. Data Retention Period (30 Days)</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Anonymous session identifiers and optional feedback records submitted to the server are retained for a <strong>maximum of 30 days</strong> in an ephemeral in-memory cache for quality evaluation, after which they are permanently expunged.
          </p>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Data stored locally in your browser (draft intakes, comparison items, saved trials) remains on your device until you clear your browser storage or use our deletion tool.
          </p>
        </section>

        {/* 3. AI Provider Handling (When LLM is Enabled) & Knowledge Base Provenance */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Stack className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>3. AI Provider Handling &amp; Product Knowledge Base</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            Our primary matching engine runs entirely deterministically using pure TypeScript rules without sending data to any AI provider. When the optional server-side LLM parser is enabled, free-text inputs may be sent to an AI provider (Groq) strictly for multi-need shopping intent interpretation.
          </p>
          <div className="p-4 rounded-card bg-surface border border-border space-y-2.5 text-xs sm:text-sm text-charcoal/85">
            <p>&bull; <strong>Structured JSON enforcement:</strong> The AI model receives instructions to extract intent into a Zod schema only. It is strictly forbidden from clinical evaluations, medical claims, or inventing products.</p>
            <p>&bull; <strong>Knowledge card provenance:</strong> Product knowledge cards are built strictly from official published product pages, label packaging, and verified catalogue ingredients. No external brand guesses or unevidenced claims are ever included.</p>
            <p>&bull; <strong>Deterministic ranking (AI interprets, rules decide):</strong> The LLM does not rank products or write final recommendations. All ranking is pure TypeScript logic using concept evidence matches and verified facts.</p>
            <p>&bull; <strong>Pre-flight PII sanitization:</strong> Automated regex filters strip phone numbers and email addresses before text is transmitted.</p>
            <p>&bull; <strong>1,500 character input cap:</strong> Excessive inputs are truncated to prevent prompt leakage or misuse.</p>
            <p>&bull; <strong>Zero-retention agreement:</strong> Calls are configured with temperature 0 and strict non-training, zero-retention API policies. User text is never used to train foundation models.</p>
            <p>&bull; <strong>8-second timeout &amp; silent fallback:</strong> If the model takes longer than the timeout window (15 seconds on cold start or 8-second timeout threshold) or returns invalid JSON, the system immediately and silently falls back to Strategy A rules. The UI shows transparent provenance tags (&ldquo;Interpreted with AI&rdquo; or &ldquo;Interpreted with rules&rdquo;).</p>
          </div>
        </section>

        {/* 4. Cookies & Local Storage Breakdown */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>4. Local Storage &amp; Cookies Used</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            We use <strong>zero third-party tracking cookies</strong> and zero advertising pixels. The only items stored exist locally in your browser to maintain session state:
          </p>

          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper border-b border-border text-brand-deep font-bold">
                <tr>
                  <th className="p-3">Storage Key</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-charcoal/80">
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_parsed_needs</td>
                  <td className="p-3">sessionStorage</td>
                  <td className="p-3">Stores your stated goal, format preference, and avoidances during your active visit. Wiped when you close the tab.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_compare_ids</td>
                  <td className="p-3">sessionStorage</td>
                  <td className="p-3">Stores up to 3 product slugs selected for the side-by-side comparison matrix.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_last_session_id</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">An anonymous ID to link feedback submissions without asking for your identity.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_saved_trials</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Stores product slug and timestamp when you click &ldquo;Save on this device&rdquo; for a 7-day follow-up.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_help_*</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Stores checklist ticks and drafted order details locally so you can copy them into official support channels.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-brand-deep">bodywise_medical_notice_dismissed</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Remembers that you dismissed the top medical disclaimer banner.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Data Deletion Route */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-deep tracking-tight flex items-center gap-2">
            <Trash className="w-6 h-6 text-brand-evergreen" weight="regular" />
            <span>5. Inspect, Export, or Delete Your Data</span>
          </h2>
          <p className="text-sm sm:text-base text-charcoal/85 leading-relaxed">
            You retain absolute control over any record created in Bodywise Match. We provide a dedicated self-service data management center where you can:
          </p>
          <div className="p-5 rounded-card bg-surface-sage/35 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-sm text-brand-deep block">
                User Privacy &amp; Data Center
              </span>
              <p className="text-xs text-charcoal/80">
                Inspect raw JSON browser storage, download an open JSON export, or permanently erase all local storage and server session records.
              </p>
            </div>
            <Link
              href="/privacy/data"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button bg-brand-evergreen text-white hover:bg-brand-deep font-bold text-xs focus-ring transition-colors shrink-0 active:scale-[0.98] motion-safe:transition-transform"
            >
              <span>Manage Your Data</span>
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
