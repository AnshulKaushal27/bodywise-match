"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DownloadSimple,
  Trash,
  ShieldCheck,
  Eye,
  CheckCircle,
  Database,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { DemoBadge, Button } from "@/components/ui";
import { deleteServerSession } from "@/lib/api";

interface LocalDataSummary {
  sessionNeeds: Record<string, unknown> | null;
  compareIds: string[];
  savedTrials: Array<{ slug: string; name: string; saved_at: number; dismissed?: boolean }>;
  helpChecklists: Record<string, string[]>;
  helpFields: Record<string, Record<string, string>>;
  lastSessionId: string | null;
}

export default function PrivacyDataPage() {
  const [dataSummary, setDataSummary] = React.useState<LocalDataSummary>({
    sessionNeeds: null,
    compareIds: [],
    savedTrials: [],
    helpChecklists: {},
    helpFields: {},
    lastSessionId: null,
  });

  const [rawJson, setRawJson] = React.useState<string>("{}");
  const [showRawJson, setShowRawJson] = React.useState<boolean>(false);

  // Status notices
  const [localDeletedNotice, setLocalDeletedNotice] = React.useState<boolean>(false);
  const [serverDeleteInput, setServerDeleteInput] = React.useState<string>("");
  const [serverDeleteStatus, setServerDeleteStatus] = React.useState<string | null>(null);
  const [isDeletingServer, setIsDeletingServer] = React.useState<boolean>(false);

  // Load and inspect all browser storage
  const inspectStorage = React.useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Session Storage
      const rawNeeds = sessionStorage.getItem("bodywise_parsed_needs");
      const sessionNeeds = rawNeeds ? JSON.parse(rawNeeds) : null;

      const rawCompare = sessionStorage.getItem("bodywise_compare_ids");
      const compareIds = rawCompare ? JSON.parse(rawCompare) : [];

      // 2. Local Storage
      const rawTrials = localStorage.getItem("bodywise_saved_trials");
      const savedTrials = rawTrials ? JSON.parse(rawTrials) : [];

      const lastSessionId = localStorage.getItem("bodywise_last_session_id");
      if (lastSessionId) {
        setServerDeleteInput(lastSessionId);
      }

      // Help items
      const helpChecklists: Record<string, string[]> = {};
      const helpFields: Record<string, Record<string, string>> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("bodywise_help_checklist_")) {
          const val = localStorage.getItem(key);
          if (val) helpChecklists[key] = JSON.parse(val);
        } else if (key && key.startsWith("bodywise_help_fields_")) {
          const val = localStorage.getItem(key);
          if (val) helpFields[key] = JSON.parse(val);
        }
      }

      const summary: LocalDataSummary = {
        sessionNeeds,
        compareIds,
        savedTrials,
        helpChecklists,
        helpFields,
        lastSessionId,
      };

      setDataSummary(summary);
      setRawJson(JSON.stringify(summary, null, 2));
    } catch {
      // Ignore
    }
  }, []);

  React.useEffect(() => {
    inspectStorage();
  }, [inspectStorage]);

  // Export Local Data (JSON Download)
  const handleExportData = () => {
    try {
      const exportBlob = new Blob([rawJson], { type: "application/json" });
      const url = URL.createObjectURL(exportBlob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `bodywise-match-data-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }
  };

  // Delete All Local Data
  const handleDeleteLocalData = () => {
    if (typeof window === "undefined") return;

    try {
      // Clear help and trial items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("bodywise_") || key.includes("help") || key.includes("trial"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Clear session items
      sessionStorage.removeItem("bodywise_parsed_needs");
      sessionStorage.removeItem("bodywise_compare_ids");

      setLocalDeletedNotice(true);
      inspectStorage();
      setTimeout(() => setLocalDeletedNotice(false), 5000);
    } catch {
      // Ignore
    }
  };

  // Delete Server Session by ID
  const handleDeleteServerSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverDeleteInput.trim()) return;

    setIsDeletingServer(true);
    setServerDeleteStatus(null);

    try {
      const success = await deleteServerSession(serverDeleteInput.trim());
      if (success) {
        setServerDeleteStatus(`Server session "${serverDeleteInput.trim()}" has been permanently erased.`);
        if (typeof window !== "undefined") {
          localStorage.removeItem("bodywise_last_session_id");
        }
        inspectStorage();
      } else {
        setServerDeleteStatus(`Session "${serverDeleteInput.trim()}" was not found or already removed.`);
      }
    } catch {
      setServerDeleteStatus("Unable to reach server. Please check your network connection.");
    } finally {
      setIsDeletingServer(false);
    }
  };

  const hasAnyData =
    Boolean(dataSummary.sessionNeeds) ||
    dataSummary.compareIds.length > 0 ||
    dataSummary.savedTrials.length > 0 ||
    Object.keys(dataSummary.helpChecklists).length > 0 ||
    Object.keys(dataSummary.helpFields).length > 0 ||
    Boolean(dataSummary.lastSessionId);

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col justify-between selection:bg-accent-lime selection:text-brand-deep">
      {/* Top Navigation */}
      <header className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-container mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/privacy"
            className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-evergreen hover:text-brand-deep focus-ring px-2 py-1 rounded transition-colors active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowLeft className="w-4 h-4" weight="regular" />
            <span>Privacy Policy</span>
          </Link>

          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="font-display font-bold text-brand-deep text-sm md:text-base tracking-tight">
              Bodywise Match
            </span>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-muted hover:text-charcoal focus-ring px-2 py-1 rounded active:scale-[0.98] motion-safe:transition-transform"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-prose md:max-w-3xl mx-auto px-5 py-8 md:py-12 flex-1 w-full space-y-8">
        {/* Header Intro */}
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-brand-evergreen">
            User Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-brand-deep tracking-tight mt-1 mb-2">
            Your Privacy &amp; Data Management
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
            Inspect, export, or permanently erase all data stored in your local browser or associated with your anonymous session.
          </p>
        </div>

        {/* Local Deletion Feedback Notice */}
        {localDeletedNotice && (
          <div className="p-4 rounded-button bg-success-bg border border-success-text/30 text-success-text text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0" weight="regular" />
            <span>All local browser records (intake drafts, comparison shortlists, saved trials, and help notes) have been permanently erased.</span>
          </div>
        )}

        {/* ================= 1. VIEW LOCAL DATA ================= */}
        <section aria-labelledby="view-local-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-evergreen" weight="regular" />
              <h2 id="view-local-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
                1. Local Data Stored on this Device
              </h2>
            </div>
            <button
              type="button"
              onClick={inspectStorage}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-charcoal underline"
            >
              <ArrowsClockwise className="w-3 h-3" weight="regular" />
              <span>Refresh</span>
            </button>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Bodywise Match operates without mandatory accounts or logins. The records below exist strictly in your browser storage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-button bg-paper border border-border">
              <span className="font-bold text-brand-deep block mb-1">
                Stated Concern &amp; Goals
              </span>
              <span className="text-charcoal">
                {dataSummary.sessionNeeds ? (
                  <>Goal: <strong className="font-semibold">{String(dataSummary.sessionNeeds.goal || "None")}</strong></>
                ) : (
                  <span className="italic text-muted">No active intake session</span>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-button bg-paper border border-border">
              <span className="font-bold text-brand-deep block mb-1">
                Product Comparison Shortlist
              </span>
              <span className="text-charcoal">
                {dataSummary.compareIds.length > 0 ? (
                  <>{dataSummary.compareIds.length} products staged for comparison</>
                ) : (
                  <span className="italic text-muted">No comparison items</span>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-button bg-paper border border-border">
              <span className="font-bold text-brand-deep block mb-1">
                Saved Product Trials
              </span>
              <span className="text-charcoal">
                {dataSummary.savedTrials.length > 0 ? (
                  <>{dataSummary.savedTrials.length} products saved on this device</>
                ) : (
                  <span className="italic text-muted">No saved trials</span>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-button bg-paper border border-border">
              <span className="font-bold text-brand-deep block mb-1">
                Help Centre Drafts &amp; Checklists
              </span>
              <span className="text-charcoal">
                {Object.keys(dataSummary.helpFields).length > 0 || Object.keys(dataSummary.helpChecklists).length > 0 ? (
                  <>{Object.keys(dataSummary.helpFields).length} draft issue notes saved</>
                ) : (
                  <span className="italic text-muted">No saved help drafts</span>
                )}
              </span>
            </div>
          </div>

          {/* Toggle Raw JSON Inspector */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-evergreen hover:text-brand-deep underline focus-ring py-1 px-1 rounded active:scale-[0.98] motion-safe:transition-transform"
            >
              <Eye className="w-3.5 h-3.5" weight="regular" />
              <span>{showRawJson ? "Hide Raw JSON Data" : "Inspect Raw JSON Storage"}</span>
            </button>

            {showRawJson && (
              <div className="mt-3 p-3.5 rounded-button bg-brand-deep text-surface text-[11px] font-mono overflow-x-auto max-h-60 border border-border animate-fade-in">
                <pre>{rawJson}</pre>
              </div>
            )}
          </div>
        </section>

        {/* ================= 2. EXPORT & DELETE LOCAL DATA ================= */}
        <section aria-labelledby="export-delete-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="pb-3 border-b border-border/70">
            <h2 id="export-delete-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
              2. Export or Delete Local Data
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Download a copy of your records in open JSON format or permanently purge all browser storage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={handleExportData}
              disabled={!hasAnyData}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold"
            >
              <DownloadSimple className="w-4 h-4 text-brand-evergreen" weight="regular" />
              <span>Export my local data (JSON)</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={handleDeleteLocalData}
              disabled={!hasAnyData}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-error-text hover:bg-error-bg/30 border-border"
            >
              <Trash className="w-4 h-4 text-error-text" weight="regular" />
              <span>Delete all local data</span>
            </Button>
          </div>
        </section>

        {/* ================= 3. DELETE SERVER SESSION BY ID ================= */}
        <section aria-labelledby="server-delete-heading" className="p-6 rounded-card bg-surface border border-border shadow-sm space-y-4">
          <div className="pb-3 border-b border-border/70">
            <h2 id="server-delete-heading" className="font-display font-bold text-base sm:text-lg text-brand-deep tracking-tight">
              3. Delete Server Session by ID
            </h2>
            <p className="text-xs text-muted mt-0.5">
              If you provided optional feedback or shortlist ratings, erase any record associated with your session identifier.
            </p>
          </div>

          <form onSubmit={handleDeleteServerSession} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="session-id-input" className="block text-xs font-bold text-brand-deep">
                Anonymous Session / Request ID
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  id="session-id-input"
                  type="text"
                  value={serverDeleteInput}
                  onChange={(e) => setServerDeleteInput(e.target.value)}
                  placeholder="e.g. session_1731920192_abcde"
                  className="flex-1 py-2.5 px-3 rounded-button bg-paper border border-border text-charcoal text-xs sm:text-sm font-mono focus-ring"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  disabled={!serverDeleteInput.trim() || isDeletingServer}
                  className="text-xs font-bold shrink-0"
                >
                  {isDeletingServer ? "Erasing..." : "Delete server session"}
                </Button>
              </div>
            </div>

            {serverDeleteStatus && (
              <div className="p-3 rounded-button bg-surface-sage/40 border border-brand-evergreen/30 text-xs text-brand-deep font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-brand-evergreen shrink-0" weight="regular" />
                <span>{serverDeleteStatus}</span>
              </div>
            )}
          </form>
        </section>

        {/* Mandatory Transparency Callout */}
        <div className="p-4 rounded-card bg-surface-sage/35 border border-border text-xs text-charcoal/85 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-brand-deep">
            <ShieldCheck className="w-4 h-4 text-brand-evergreen" weight="regular" />
            <span>Honesty &amp; Privacy Safeguards</span>
          </div>
          <p className="leading-relaxed">
            All value in Bodywise Match arrives in ONE session with zero signup required. Fastify server loggers redact request bodies to guarantee your free-text inputs are never written to disk or logs.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-5 text-center text-xs text-muted">
        <p>Bodywise Match &bull; Client-Side Privacy Controls</p>
      </footer>
    </div>
  );
}
