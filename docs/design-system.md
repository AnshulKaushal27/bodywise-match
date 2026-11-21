# Bodywise Match Design System

**Aesthetic Concept:** "White + Blue Editorial Product Finder"  
**Tone & Mood:** Calm, premium wellness, deliberate pacing, high readability.  
**Strict Anti-Goals:** Not a clinical diagnostic tool; not a high-pressure e-commerce storefront; never copies Be Bodywise trade dress or logo.

---

## 1. Color Palette & Tokens

All tokens are defined as CSS custom properties in `apps/web/app/globals.css` and mapped to Tailwind utilities in `apps/web/tailwind.config.ts`.

| CSS Variable | Hex Value | Role & Usage Rules | Contrast Ratio (WCAG) |
| :--- | :--- | :--- | :--- |
| `--bg-paper` | `#F5F9FF` | Canvas background for main pages, cool off-white feel. | Base Canvas |
| `--surface` | `#FFFFFF` | Primary card background, active inputs, dialog canvas. | Base Surface |
| `--surface-sky` / `--surface-sage` | `#E3EEFC` | Alternate section backgrounds, inactive chip fill, soft panels. | Base Section |
| `--brand-deep` | `#0B2447` | Deepest navy tone. Display headings, footers, high-emphasis text. | 14.9:1 on paper (AAA) |
| `--brand-primary` / `--brand-evergreen` | `#1D4ED8` | Primary action buttons, active links, focused states, borders. (Hover: `#1E40AF`) | 6.73:1 with white text (AA / AAA Large) |
| `--accent-sky` / `--accent-lime` | `#BBD9FF` | Restrained accent for "Demo data" badges, active chips, hero shapes. **Never use for small text.** | 11.0:1 with brand-deep text (AAA) |
| `--decorative-blue` | `#3B82F6` / `#60A5FA` | Smoke depth ribbons, gradients, subtle decorative accents only. | Decorative Only |
| `--text-charcoal` | `#1B2A41` | Primary body text across all light backgrounds. | 13.3:1 on paper, 14.0:1 on white (AAA) |
| `--text-muted` | `#5B6B82` | Secondary subtitles, helper text. Use at 14px+ on white and paper. | 5.00:1 on white, 4.76:1 on paper (AA) |
| `--border` | `#D5E0EF` | Soft structural borders, card strokes, dividers, unselected inputs. | UI Component Border (3:1+) |
| `--caution-peach` | `#FBE3D3` | Background for ingredient caveats, usage cautions, tolerance notes. | Base Callout |
| `--caution-text` | `#7A3B14` | High-contrast warm text for caution callouts. | 6.53:1 on peach (AA / AAA Large) |
| `--success-bg` | `#E3F0FF` | Background for positive verification states and source badges. | Base Callout |
| `--success-text` | `#0B4A9E` | High-contrast blue text for confirmed facts and successes. Always paired with check icon & text. | 7.36:1 on success-bg (AAA) |
| `--error-bg` | `#FBE1E1` | Background for field errors and failed requests. | Base Callout |
| `--error-text` | `#8A1F1F` | Deep red text for validation and system errors. | 7.23:1 on error-bg (AAA) |
| `--focus-ring` | `#1D4ED8` | 3px primary blue ring with 2px white gap for keyboard focus rings. | Interactive Focus |

### Official Brand Blue Swatch Comparison
- **Theme Primary Blue:** `#1D4ED8` (Royal Blue) — Contrast with white: **6.73:1** (AA)
- **Official Be Bodywise Blue:** `#005995` (Ocean / Steel Blue) — Contrast with white: **7.29:1** (AAA)

---

## 2. WCAG AA Contrast Verification Matrix

Every text and background combination supported by the system meets or exceeds WCAG AA standards (4.5:1 minimum for normal text, 3.0:1 for large text/interactive components).

| Foreground Color | Background Color | Tested Ratio | WCAG Compliance Level | Intended UI Location |
| :--- | :--- | :---: | :---: | :--- |
| `text-charcoal` (`#1B2A41`) | `bg-paper` (`#F5F9FF`) | **13.3 : 1** | **AAA** | Main body reading paragraphs |
| `text-charcoal` (`#1B2A41`) | `surface` (`#FFFFFF`) | **14.0 : 1** | **AAA** | Card text, input text, table cells |
| `brand-deep` (`#0B2447`) | `bg-paper` (`#F5F9FF`) | **14.9 : 1** | **AAA** | H1–H4 section headings |
| `brand-deep` (`#0B2447`) | `accent-sky` (`#BBD9FF`)| **11.0 : 1** | **AAA** | "Demo data" badge label, selected chips |
| `brand-deep` (`#0B2447`) | `surface-sky` (`#E3EEFC`)| **12.5 : 1** | **AAA** | Chip text on unselected sky pills |
| `white` (`#FFFFFF`) | `brand-primary` (`#1D4ED8`)| **6.73 : 1** | **AA (AAA Large)** | Primary button labels |
| `white` (`#FFFFFF`) | `brand-primary-hover` (`#1E40AF`)| **8.20 : 1** | **AAA** | Primary button hover / active states |
| `brand-primary` (`#1D4ED8`)| `surface` (`#FFFFFF`) | **6.73 : 1** | **AA** | Secondary button border/text, inline links |
| `text-muted` (`#5B6B82`) | `surface` (`#FFFFFF`) | **5.00 : 1** | **AA** | Card metadata, input labels |
| `text-muted` (`#5B6B82`) | `bg-paper` (`#F5F9FF`) | **4.76 : 1** | **AA** | Section subheads, disclaimer notes |
| `caution-text` (`#7A3B14`) | `caution-peach` (`#FBE3D3`)| **6.53 : 1** | **AAA (Large)** / **AA** | Safety notices & ingredient warnings |
| `success-text` (`#0B4A9E`) | `success-bg` (`#E3F0FF`)| **7.36 : 1** | **AAA** | Verified batch and source stamps |
| `error-text` (`#8A1F1F`) | `error-bg` (`#FBE1E1`) | **7.23 : 1** | **AAA** | Form error banners and validation notes |

---

## 3. Typography & Rhythm

- **Display Typeface:** `DM Sans` (Weights: 600 Semi-Bold, 700 Bold)
- **Body Typeface:** `Inter` (Weights: 400 Regular, 500 Medium, 600 Semi-Bold)
- **Fallbacks:** System sans-serif stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Reading Measure:** Maximum column width is constrained to `680px` (`max-w-prose`) to maintain 60–75 characters per line for optimal editorial cadence.
- **Scale:**
  - `Display / H1`: 38px mobile / 56px desktop, tight tracking `-0.02em`, line-height `1.15`
  - `H2`: 28px mobile / 34px desktop, tracking `-0.015em`, line-height `1.25`
  - `H3`: 22px mobile / 26px desktop, line-height `1.3`
  - `Body Standard`: 16px, line-height `1.6` (26px)
  - `Body Large`: 18px, line-height `1.6` (29px)
  - `Caption / Microcopy`: 13px–14px, line-height `1.4`

---

## 4. Spacing, Radii & Depth

- **Spacing Scale:** Multiples of 8px (8, 16, 24, 32, 40, 48, 64, 80px).
- **Max Viewport Width:** `1120px` centered with `20px` mobile side gutters.
- **Corner Radii:**
  - Chips / Pills: `9999px` (Full rounded)
  - Inputs & Buttons: `12px` (`rounded-xl`)
  - Cards & Containers: `18px` (`rounded-2xl`)
  - Modals / Sheets: `24px` (`rounded-3xl`)
- **Depth & Elevation:**
  - Elevation is achieved through hairlines (`border border-[#D5E0EF]`) rather than harsh drop shadows.
  - Optional soft elevation: `0 6px 24px rgba(11, 36, 71, 0.08)` for floating elements (dialogs, dropdowns, toasts).
- **Touch Ergonomics:**
  - All interactive controls (buttons, inputs, selectable chips, tabs) guarantee at least a **44×44px** touch target.
  - Buttons have a minimum height of `48px`.
  - Form inputs have a minimum height of `52px`.

---

## 5. Motion & Accessibility

- **Motion Duration:** Subtle micro-interactions between `150ms` and `220ms` with ease-out timing curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Reduced Motion:** Every CSS transition and keyframe animation is conditionally scoped inside `@media (prefers-reduced-motion: no-preference)`. When reduced motion is requested by the OS, animations resolve instantly (0s duration).
- **Focus Indicators:** Interactive elements display a dedicated focus ring: `outline: 3px solid #1D4ED8` with an inner `2px` white offset ring.

---

## 6. Built-in Component Specifications

All primitives are located in `apps/web/components/ui`:

1. **Button:** Primary (primary blue filled), Secondary (white surface + 1.5px blue border), Ghost (understated text link), with an accessible loading state (`aria-busy`).
2. **Chip:** Selectable chip with sky accent fill on selection, removable chip with dismiss trigger, and editable inline chip.
3. **Card:** Clean 18px rounded container with border stroke and editorial typography.
4. **Badge & DemoBadge:** Subtle metadata indicators. `DemoBadge` is always styled in accent-sky with brand-deep navy text to clearly flag mock data.
5. **SourceTag:** Structured metadata tag displaying provenance (e.g. `Source: official site, checked 12 Nov 2026`).
6. **Input, Textarea & Select:** Form controls with 52px minimum height, clear placeholder styling, and error rings.
7. **Callout:** 4 distinct semantic variants (`info`, `caution`, `success`, `error`) with a 4px left emphasis border.
8. **Stepper & ProgressBar:** Visual guidance for multi-step product discovery and question progression.
9. **Accordion & Tabs:** Smooth expanding editorial FAQs and segmented views.
10. **Dialog & Toast:** Clean, non-intrusive modal dialogs and notification toasts.
11. **Skeleton:** Warm shimmering placeholders for image and card loading states.
12. **EmptyState & ErrorState:** Reassuring, actionable fallback states with clear next steps.
