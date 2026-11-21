# AGENTS.md — Bodywise Match Architecture & Guardrails

This document establishes the architecture, non-negotiable rules, and development guidelines for **Bodywise Match**.

## 1. Product Promise & Core Flow
- **One-line promise:** *"Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong."*
- **Core flow:** User describes concern -> editable parsed summary -> 1 clarifying question at a time -> 2–3 explained product matches -> optional feedback -> optional order/product issue helper.
- **Value delivery:** All value arrives in ONE session with zero signup required.

## 2. Non-Negotiable Product Rules
1. **No Diagnosis:** Zero medical diagnosis, severity scores, treatment plans, or "this will fix X". Only cautious relevance wording ("may be relevant to your stated goal", "here is why this appears in your shortlist").
2. **Deterministic Matching (AI interprets, rules decide):** Matching and ranking logic is pure TypeScript (`packages/shared/src/matcher.ts`). An LLM may only extract intent into a Zod schema and must never invent products, ingredients, prices, or claims.
3. **Fact Integrity & Provenance:** Every fact in the catalogue carries `source` and `last_verified_at`. Missing facts remain `null` and the UI shows "Not verified yet".
4. **Honesty Safeguards:** All sample data is explicitly flagged "Demo data". Zero fake testimonials, fake interviews, fake star ratings, or percentage "match scores".
5. **Photo Uploads Disabled:** Photo uploads are disabled in MVP with a visible "Coming later" disabled state.
6. **No Retention Gimmicks:** No mandatory signup, no streaks, no push reminders, no diary features.
7. **No Logistics Claims:** No claims of live order tracking, batch authenticity, or ticket status.
8. **Privacy First:** Never log free-text user input. Never store photos. Fastify logger redacts request bodies.
9. **Resilient UX:** Always provide loading, empty, error, and offline states (never a blank screen).
10. **Accessibility:** WCAG AA contrast (4.5:1 min), 44×44px touch targets, visible focus rings, `prefers-reduced-motion` respected.

## 3. Monorepo Structure
- `apps/web`: Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui primitives, PWA manifest, sitemap).
- `apps/api`: Fastify + TypeScript, JSON REST under `/v1`, CORS allowlist, rate limiting, helmet, redacting logger.
- `packages/shared`: Zod schemas, inferred types, deterministic matcher, reason codes.
- `docs/design-system.md`: Comprehensive design tokens, contrast verification matrix, and typography scale.

## 4. Key Scripts
- `pnpm dev`: Runs both Next.js Web (`:3000`) and Fastify API (`:4000`) concurrently.
- `pnpm build`: Builds `@bodywise/shared`, `@bodywise/web`, and `@bodywise/api`.
- `pnpm test`: Runs Vitest test suites.
- `pnpm typecheck`: Runs strict TypeScript typechecks across all packages.
- `pnpm lint`: Lints the monorepo code.

## 5. Skills and Workflow

### 5.1 Skill Roles & Responsibilities
- **Impeccable:** Primary design judgement, UI critique, styling polish, and layout refinement.
- **UI/UX Pro Max:** Reference data lookup for UX rules, charts, component patterns, and stack-specific guidelines. (Recommendations only; never persists or overwrites tokens).
- **Vercel Agent Skills (`web-design-guidelines`, `vercel-react-best-practices`, `vercel-composition-patterns`):** Code quality, accessibility verification, React 18 composition patterns, and Next.js performance rules.
- **Playwright Skill:** Headless browser automation for exploratory UI validation and cross-viewport checks. (Existing `@playwright/test` suite remains authoritative regression suite).
- **Frontend Design (Anthropic):** Generic fallback guidance for visual direction (lowest priority).

### 5.2 Precedence Order
When skills or recommendations conflict, precedence is strictly resolved in this order:
1. **User Rules, AGENTS.md & Brand Lock:** Absolute highest authority. Non-negotiable safety guardrails and tokens cannot be overridden.
2. **Impeccable:** Highest design authority for aesthetic judgment, polish, and layout hierarchy.
3. **UI/UX Pro Max:** Reference data provider for guidelines, accessibility checks, and UX heuristics.
4. **Vercel Guidelines:** Web interface guidelines and React performance best practices.
5. **Anthropic Frontend Design:** General aesthetic direction (lowest precedence).

### 5.3 Brand Lock Tokens (Immutable)
- **Palette (White + Blue):** `bg-paper` (#F5F9FF), `surface` (#FFFFFF), `surface-sky`/`surface-sage` (#E3EEFC), `brand-deep` (#0B2447), `brand-primary`/`brand-evergreen` (#1D4ED8, hover #1E40AF), `accent-sky`/`accent-lime` (#BBD9FF — badges/shapes only, never small text; text on it is #0B2447), `decorative-blue` (#3B82F6 / #60A5FA), `text-charcoal` (#1B2A41), `text-muted` (#5B6B82), `border` (#D5E0EF), `caution-peach` (#FBE3D3) with `caution-text` (#7A3B14), `success-bg` (#E3F0FF) with `success-text` (#0B4A9E).
- **Radii:** Cards `18px` (`rounded-card`), Buttons/Inputs `12px` (`rounded-button`).
- **Typography:** Display `DM Sans`, Body `Inter`. Column width `max-w-prose` (680px max).
- **Interactions:** Calm editorial wellness aesthetic, motion level 3 max (150–300ms, transform/opacity only), `prefers-reduced-motion` safe, WCAG AA compliant (4.5:1 min), 44px min touch targets.

### 5.4 Execution & Git Safety
- **Git Safety:** Zero commits, pushes, merges, rebases, resets, stashes, or branch creations without explicit user permission. Read-only git only.
- **Execution Safety:** All commands must run in the foreground with explicit timeouts (`timeout 120 ...`), one at a time. No background test suites left running.
- **Secrets & Safety:** Never log or read `.env` files or API keys. Never alter medical safety copy or deterministic matching logic.

### 5.5 Workflow Standard
Every frontend change follows the strict 5-stage lifecycle:
$$\text{Inspect} \longrightarrow \text{Plan} \longrightarrow \text{Implement} \longrightarrow \text{Test} \longrightarrow \text{Verify}$$

