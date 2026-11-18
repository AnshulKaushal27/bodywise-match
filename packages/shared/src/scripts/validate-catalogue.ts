import * as fs from "fs";
import * as path from "path";
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

const FORBIDDEN_MEDICAL_WORDS = [
  "\\bcure\\b",
  "\\bcures\\b",
  "\\btreats\\b",
  "\\btreating\\b",
  "\\bdiagnose\\b",
  "\\bguaranteed\\b",
  "\\bclears acne\\b",
  "\\bheals\\b",
];

export function validateCatalogue(products: ProductRecord[]): ValidationReport {
  const report: ValidationReport = {
    total: products.length,
    validCount: 0,
    demoCount: 0,
    verifiedCount: 0,
    errors: [],
  };

  // Check image permission status from data/image-permissions.md
  let imagePermission = "not_granted";
  const permissionsPath = path.resolve(process.cwd(), "data/image-permissions.md");
  if (fs.existsSync(permissionsPath)) {
    const permContent = fs.readFileSync(permissionsPath, "utf-8");
    const permMatch = permContent.match(/IMAGE_PERMISSION:\s*([a-zA-Z_]+)/);
    if (permMatch) {
      imagePermission = permMatch[1].trim().toLowerCase();
    }
  }

  const extractedDir = path.resolve(process.cwd(), "data/extracted");

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
      } else if (!product.source_url.startsWith("https://bebodywise.com/")) {
        issues.push(`Non-demo product source_url must point to official domain https://bebodywise.com/ (found: ${product.source_url})`);
      }

      if (!product.last_verified_at || product.last_verified_at.trim().length === 0) {
        issues.push("Non-demo product missing required last_verified_at date.");
      }

      // Check field_sources in data/extracted/<slug>.json
      const extractedPath = path.join(extractedDir, `${product.slug}.json`);
      if (fs.existsSync(extractedPath)) {
        try {
          const ext = JSON.parse(fs.readFileSync(extractedPath, "utf-8"));
          if (!ext.field_sources || Object.keys(ext.field_sources).length === 0) {
            issues.push("Non-demo product lacks field_sources provenance map in extracted data.");
          }
        } catch {
          issues.push("Extracted JSON file could not be parsed for field_sources.");
        }
      }

      // 4. Medical-claim wording check in user-facing fields
      const userFacingFields = [
        product.official_name,
        product.official_description,
        product.label_directions,
        ...(product.cautions || []),
      ].join(" ");

      for (const pattern of FORBIDDEN_MEDICAL_WORDS) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(userFacingFields)) {
          issues.push(`Forbidden medical claim wording matching '${pattern}' found in user-facing fields.`);
        }
      }

      // 5. Image domain and permission check
      if (product.image_url) {
        const isBrandDomain = product.image_url.includes("bebodywise.com") || product.image_url.includes("mscwlns.co");
        if (isBrandDomain && imagePermission !== "granted") {
          issues.push(`Product image_url references brand domain '${product.image_url}' but IMAGE_PERMISSION is '${imagePermission}' (must be 'granted').`);
        }
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
