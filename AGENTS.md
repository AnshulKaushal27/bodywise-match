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
