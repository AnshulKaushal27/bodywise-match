"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Chip,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  DemoBadge,
  SourceTag,
  Input,
  Textarea,
  Select,
  Stepper,
  ProgressBar,
  Callout,
  Accordion,
  Tabs,
  Dialog,
  Skeleton,
  Toast,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function DesignSystemPage() {
  // Interactive state hooks for demonstration
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [selectedChips, setSelectedChips] = React.useState<Record<string, boolean>>({
    hair: true,
    scalp: false,
    dryness: true,
    fragranceFree: false,
  });
  const [removableList, setRemovableList] = React.useState([
    "Rosemary Oil",
    "Redensyl 3%",
    "AHA-BHA 4%",
  ]);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [progressVal, setProgressVal] = React.useState(65);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [showToast, setShowToast] = React.useState(true);
  const [inputValue, setInputValue] = React.useState("");

  const toggleChip = (key: string) => {
    setSelectedChips((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeChip = (item: string) => {
    setRemovableList((prev) => prev.filter((i) => i !== item));
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Editorial Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-container mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-evergreen flex items-center justify-center text-white font-bold text-sm">
              BM
            </div>
            <div>
              <span className="font-display font-bold text-brand-deep text-lg tracking-tight">
                Bodywise Match
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-muted font-normal">
                Design System & UI Component Spec
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DemoBadge />
            <Link
              href="/"
              className="text-sm font-medium text-brand-evergreen hover:underline focus-ring px-2 py-1 rounded"
            >
              App Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="max-w-container mx-auto px-5 pt-12 pb-8">
        <div className="max-w-prose">
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge variant="default">Design System v1.0</Badge>
            <span className="text-xs text-muted">Warm Editorial Product Finder</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-display text-brand-deep tracking-tight mb-4">
            Calm, intentional product discovery.
          </h1>
          <p className="text-lg md:text-xl text-charcoal/90 leading-relaxed font-body">
            A restrained design system for <strong>Bodywise Match</strong>. Built for editorial clarity,
            accessible touch ergonomics (44px min), high contrast (WCAG AAA/AA), and deliberate pacing
            without clinical coldness or e-commerce overload.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-container mx-auto px-5 flex flex-col gap-16">

        {/* 1. COLOR TOKENS & WCAG RATIOS */}
        <section id="colors" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              1. Color Tokens & Contrast Proof
            </h2>
            <p className="text-sm text-muted">
              Defined as CSS variables in <code>globals.css</code> and mapped to Tailwind utilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Paper */}
            <div className="p-4 rounded-xl border border-border bg-paper flex flex-col justify-between h-36 shadow-sm">
              <div>
                <span className="text-xs font-mono font-bold text-brand-deep">--bg-paper</span>
                <p className="text-xs text-muted">#F5F9FF • Canvas Cool Off-White</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-charcoal">Base Surface</span>
                <Badge variant="default">Canvas</Badge>
              </div>
            </div>

            {/* Surface */}
            <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between h-36 shadow-card">
              <div>
                <span className="text-xs font-mono font-bold text-brand-deep">--surface</span>
                <p className="text-xs text-muted">#FFFFFF • Pure Card Surface</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-charcoal">14.0:1 on charcoal</span>
                <Badge variant="success">AAA</Badge>
              </div>
            </div>

            {/* Surface Sky */}
            <div className="p-4 rounded-xl border border-border bg-surface-sage flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-mono font-bold text-brand-deep">--surface-sky</span>
                <p className="text-xs text-muted">#E3EEFC • Calming Sky Backing</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-brand-deep">12.5:1 with navy</span>
                <Badge variant="success">AAA</Badge>
              </div>
            </div>

            {/* Brand Primary */}
            <div className="p-4 rounded-xl border border-transparent bg-brand-evergreen text-white flex flex-col justify-between h-36 shadow-sm">
              <div>
                <span className="text-xs font-mono font-bold">--brand-primary</span>
                <p className="text-xs text-white/80">#1D4ED8 • Primary Action Tone</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>6.73:1 with white</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">AA</span>
              </div>
            </div>

            {/* Brand Deep */}
            <div className="p-4 rounded-xl border border-transparent bg-brand-deep text-white flex flex-col justify-between h-36 shadow-sm">
              <div>
                <span className="text-xs font-mono font-bold">--brand-deep</span>
                <p className="text-xs text-white/80">#0B2447 • Deep Navy Headings</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>14.9:1 on paper</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">AAA</span>
              </div>
            </div>

            {/* Accent Sky */}
            <div className="p-4 rounded-xl border border-brand-deep/20 bg-accent-lime text-brand-deep flex flex-col justify-between h-36 shadow-sm">
              <div>
                <span className="text-xs font-mono font-bold">--accent-sky</span>
                <p className="text-xs text-brand-deep/80">#BBD9FF • Restrained Accent</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">11.0:1 with deep navy</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep font-bold text-[10px]">AAA</span>
              </div>
            </div>

            {/* Caution Peach */}
            <div className="p-4 rounded-xl border border-caution-text/20 bg-caution-peach text-caution-text flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-mono font-bold">--caution-peach</span>
                <p className="text-xs text-caution-text/80">#FBE3D3 • Safety / Caution Box</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">6.53:1 contrast</span>
                <Badge variant="caution">AA</Badge>
              </div>
            </div>

            {/* Text Charcoal */}
            <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between h-36">
              <div>
                <span className="text-xs font-mono font-bold text-charcoal">--text-charcoal</span>
                <p className="text-xs text-muted">#1B2A41 • High-Legibility Body</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal font-medium">13.3:1 on paper</span>
                <Badge variant="success">AAA</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TYPOGRAPHY */}
        <section id="typography" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              2. Typography System
            </h2>
            <p className="text-sm text-muted">
              Display: <strong>DM Sans</strong> (600/700) • Body: <strong>Inter</strong> (400/500/600). Reading column constrained to max 680px.
            </p>
          </div>

          <Card variant="surface" className="flex flex-col gap-6 divide-y divide-border">
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-xs text-muted font-mono">Display H1 • 56px desktop / 38px mobile • -0.02em</span>
              <p className="text-4xl md:text-5xl font-bold font-display text-brand-deep tracking-tight">
                Understand what other customers report.
              </p>
            </div>

            <div className="flex flex-col gap-1 pt-6">
              <span className="text-xs text-muted font-mono">Display H2 • 30px • font-display</span>
              <p className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
                Here is why this appears in your shortlist
              </p>
            </div>

            <div className="flex flex-col gap-1 pt-6">
              <span className="text-xs text-muted font-mono">Body Regular • 16px • line-height 1.6</span>
              <div className="max-w-prose">
                <p className="text-base text-charcoal leading-relaxed font-body">
                  We look at real feedback patterns across daily use, formulation tolerance, and active
                  ingredients. This product may be relevant to your stated goal based on your skin type
                  and current routine consistency.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-6">
              <span className="text-xs text-muted font-mono">Secondary / Metadata • 14px • text-muted</span>
              <p className="text-sm text-muted font-normal">
                Verified against official brand specifications on 18 November 2026.
              </p>
            </div>
          </Card>
        </section>

        {/* 3. BUTTONS */}
        <section id="buttons" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              3. Buttons & Action States
            </h2>
            <p className="text-sm text-muted">
              Min height 48px, minimum 44×44px touch targets. Ever-present focus ring indicators.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center p-6 rounded-card bg-surface border border-border">
            <Button variant="primary">
              Primary Action
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <Button variant="secondary">
              Secondary Action
            </Button>

            <Button variant="ghost">
              Ghost Link Action
            </Button>

            <Button
              variant="primary"
              isLoading={btnLoading}
              onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 2000);
              }}
            >
              {btnLoading ? "Processing..." : "Click to Test Loading"}
            </Button>

            <Button variant="primary" disabled>
              Disabled State
            </Button>

            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </div>
        </section>

        {/* 4. CHIPS, BADGES & PROVENANCE */}
        <section id="chips" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              4. Chips, Badges & Fact Provenance
            </h2>
            <p className="text-sm text-muted">
              Selected chips use accent-sky (#BBD9FF). Rule 4: All sample data is explicitly flagged with DemoBadge.
            </p>
          </div>

          <div className="flex flex-col gap-6 p-6 rounded-card bg-surface border border-border">
            {/* Selectable Chips */}
            <div>
              <h4 className="text-sm font-semibold text-brand-deep mb-3">Selectable Chips (Interactive)</h4>
              <div className="flex flex-wrap gap-2.5">
                <Chip
                  selected={selectedChips.hair}
                  onSelectChange={() => toggleChip("hair")}
                >
                  Hair Density Support
                </Chip>
                <Chip
                  selected={selectedChips.scalp}
                  onSelectChange={() => toggleChip("scalp")}
                >
                  Scalp Oil Balance
                </Chip>
                <Chip
                  selected={selectedChips.dryness}
                  onSelectChange={() => toggleChip("dryness")}
                >
                  Non-Drying Cleanser
                </Chip>
                <Chip
                  selected={selectedChips.fragranceFree}
                  onSelectChange={() => toggleChip("fragranceFree")}
                >
                  Fragrance-Free Formulation
                </Chip>
              </div>
            </div>

            {/* Removable & Editable Chips */}
            <div>
              <h4 className="text-sm font-semibold text-brand-deep mb-3">Removable & Editable Chips</h4>
              <div className="flex flex-wrap gap-2.5">
                {removableList.map((item) => (
                  <Chip
                    key={item}
                    removable
                    onRemove={() => removeChip(item)}
                    editable
                    onEdit={() => alert(`Editing: ${item}`)}
                  >
                    {item}
                  </Chip>
                ))}
                {removableList.length === 0 && (
                  <span className="text-xs text-muted italic">All items removed.</span>
                )}
              </div>
            </div>

            {/* Badges & DemoBadges */}
            <div>
              <h4 className="text-sm font-semibold text-brand-deep mb-3">Badges & Sample Data Labels</h4>
              <div className="flex flex-wrap gap-3 items-center">
                <DemoBadge />
                <Badge variant="default">Verified Active</Badge>
                <Badge variant="caution">Patch Test Recommended</Badge>
                <Badge variant="success">Clinical Data Available</Badge>
                <Badge variant="error">High Allergen Risk</Badge>
              </div>
            </div>

            {/* SourceTag Provenance */}
            <div>
              <h4 className="text-sm font-semibold text-brand-deep mb-3">Catalogue Fact Provenance (Rule 3)</h4>
              <div className="flex flex-wrap gap-3 items-center">
                <SourceTag source="Official Brand Catalogue" lastVerifiedAt="18 Nov 2026" />
                <SourceTag source="Clinical Dossier" lastVerifiedAt="02 Oct 2026" />
                <SourceTag source={null} lastVerifiedAt={null} />
              </div>
            </div>
          </div>
        </section>

        {/* 5. FORM CONTROLS */}
        <section id="inputs" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              5. Form Inputs & Interactive Controls
            </h2>
            <p className="text-sm text-muted">
              52px min-height, 12px radius, visible focus ring on focus-visible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-card bg-surface border border-border">
            <Input
              label="Describe your primary goal"
              placeholder="e.g. My scalp feels dry and hair feels thinner at temples"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Describe freely in plain language. Your input is never logged."
            />

            <Input
              label="Input with Error State"
              defaultValue="Invalid percentage active"
              error="Active ingredient concentration must be between 1% and 10%."
            />

            <Select
              label="Primary Hair / Skin Concern Area"
              helperText="Helps filter out incompatible formulations"
              options={[
                { value: "scalp", label: "Scalp density & hair thinning" },
                { value: "underarm", label: "Underarm odour & texture" },
                { value: "body", label: "Body acne & back bumps" },
                { value: "hydration", label: "Skin barrier & dryness" },
              ]}
            />

            <Textarea
              label="Routine Notes or Sensitivities"
              placeholder="e.g. Sensitive to essential oils, experienced stinging with AHA previously"
              helperText="Optional details to help refine shortlists"
            />
          </div>
        </section>

        {/* 6. STEPPER & PROGRESS */}
        <section id="progress" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              6. Stepper & Progress Bar
            </h2>
            <p className="text-sm text-muted">
              Guides the user one clarifying question at a time. Progress bar fill is accent-lime.
            </p>
          </div>

          <Card variant="surface" className="flex flex-col gap-8">
            <div>
              <h4 className="text-sm font-semibold text-brand-deep mb-4">Discovery Stepper</h4>
              <Stepper
                currentStepIndex={currentStep}
                onStepClick={(idx) => setCurrentStep(idx)}
                steps={[
                  { id: "1", label: "Concern", description: "State goal" },
                  { id: "2", label: "Clarification", description: "1 question" },
                  { id: "3", label: "Shortlist", description: "2-3 matches" },
                  { id: "4", label: "Support", description: "Issue guide" },
                ]}
              />
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentStep <= 0}
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                >
                  Previous Step
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentStep >= 3}
                  onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                >
                  Next Step
                </Button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-brand-deep">Progress Bar with Accent Lime Fill</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProgressVal(30)}
                    className="text-xs px-2 py-1 rounded bg-surface-sage text-brand-deep hover:bg-surface-sage/80"
                  >
                    30%
                  </button>
                  <button
                    onClick={() => setProgressVal(65)}
                    className="text-xs px-2 py-1 rounded bg-surface-sage text-brand-deep hover:bg-surface-sage/80"
                  >
                    65%
                  </button>
                  <button
                    onClick={() => setProgressVal(100)}
                    className="text-xs px-2 py-1 rounded bg-surface-sage text-brand-deep hover:bg-surface-sage/80"
                  >
                    100%
                  </button>
                </div>
              </div>
              <ProgressBar value={progressVal} showLabel />
            </div>
          </Card>
        </section>

        {/* 7. CALLOUTS & SAFETY NOTICES */}
        <section id="callouts" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              7. Callouts & Safety Caution Boxes
            </h2>
            <p className="text-sm text-muted">
              Left 4px border. Caution callouts use peach background with caution-text for clinical safety caveats.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Callout
              variant="caution"
              title="Active Ingredient Note: Early Shedding Is Normal"
            >
              When starting Redensyl or Aminexil formulations, temporary shedding during the first 2–4 weeks is biologically common as hair enters the anagen growth cycle. Discontinue use if intense scalp itching or redness occurs.
            </Callout>

            <Callout
              variant="info"
              title="Editorial Matching Note"
            >
              Our recommendation engine uses deterministic ingredient matching. We do not evaluate skin diseases or prescribe medical treatments.
            </Callout>

            <Callout
              variant="success"
              title="Ingredient Formulation Verified"
            >
              This batch conforms to the declared 4% AHA-BHA chemical exfoliator balance verified by public product documentation.
            </Callout>

            <Callout
              variant="error"
              title="Incompatible Ingredient Conflict"
            >
              Do not layer this 1% Salicylic Acid wash with concentrated direct retinoid solutions in the same evening shower routine.
            </Callout>
          </div>
        </section>

        {/* 8. CARDS, ACCORDIONS, TABS & DIALOGS */}
        <section id="layout" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              8. Cards, Accordions, Tabs & Modal Dialogs
            </h2>
            <p className="text-sm text-muted">
              18px card radii, 0 6px 24px soft elevation, full keyboard and screen reader accessibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample Product Match Card */}
            <Card variant="surface">
              <CardHeader>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Badge variant="default">Hair Care</Badge>
                  <DemoBadge />
                </div>
                <CardTitle>Hair Regrowth Roll-On Serum</CardTitle>
                <CardDescription>
                  Formulated with 3% Redensyl, 3% Rosemary & 2% Aminexil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-xl bg-surface-sage/30 text-sm">
                  <p className="font-semibold text-brand-deep mb-1">Why this appears in your shortlist:</p>
                  <p className="text-charcoal/90 text-xs leading-relaxed">
                    Matches your stated goal for targeted temple density without leaving oily residue.
                  </p>
                </div>
                <SourceTag source="Brand Official Website" lastVerifiedAt="18 Nov 2026" />
              </CardContent>
              <CardFooter className="justify-between">
                <div>
                  <span className="text-xs text-muted block">Estimated Price</span>
                  <span className="text-lg font-bold text-brand-deep font-display">₹699</span>
                </div>
                <Button variant="primary" size="sm">
                  View Explained Match
                </Button>
              </CardFooter>
            </Card>

            {/* Tabs & Dialog Triggers */}
            <div className="flex flex-col gap-4">
              <Card variant="surface">
                <CardTitle className="text-lg mb-3">Segmented Views (Tabs)</CardTitle>
                <Tabs
                  tabs={[
                    {
                      id: "overview",
                      label: "Overview",
                      content: (
                        <p className="text-sm text-charcoal leading-relaxed">
                          Clean editorial summaries explaining the mechanism of action without curative promises.
                        </p>
                      ),
                    },
                    {
                      id: "feedback",
                      label: "Customer Signals",
                      content: (
                        <p className="text-sm text-charcoal leading-relaxed">
                          Reviews indicate noticeable texture benefits by week 6, but scent is unscented.
                        </p>
                      ),
                    },
                    {
                      id: "caution",
                      label: "Usage Rules",
                      content: (
                        <p className="text-sm text-charcoal leading-relaxed">
                          Apply directly once daily before sleep. Patch test on inner arm first.
                        </p>
                      ),
                    },
                  ]}
                />
              </Card>

              {/* Dialog Trigger */}
              <Card variant="sage" className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-brand-deep">Interactive Modal Dialog</h4>
                  <p className="text-xs text-muted">Accessible focus trap & backdrop</p>
                </div>
                <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
                  Open Dialog
                </Button>
              </Card>
            </div>
          </div>

          {/* Accordion */}
          <div className="mt-4">
            <h4 className="text-lg font-bold font-display text-brand-deep mb-3">Editorial FAQ (Accordion)</h4>
            <Accordion
              defaultOpenId="item-1"
              items={[
                {
                  id: "item-1",
                  title: "How does the deterministic matching logic work?",
                  content: (
                    <p>
                      The matcher uses pure TypeScript rules that weigh active ingredients, tolerance checks,
                      and declared user goals. An LLM never makes the final recommendation or fabricates product facts.
                    </p>
                  ),
                },
                {
                  id: "item-2",
                  title: "Why are photo uploads disabled?",
                  content: (
                    <p>
                      To respect strict user privacy and avoid making unsubstantiated diagnostic claims from images.
                      Photo analysis affordances are reserved for future verified clinical integrations.
                    </p>
                  ),
                },
                {
                  id: "item-3",
                  title: "What happens if a product fact is unverified?",
                  content: (
                    <p>
                      Every fact requires a verified source and timestamp. If unverified, it remains null and
                      displays "Not verified yet" to ensure strict integrity.
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </section>

        {/* 9. RESILIENT STATES: EMPTY, ERROR & SKELETON (Rule 9) */}
        <section id="states" className="flex flex-col gap-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-brand-deep">
              9. Resilience States (Loading, Empty, Error & Toast)
            </h2>
            <p className="text-sm text-muted">
              Rule 9: Always provide loading, empty, error, and offline states. Never a blank screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Empty State */}
            <EmptyState
              title="No Shortlisted Products Found"
              description="We couldn't find an exact match for that specific ingredient combination. Try broadening your goal."
              actionLabel="Reset Discovery Form"
              onAction={() => alert("Reset clicked")}
            />

            {/* Error State */}
            <ErrorState
              title="Connection Interrupted"
              description="Unable to reach the matching service. Don't worry, your selections have been saved locally."
              retryLabel="Retry Match"
              onRetry={() => alert("Retrying connection")}
              secondaryActionLabel="Explore Catalogue"
              onSecondaryAction={() => alert("Catalogue clicked")}
            />
          </div>

          {/* Skeletons */}
          <div className="p-6 rounded-card bg-surface border border-border">
            <h4 className="text-sm font-semibold text-brand-deep mb-3">Loading Skeletons (Warm Editorial Pulse)</h4>
            <div className="flex flex-col gap-3">
              <Skeleton variant="text" className="h-6 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {showToast && (
            <div className="flex justify-center">
              <Toast
                type="success"
                title="Shortlist Saved to Session"
                message="Your recommendations are ready to review without requiring an account."
                onDismiss={() => setShowToast(false)}
              />
            </div>
          )}
        </section>
      </main>

      {/* Modal Dialog Instance */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="What To Do If An Experience Goes Wrong"
        description="Transparent guidance for order issues and unexpected skin reactions."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
              Understood
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm">
          <Callout variant="caution" title="Immediate Discontinuation">
            If you experience stinging or hives, rinse with cool water immediately. Active skincare is not one-size-fits-all.
          </Callout>
          <p className="text-charcoal leading-relaxed">
            For delayed deliveries or package discrepancies, you can reach out through official verified customer support routes with your order reference number.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
