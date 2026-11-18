"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle,
  Warning,
  ArrowsClockwise,
  HardDrives,
  Cpu,
  Database,
  BookOpen,
  Sparkle,
  ShieldCheck,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import {
  fetchApiHealth,
  ApiHealthResponse,
  API_HEALTH_URL,
  API_ROOT_URL,
} from "@/lib/api";
import { RULES_VERSION, CATALOGUE_VERSION, DEMO_CATALOGUE_SEED } from "@bodywise/shared";
import { DemoBadge } from "@/components/ui";

export function StatusClient() {
  const [health, setHealth] = React.useState<ApiHealthResponse | null>(null);
  const [latency, setLatency] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);

  const checkStatus = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApiHealth();
      setLatency(res.latencyMs);
      if (res.ok && res.data) {
        setHealth(res.data);
      } else {
        setHealth(null);
        setError(res.error || "API server is currently unreachable or cold-starting.");
      }
    } catch (err: unknown) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const isOnline = Boolean(health && health.status === "ok");

  return (
    <div className="space-y-8">
      {/* Overall Status Banner */}
      <section
        aria-live="polite"
        className={`p-6 rounded-card border transition-all ${
          isOnline
            ? "bg-brand-sage/20 border-brand-sage text-brand-deep"
            : "bg-surface border-border text-foreground"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5">
              {isLoading ? (
                <ArrowsClockwise className="w-6 h-6 text-brand-evergreen animate-spin" weight="regular" />
              ) : isOnline ? (
                <CheckCircle className="w-6 h-6 text-brand-evergreen flex-shrink-0" weight="regular" />
              ) : (
                <Warning className="w-6 h-6 text-amber-700 flex-shrink-0" weight="regular" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-lg text-brand-deep">
                  {isLoading
                    ? "Checking system diagnostics..."
                    : isOnline
                    ? "All Core Systems Operational"
                    : "Autonomous Local Mode Active"}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isOnline
                      ? "bg-brand-evergreen text-white"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isLoading ? "Probing" : isOnline ? "Online" : "Cold Start / Standby"}
                </span>
              </div>
              <p className="text-xs md:text-sm text-foreground/80 mt-1 max-w-xl">
                {isOnline
                  ? `REST API connected at ${API_ROOT_URL} with ${latency}ms latency. Pure TypeScript deterministic matching engine and catalogue verified.`
                  : "Render free tier sleeps after 15 minutes of inactivity (takes 30-60s to wake up). Client-side deterministic matching operates autonomously with zero dependencies."}
              </p>
              {lastChecked && (
                <p className="text-[11px] text-foreground/60 mt-1">
                  Last verified: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => checkStatus()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-bold rounded-button border border-brand-evergreen text-brand-evergreen bg-surface hover:bg-brand-sage/20 focus-ring transition-colors disabled:opacity-50 self-start sm:self-center active:scale-[0.98] motion-safe:transition-transform"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} weight="regular" />
            <span>{isLoading ? "Probing..." : "Refresh Status"}</span>
          </button>
        </div>
      </section>

      {/* Grid of Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: REST API Health */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <HardDrives className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">REST API Backend</h3>
                <p className="text-[11px] text-foreground/65">Fastify + Node.js (Render PaaS)</p>
              </div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
              title={isOnline ? "Operational" : "Cold start or offline"}
            />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Health Endpoint:</span>
              <a
                href={API_HEALTH_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-brand-evergreen hover:underline inline-flex items-center gap-1"
              >
                /health <ArrowSquareOut className="w-3 h-3" weight="regular" />
              </a>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Status:</span>
              <span className="font-semibold">{isOnline ? "Operational" : "Standby / Sleeping"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Response Latency:</span>
              <span className="font-mono">{latency !== null ? `${latency} ms` : "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">API Version:</span>
              <span className="font-mono">{health?.version || "0.1.0"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">Ephemeral Disk:</span>
              <span className="font-semibold text-emerald-800">Active (No local file writes)</span>
            </div>
          </div>
          {error && !isOnline && (
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
              Diagnostic note: {error}
            </p>
          )}
        </div>

        {/* Card 2: Deterministic Rules Engine */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <Cpu className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">Rules Engine</h3>
                <p className="text-[11px] text-foreground/65">Deterministic Pure TypeScript</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Deterministic rules active" />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Rules Engine Version:</span>
              <span className="font-mono font-bold text-brand-evergreen">{RULES_VERSION}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Core Principle:</span>
              <span className="font-semibold">AI interprets, rules decide</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Ranking Architecture:</span>
              <span>Deterministic scoring & filter tree</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Match Score Policy:</span>
              <span>Categorical Shortlist (No % scores)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">Medical Diagnosis:</span>
              <span className="font-semibold text-emerald-800">Zero (Explicitly forbidden)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Product Catalogue & Fact Integrity */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <BookOpen className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">Product Catalogue</h3>
                <p className="text-[11px] text-foreground/65">Fact Integrity & Sourced Provenance</p>
              </div>
            </div>
            <DemoBadge />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Catalogue Version:</span>
              <span className="font-mono font-bold text-brand-evergreen">
                {health?.catalogue_version || CATALOGUE_VERSION}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Seeded Demo Products:</span>
              <span className="font-mono">{DEMO_CATALOGUE_SEED.length} verified products</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Fact Integrity (Rule 3):</span>
              <span>Unverified fields stay null</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Missing Data UI:</span>
              <span>Shows &quot;Not verified yet&quot;</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">Fabricated Claims:</span>
              <span className="font-semibold text-emerald-800">Zero tolerance</span>
            </div>
          </div>
        </div>

        {/* Card 4: Database & Storage Strategy */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <Database className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">Database & Storage</h3>
                <p className="text-[11px] text-foreground/65">Supabase PostgreSQL (Pooled)</p>
              </div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.database === "configured" ? "bg-emerald-500" : "bg-brand-evergreen"
              }`}
              title="Database status"
            />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Storage Mode:</span>
              <span className="font-semibold">
                {health?.database === "configured"
                  ? "Supabase PostgreSQL (Active)"
                  : "In-Memory Session Store"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Connection Pooler:</span>
              <span className="font-mono">Port 6543 (PgBouncer/Supavisor)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Logging Redaction (Rule 8):</span>
              <span className="font-semibold text-emerald-800">Request bodies redacted</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Signup Requirement:</span>
              <span>Zero mandatory signup</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">Privacy Deletion:</span>
              <Link href="/privacy/data" className="text-brand-evergreen font-semibold hover:underline">
                /privacy/data &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Card 5: Intent Parsing & Strategy */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <Sparkle className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">Intent Extraction</h3>
                <p className="text-[11px] text-foreground/65">Strategy A & B Architecture</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Parser online" />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Strategy A (Deterministic):</span>
              <span className="font-semibold text-emerald-800">Always Active (Offline capable)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Strategy B (Groq LLM):</span>
              <span className="font-semibold">
                {health?.llm === "groq" || health?.llm === "enabled"
                  ? "Active (Groq API)"
                  : "Deterministic Rules Parser (Default)"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Intent Target Schema:</span>
              <span className="font-mono text-[11px]">ParsedNeedsSchema (Zod)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">AI Boundary:</span>
              <span className="text-foreground/75">Extracts intent only, never ranks</span>
            </div>
          </div>
        </div>

        {/* Card 6: Safety & Compliance Safeguards */}
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/40 flex items-center justify-center text-brand-evergreen">
                <ShieldCheck className="w-4 h-4" weight="regular" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-deep">Safety Safeguards</h3>
                <p className="text-[11px] text-foreground/65">Content & Medical Guardrails</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Safeguards active" />
          </div>

          <div className="space-y-2 text-xs text-foreground/80 border-t border-border/60 pt-3">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Prohibited Terminology:</span>
              <span className="font-semibold text-emerald-800">CI Safety Linter Verified</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Medical Diagnosis Claim:</span>
              <span>Zero (Strictly prohibited)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-foreground/60">Photo Uploads:</span>
              <span>Disabled in MVP (&quot;Coming later&quot;)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-foreground/60">Issue Resolution Guide:</span>
              <Link href="/help" className="text-brand-evergreen font-semibold hover:underline">
                /help &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Help Links */}
      <section className="bg-brand-sage/20 border border-brand-sage/60 rounded-card p-5 text-xs text-brand-deep flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold">Need assistance or want to review your local data?</p>
          <p className="text-foreground/75 mt-0.5">
            Bodywise Match operates entirely without login. All session records can be exported or purged instantly.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/privacy/data"
            className="px-3 py-1.5 rounded-button border border-brand-evergreen font-bold text-brand-evergreen hover:bg-brand-sage/30 transition-colors focus-ring active:scale-[0.98] motion-safe:transition-transform"
          >
            Manage Data
          </Link>
          <Link
            href="/help"
            className="px-3 py-1.5 rounded-button bg-brand-evergreen text-white font-bold hover:bg-brand-deep transition-colors focus-ring active:scale-[0.98] motion-safe:transition-transform"
          >
            Help Centre
          </Link>
        </div>
      </section>
    </div>
  );
}
