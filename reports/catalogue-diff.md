# Catalogue Drift & Refresh Audit Report

**Execution Date:** 2026-11-18T14:25:44.079Z
**Total Products Checked:** 5
**Unchanged:** 5 | **Changed:** 0 | **Unreachable / Discontinued:** 0

> **Rule 3 & Safety Policy:** This script is read-only. It **never overwrites** verified catalogue data automatically.
> If changes are detected, review them manually with the team before running the import pipeline.

## Status Summary

All 5 scanned products match the verified baseline with 0% drift. No price, ingredient, or specification changes detected.

## Re-Verification Action Steps

1. Review the detected changes above against official marketing updates.
2. If verified authentic, update `data/extracted/<slug>.json` with new verified values.
3. Re-run `tsx scripts/build-verified-catalogue.ts` to update the seed and sql files.
4. Run `pnpm catalogue:validate` to ensure provenance and safety constraints.
5. Run `pnpm safety:lint` and test suites.
