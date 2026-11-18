import { ProductRecordSchema, ProductRecord } from "../product";
import { VALID_GOAL_IDS } from "../goals";
import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";

export interface ValidationReport {
  total: number;
  validCount: number;
  demoCount: number;
  verifiedCount: number;
  errors: Array<{ productSlug: string; issues: string[] }>;
}

export function validateCatalogue(products: ProductRecord[]): ValidationReport {
  const report: ValidationReport = {
    total: products.length,
    validCount: 0,
    demoCount: 0,
    verifiedCount: 0,
    errors: [],
  };

  for (const product of products) {
    const issues: string[] = [];

    // 1. Zod Schema Validation
    const parseResult = ProductRecordSchema.safeParse(product);
    if (!parseResult.success) {
      for (const err of parseResult.error.errors) {
        issues.push(`${err.path.join(".")}: ${err.message}`);
      }
    }

    // 2. Controlled Goals Check
    for (const goal of product.supported_goals) {
      if (!VALID_GOAL_IDS.has(goal)) {
        issues.push(`Unknown goal ID '${goal}'. Must belong to controlled vocabulary.`);
      }
    }

    // 3. Strict Non-Demo Verification Check (Rule 3)
    if (!product.is_demo) {
      report.verifiedCount++;
      if (!product.source_url || product.source_url.trim().length === 0) {
        issues.push("Non-demo product missing required official source_url.");
      }
      if (!product.last_verified_at || product.last_verified_at.trim().length === 0) {
        issues.push("Non-demo product missing required last_verified_at date.");
      }
    } else {
      report.demoCount++;
    }

    if (issues.length > 0) {
      report.errors.push({
        productSlug: product.slug || "unknown",
        issues,
      });
    } else {
      report.validCount++;
    }
  }

  return report;
}

export function runCatalogueValidationCLI() {
  console.log("=========================================");
  console.log("🔍 Validating Bodywise Match Catalogue...");
  console.log("=========================================\n");

  const report = validateCatalogue(DEMO_CATALOGUE_SEED);

  console.log(`Checked Products:  ${report.total}`);
  console.log(`Demo Products:     ${report.demoCount}`);
  console.log(`Verified Products: ${report.verifiedCount}`);
  console.log(`Valid Records:     ${report.validCount}`);

  if (report.errors.length > 0) {
    console.error(`\n❌ Validation FAILED with ${report.errors.length} error(s):`);
    for (const err of report.errors) {
      console.error(`\n  Product [${err.productSlug}]:`);
      for (const issue of err.issues) {
        console.error(`    - ${issue}`);
      }
    }
    process.exit(1);
  }

  console.log("\n✅ All catalogue products conform strictly to Zod schemas, controlled goals, and fact integrity rules.");
  process.exit(0);
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  (process.argv[1].includes("validate-catalogue.ts") ||
    process.argv[1].includes("validate-catalogue.js"));

if (process.env.NODE_ENV !== "test" && isDirectRun) {
  runCatalogueValidationCLI();
}
