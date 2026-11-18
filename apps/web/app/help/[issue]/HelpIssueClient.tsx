"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  WarningCircle,
  ArrowSquareOut,
  Trash,
  CheckCircle,
  Question,
} from "@phosphor-icons/react";
import {
  HelpIssueConfig,
  HELP_ISSUES,
  OFFICIAL_SUPPORT_CHANNELS,
} from "@bodywise/shared";
import { DemoBadge, Button } from "@/components/ui";

interface HelpIssueClientProps {
  issueSlug?: string;
  issueConfig?: HelpIssueConfig;
}

export function HelpIssueClient({ issueSlug, issueConfig: propConfig }: HelpIssueClientProps) {
  const issueConfig = propConfig || HELP_ISSUES.find((i) => i.slug === issueSlug) || HELP_ISSUES[0];
  const checklistStorageKey = `bodywise_help_checklist_${issueConfig.slug}`;
  const fieldsStorageKey = `bodywise_help_fields_${issueConfig.slug}`;

  // 1. Checklist State
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);

  // 2. User-entered Fields State (stored in localStorage only, never sent to server)
  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>({});

  // 3. Editable Message Template State
  const [messageText, setMessageText] = React.useState<string>(() =>
    issueConfig.generateTemplate({})
  );
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const [hasManuallyEdited, setHasManuallyEdited] = React.useState<boolean>(false);

  // Notice for cleared data
  const [clearedNotice, setClearedNotice] = React.useState<boolean>(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedChecklist = localStorage.getItem(checklistStorageKey);
        if (storedChecklist) {
          setCheckedIds(JSON.parse(storedChecklist));
        }

        const storedFields = localStorage.getItem(fieldsStorageKey);
        if (storedFields) {
          const parsed = JSON.parse(storedFields);
          setFieldValues(parsed);
          setMessageText(issueConfig.generateTemplate(parsed));
        } else {
          setMessageText(issueConfig.generateTemplate({}));
        }
      } catch {
        setMessageText(issueConfig.generateTemplate({}));
      }
    }
  }, [checklistStorageKey, fieldsStorageKey, issueConfig]);

  // Handle Checklist Item Toggle
  const toggleChecklistItem = (id: string) => {
    setCheckedIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem(checklistStorageKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Handle Field Value Change
  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => {
      const updated = { ...prev, [fieldId]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem(fieldsStorageKey, JSON.stringify(updated));
      }

      // Automatically update message template unless user has manually customized it
      if (!hasManuallyEdited) {
        setMessageText(issueConfig.generateTemplate(updated));
      }
      return updated;
    });
  };

  // Handle Copy to Clipboard
  const handleCopyMessage = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
      }
    } catch {
      // Fallback if clipboard permission is restricted
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Reset to auto-filled template
  const handleResetTemplate = () => {
    setMessageText(issueConfig.generateTemplate(fieldValues));
    setHasManuallyEdited(false);
  };

  // Clear Local Data for this issue
  const handleClearLocalData = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(checklistStorageKey);
        localStorage.removeItem(fieldsStorageKey);
        setCheckedIds([]);
        setFieldValues({});
        setMessageText(issueConfig.generateTemplate({}));
        setHasManuallyEdited(false);
        setClearedNotice(true);
        setTimeout(() => setClearedNotice(false), 4000);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/help"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>All Help Categories</span>
          </Link>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearLocalData}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-error-text underline focus-ring py-1 px-1.5 rounded active:scale-[0.98] motion-safe:transition-transform"
            title="Wipe saved inputs for this issue from your browser"
          >
            <Trash className="w-3.5 h-3.5" weight="regular" />
            <span className="hidden sm:inline">Clear my local data</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-prose md:max-w-3xl mx-auto px-5 py-8 md:py-12 flex-1 w-full space-y-8">
        {/* Issue Header */}
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
            Issue Preparation Guide
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight mt-1 mb-2">
            {issueConfig.title}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            {issueConfig.shortDescription}
          </p>
        </div>

        {/* Local Data Clear Feedback */}
        {clearedNotice && (
          <div className="p-3.5 rounded-button bg-success-bg border border-success-text/30 text-success-text text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" weight="regular" />
            <span>Local checklist and draft fields for this issue have been cleared from your browser storage.</span>
          </div>
        )}

        {/* ================= 5. CAUTION NOTE (Prominently displayed) ================= */}
        <div className="p-4 rounded-card bg-caution-peach/60 border-l-4 border-caution-text text-caution-text text-xs md:text-sm space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
            <WarningCircle className="w-4 h-4 text-caution-text shrink-0" weight="regular" />
            <span>Important Boundary &amp; Safety Note</span>
          </div>
          <p className="leading-relaxed text-charcoal/90">
            {issueConfig.caution}
          </p>
          {issueConfig.slug === "product-reaction" && (
            <p className="font-semibold text-caution-text pt-1">
              Stop using the product and consult a qualified health professional if you have a significant reaction.
            </p>
          )}
        </div>

        {/* ================= 1. SHORT CHECKLIST (stored locally) ================= */}
        <section aria-labelledby="checklist-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-evergreen" weight="regular" />
              <h2 id="checklist-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
                1. Step-by-Step Verification Checklist
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted">
              {checkedIds.length} of {issueConfig.checklist.length} completed
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Tick the items you have verified. Your checklist is saved in your browser&apos;s localStorage and never transmitted to our servers.
          </p>

          <div className="space-y-2.5">
            {issueConfig.checklist.map((item) => {
              const isChecked = checkedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3.5 rounded-button border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? "bg-surface-sage/30 border-brand-evergreen/40"
                      : "bg-paper border-border hover:bg-surface-sage/15"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="w-4 h-4 mt-0.5 rounded text-brand-evergreen focus:ring-brand-evergreen border-border cursor-pointer shrink-0"
                  />
                  <span
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isChecked ? "text-brand-deep font-medium line-through opacity-85" : "text-charcoal"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ================= 2. USER-ENTERED FIELDS (localStorage only, never sent to server) ================= */}
        <section aria-labelledby="fields-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="pb-3 border-b border-border/70">
            <h2 id="fields-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep">
              2. Prepare Your Specific Details
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Enter your information below to populate the support message template. Stored in localStorage only.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {issueConfig.fields.map((f) => {
              const val = fieldValues[f.id] || "";
              return (
                <div key={f.id} className="space-y-1.5">
                  <label htmlFor={`field-${f.id}`} className="block text-xs font-bold text-brand-deep">
                    {f.label}
                  </label>
                  <input
                    id={`field-${f.id}`}
                    type={f.type || "text"}
                    value={val}
                    onChange={(e) => handleFieldChange(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    aria-describedby={f.helperText ? `field-helper-${f.id}` : undefined}
                    className="w-full py-2.5 px-3 rounded-button bg-paper border border-border text-charcoal text-xs sm:text-sm focus-ring placeholder:text-muted/60 min-h-[44px]"
                  />
                  {f.helperText && (
                    <span id={`field-helper-${f.id}`} className="text-[11px] text-muted block">{f.helperText}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 3. EDITABLE MESSAGE TEMPLATE WITH COPY BUTTON ================= */}
        <section aria-labelledby="template-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div>
              <h2 id="template-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep">
                3. Generated Support Message Template
              </h2>
              <p className="text-xs text-muted">
                Pre-filled from your details above. You can freely edit this draft before copying.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasManuallyEdited && (
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="text-xs text-muted hover:text-charcoal underline px-2 py-1"
                >
                  Reset auto-fill
                </button>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCopyMessage}
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs min-h-[44px]"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-lime" weight="bold" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" weight="regular" />
                    <span>Copy Message</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                setHasManuallyEdited(true);
              }}
              rows={12}
              className="w-full p-4 rounded-button bg-paper border border-border text-charcoal font-mono text-xs sm:text-sm leading-relaxed focus-ring shadow-inner"
              aria-label="Support message template draft"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span>Ready to paste into Email or WhatsApp support.</span>
            <span>{messageText.length} characters</span>
          </div>
        </section>

        {/* ================= 4. "OFFICIAL SUPPORT" BOX (from data/support-links.ts) ================= */}
        <section aria-labelledby="channels-heading" className="p-6 rounded-card bg-surface-sage/35 border border-brand-evergreen/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck className="w-5 h-5 text-brand-evergreen" weight="regular" />
            <h2 id="channels-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
              4. Send Your Message via Official Channels
            </h2>
          </div>

          <p className="text-xs text-charcoal/85 leading-relaxed">
            Copy your prepared message above, then paste it into any of Be Bodywise&apos;s verified customer support portals below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {OFFICIAL_SUPPORT_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                className="p-3.5 rounded-button bg-surface border border-border flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-display font-bold text-xs sm:text-sm text-brand-deep tracking-tight">
                      {ch.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-charcoal/80 leading-relaxed mt-1">
                    {ch.description}
                  </p>
                  <div className="text-[10px] text-muted pt-2 border-t border-border/60 mt-2 space-y-0.5">
                    <div>Source: {ch.source}</div>
                    <div>Checked: {ch.last_checked}</div>
                  </div>
                </div>

                <a
                  href={ch.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-surface-sage/60 hover:bg-surface-sage border border-border text-brand-evergreen py-1.5 px-3 rounded-button focus-ring transition-colors active:scale-[0.98] motion-safe:transition-transform"
                >
                  <span>Open {ch.name}</span>
                  <ArrowSquareOut className="w-3 h-3" weight="regular" />
                </a>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-muted flex items-start gap-1.5">
            <Question className="w-3.5 h-3.5 text-brand-evergreen shrink-0 mt-0.5" weight="regular" />
            <span>
              Channels sourced from official Be Bodywise help directory. All support inquiries are handled exclusively by brand customer service personnel.
            </span>
          </div>
        </section>

        {/* Bottom Navigation */}
        <div className="pt-4 flex items-center justify-between">
          <Link
            href="/help"
            className="text-xs font-semibold text-brand-evergreen hover:text-brand-deep underline focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            &larr; Back to all help issues
          </Link>

          <button
            type="button"
            onClick={handleClearLocalData}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-error-text underline focus-ring py-1 px-2 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            <Trash className="w-3.5 h-3.5" weight="regular" />
            <span>Clear my local data</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <p>Bodywise Match &bull; Independent Resolution Assistant &bull; Data stored locally in browser</p>
      </footer>
    </div>
  );
}
