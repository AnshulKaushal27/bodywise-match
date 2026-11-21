# Design

<!-- impeccable:design-schema 1 -->

## Visual World

Warm Editorial Wellness Product Finder.
Calm, premium, high-readability layout with deliberate pacing. Never clinical, never aggressive e-commerce, and strictly preserves the Brand Lock.

## Brand Lock Tokens (Immutable)

### Colors
- `bg-paper`: `#F5F9FF` (Canvas background)
- `surface`: `#FFFFFF` (Card background, inputs, dialog canvas)
- `surface-sky` / `surface-sage`: `#E3EEFC` (Secondary sections, unselected chip fill)
- `brand-deep`: `#0B2447` (Display titles, headings, footer background)
- `brand-primary` / `brand-evergreen`: `#1D4ED8` (Primary action buttons, active links, focus rings; hover `#1E40AF`)
- `accent-sky` / `accent-lime`: `#BBD9FF` (Badges, selected chip fill; **never small text**; text on it is `#0B2447`)
- `decorative-blue`: `#3B82F6` / `#60A5FA` (Smoke depth ribbons, gradients)
- `text-charcoal`: `#1B2A41` (Standard body text)
- `text-muted`: `#5B6B82` (Secondary labels, captions)
- `border`: `#D5E0EF` (Hairline component strokes, dividers)
- `caution-peach`: `#FBE3D3` with `caution-text`: `#7A3B14` (Safety/allergen notices)
- `success-bg`: `#E3F0FF` with `success-text`: `#0B4A9E` (Verified stamps)
- `error-bg`: `#FBE1E1` with `error-text`: `#8A1F1F` (System errors)

### Radii
- Cards & Containers: `18px` (`rounded-card`)
- Buttons & Form Inputs: `12px` (`rounded-button`)
- Chips & Pills: `9999px` (Full rounded)
- Dialogs & Sheets: `24px`

### Typography
- **Display / Headings:** `DM Sans` (600 Semi-Bold, 700 Bold)
- **Body / Interface:** `Inter` (400 Regular, 500 Medium, 600 Semi-Bold)
- **Column Measure:** Constrained to `max-w-prose` (680px) for editorial comfort

### Interaction & Motion
- **Motion Budget:** Motion Level 3 max (150ms–220ms ease-out transitions).
- **Reduced Motion:** Fully conditional on `prefers-reduced-motion: no-preference`. Instant fallback when reduced motion is preferred.
- **Touch Targets:** Minimum 44×44px interactive targets across all touch devices.
- **Focus Indicators:** 3px primary blue ring (`#1D4ED8`) with 2px white gap.
