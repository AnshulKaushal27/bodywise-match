/**
 * Catalogue Family Detection & Review Generator (Task Step 1 & Step 5)
 *
 * Groups products differing only by size/capacity into single product families
 * while preserving distinct fragrance, flavor, strength, and formulation variants.
 * Generates data/families.generated.json and reports/families-review.md.
 */

import * as fs from "fs";
import * as path from "path";
import { DEMO_CATALOGUE_SEED } from "../packages/shared/src/data/catalogue.seed";
import { ProductRecord } from "../packages/shared/src/product";

export interface ParsedSize {
  raw: string;
  value: number | null;
  unit: string | null;
  label: string;
  isAmbiguous: boolean;
  ambiguityReason?: string;
}

export interface FamilyVariant {
  variantId: string;
  size_value: number | null;
  size_unit: string | null;
  size_label: string;
  sku: string;
  price_inr: number | null;
  price_checked_at: string | null;
  image_url: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  is_default: boolean;
}

export interface ProductFamily {
  familyId: string;
  canonical_name: string;
  slug: string;
  category: string;
  format: string;
  variants: FamilyVariant[];
  shared_facts: {
    brand_line: string;
    official_description: string;
    label_directions: string;
    ingredients: string[] | null;
    cautions: string[] | null;
    fragrance_free: boolean | null;
    suitable_for: string[] | null;
    supported_goals: string[];
    is_demo: boolean;
  };
  mergedFrom: string[];
  needs_review: boolean;
  review_reasons: string[];
}

export interface HygieneReport {
  misclassifiedCategories: Array<{
    slug: string;
    name: string;
    currentCategory: string;
    currentFormat: string;
    suggestedCategory: string;
    reason: string;
  }>;
  genericDescriptions: Array<{
    slug: string;
    name: string;
    description: string;
  }>;
  sizeSlugMismatches: Array<{
    slug: string;
    name: string;
    slugSizeToken: string;
    nameSizeToken: string;
    reason: string;
  }>;
  unverifiedFragrance: Array<{
    slug: string;
    name: string;
    ingredients: string[];
    potentialInference: string;
  }>;
}

/**
 * Parses numeric size value and unit from size string or product name.
 */
export function parseSizeString(sizeStr: string | null, nameStr: string): ParsedSize {
  const fallback: ParsedSize = {
    raw: sizeStr || "Standard Packaging",
    value: null,
    unit: null,
    label: sizeStr || "Standard Packaging",
    isAmbiguous: false,
  };

  const target = (sizeStr || nameStr).trim();

  // Pattern: 250 mL, 375ml, 200 g, 300g, 50 ml, 75 ml, 700ml, 60N, 30N, 2 Months
  const match = target.match(/(\d+(?:\.\d+)?)\s*(ml|mL|l|L|g|gm|grams|kg|oz|n|N|months?|month|tablets?|gummies)/i);

  if (match) {
    const val = parseFloat(match[1]);
    let unit = match[2].toLowerCase();

    if (unit === "ml") unit = "mL";
    else if (unit === "l") unit = "L";
    else if (unit === "g" || unit === "gm" || unit === "grams") unit = "g";
    else if (unit === "kg") unit = "kg";
    else if (unit === "n") unit = "count";
    else if (unit.startsWith("month")) unit = "months";
    else if (unit.startsWith("tablet") || unit.startsWith("gumm")) unit = "count";

    const label = `${val} ${unit}`;
    return {
      raw: target,
      value: val,
      unit,
      label,
      isAmbiguous: false,
    };
  }

  return fallback;
}

/**
 * Strips size tokens, packaging suffixes, brackets, and extra punctuation to find canonical base name.
 * Preserves distinct scent/variant descriptors (Flora, Aqua, Oudh, Watermelon, Fragrance-Free, XP).
 */
export function extractCanonicalName(name: string): string {
  let cleaned = name;

  // 1. Remove bracketed sizes e.g. (200g), (300g), (50ml), (75ml)
  cleaned = cleaned.replace(/\s*\(\s*\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\s*\)/gi, "");

  // 2. Remove dash-separated sizes e.g. "- 250 mL", "- 375 mL", "- 700 mL", "- 50ml", "- 350ml"
  cleaned = cleaned.replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\b/gi, "");

  // 3. Remove inline size tokens at the end e.g. " 250ml", " 700", " 300", " 150ml", " 50 ml", " 60N"
  cleaned = cleaned.replace(/\s+\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\b/gi, "");

  // 4. Clean trailing numbers that represent sizes e.g. "Wash 700", "Scrub 300"
  cleaned = cleaned.replace(/\s+\d{2,4}\s*$/g, "");

  // 5. Clean trailing dashes, commas, spaces
  cleaned = cleaned.replace(/[\s\-_]+$/, "").trim();

  return cleaned;
}

/**
 * Normalizes base name for strict grouping comparison.
 */
export function normalizeBaseKey(name: string): string {
  return extractCanonicalName(name)
    .toLowerCase()
    .replace(/[^\w\s%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether ingredients match between two products.
 */
export function areIngredientsIdentical(a: string[] | null, b: string[] | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;

  const setA = new Set(a.map((i) => i.trim().toLowerCase()));
  const setB = new Set(b.map((i) => i.trim().toLowerCase()));

  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

export function detectCatalogueFamilies(products: ProductRecord[]): {
  families: ProductFamily[];
  hygiene: HygieneReport;
} {
  const families: ProductFamily[] = [];
  const hygiene: HygieneReport = {
    misclassifiedCategories: [],
    genericDescriptions: [],
    sizeSlugMismatches: [],
    unverifiedFragrance: [],
  };

  // Group candidate map: key -> ProductRecord[]
  const candidateGroups = new Map<string, ProductRecord[]>();

  for (const prod of products) {
    // Hygiene checks
    // 1. Misclassified categories
    const lowerFormat = prod.format.toLowerCase();
    const lowerName = prod.official_name.toLowerCase();
    if (prod.category === "body_wash") {
      if (lowerFormat.includes("lotion") || lowerName.includes("lotion")) {
        hygiene.misclassifiedCategories.push({
          slug: prod.slug,
          name: prod.official_name,
          currentCategory: prod.category,
          currentFormat: prod.format,
          suggestedCategory: "body_lotion (or cream/skincare)",
          reason: "Product is a leave-on lotion/moisturizer, not a cleansing body wash.",
        });
      } else if (lowerFormat.includes("scrub") || lowerName.includes("scrub")) {
        hygiene.misclassifiedCategories.push({
          slug: prod.slug,
          name: prod.official_name,
          currentCategory: prod.category,
          currentFormat: prod.format,
          suggestedCategory: "body_scrub (or exfoliator)",
          reason: "Product is an exfoliating physical/chemical body scrub, not a daily cleansing wash.",
        });
      }
    }

    // 2. Generic descriptions
    if (
      prod.official_description.includes("designed for regular personal care and surface skin maintenance") ||
      prod.official_description.trim().length <= 25
    ) {
      hygiene.genericDescriptions.push({
        slug: prod.slug,
        name: prod.official_name,
        description: prod.official_description,
      });
    }

    // 3. Size vs slug mismatches
    const slugSizeMatch = prod.slug.match(/(\d+)\s*(ml|g|gm)/i);
    const nameSizeMatch = prod.official_name.match(/(\d+)\s*(ml|g|gm)/i);
    if (slugSizeMatch && nameSizeMatch) {
      const slugVal = slugSizeMatch[1];
      const nameVal = nameSizeMatch[1];
      if (slugVal !== nameVal) {
        hygiene.sizeSlugMismatches.push({
          slug: prod.slug,
          name: prod.official_name,
          slugSizeToken: `${slugVal} ${slugSizeMatch[2]}`,
          nameSizeToken: `${nameVal} ${nameSizeMatch[2]}`,
          reason: `Slug contains ${slugVal} while official name specifies ${nameVal}.`,
        });
      }
    }

    // 4. Fragrance declaration check
    if (prod.fragrance_free === null) {
      const hasFragrance = prod.ingredients?.some((ing) =>
        ing.toLowerCase().includes("fragrance") || ing.toLowerCase().includes("parfum")
      );
      const hasNoFragranceClaim = prod.official_description.toLowerCase().includes("fragrance free");
      hygiene.unverifiedFragrance.push({
        slug: prod.slug,
        name: prod.official_name,
        ingredients: prod.ingredients || [],
        potentialInference: hasFragrance
          ? "Contains fragrance (IFRA Certified Fragrance detected in ingredients)"
          : hasNoFragranceClaim
          ? "Likely Fragrance-Free (claimed in description)"
          : "Unverified / requires product label check",
      });
    }

    // Grouping Key creation
    const baseKey = normalizeBaseKey(prod.official_name);
    const groupKey = `${prod.category}::${prod.format.toLowerCase()}::${baseKey}::${prod.fragrance_free}`;

    if (!candidateGroups.has(groupKey)) {
      candidateGroups.set(groupKey, []);
    }
    candidateGroups.get(groupKey)!.push(prod);
  }

  // Process candidate groups into families
  for (const [groupKey, prods] of candidateGroups.entries()) {
    if (prods.length === 1) {
      // Single product family
      const p = prods[0];
      const parsedSize = parseSizeString(p.size, p.official_name);
      const canonicalName = extractCanonicalName(p.official_name);

      const variant: FamilyVariant = {
        variantId: `${p.slug}-v1`,
        size_value: parsedSize.value,
        size_unit: parsedSize.unit,
        size_label: p.size || parsedSize.label,
        sku: p.slug,
        price_inr: p.price_inr,
        price_checked_at: p.price_checked_at,
        image_url: p.image_url,
        source_url: p.source_url,
        last_verified_at: p.last_verified_at,
        is_default: true,
      };

      const family: ProductFamily = {
        familyId: `fam-${p.slug}`,
        canonical_name: canonicalName,
        slug: p.slug,
        category: p.category,
        format: p.format,
        variants: [variant],
        shared_facts: {
          brand_line: p.brand_line,
          official_description: p.official_description,
          label_directions: p.label_directions,
          ingredients: p.ingredients,
          cautions: p.cautions,
          fragrance_free: p.fragrance_free,
          suitable_for: p.suitable_for,
          supported_goals: p.supported_goals as string[],
          is_demo: p.is_demo,
        },
        mergedFrom: [p.slug],
        needs_review: false,
        review_reasons: [],
      };

      families.push(family);
    } else {
      // Multiple candidates for family: verify strict merge rules
      // Grouping rules 2: same ingredients, same directions, same claims
      const first = prods[0];
      const reviewReasons: string[] = [];
      let canMergeAll = true;

      for (let i = 1; i < prods.length; i++) {
        const other = prods[i];
        if (!areIngredientsIdentical(first.ingredients, other.ingredients)) {
          canMergeAll = false;
          reviewReasons.push(
            `Ingredients differ between ${first.slug} and ${other.slug}. Cannot merge into same formula family.`
          );
        }
        if (first.fragrance_free !== other.fragrance_free) {
          canMergeAll = false;
          reviewReasons.push(
            `Fragrance status differs between ${first.slug} (${first.fragrance_free}) and ${other.slug} (${other.fragrance_free}).`
          );
        }
      }

      if (!canMergeAll) {
        // Keep them as separate families if they violate strict merge rules
        for (const p of prods) {
          const parsedSize = parseSizeString(p.size, p.official_name);
          const canonicalName = extractCanonicalName(p.official_name);
          families.push({
            familyId: `fam-${p.slug}`,
            canonical_name: canonicalName,
            slug: p.slug,
            category: p.category,
            format: p.format,
            variants: [
              {
                variantId: `${p.slug}-v1`,
                size_value: parsedSize.value,
                size_unit: parsedSize.unit,
                size_label: p.size || parsedSize.label,
                sku: p.slug,
                price_inr: p.price_inr,
                price_checked_at: p.price_checked_at,
                image_url: p.image_url,
                source_url: p.source_url,
                last_verified_at: p.last_verified_at,
                is_default: true,
              },
            ],
            shared_facts: {
              brand_line: p.brand_line,
              official_description: p.official_description,
              label_directions: p.label_directions,
              ingredients: p.ingredients,
              cautions: p.cautions,
              fragrance_free: p.fragrance_free,
              suitable_for: p.suitable_for,
              supported_goals: p.supported_goals as string[],
              is_demo: p.is_demo,
            },
            mergedFrom: [p.slug],
            needs_review: true,
            review_reasons: reviewReasons,
          });
        }
      } else {
        // Valid merge into one family
        const canonicalName = extractCanonicalName(first.official_name);

        // Canonical slug: choose cleanest slug (preferably the one without size suffix)
        let familySlug = first.slug;
        for (const p of prods) {
          if (!p.slug.match(/-\d+(?:ml|g|gm|n)?$/i)) {
            familySlug = p.slug;
            break;
          }
        }

        const rawVariants = prods.map((p, idx) => {
          const parsed = parseSizeString(p.size, p.official_name);
          return {
            product: p,
            parsed,
            idx,
          };
        });

        // Check for duplicate sizes
        const sizeSet = new Set<string>();
        for (const v of rawVariants) {
          const key = `${v.parsed.value}-${v.parsed.unit}`;
          if (sizeSet.has(key)) {
            reviewReasons.push(`Duplicate size detected in family: ${key} on product ${v.product.slug}`);
          }
          sizeSet.add(key);
        }

        // Check for slug/name mismatch in any merged variant
        for (const v of rawVariants) {
          const slugMatch = v.product.slug.match(/(\d+)\s*(ml|g|gm)/i);
          const nameMatch = v.product.official_name.match(/(\d+)\s*(ml|g|gm)/i);
          if (slugMatch && nameMatch && slugMatch[1] !== nameMatch[1]) {
            reviewReasons.push(
              `Slug/Name size mismatch for variant ${v.product.slug}: slug has ${slugMatch[1]} but name states ${nameMatch[1]}`
            );
          }
        }

        // Sort variants ascending by numeric size_value within same unit
        rawVariants.sort((a, b) => {
          if (a.parsed.value === null) return 1;
          if (b.parsed.value === null) return -1;
          return a.parsed.value - b.parsed.value;
        });

        // Default variant: smallest size (first in sorted list)
        const variants: FamilyVariant[] = rawVariants.map((item, idx) => ({
          variantId: `${item.product.slug}-v${idx + 1}`,
          size_value: item.parsed.value,
          size_unit: item.parsed.unit,
          size_label: item.product.size || item.parsed.label,
          sku: item.product.slug,
          price_inr: item.product.price_inr,
          price_checked_at: item.product.price_checked_at,
          image_url: item.product.image_url,
          source_url: item.product.source_url,
          last_verified_at: item.product.last_verified_at,
          is_default: idx === 0, // Smallest size is default
        }));

        families.push({
          familyId: `fam-${familySlug}`,
          canonical_name: canonicalName,
          slug: familySlug,
          category: first.category,
          format: first.format,
          variants,
          shared_facts: {
            brand_line: first.brand_line,
            official_description: first.official_description,
            label_directions: first.label_directions,
            ingredients: first.ingredients,
            cautions: first.cautions,
            fragrance_free: first.fragrance_free,
            suitable_for: first.suitable_for,
            supported_goals: first.supported_goals as string[],
            is_demo: first.is_demo,
          },
          mergedFrom: prods.map((p) => p.slug),
          needs_review: reviewReasons.length > 0,
          review_reasons: reviewReasons,
        });
      }
    }
  }

  // Sort families deterministically by canonical name
  families.sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));

  return { families, hygiene };
}

// Generate reports and JSON files
export async function run() {
  console.log("Analyzing catalogue for size variants & families...");
  const { families, hygiene } = detectCatalogueFamilies(DEMO_CATALOGUE_SEED);

  const totalProducts = DEMO_CATALOGUE_SEED.length;
  const totalFamilies = families.length;
  const mergedFamilies = families.filter((f) => f.variants.length > 1);
  const totalMergedProducts = mergedFamilies.reduce((sum, f) => sum + f.variants.length, 0);
  const needsReviewFamilies = families.filter((f) => f.needs_review);

  // 1. Write data/families.generated.json
  const dataDir = path.resolve(__dirname, "../data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const jsonPath = path.join(dataDir, "families.generated.json");
  fs.writeFileSync(jsonPath, JSON.stringify(families, null, 2), "utf8");
  console.log(`Saved: ${jsonPath}`);

  // 2. Generate reports/families-review.md
  const reportsDir = path.resolve(__dirname, "../reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  let md = `# Catalogue Product Families Review Report\n\n`;
  md += `**Generated At:** ${new Date().toISOString()}\n`;
  md += `**Catalogue Seed:** ${totalProducts} products\n`;
  md += `**Resulting Families:** ${totalFamilies} families\n`;
  md += `**Merged Groups:** ${mergedFamilies.length} families (containing ${totalMergedProducts} size variants)\n`;
  md += `**Families Requiring Review:** ${needsReviewFamilies.length}\n\n`;

  md += `---\n\n`;
  md += `## Summary of Merged Product Families\n\n`;
  md += `The following product lines have been merged into single product families with selectable size variants:\n\n`;

  for (const fam of mergedFamilies) {
    md += `### ${fam.canonical_name} (${fam.category} • ${fam.format})\n`;
    md += `- **Family Slug:** \`${fam.slug}\`\n`;
    md += `- **Merged From (${fam.variants.length} sizes):**\n`;
    for (const v of fam.variants) {
      md += `  - **${v.size_label}** (SKU: \`${v.sku}\`)${v.is_default ? " *(Default)*" : ""}: Price ${v.price_inr ? `₹${v.price_inr}` : "Not verified yet"}\n`;
    }
    if (fam.needs_review) {
      md += `- **Review Flags:**\n`;
      for (const r of fam.review_reasons) {
        md += `  - ⚠️ *${r}*\n`;
      }
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## Distinct Formulations & Scent Variants Preserved (Not Merged)\n\n`;
  md += `Per Rule 3, the following lines were kept as separate families because they differ in scent, active percentage, or formula:\n\n`;

  const distinctRollOns = families.filter((f) => f.canonical_name.includes("Roll-On") || f.canonical_name.includes("Roll On"));
  for (const r of distinctRollOns) {
    md += `- **${r.canonical_name}** (\`${r.slug}\`): ${r.variants.length} size(s) [${r.variants.map((v) => v.size_label).join(", ")}]\n`;
  }

  md += `\n---\n\n`;
  md += `## Catalogue Hygiene Report: Possible Data Problems (Step 5)\n\n`;

  md += `### 1. Misclassified Categories (${hygiene.misclassifiedCategories.length} items)\n`;
  md += `*Products currently catalogued under "Body Wash" that are leave-on lotions or scrubs:*\n\n`;
  for (const item of hygiene.misclassifiedCategories) {
    md += `- **${item.name}** (\`${item.slug}\`)\n`;
    md += `  - Current Category: \`${item.currentCategory}\` | Format: \`${item.currentFormat}\`\n`;
    md += `  - Suggested Correction: **${item.suggestedCategory}**\n`;
    md += `  - Diagnostic Reason: ${item.reason}\n\n`;
  }

  md += `### 2. Generic Boilerplate Descriptions (${hygiene.genericDescriptions.length} items)\n`;
  md += `*Cards with generic unextracted packaging text ("designed for regular personal care and surface skin maintenance"):*\n\n`;
  for (const item of hygiene.genericDescriptions.slice(0, 10)) {
    md += `- **${item.name}** (\`${item.slug}\`)\n`;
  }
  if (hygiene.genericDescriptions.length > 10) {
    md += `- *...and ${hygiene.genericDescriptions.length - 10} more items.*\n`;
  }
  md += `\n`;

  md += `### 3. Size vs. Slug Inconsistencies (${hygiene.sizeSlugMismatches.length} items)\n`;
  md += `*Disagreements between slug token and official label title:*\n\n`;
  for (const item of hygiene.sizeSlugMismatches) {
    md += `- **${item.name}**\n`;
    md += `  - Slug: \`${item.slug}\` (${item.slugSizeToken})\n`;
    md += `  - Official Name: "${item.name}" (${item.nameSizeToken})\n`;
    md += `  - Flag: ${item.reason}\n\n`;
  }

  md += `### 4. Fragrance Status Requiring Verification (${hygiene.unverifiedFragrance.length} items)\n`;
  md += `*Products with fragrance_free = null that can be resolved from packaging:*\n\n`;
  for (const item of hygiene.unverifiedFragrance.slice(0, 10)) {
    md += `- **${item.name}** (\`${item.slug}\`): Potential inference -> ${item.potentialInference}\n`;
  }
  if (hygiene.unverifiedFragrance.length > 10) {
    md += `- *...and ${hygiene.unverifiedFragrance.length - 10} more unverified fragrance items.*\n`;
  }

  const reviewPath = path.join(reportsDir, "families-review.md");
  fs.writeFileSync(reviewPath, md, "utf8");
  console.log(`Saved: ${reviewPath}`);

  console.log("\n==========================================");
  console.log(`Catalogue Analysis Summary:`);
  console.log(`- Products Before: ${totalProducts}`);
  console.log(`- Families After: ${totalFamilies}`);
  console.log(`- Merged Groups: ${mergedFamilies.length} families (encompassing ${totalMergedProducts} products)`);
  console.log(`- Single-Variant Families: ${totalFamilies - mergedFamilies.length}`);
  console.log(`- Families Requiring Review: ${needsReviewFamilies.length}`);
  console.log("==========================================\n");
}

if (require.main === module) {
  run().catch((err) => {
    console.error("Family detection failed:", err);
    process.exit(1);
  });
}
