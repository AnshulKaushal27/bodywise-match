# Design Review & Audit — Bodywise Match

*Comprehensive Frontend Audit using Impeccable, UI/UX Pro Max, and Vercel Web Interface Guidelines.*
*Audit Date: 20 Nov 2026 | Antigravity AI Architecture*

---

## 1. What is Already Good & Must Be Preserved

1. **Brand Lock Identity:** The calm editorial aesthetic (`bg-paper` #F5F9FF canvas, `brand-deep` #0B2447 headings, `brand-primary` #1D4ED8 buttons) delivers a reassuring, non-clinical tone.
2. **Deterministic Matcher Integrity:** Pure TypeScript rules decide rankings; AI only parses intent. No medical diagnosis, no treatment claims, and demo data is clearly badged.
3. **Accessibility Baseline:** Semantic landmarks (`<header>`, `<main id="main-content">`, `<footer>`, `<nav>`), skip links, visible focus rings, and high text contrast (12:1+ for body text).
4. **Verified Provenance:** Fact verification stamps and official URL source citations are cleanly presented across all product cards.
5. **Reading Measure:** The `max-w-prose` (680px) column measure on reading pages (/privacy, /safety, /about) provides optimal editorial rhythm.

---

## 2. Findings Per Page (Ranked by Impact)

### A. Landing Page (`/`)
- **Hierarchy & Hero Breathing Room:** Hero section layout on mobile (390px) is compact; the headline-to-chip transition lacks deliberate editorial spacing (32px vs 48px).
- **Touch Targets:** Navigation header links have `px-2 py-1` with effective height ~28px, failing the 44px touch target requirement.
- **Card Monotony:** Feature pillars use three identical white cards; introducing subtle surface-sage differentiation elevates the editorial look without adding clutter.

### B. Match Intake (`/match`)
- **Textarea Focus & Height:** Textarea has `min-h-[110px]` which on small mobile screens pushes the continue button below the fold. Ensure smooth responsive height.
- **Error Callout Positioning:** Field validation error messages should anchor directly below the input with aria-live polite feedback.

### C. Match Confirm & Chat (`/match/confirm`)
- **Undeclared Color Classes:** `UnderstandingCard.tsx` and `GuidedQuestionCard.tsx` contain undeclared/legacy classes (`border-mist`, `text-moss`, `bg-sand`, `text-charcoal-subtle`) instead of Brand Lock tokens (`border-border`, `text-brand-evergreen`, `bg-surface-sage`, `text-muted`).
- **Font Mismatch:** In `UnderstandingCard.tsx`, `font-serif` is used instead of the Brand Lock display typeface (`font-display` / `DM Sans`).
- **Touch Target Deficit:** Chip dismiss/remove buttons and "You misunderstood me" button have `min-h-[36px]` (below 44px min).
- **Live Shortlist Contrast:** Candidate rank indicator numbers (`1.`, `2.`, `3.`) need consistent `text-brand-deep` contrast rather than subtle muted grey.

### D. Match Results (`/match/results`)
- **Active Refinement Chips Row:** Active filter chips use legacy `bg-sand` instead of `bg-surface-sage` and require smooth horizontal scrolling on 390px mobile screens without horizontal page overflow.
- **Direct Fit Badge Styling:** "Direct fit for Body wash" badge should use `bg-surface-sage` with `text-brand-deep` border for unified editorial consistency.

### E. Products Catalogue & Filters (`/products`)
- **Filter Dialog Mobile Sheet:** On 390px screens, the filter dialog should comfortably fill the mobile viewport with a fixed footer CTA ("Show N products") and 44px minimum touch targets.
- **Comparison Drawer Collision:** The sticky comparison drawer uses `z-20`, which can collide with the filter dialog backdrop (`z-50`).
- **Size Variant Buttons:** Size chips in catalogue cards need unified 44px touch targets and clear selected states.

### F. Product Detail (`/products/[slug]`)
- **Mobile Sticky Action Bar:** On 390px mobile viewports, the primary action button is pushed below lengthy ingredient matrices. Adding a subtle, non-intrusive mobile footer action bar improves usability.
- **Packaging Directions Visual Hierarchy:** Packaging directions and ingredient transparency tables benefit from subtle row-striping with `bg-surface-sage/30` for scannability.

### G. Compare Page (`/compare`)
- **Sticky Column Headers:** On mobile horizontal scroll, the sticky product column header must remain crisp with `bg-surface` and a distinct right border to indicate scrollable content.

### H. Help & Trust Pages (`/help`, `/privacy`, `/safety`, `/about`)
- **Card Spacing Rhythm:** Help issue cards have varying vertical gap on mobile (gap-3 vs gap-4); standardize to 16px (2rem on desktop).
- **Footer Touch Targets:** Footer legal and navigation links need `min-h-[44px]` touch targets.

---

## 3. Prioritised Improvement Plan (25 Items)

| # | Item Description | Scope / File | Impact Category | Tag |
| :-: | :--- | :--- | :--- | :---: |
| **1** | Replace legacy undeclared tokens (`mist`, `moss`, `sand`, `charcoal-subtle`) with Brand Lock tokens | `UnderstandingCard.tsx`, `GuidedQuestionCard.tsx`, `LivePreview.tsx` | Visual Inconsistency | **LOW RISK** |
| **2** | Replace `font-serif` with `font-display` (`DM Sans`) in `UnderstandingCard.tsx` | `UnderstandingCard.tsx` | Typography Hierarchy | **LOW RISK** |
| **3** | Ensure all interactive buttons, links, and chip triggers have `min-h-[44px]` min touch targets | Global Navigation, Headers, Chips | Accessibility (WCAG AA) | **LOW RISK** |
| **4** | Standardize card corner radii to `rounded-card` (18px) and interactive elements to `rounded-button` (12px) | Monorepo Web UI | Brand Lock Consistency | **LOW RISK** |
| **5** | Add smooth horizontal scroll container with no page overflow for active chips on mobile (390px) | `apps/web/app/match/results/page.tsx`, `/products` | Responsiveness | **LOW RISK** |
| **6** | Replace legacy `bg-sand` in results page badges with `bg-surface-sage` | `apps/web/app/match/results/page.tsx` | Visual Inconsistency | **LOW RISK** |
| **7** | Enhance keyboard focus visibility with high-contrast `focus-ring` (3px evergreen, 2px white gap) | Form inputs, dialogs, chips | Accessibility | **LOW RISK** |
| **8** | Standardize micro-interaction motion timing (150–200ms ease-out, reduced-motion safe) | Global UI components | Motion Budget (Level 3) | **LOW RISK** |
| **9** | Elevate Landing Page hero layout spacing and editorial rhythm for 390px, 768px, 1440px | `apps/web/app/page.tsx` | Hierarchy & Spacing | **LOW RISK** |
| **10** | Polish Live Shortlist rank indicators and pricing typography hierarchy | `LivePreview.tsx` | Visual Hierarchy | **LOW RISK** |
| **11** | Polish Filter Dialog on mobile (390px) with fixed bottom CTA bar and clear badge counter | `FilterDialog.tsx` | Mobile Ergonomics | **LOW RISK** |
| **12** | Refine comparison floating drawer z-index and elevation to avoid dialog collisions | `apps/web/app/products/page.tsx` | Component Architecture | **LOW RISK** |
| **13** | Add subtle sticky mobile action bar on product detail page (`/products/[slug]`) | `apps/web/app/products/[slug]/page.tsx` | UX & Conversion | **LOW RISK** |
| **14** | Improve Compare table mobile horizontal scroll affordance and sticky product header | `apps/web/app/compare/page.tsx` | Responsiveness | **LOW RISK** |
| **15** | Polish Help Landing Page issue cards with consistent 16px vertical rhythm | `apps/web/app/help/page.tsx` | Spacing & Rhythm | **LOW RISK** |
| **16** | Add subtle alternating row background (`bg-surface-sage/30`) to product ingredient tables | `apps/web/app/products/[slug]/page.tsx` | Scannability | **LOW RISK** |
| **17** | Ensure all icon-only buttons (`X`, `Trash`, `Sliders`) have descriptive `aria-label`s | Monorepo Web Components | Accessibility | **LOW RISK** |
| **18** | Verify all secondary disclaimer text maintains &ge; 4.5:1 contrast against `#F7F7F1` | Privacy, Safety, Results | WCAG AA Compliance | **LOW RISK** |
| **19** | Optimize Next.js Image component usage (priority flags on hero logo, explicit aspect ratios) | `apps/web/app/page.tsx` | Performance | **LOW RISK** |
| **20** | Polish Chat Dialog input, message bubbles, and quick reply pills with Brand Lock tokens | `MatchChatDialog.tsx` | Visual Polish | **LOW RISK** |
| **21** | Polish footer touch targets and link typography hierarchy across trust pages | `SiteFooter.tsx` | Accessibility & Polish | **LOW RISK** |
| **22** | Extract reusable `SizeVariantSelector` component to remove duplication between catalogue & detail | `components/ui/SizeVariantSelector.tsx` | Duplication Removal | **LOW RISK** |
| **23** | Add subtle empty state illustrations or calm typographic styling when 0 products match filters | `apps/web/app/products/page.tsx` | UX Resilience | **LOW RISK** |
| **24** | Add structured metadata JSON-LD tags for product details and organization | `apps/web/app/layout.tsx` | SEO & Discoverability | **LOW RISK** |
| **25** | Unify multi-package UI primitives into a standalone design package | Monorepo Architecture | Monorepo Refactor | **NEEDS APPROVAL** |
