import fs from "node:fs";
import path from "node:path";
import {
  parseRequestKeyword,
  matchMultiNeeds,
  DEMO_CATALOGUE_SEED,
  ParsedRequest,
  MultiNeedMatchResult,
} from "@bodywise/shared";

interface QueryItem {
  id: string;
  query: string;
  description: string;
}

async function runEvaluation() {
  const queriesPath = path.resolve(process.cwd(), "data/eval/queries.json");
  if (!fs.existsSync(queriesPath)) {
    console.error(`Queries file not found at ${queriesPath}`);
    process.exit(1);
  }

  const queries: QueryItem[] = JSON.parse(fs.readFileSync(queriesPath, "utf-8"));
  console.log(`Running evaluation across ${queries.length} realistic queries...\n`);

  const reportRows: string[] = [];

  reportRows.push("# Multi-Need RAG Evaluation Report");
  reportRows.push("");
  reportRows.push(`*Generated at: ${new Date().toISOString()}*`);
  reportRows.push(`*Total Queries Evaluated: ${queries.length}*`);
  reportRows.push(`*Catalogue Size: ${DEMO_CATALOGUE_SEED.length} verified products*`);
  reportRows.push(`*Rules Version: 2.0.0*`);
  reportRows.push("");
  reportRows.push("> [!NOTE]");
  reportRows.push("> This report presents deterministic evaluation outputs for manual review.");
  reportRows.push("> As per safety guidelines, products are NOT marked as 'correct' or 'incorrect' automatically.");
  reportRows.push("");
  reportRows.push("---");
  reportRows.push("");

  for (let i = 0; i < queries.length; i++) {
    const item = queries[i];
    console.log(`[${i + 1}/${queries.length}] Evaluating: "${item.query}" (${item.id})`);

    // Parse request into multi-needs
    const parsedRequest: ParsedRequest = parseRequestKeyword(item.query);

    // Run deterministic multi-need matcher with RAG concept evidence
    const matchResult: MultiNeedMatchResult = await matchMultiNeeds(parsedRequest, DEMO_CATALOGUE_SEED);

    // Format console output
    console.log(`  Needs identified (${parsedRequest.needs.length}):`);
    for (const need of parsedRequest.needs) {
      console.log(`    - [${need.id}] "${need.phrase_from_user}" -> Concepts: [${need.concepts.join(", ")}] | Category: ${need.preferred_category || "any"}`);
    }
    console.log(`  Medical Flag: ${parsedRequest.medical_flag}`);

    for (const group of matchResult.groups) {
      console.log(`  Need: "${group.needLabel}" -> Status: ${group.status}`);
      if (group.status === "MATCHED") {
        for (const rec of group.recommendations) {
          console.log(`    * ${rec.productName} (${rec.format}) - Evidence: "${rec.evidenceSnippets[0] || 'No snippet'}"`);
        }
      } else {
        console.log(`    * NO_FIT: ${group.noFitReason || 'No product with verified evidence'}`);
      }
    }
    console.log("");

    // Build Markdown Section
    reportRows.push(`## Query ${item.id}: "${item.query}"`);
    reportRows.push(`**Scenario:** ${item.description}  `);
    reportRows.push(`**Medical Boundary Flag:** \`${parsedRequest.medical_flag ? "TRUE (Caution banner shown)" : "FALSE"}\`  `);
    reportRows.push(`**Avoidances Detected:** ${parsedRequest.avoidances.length > 0 ? parsedRequest.avoidances.join(", ") : "None"}  `);
    reportRows.push("");

    reportRows.push("### Understood Needs");
    reportRows.push("| Need ID | Raw Phrase | Cosmetic Concepts | Preferred Product Type | Priority |");
    reportRows.push("| :--- | :--- | :--- | :--- | :--- |");
    for (const need of parsedRequest.needs) {
      reportRows.push(
        `| \`${need.id}\` | "${need.phrase_from_user}" | \`${need.concepts.join(", ") || "none"}\` | ${need.preferred_category || "*any suitable*"} | ${need.priority} |`
      );
    }
    reportRows.push("");

    reportRows.push("### Shortlisted Matches per Need");
    for (const group of matchResult.groups) {
      reportRows.push(`#### For ${group.needLabel} (\`${group.status}\`)`);
      if (group.status === "MATCHED" && group.recommendations.length > 0) {
        reportRows.push("| Rank | Product Name | Category | Format | Price | Match Label | Published Evidence Snippet |");
        reportRows.push("| :---: | :--- | :--- | :--- | :---: | :--- | :--- |");
        for (const rec of group.recommendations) {
          const evidence = rec.evidenceSnippets && rec.evidenceSnippets.length > 0
            ? `*"${rec.evidenceSnippets[0].replace(/\|/g, "-")}"*`
            : "*No direct quote*";
          const price = rec.priceInr ? `₹${rec.priceInr}` : "Unverified";
          reportRows.push(
            `| ${rec.rank} | **${rec.productName}** | \`${rec.category}\` | ${rec.format} | ${price} | \`${rec.matchLabel}\` | ${evidence} |`
          );
        }
      } else {
        reportRows.push(`> **NO_FIT:** ${group.noFitReason || "No catalogue product carries verified published evidence for this specific need."}`);
      }
      reportRows.push("");
    }

    reportRows.push("---");
    reportRows.push("");
  }

  // Ensure reports directory exists
  const reportsDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, "eval.md");
  fs.writeFileSync(reportPath, reportRows.join("\n"), "utf-8");
  console.log(`\nEvaluation complete! Report written to ${reportPath}`);
}

runEvaluation().catch((err) => {
  console.error("Evaluation script failed:", err);
  process.exit(1);
});
