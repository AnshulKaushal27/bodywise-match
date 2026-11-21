# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users: Indian personal care and wellness consumers looking for evidence-based skincare, haircare, and bodycare products. Many type concerns casually or colloquially in Hinglish (e.g., "yaar mere face pe dark spots hai koi cream bata do"). They seek honest guidance without high-pressure marketing, deceptive claims, or mandatory signups.

## Product Purpose

"Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong."
All value arrives in a single, focused session with zero signup or retention gimmicks.

## Positioning

A calm, trustworthy, non-clinical personal-care product finder. Deterministic TypeScript matching rules rank products; AI only extracts user intent. Zero medical diagnoses, zero severity scores, zero treatment plans, zero fake percentages or fake reviews. Every product claim cites its verified source.

## Operating Context

Mobile-first browsing, often on varying connection qualities across India. PWA manifest supported with full offline fallback states. User intake handles Hinglish and English queries with equal resilience.

## Capabilities and Constraints

- **No Medical Claims:** Strictly cosmetic and wellness relevance wording ("may be relevant to your stated goal").
- **Deterministic Matcher:** Pure TypeScript rules engine (`computeShortlist`).
- **Fact Provenance:** Every claim requires `source` and `last_verified_at`. Missing facts display "Not verified yet".
- **Demo Data Transparency:** Any unverified demo review is clearly flagged with a "Demo data" pill.
- **Photo Uploads:** Disabled in MVP with a visible "Coming later" disabled state.
- **Privacy:** Free-text input is never logged; Fastify redacts request bodies.

## Brand Commitments

- **Tone & Mood:** Warm editorial wellness, calm pacing, high readability, non-clinical.
- **Strict Brand Lock:** Palette (`bg-paper` #F5F9FF, `surface` #FFFFFF, `surface-sky` #E3EEFC, `brand-deep` #0B2447, `brand-primary` #1D4ED8, `accent-sky` #BBD9FF, `text-charcoal` #1B2A41, `text-muted` #5B6B82, `border` #D5E0EF, `caution-peach` #FBE3D3 / `caution-text` #7A3B14, `success-bg` #E3F0FF / `success-text` #0B4A9E).
- **Radii:** 18px cards, 12px inputs and buttons.
- **Typography:** `DM Sans` (Display), `Inter` (Body).
- **Prohibited:** No flashy animations (motion level 3 max), no emojis in UI text, no infinite loops or overdrive effects.

## Product Principles

1. **AI Interprets, Rules Decide:** LLM parses intent; deterministic rules filter and rank products.
2. **Honesty Over Hype:** Never invent product facts, customer ratings, or curative promises.
3. **Calm Pacing & Dignity:** Clear contrast (WCAG AA min), generous 44px touch targets, and accessible focus rings.
4. **Frictionless Utility:** Complete user value delivered in one session without account creation or streaks.

## Accessibility & Inclusion

- WCAG AA contrast standard across all text and surfaces (4.5:1 min for body text, 3:1 for large/UI).
- Mobile touch targets &ge; 44x44px.
- Visible, high-contrast focus rings (`#245345`).
- Strictly respects `prefers-reduced-motion`.
