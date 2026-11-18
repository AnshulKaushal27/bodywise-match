# CATALOGUE-MAINTENANCE.md — Bodywise Match Catalogue Operations & Drift Management

This guide documents the procedures, automation tools, and safety protocols for maintaining authentic, verified product data in Bodywise Match.

---

## 1. Core Principles & Guardrails (AGENTS.md)

1. **Fact Integrity & Provenance (Rule 3):**
   - Every fact must carry `source` and `last_verified_at`.
   - Missing or unstated facts remain strictly `null` and the UI renders `"Not verified yet"`.
   - Never extrapolate, fill gaps from memory, or fabricate attributes.

2. **No Medical Claims Quarantine (Rule 1):**
   - All external marketing claims containing forbidden keywords (`cure`, `cures`, `treats`, `treatment`, `heals`, `diagnose`, `guaranteed`, `clears acne`) must have `medical_claim_language: true` in `data/extracted/<slug>.json`.
   - In user-facing fields (`official_description`, `label_directions`), all medical claims must be neutralized into neutral, objective descriptions.

3. **Image Permission Switch:**
   - Governed strictly by `data/image-permissions.md`.
   - Current state: `IMAGE_PERMISSION: not_granted`.
   - No brand images may be downloaded, hotlinked, mirrored, or rendered. `image_url` remains `null`, rendering the calm botanical placeholder.

4. **Zero Silent Overwrites:**
   - Automated refresh scripts are strictly **read-only**.
   - Live crawls compute a diff report in `reports/catalogue-diff.md` and never overwrite verified seed files without explicit human review.

---

## 2. Re-Verify-Before-Demo Checklist

Run this checklist prior to any product demonstration, client review, or production deployment:

- [ ] **Step 1: Check Source Domain & Robot Rules**
  - Verify official store domain is `bebodywise.com` (recorded in `data/sources.md`).
  - Check `https://bebodywise.com/robots.txt` to confirm crawler access etiquette.

- [ ] **Step 2: Run Catalogue Drift Audit**
  ```bash
  # Check a 5-product sample for quick health check
  pnpm catalogue:refresh --sample

  # Or run full catalogue scan across all 107 products
  pnpm catalogue:refresh
  ```

- [ ] **Step 3: Inspect Drift Report**
  - Open `reports/catalogue-diff.md`.
  - Confirm:
    - `0` discontinued or 404 products.
    - Prices match current official store listings.
    - No undetected reformulations or unquarantined medical claims.

- [ ] **Step 4: Validate Data Schema & Provenance**
  ```bash
  pnpm catalogue:validate
  ```
  - Confirms all 107 records satisfy `ProductRecordSchema`, have valid `source_url`, `last_verified_at`, and zero forbidden claims in user-facing fields.

- [ ] **Step 5: Run Content Safety Lint**
  ```bash
  pnpm safety:lint
  ```
  - Verifies no forbidden medical phrases exist anywhere in rendered code, data seeds, or tests.

- [ ] **Step 6: Run Vitest Suite**
  ```bash
  pnpm test
  ```
  - Confirms all 25 test suites (287+ unit/integration tests) pass cleanly.

- [ ] **Step 7: Run Playwright E2E Suite**
  ```bash
  pnpm test:e2e
  ```
  - Confirms all 16 end-to-end tests pass on both Desktop Chrome and Mobile Chrome (390x844).

---

## 3. Handling Common Drift Scenarios

### Scenario A: Price or Packaging Size Update
1. Check the diff in `reports/catalogue-diff.md`.
2. Update the corresponding `data/extracted/<slug>.json` with the new verified `price_inr` and update `price_checked_at` and `last_verified_at` to the current date.
3. Rebuild the seed files:
   ```bash
   npx tsx scripts/build-verified-catalogue.ts
   ```
4. Rebuild `@bodywise/shared`:
   ```bash
   pnpm --filter @bodywise/shared build
   ```
5. Run `pnpm catalogue:validate` and `pnpm test`.

### Scenario B: Ingredient Reformulation
1. Review the added or removed ingredients in `reports/catalogue-diff.md`.
2. Verify against the official product page ingredient declaration.
3. Update `ingredients` array in `data/extracted/<slug>.json`.
4. Rebuild catalogue files (`tsx scripts/build-verified-catalogue.ts`).
5. Ensure the deterministic matcher still honors hard exclusions (`evaluateHardExclusions`).

### Scenario C: Discontinued Product / 404 URL
1. Mark the product in `data/extracted/<slug>.json` or remove it from the active catalogue list if permanently delisted.
2. If kept as archived, update `notes` and ensure `is_demo: false`.
3. If delisted from active shortlist, regenerate `packages/shared/src/data/catalogue.seed.ts` and `supabase/seed.sql`.

### Scenario D: New Product Launch
1. Add the new product URL to `data/raw/product-urls.json`.
2. Run single product extraction:
   ```bash
   npx tsx scripts/crawl-and-extract.ts
   ```
3. Generate review gate entry:
   ```bash
   npx tsx scripts/generate-catalogue-review.ts
   ```
4. Review goals and medical claim quarantine in `reports/catalogue-review.md`.
5. Upon approval, rebuild seed files (`tsx scripts/build-verified-catalogue.ts`).

---

## 4. Maintenance Scripts Quick Reference

| Command | Description | Output Files |
| :--- | :--- | :--- |
| `pnpm catalogue:refresh` | Polite live crawl against `bebodywise.com`; detects price/ingredient/status drift. | `reports/catalogue-diff.md` |
| `pnpm catalogue:refresh --sample` | Audits 5 products for quick baseline health check. | `reports/catalogue-diff.md` |
| `pnpm catalogue:validate` | Validates all verified records against Zod schema, safety rules, and image permissions. | Console report |
| `pnpm safety:lint` | Asserts zero forbidden claims (`cure`, `treats`, `guaranteed`, etc.) across the app. | Test result |
| `pnpm test` | Runs all Vitest unit and integration test suites. | Test report |
| `pnpm test:e2e` | Runs Playwright tests on desktop & mobile viewports. | HTML report & console |
