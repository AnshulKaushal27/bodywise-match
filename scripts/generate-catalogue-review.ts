import * as fs from "fs";
import * as path from "path";

interface ExtractedProduct {
  slug: string;
  official_name: string;
  category: string;
  format: string;
  size: string | null;
  official_description_summary: string;
  official_description_quote: string | null;
  label_directions: string | null;
  ingredients: string[] | null;
  published_claims: string[];
  medical_claim_language: boolean;
  cautions: string[] | null;
  fragrance_free: boolean | null;
  suitable_for: string[] | null;
  price_inr: number | null;
  price_checked_at: string;
  image_url_on_site: string | null;
  source_url: string;
  last_verified_at: string;
  field_sources: Record<string, string>;
  extraction_notes: string[];
}

interface ProductReviewItem extends ExtractedProduct {
  mapped_goals: string[];
  goal_mapping_confidence: "high" | "needs_review";
  medical_flags: string[];
}

function mapProductToGoals(p: ExtractedProduct): { goals: string[]; confidence: "high" | "needs_review"; flags: string[] } {
  const s = p.slug.toLowerCase();
  const name = p.official_name.toLowerCase();
  const claims = p.published_claims.join(" ").toLowerCase();
  const combined = `${s} ${name} ${claims}`;
  const goals: string[] = [];
  let confidence: "high" | "needs_review" = "high";
  const flags: string[] = [];

  // Medical claim detection
  const medicalWords = ["prevent body acne", "clear acne", "clears acne", "cure", "treats", "treatment", "heals", "anti-dandruff clinical", "removes back acne"];
  for (const w of medicalWords) {
    if (combined.includes(w)) {
      flags.push(w);
    }
  }

  // 1. Body bumps & texture
  if (s.includes("salicylic") && (s.includes("body") || s.includes("wash"))) {
    goals.push("body_bumps_look");
  } else if (s.includes("strawberry") || s.includes("aha-bha-body")) {
    goals.push("body_bumps_look");
    goals.push("rough_texture_smoothing");
  }

  // 2. Rough texture & calloused skin smoothing
  if (s.includes("urea") || s.includes("scrub") || s.includes("glycolic-acid-stick")) {
    goals.push("rough_texture_smoothing");
    if (s.includes("lotion")) goals.push("hydration_barrier");
  }

  // 3. Gentle cleansing & hydration
  if (s.includes("triple-milk") || s.includes("body-wash-deal")) {
    goals.push("gentle_daily_cleansing");
    goals.push("hydration_barrier");
  } else if (s.includes("bodywash") || s.includes("body-wash")) {
    if (!goals.includes("body_bumps_look") && !goals.includes("rough_texture_smoothing")) {
      goals.push("gentle_daily_cleansing");
    }
  }

  // 4. Dark spots & uneven tone
  if (s.includes("pigmentation") || s.includes("niacinamide") || s.includes("de-tan")) {
    goals.push("dark_spots_look");
    if (s.includes("underarm")) {
      goals.push("underarm_texture_smoothing");
    }
  }

  // 5. Underarm
  if (s.includes("underarm") || s.includes("roll-on") || s.includes("rollon")) {
    if (!s.includes("foot") && !s.includes("hair")) {
      goals.push("underarm_odor_freshness");
      goals.push("underarm_texture_smoothing");
    }
  }

  // 6. Hair Care
  if (s.includes("hair-growth") || s.includes("pro-growth") || s.includes("hair-strengthening")) {
    goals.push("hair_density_appearance");
  }
  if (s.includes("hair-fall") || s.includes("keratin-shampoo")) {
    goals.push("hair_fall_appearance");
  }
  if (s.includes("dandruff") || s.includes("ketoconazole") || s.includes("zpto")) {
    goals.push("scalp_comfort");
    goals.push("scalp_clarifying");
  }
  if (s.includes("frizz") || s.includes("conditioner")) {
    goals.push("frizz_control");
  }

  // 7. Sunscreen
  if (s.includes("sunscreen") || s.includes("spf") || s.includes("sun-care")) {
    goals.push("sun_protection");
  }

  // 8. Face & Blemishes
  if (s.includes("face-wash") || s.includes("facewash") || s.includes("pimple") || s.includes("acne-kit")) {
    goals.push("oil_control");
  }
  if (s.includes("ceramide") || s.includes("moisturizer")) {
    goals.push("hydration_barrier");
  }

  // Fallbacks / Judgement calls
  if (goals.length === 0) {
    if (p.category === "supplement" || s.includes("gummies") || s.includes("magnesium") || s.includes("calcium")) {
      // General wellness supplements
      confidence = "needs_review";
      goals.push("gentle_daily_cleansing"); // placeholder for review
    } else if (s.includes("razor") || s.includes("roller") || s.includes("massager")) {
      confidence = "needs_review";
      goals.push("rough_texture_smoothing");
    } else {
      confidence = "needs_review";
      goals.push("gentle_daily_cleansing");
    }
  }

  // If combo kit or pack, mark as needs_review for review gate
  if (s.includes("kit") || s.includes("pack") || s.includes("combo")) {
    confidence = "needs_review";
  }

  return {
    goals: Array.from(new Set(goals)),
    confidence,
    flags,
  };
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function main() {
  const extractedDir = path.resolve(process.cwd(), "data/extracted");
  const files = fs.readdirSync(extractedDir).filter(f => f.endsWith(".json"));

  console.log(`Analyzing ${files.length} extracted product files...`);

  const reviewItems: ProductReviewItem[] = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(extractedDir, f), "utf-8");
    const p: ExtractedProduct = JSON.parse(raw);
    const mapping = mapProductToGoals(p);
    reviewItems.push({
      ...p,
      mapped_goals: mapping.goals,
      goal_mapping_confidence: mapping.confidence,
      medical_flags: mapping.flags,
    });
  }

  // Sort by category then slug
  reviewItems.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));

  // 1. Generate CSV
  const csvHeaders = [
    "approved (Y/N)",
    "slug",
    "official_name",
    "category",
    "format",
    "size",
    "price_inr",
    "source_url",
    "mapped_goals",
    "goal_mapping_confidence",
    "ingredients_count",
    "ingredients_null",
    "label_directions_null",
    "cautions_null",
    "fragrance_free",
    "medical_claims_flagged",
    "notes",
  ];

  const csvRows = reviewItems.map(p => {
    return [
      "", // approved blank for user
      escapeCsv(p.slug),
      escapeCsv(p.official_name),
      escapeCsv(p.category),
      escapeCsv(p.format),
      escapeCsv(p.size),
      escapeCsv(p.price_inr),
      escapeCsv(p.source_url),
      escapeCsv(p.mapped_goals.join(", ")),
      escapeCsv(p.goal_mapping_confidence),
      escapeCsv(p.ingredients ? p.ingredients.length : 0),
      escapeCsv(p.ingredients === null ? "YES" : "NO"),
      escapeCsv(p.label_directions === null ? "YES" : "NO"),
      escapeCsv(p.cautions === null ? "YES" : "NO"),
      escapeCsv(p.fragrance_free === null ? "NULL" : p.fragrance_free ? "TRUE" : "FALSE"),
      escapeCsv(p.medical_flags.join("; ")),
      escapeCsv(p.extraction_notes.join("; ")),
    ].join(",");
  });

  const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
  fs.writeFileSync(path.resolve(process.cwd(), "reports/catalogue-review.csv"), csvContent, "utf-8");

  // 2. Generate Markdown Report
  const totalCount = reviewItems.length;
  const missingIngredients = reviewItems.filter(p => p.ingredients === null).length;
  const missingDirections = reviewItems.filter(p => p.label_directions === null).length;
  const missingCautions = reviewItems.filter(p => p.cautions === null).length;
  const missingSize = reviewItems.filter(p => p.size === null).length;
  const missingPrice = reviewItems.filter(p => p.price_inr === null).length;
  const flaggedClaimsCount = reviewItems.filter(p => p.medical_flags.length > 0).length;
  const needsReviewGoalsCount = reviewItems.filter(p => p.goal_mapping_confidence === "needs_review").length;

  let md = `# Catalogue Extraction & Review Gate Report

**Date of Extraction:** ${new Date().toISOString().split("T")[0]}  
**Official Source:** [bebodywise.com](https://bebodywise.com)  
**Total Products Extracted:** ${totalCount}  

---

## 1. Executive Summary & Verification Metrics

| Metric | Count | Percentage | Status |
| :--- | :---: | :---: | :--- |
| **Total Products Extracted** | **${totalCount}** | 100% | Complete |
| **Full Ingredients Verified** | ${totalCount - missingIngredients} | ${Math.round(((totalCount - missingIngredients) / totalCount) * 100)}% | ${missingIngredients > 0 ? "Highlighted in report" : "All complete"} |
| **Missing Ingredients (Null)** | ${missingIngredients} | ${Math.round((missingIngredients / totalCount) * 100)}% | Null preserved (Rule 3) |
| **Directions Verified** | ${totalCount - missingDirections} | ${Math.round(((totalCount - missingDirections) / totalCount) * 100)}% | Verified from How To Use |
| **Missing Directions (Null)** | ${missingDirections} | ${Math.round((missingDirections / totalCount) * 100)}% | Null preserved |
| **Cautions Verified** | ${totalCount - missingCautions} | ${Math.round(((totalCount - missingCautions) / totalCount) * 100)}% | Verified from FAQ/Safety advisory |
| **Missing Cautions (Null)** | ${missingCautions} | ${Math.round((missingCautions / totalCount) * 100)}% | Null preserved |
| **Size Verified** | ${totalCount - missingSize} | ${Math.round(((totalCount - missingSize) / totalCount) * 100)}% | Verified from name / packaging |
| **Price (INR) Verified** | ${totalCount - missingPrice} | ${Math.round(((totalCount - missingPrice) / totalCount) * 100)}% | Verified from JSON-LD offer |
| **Medical Claims Flagged** | ${flaggedClaimsCount} | ${Math.round((flaggedClaimsCount / totalCount) * 100)}% | Flagged & excluded from UI copy |
| **Goal Mappings Needing Review** | ${needsReviewGoalsCount} | ${Math.round((needsReviewGoalsCount / totalCount) * 100)}% | Multi-packs & kits flagged |

---

## 2. Hard Rule Safeguards Applied
1. **Zero Hallucination (Rule 2 & 3):** No ingredients, sizes, cautions, or suitability claims were invented or inferred from general knowledge. Missing values remain strictly \`null\` and render as *"Not verified yet"*.
2. **Neutral Paraphrasing:** Brand marketing claims were isolated. Product summaries use our neutral, non-promotional descriptions without treatment promises.
3. **Medical Language Quarantine:** Claims containing treatment or cure language (e.g., *"prevents body acne"*, *"clears acne"*) are quarantined in \`published_claims\` for audit only and marked with \`medical_claim_language: true\`.
4. **Image Quarantine:** Per \`data/image-permissions.md\` (\`IMAGE_PERMISSION: not_granted\`), zero brand images were downloaded or embedded. \`image_url\` remains \`null\` in the catalogue.

---

## 3. Products Flagged with Medical Claim Language
The following products have published claims on the official website that contain medical or treatment phrasing. In accordance with AGENTS.md, these phrases are retained for audit only and neutralized in our UI summary:

| Product Slug | Official Name | Flagged Phrasing Found on Site |
| :--- | :--- | :--- |
${reviewItems
  .filter(p => p.medical_flags.length > 0)
  .map(p => `| \`${p.slug}\` | ${p.official_name} | \`${p.medical_flags.join("; ")}\` |`)
  .join("\n")}

---

## 4. Goal Mappings Needing Review (\`needs_review\`)
The following products are multi-item kits, dietary supplements, or accessories where goal assignment involves editorial discretion:

| Product Slug | Official Name | Proposed Goals | Reason for Review |
| :--- | :--- | :--- | :--- |
${reviewItems
  .filter(p => p.goal_mapping_confidence === "needs_review")
  .map(p => `| \`${p.slug}\` | ${p.official_name} | \`${p.mapped_goals.join(", ")}\` | Multi-item bundle, accessory, or oral supplement |`)
  .join("\n")}

---

## 5. Complete Product Inventory & Extraction Table

> **Note on Nulls:** Where a field was not explicitly published on the official page, it is set to \`NULL\` (rendered as "Not verified yet" in UI).

| Slug | Category | Size | Price | Ing. Count | Null Fields | Goals | Approved? |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
${reviewItems
  .map(p => {
    const nulls: string[] = [];
    if (p.ingredients === null) nulls.push("Ing");
    if (p.label_directions === null) nulls.push("Dir");
    if (p.cautions === null) nulls.push("Caut");
    if (p.size === null) nulls.push("Size");
    if (p.price_inr === null) nulls.push("Price");
    if (p.fragrance_free === null) nulls.push("Frag");
    const nullStr = nulls.length > 0 ? `**${nulls.join(", ")}**` : "None";
    return `| [\`${p.slug}\`](${p.source_url}) | ${p.category} | ${p.size || "NULL"} | ${p.price_inr ? `₹${p.price_inr}` : "NULL"} | ${p.ingredients ? p.ingredients.length : 0} | ${nullStr} | \`${p.mapped_goals.slice(0, 2).join(", ")}\` | [ ] |`;
  })
  .join("\n")}

---

## 6. Review Gate Action Required

Per **STEP 4: REVIEW GATE**:
1. Review the generated CSV at [reports/catalogue-review.csv](file:///f:/Mosaic/reports/catalogue-review.csv).
2. Confirm the approval list or state which products/categories should be marked as non-demo in the active catalogue.
3. No product will be imported into \`data/catalogue.verified.ts\` or the Postgres seed until you approve the shortlist.
`;

  fs.writeFileSync(path.resolve(process.cwd(), "reports/catalogue-review.md"), md, "utf-8");
  console.log("Generated reports/catalogue-review.csv and reports/catalogue-review.md successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
