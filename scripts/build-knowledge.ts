/**
 * Knowledge Base Builder for Bodywise Match RAG Layer
 * Rebuildable via: pnpm knowledge:build
 *
 * Produces:
 * 1. data/knowledge/digest.json (compact family summaries, <= 60 tokens each, total <= 8000 tokens)
 * 2. data/knowledge/chunks.json (chunked descriptions, ingredients, directions, claims with metadata)
 * 3. data/knowledge/support.json (support channels from data/support-links.ts)
 * 4. reports/knowledge-quality.md (quality audit report on categories, descriptions, concepts, marketing text)
 */

import * as fs from "fs";
import * as path from "path";
import { CATALOGUE_VERSION, DEMO_CATALOGUE_SEED } from "../packages/shared/src/data/catalogue.seed";
import { CATALOGUE_CATEGORIES, detectPrimaryCategory, CatalogueCategoryId } from "../packages/shared/src/data/categories";
import { CATEGORY_IMPLICATIONS, getImplicationsForCategory } from "../packages/shared/src/data/categoryMap";
import { CONTROLLED_CONCEPTS, ConceptDefinition } from "../packages/shared/src/retrieval/concepts";
import { OFFICIAL_SUPPORT_CHANNELS, SupportChannel } from "../packages/shared/src/data/support-links";
import { getFamilyIdForProduct } from "../packages/shared/src/families";
import { ProductFamily } from "./detect-families";

const KNOWLEDGE_DIGEST_MAX_TOKENS = parseInt(process.env.KNOWLEDGE_DIGEST_MAX_TOKENS || "8000", 10);

export interface FamilyDigestEntry {
  familyId: string;
  name: string;
  category: string;
  area: string;
  format: string;
  concepts: string[];
  fragrance_free: boolean | null;
  summary: string;
  verified: boolean;
  catalog_version: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  familyId: string;
  variantIds: string[];
  category: string;
  subcategory: string | null;
  format: string;
  area: string;
  concepts: string[];
  fragrance_free: boolean | null;
  is_demo: boolean;
  source_url: string | null;
  last_verified_at: string | null;
  catalog_version: string;
  chunk_type: "description" | "ingredients" | "directions" | "claims";
  text: string;
}

export interface SupportKnowledgeChunk {
  id: string;
  title: string;
  description: string;
  type: "email" | "chat" | "portal" | "phone";
  target_url: string;
  source: string;
  last_checked: string;
  recommended_for: string;
  text: string;
}

function sanitizeText(str: string): string {
  if (!str) return "";
  // Strip emojis and non-standard unicode symbols
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeDirections(str: string): string {
  if (!str) return "";
  let cleaned = str;
  // Remove promotional app copy
  cleaned = cleaned.replace(/The Be Bodywise app will be a partner for you[^.]*\./gi, "");
  cleaned = cleaned.replace(/Get daily reminders & rewards on the Be Bodywise app[^.]*\./gi, "");
  cleaned = cleaned.replace(/SAVE UPTO \d+%\s*on your next order using the wallet on our app\.?/gi, "");
  cleaned = cleaned.replace(/Download the Be Bodywise app[^.]*\./gi, "");
  cleaned = sanitizeText(cleaned);
  return cleaned || "Apply as directed on the packaging label.";
}

function deriveCanonicalCategory(family: ProductFamily): {
  canonicalCategory: string;
  isOddity: boolean;
  oddityReason?: string;
} {
  const detected = detectPrimaryCategory(`${family.canonical_name} ${family.format}`);
  const current = family.category;

  if (detected) {
    const detId = detected.categoryId;
    if (current === detId) {
      return { canonicalCategory: current, isOddity: false };
    }
    // Check known oddities
    if (current === "body_wash" && family.canonical_name.toLowerCase().includes("lotion")) {
      return {
        canonicalCategory: "moisturizer",
        isOddity: true,
        oddityReason: `Lotion filed under body_wash; re-tagged as moisturizer.`,
      };
    }
    if (current === "other" && detId) {
      return {
        canonicalCategory: detId,
        isOddity: true,
        oddityReason: `Catalog tagged as 'other', but name indicates '${detId}'.`,
      };
    }
    return {
      canonicalCategory: detId,
      isOddity: current !== detId,
      oddityReason: current !== detId ? `Catalog category '${current}' mapped to detected '${detId}'` : undefined,
    };
  }

  // Fallback for accessories or multi-product packs
  const nameLower = family.canonical_name.toLowerCase();
  if (nameLower.includes("roller") || nameLower.includes("razor") || nameLower.includes("patch") || nameLower.includes("massager")) {
    return { canonicalCategory: "accessory", isOddity: false };
  }
  if (nameLower.includes("kit") || nameLower.includes("pack") || nameLower.includes("trio") || nameLower.includes("duo")) {
    return { canonicalCategory: "kit", isOddity: false };
  }

  return { canonicalCategory: current || "other", isOddity: false };
}

function deriveArea(category: string, name: string, desc: string): string {
  const implications = getImplicationsForCategory(category as CatalogueCategoryId);
  if (implications?.derivedBodyArea) {
    return implications.derivedBodyArea;
  }

  const combined = `${name} ${desc}`.toLowerCase();
  if (combined.includes("underarm")) return "underarm";
  if (combined.includes("scalp") || combined.includes("dandruff")) return "scalp";
  if (combined.includes("hair") || combined.includes("folli")) return "hair";
  if (combined.includes("face") || combined.includes("chehra") || combined.includes("facial") || combined.includes("blackhead") || combined.includes("pimple")) {
    return "face";
  }
  if (combined.includes("foot") || combined.includes("heel") || combined.includes("body") || combined.includes("stretch mark")) {
    return "body";
  }

  return "body";
}

function deriveFormat(rawFormat: string, category: string, name: string): string {
  const combined = `${rawFormat} ${name}`.toLowerCase();
  if (combined.includes("roll-on") || combined.includes("roll on") || combined.includes("roller")) return "roll-on";
  if (combined.includes("wash") || combined.includes("cleanser") || combined.includes("shower gel")) return "wash";
  if (combined.includes("serum") || combined.includes("dropper")) return "serum";
  if (combined.includes("lotion")) return "lotion";
  if (combined.includes("cream")) return "cream";
  if (combined.includes("gummy") || combined.includes("gummies") || combined.includes("chewable")) return "gummies";
  if (combined.includes("shampoo")) return "shampoo";
  if (combined.includes("conditioner")) return "conditioner";
  if (combined.includes("oil")) return "oil";
  if (combined.includes("stick")) return "stick";
  if (combined.includes("scrub")) return "scrub";
  if (combined.includes("patch")) return "patch";
  if (combined.includes("sunscreen")) return "lotion";
  return "product";
}

function extractEvidenceConcepts(
  family: ProductFamily,
  category: string
): { concepts: string[]; evidenceQuotes: Record<string, string> } {
  const concepts: string[] = [];
  const evidenceQuotes: Record<string, string> = {};

  const fullText = [
    family.canonical_name,
    family.shared_facts.official_description,
    family.shared_facts.label_directions,
    ...(family.shared_facts.ingredients || []),
    ...(family.shared_facts.suitable_for || []),
    ...(family.shared_facts.cautions || []),
  ].join(" ").toLowerCase();

  for (const concept of CONTROLLED_CONCEPTS) {
    // Check if relevant
    const isGoalClaimed = family.shared_facts.supported_goals.includes(concept.id);

    // Look for exact evidence keywords in text
    let matchedQuote: string | null = null;
    for (const kw of concept.keywords_for_evidence) {
      const idx = fullText.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        matchedQuote = kw;
        break;
      }
    }

    if (isGoalClaimed || matchedQuote) {
      concepts.push(concept.id);
      if (matchedQuote) {
        evidenceQuotes[concept.id] = matchedQuote;
      }
    }
    // Limit to top 4 concepts per family for compact digest
    if (concepts.length >= 4) break;
  }

  return { concepts, evidenceQuotes };
}

function generateNeutralSummary(name: string, category: string, format: string, concepts: string[]): string {
  const goalStr = concepts.slice(0, 2).map(c => c.replace(/_/g, " ")).join(", ");
  const cleanName = name.replace(/Be Bodywise\s*/i, "").trim();

  if (goalStr) {
    return `${format} for ${goalStr}.`;
  }
  return `Daily personal care ${format}.`;
}

export function buildKnowledge() {
  const familiesPath = path.resolve(process.cwd(), "data/families.generated.json");
  if (!fs.existsSync(familiesPath)) {
    throw new Error(`data/families.generated.json does not exist. Run pnpm catalogue:families first.`);
  }

  const families: ProductFamily[] = JSON.parse(fs.readFileSync(familiesPath, "utf8"));
  const outDir = path.resolve(process.cwd(), "data/knowledge");
  fs.mkdirSync(outDir, { recursive: true });

  const reportsDir = path.resolve(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const digestEntries: FamilyDigestEntry[] = [];
  const chunks: KnowledgeChunk[] = [];

  // Quality Audit Tracking
  const oddCategories: Array<{ familyId: string; name: string; rawCat: string; canonicalCat: string; reason: string }> = [];
  const genericDescriptions: Array<{ familyId: string; name: string; desc: string }> = [];
  const missingConceptEvidence: Array<{ familyId: string; name: string }> = [];
  const marketingTextFound: Array<{ familyId: string; name: string; snippet: string }> = [];
  const sizeConflicts: Array<{ familyId: string; name: string; variants: string[] }> = [];

  for (const fam of families) {
    const { canonicalCategory, isOddity, oddityReason } = deriveCanonicalCategory(fam);
    if (isOddity && oddityReason) {
      oddCategories.push({
        familyId: fam.familyId,
        name: fam.canonical_name,
        rawCat: fam.category,
        canonicalCat: canonicalCategory,
        reason: oddityReason,
      });
    }

    // Check description quality
    const desc = fam.shared_facts.official_description || "";
    if (!desc || desc.includes("designed for regular personal care and surface skin maintenance")) {
      genericDescriptions.push({
        familyId: fam.familyId,
        name: fam.canonical_name,
        desc: desc || "(empty)",
      });
    }

    // Check directions marketing copy
    const rawDirs = fam.shared_facts.label_directions || "";
    if (rawDirs.includes("Be Bodywise app") || rawDirs.includes("SAVE UPTO") || rawDirs.includes("wallet")) {
      marketingTextFound.push({
        familyId: fam.familyId,
        name: fam.canonical_name,
        snippet: rawDirs.slice(0, 100) + "...",
      });
    }

    // Check size conflicts
    if (fam.variants.length > 1) {
      const labels = fam.variants.map(v => v.size_label);
      const unique = new Set(labels);
      if (unique.size !== labels.length) {
        sizeConflicts.push({
          familyId: fam.familyId,
          name: fam.canonical_name,
          variants: labels,
        });
      }
    }

    const area = deriveArea(canonicalCategory, fam.canonical_name, desc);
    const format = deriveFormat(fam.format, canonicalCategory, fam.canonical_name);
    const { concepts, evidenceQuotes } = extractEvidenceConcepts(fam, canonicalCategory);

    if (concepts.length === 0) {
      missingConceptEvidence.push({
        familyId: fam.familyId,
        name: fam.canonical_name,
      });
    }

    const summary = generateNeutralSummary(fam.canonical_name, canonicalCategory, format, concepts);
    const verified = fam.variants.some(v => Boolean(v.last_verified_at || v.source_url));

    const primaryProduct = DEMO_CATALOGUE_SEED.find((p) => p.slug === fam.variants[0]?.sku);
    const targetFamilyId = primaryProduct ? getFamilyIdForProduct(primaryProduct) : fam.familyId;

    // 1. Build Digest Entry (deduplicated by targetFamilyId)
    const existingDigest = digestEntries.find(d => d.familyId === targetFamilyId);
    if (!existingDigest) {
      const digestEntry: FamilyDigestEntry = {
        familyId: targetFamilyId,
        name: fam.canonical_name,
        category: canonicalCategory,
        area,
        format,
        concepts,
        fragrance_free: fam.shared_facts.fragrance_free,
        summary,
        verified,
        catalog_version: CATALOGUE_VERSION,
      };
      digestEntries.push(digestEntry);
    }

    // 2. Build Chunks
    const variantIds = fam.variants.map(v => v.variantId);
    const primaryVariant = fam.variants[0];

    // Description chunk
    chunks.push({
      chunkId: `${fam.familyId}-desc`,
      familyId: targetFamilyId,
      variantIds,
      category: canonicalCategory,
      subcategory: null,
      format,
      area,
      concepts,
      fragrance_free: fam.shared_facts.fragrance_free,
      is_demo: fam.shared_facts.is_demo ?? false,
      source_url: primaryVariant?.source_url || null,
      last_verified_at: primaryVariant?.last_verified_at || null,
      catalog_version: CATALOGUE_VERSION,
      chunk_type: "description",
      text: sanitizeText(desc) || fam.canonical_name,
    });

    // Ingredients chunk
    if (fam.shared_facts.ingredients && fam.shared_facts.ingredients.length > 0) {
      chunks.push({
        chunkId: `${fam.familyId}-ing`,
        familyId: targetFamilyId,
        variantIds,
        category: canonicalCategory,
        subcategory: null,
        format,
        area,
        concepts,
        fragrance_free: fam.shared_facts.fragrance_free,
        is_demo: fam.shared_facts.is_demo ?? false,
        source_url: primaryVariant?.source_url || null,
        last_verified_at: primaryVariant?.last_verified_at || null,
        catalog_version: CATALOGUE_VERSION,
        chunk_type: "ingredients",
        text: `Ingredients for ${fam.canonical_name}: ${fam.shared_facts.ingredients.join(", ")}.`,
      });
    }

    // Directions chunk
    const cleanedDirections = sanitizeDirections(rawDirs);
    chunks.push({
      chunkId: `${fam.familyId}-dir`,
      familyId: targetFamilyId,
      variantIds,
      category: canonicalCategory,
      subcategory: null,
      format,
      area,
      concepts,
      fragrance_free: fam.shared_facts.fragrance_free,
      is_demo: fam.shared_facts.is_demo ?? false,
      source_url: primaryVariant?.source_url || null,
      last_verified_at: primaryVariant?.last_verified_at || null,
      catalog_version: CATALOGUE_VERSION,
      chunk_type: "directions",
      text: `Directions for ${fam.canonical_name}: ${cleanedDirections}`,
    });

    // Claims chunk
    const claimsText = [
      concepts.length > 0 ? `Targeted concerns: ${concepts.map(c => c.replace(/_/g, " ")).join(", ")}.` : null,
      fam.shared_facts.suitable_for?.length ? `Suitable for: ${fam.shared_facts.suitable_for.join(", ")}.` : null,
      fam.shared_facts.cautions?.length ? `Precautions: ${fam.shared_facts.cautions.join("; ")}.` : null,
      fam.shared_facts.fragrance_free === true ? "Formulated without fragrance." : null,
    ].filter(Boolean).join(" ");

    chunks.push({
      chunkId: `${fam.familyId}-claims`,
      familyId: targetFamilyId,
      variantIds,
      category: canonicalCategory,
      subcategory: null,
      format,
      area,
      concepts,
      fragrance_free: fam.shared_facts.fragrance_free,
      is_demo: fam.shared_facts.is_demo ?? false,
      source_url: primaryVariant?.source_url || null,
      last_verified_at: primaryVariant?.last_verified_at || null,
      catalog_version: CATALOGUE_VERSION,
      chunk_type: "claims",
      text: claimsText || `Authentic personal care formulation from Be Bodywise.`,
    });
  }

  // 3. Build Support Chunks
  const supportChunks: SupportKnowledgeChunk[] = OFFICIAL_SUPPORT_CHANNELS.map(ch => ({
    id: ch.id,
    title: ch.name,
    description: ch.description,
    type: ch.type,
    target_url: ch.target_url,
    source: ch.source,
    last_checked: ch.last_checked,
    recommended_for: ch.recommended_for,
    text: `${ch.name}. ${ch.description}. Recommended for: ${ch.recommended_for}. Official link: ${ch.target_url}`,
  }));

  // Compact one-line per family formatting
  const digestLines = "[\n" + digestEntries.map(e => "  " + JSON.stringify(e)).join(",\n") + "\n]";
  const estimatedTokens = Math.ceil(digestLines.length / 4);
  console.log(`Knowledge Digest: ${digestEntries.length} families, ${digestLines.length} chars, estimated tokens: ${estimatedTokens} (budget: ${KNOWLEDGE_DIGEST_MAX_TOKENS})`);

  if (estimatedTokens > KNOWLEDGE_DIGEST_MAX_TOKENS) {
    throw new Error(
      `KNOWLEDGE_DIGEST_MAX_TOKENS exceeded: estimated ${estimatedTokens} tokens > budget ${KNOWLEDGE_DIGEST_MAX_TOKENS}`
    );
  }

  // Write Files
  const digestPath = path.join(outDir, "digest.json");
  fs.writeFileSync(digestPath, digestLines, "utf8");

  const chunksPath = path.join(outDir, "chunks.json");
  fs.writeFileSync(chunksPath, JSON.stringify(chunks, null, 2), "utf8");

  const supportPath = path.join(outDir, "support.json");
  fs.writeFileSync(supportPath, JSON.stringify(supportChunks, null, 2), "utf8");

  // Also write TypeScript seed to packages/shared/src/knowledge/data.seed.ts
  const sharedKnowledgeDir = path.resolve(process.cwd(), "packages/shared/src/knowledge");
  fs.mkdirSync(sharedKnowledgeDir, { recursive: true });
  const seedTsPath = path.join(sharedKnowledgeDir, "data.seed.ts");
  const seedTsContent = `/**
 * Pre-compiled Knowledge Data Seed for Bodywise Match
 * Auto-generated by scripts/build-knowledge.ts
 */

import { FamilyDigestEntry, KnowledgeChunk, SupportKnowledgeChunk } from "./types";

export const DIGEST_SEED: FamilyDigestEntry[] = ${digestLines};

export const CHUNKS_SEED: KnowledgeChunk[] = ${JSON.stringify(chunks, null, 2)};

export const SUPPORT_SEED: SupportKnowledgeChunk[] = ${JSON.stringify(supportChunks, null, 2)};
`;
  fs.writeFileSync(seedTsPath, seedTsContent, "utf8");

  // 4. Generate reports/knowledge-quality.md
  let reportMd = `# Knowledge Quality & Hygiene Report\n\n`;
  reportMd += `*Generated: ${new Date().toISOString()} | Catalogue Version: ${CATALOGUE_VERSION}*\n\n`;
  reportMd += `## Summary Statistics\n`;
  reportMd += `- **Total Families Indexed:** ${families.length}\n`;
  reportMd += `- **Total Knowledge Chunks:** ${chunks.length}\n`;
  reportMd += `- **Support Channels Indexed:** ${supportChunks.length}\n`;
  reportMd += `- **Digest Token Estimate:** ${estimatedTokens} / ${KNOWLEDGE_DIGEST_MAX_TOKENS} tokens\n`;
  reportMd += `- **Average Tokens Per Family:** ${Math.round(estimatedTokens / families.length)}\n\n`;

  reportMd += `## 1. Category Misclassifications & Oddities (${oddCategories.length})\n`;
  if (oddCategories.length === 0) {
    reportMd += `No category oddities found.\n\n`;
  } else {
    reportMd += `| Family ID | Product Name | Raw Catalogue Category | Canonical Assigned Category | Finding |\n`;
    reportMd += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const odd of oddCategories) {
      reportMd += `| \`${odd.familyId}\` | **${odd.name}** | \`${odd.rawCat}\` | \`${odd.canonicalCat}\` | ${odd.reason} |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## 2. Generic or Empty Descriptions (${genericDescriptions.length})\n`;
  if (genericDescriptions.length === 0) {
    reportMd += `All descriptions are rich and descriptive.\n\n`;
  } else {
    reportMd += `| Family ID | Product Name | Description Snippet |\n`;
    reportMd += `| :--- | :--- | :--- |\n`;
    for (const g of genericDescriptions) {
      reportMd += `| \`${g.familyId}\` | **${g.name}** | ${g.desc.slice(0, 80)}... |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## 3. Marketing / App Promo Text in Directions (${marketingTextFound.length})\n`;
  if (marketingTextFound.length === 0) {
    reportMd += `No promotional marketing text detected in directions.\n\n`;
  } else {
    reportMd += `| Family ID | Product Name | Detected Promo Copy (Sanitized for RAG) |\n`;
    reportMd += `| :--- | :--- | :--- |\n`;
    for (const m of marketingTextFound) {
      reportMd += `| \`${m.familyId}\` | **${m.name}** | \`${m.snippet}\` |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## 4. Families with No Evidenced Concepts (${missingConceptEvidence.length})\n`;
  if (missingConceptEvidence.length === 0) {
    reportMd += `All families have at least one evidenced concept.\n\n`;
  } else {
    reportMd += `| Family ID | Product Name |\n`;
    reportMd += `| :--- | :--- |\n`;
    for (const m of missingConceptEvidence) {
      reportMd += `| \`${m.familyId}\` | **${m.name}** |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## 5. Size Conflicts Across Variants (${sizeConflicts.length})\n`;
  if (sizeConflicts.length === 0) {
    reportMd += `Zero duplicate or conflicting variant size labels detected.\n\n`;
  } else {
    reportMd += `| Family ID | Product Name | Variant Sizes |\n`;
    reportMd += `| :--- | :--- | :--- |\n`;
    for (const s of sizeConflicts) {
      reportMd += `| \`${s.familyId}\` | **${s.name}** | ${s.variants.join(", ")} |\n`;
    }
    reportMd += `\n`;
  }

  const reportPath = path.join(reportsDir, "knowledge-quality.md");
  fs.writeFileSync(reportPath, reportMd, "utf8");

  console.log(`✅ Knowledge index generated successfully:`);
  console.log(`   - Digest: ${digestPath}`);
  console.log(`   - Chunks: ${chunksPath}`);
  console.log(`   - Support: ${supportPath}`);
  console.log(`   - Quality Report: ${reportPath}`);
}

if (require.main === module) {
  buildKnowledge();
}
