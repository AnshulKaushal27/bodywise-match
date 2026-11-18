import * as fs from "fs";
import * as path from "path";
import { extractFromHtml } from "./crawl-and-extract";

interface DiffRecord {
  slug: string;
  official_name: string;
  source_url: string;
  status: "unchanged" | "changed" | "unreachable" | "discontinued";
  changes: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
  new_medical_claims: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== Be Bodywise Catalogue Refresh & Drift Audit ===");
  console.log("Rule 3 & Safety Policy: This script NEVER overwrites verified catalogue data.");
  console.log("It polite-fetches live product pages, computes a diff, and generates a report.\n");

  const extractedDir = path.join(process.cwd(), "data", "extracted");
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const allFiles = fs.readdirSync(extractedDir).filter((f) => f.endsWith(".json"));
  console.log(`Discovered ${allFiles.length} stored verified product records in data/extracted/`);

  // CLI Arguments
  const args = process.argv.slice(2);
  let filesToScan = allFiles;

  const slugArg = args.find((a) => a.startsWith("--slug="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const sampleArg = args.includes("--sample");

  if (slugArg) {
    const targetSlug = slugArg.split("=")[1];
    filesToScan = allFiles.filter((f) => f === `${targetSlug}.json`);
    console.log(`Targeting single product: ${targetSlug}`);
  } else if (sampleArg) {
    filesToScan = allFiles.slice(0, 5);
    console.log(`Running in sample mode: checking 5 products.`);
  } else if (limitArg) {
    const limit = parseInt(limitArg.split("=")[1], 10);
    if (!isNaN(limit)) {
      filesToScan = allFiles.slice(0, limit);
      console.log(`Running with limit: checking first ${limit} products.`);
    }
  }

  const results: DiffRecord[] = [];
  const delayMs = 2100;
  const userAgent = "BodywiseMatchBot/1.0 (Audit & Catalogue Verification; independent research prototype)";

  for (let i = 0; i < filesToScan.length; i++) {
    const file = filesToScan[i];
    const slug = file.replace(".json", "");
    const storedPath = path.join(extractedDir, file);
    const stored = JSON.parse(fs.readFileSync(storedPath, "utf-8"));
    const url = `https://bebodywise.com/product/${slug}`;

    console.log(`[${i + 1}/${filesToScan.length}] Checking ${slug}...`);

    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (resp.status === 404 || resp.redirected && !resp.url.includes(slug)) {
        console.warn(`  ! Product page unreachable or redirected: HTTP ${resp.status}`);
        results.push({
          slug,
          official_name: stored.official_name,
          source_url: url,
          status: "unreachable",
          changes: [{ field: "http_status", old_value: "200 OK", new_value: `HTTP ${resp.status}` }],
          new_medical_claims: [],
        });
        await sleep(delayMs);
        continue;
      }

      if (!resp.ok) {
        console.warn(`  ! Received non-200 HTTP status: ${resp.status}`);
        results.push({
          slug,
          official_name: stored.official_name,
          source_url: url,
          status: "unreachable",
          changes: [{ field: "http_status", old_value: "200 OK", new_value: `HTTP ${resp.status}` }],
          new_medical_claims: [],
        });
        await sleep(delayMs);
        continue;
      }

      const html = await resp.text();
      const extracted = extractFromHtml(html, url, slug);

      const changes: Array<{ field: string; old_value: any; new_value: any }> = [];

      // Compare price
      if (extracted.price_inr !== null && stored.price_inr !== null && extracted.price_inr !== stored.price_inr) {
        changes.push({
          field: "price_inr",
          old_value: `₹${stored.price_inr}`,
          new_value: `₹${extracted.price_inr}`,
        });
      }

      // Compare size
      if (extracted.size && stored.size && extracted.size.toLowerCase() !== stored.size.toLowerCase()) {
        changes.push({
          field: "size",
          old_value: stored.size,
          new_value: extracted.size,
        });
      }

      // Compare ingredients count / formula
      if (extracted.ingredients && stored.ingredients) {
        const storedIngs = new Set(stored.ingredients.map((x: string) => x.toLowerCase().trim()));
        const liveIngs = new Set(extracted.ingredients.map((x: string) => x.toLowerCase().trim()));
        
        const added = extracted.ingredients.filter((x: string) => !storedIngs.has(x.toLowerCase().trim()));
        const removed = stored.ingredients.filter((x: string) => !liveIngs.has(x.toLowerCase().trim()));

        if (added.length > 0 || removed.length > 0) {
          changes.push({
            field: "ingredients",
            old_value: `Total ${stored.ingredients.length} (removed: ${removed.slice(0, 3).join(", ") || "none"})`,
            new_value: `Total ${extracted.ingredients.length} (added: ${added.slice(0, 3).join(", ") || "none"})`,
          });
        }
      }

      // Check fragrance free
      if (extracted.fragrance_free !== null && stored.fragrance_free !== null && extracted.fragrance_free !== stored.fragrance_free) {
        changes.push({
          field: "fragrance_free",
          old_value: stored.fragrance_free ? "Yes" : "No",
          new_value: extracted.fragrance_free ? "Yes" : "No",
        });
      }

      // Check new medical claims
      const newMedicalClaims: string[] = [];
      if (extracted.medical_claim_language && !stored.medical_claim_language) {
        newMedicalClaims.push(...extracted.published_claims);
      }

      if (changes.length > 0) {
        console.log(`  -> Detected ${changes.length} difference(s)`);
        results.push({
          slug,
          official_name: stored.official_name,
          source_url: url,
          status: "changed",
          changes,
          new_medical_claims: newMedicalClaims,
        });
      } else {
        console.log("  ✓ Verified: no drift detected");
        results.push({
          slug,
          official_name: stored.official_name,
          source_url: url,
          status: "unchanged",
          changes: [],
          new_medical_claims: [],
        });
      }
    } catch (err: any) {
      console.error(`  x Error refreshing ${slug}: ${err.message}`);
      results.push({
        slug,
        official_name: stored.official_name,
        source_url: url,
        status: "unreachable",
        changes: [{ field: "fetch_error", old_value: "OK", new_value: err.message }],
        new_medical_claims: [],
      });
    }

    if (i < filesToScan.length - 1) {
      await sleep(delayMs);
    }
  }

  // Generate Diff Report
  const unchangedCount = results.filter((r) => r.status === "unchanged").length;
  const changedCount = results.filter((r) => r.status === "changed").length;
  const unreachableCount = results.filter((r) => r.status === "unreachable").length;

  const nowIso = new Date().toISOString();
  const reportPath = path.join(reportsDir, "catalogue-diff.md");

  let md = `# Catalogue Drift & Refresh Audit Report\n\n`;
  md += `**Execution Date:** ${nowIso}\n`;
  md += `**Total Products Checked:** ${results.length}\n`;
  md += `**Unchanged:** ${unchangedCount} | **Changed:** ${changedCount} | **Unreachable / Discontinued:** ${unreachableCount}\n\n`;
  md += `> **Rule 3 & Safety Policy:** This script is read-only. It **never overwrites** verified catalogue data automatically.\n`;
  md += `> If changes are detected, review them manually with the team before running the import pipeline.\n\n`;

  if (changedCount === 0 && unreachableCount === 0) {
    md += `## Status Summary\n\nAll ${results.length} scanned products match the verified baseline with 0% drift. No price, ingredient, or specification changes detected.\n\n`;
  } else {
    md += `## Detected Differences\n\n`;
    md += `| Product Name | Slug | Field | Baseline Value | Live Page Value |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    for (const r of results.filter((res) => res.status === "changed")) {
      for (const ch of r.changes) {
        md += `| ${r.official_name} | \`${r.slug}\` | ${ch.field} | ${ch.old_value} | ${ch.new_value} |\n`;
      }
    }
    md += `\n`;

    if (unreachableCount > 0) {
      md += `## Unreachable or Discontinued Products\n\n`;
      md += `| Product Name | Slug | Reason / Error |\n`;
      md += `| :--- | :--- | :--- |\n`;
      for (const r of results.filter((res) => res.status === "unreachable")) {
        const errDetail = r.changes.map((c) => `${c.field}: ${c.new_value}`).join("; ");
        md += `| ${r.official_name} | \`${r.slug}\` | ${errDetail} |\n`;
      }
      md += `\n`;
    }

    const itemsWithNewClaims = results.filter((r) => r.new_medical_claims.length > 0);
    if (itemsWithNewClaims.length > 0) {
      md += `## Potential New Medical Claim Language Detected (Requires Quarantine)\n\n`;
      for (const item of itemsWithNewClaims) {
        md += `- **${item.official_name}** (\`${item.slug}\`): Claims detected: \`${item.new_medical_claims.join("; ")}\`\n`;
      }
      md += `\n`;
    }
  }

  md += `## Re-Verification Action Steps\n\n`;
  md += `1. Review the detected changes above against official marketing updates.\n`;
  md += `2. If verified authentic, update \`data/extracted/<slug>.json\` with new verified values.\n`;
  md += `3. Re-run \`tsx scripts/build-verified-catalogue.ts\` to update the seed and sql files.\n`;
  md += `4. Run \`pnpm catalogue:validate\` to ensure provenance and safety constraints.\n`;
  md += `5. Run \`pnpm safety:lint\` and test suites.\n`;

  fs.writeFileSync(reportPath, md, "utf-8");
  console.log(`\nDiff report saved to: ${reportPath}`);
  console.log(`Summary: ${unchangedCount} unchanged, ${changedCount} changed, ${unreachableCount} unreachable.`);
}

main().catch((err) => {
  console.error("Fatal error during catalogue refresh:", err);
  process.exit(1);
});
