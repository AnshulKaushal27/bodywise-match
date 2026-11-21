/**
 * Catalogue Text Sanitizer
 * Command: pnpm catalogue:sanitize
 *
 * Section D.2:
 * - Strips emoji, pictographs, decorative symbols and repeated whitespace from all scraped text.
 * - Cleans concept_evidence snippets and knowledge cards.
 * - Flags any text containing medical wording.
 * - Guarantees rendered product text contains zero emojis.
 */

import * as fs from "fs";
import * as path from "path";

const EMOJI_AND_SYMBOLS_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}🔹✅🚨👇▶►✔★☆●■]/gu;

export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(EMOJI_AND_SYMBOLS_REGEX, "")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, " ") // Replace obscure control/non-ascii symbols with space
    .replace(/[ \t]+/g, " ")
    .replace(/\s*([,.;:!?])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeSnippet(snippet: string): string {
  if (!snippet) return "";
  let clean = sanitizeText(snippet);
  clean = clean.replace(/^[-,.;:!?\s]+/, "").replace(/[-,.;:!?\s]+$/, "");
  return clean;
}

const MEDICAL_PATTERNS = [
  /\b(cure|cures|curing)\b/i,
  /\b(treat|treatment of disease|treats disease)\b/i,
  /\b(prescription|antibiotic|medication)\b/i,
  /\b(diagnose|diagnosis)\b/i,
];

function checkMedicalFlags(text: string): string[] {
  const flags: string[] = [];
  for (const pat of MEDICAL_PATTERNS) {
    if (pat.test(text)) {
      flags.push(`Matched pattern: ${pat.source}`);
    }
  }
  return flags;
}

function main() {
  console.log("==> Starting Catalogue Text Sanitization...");

  const knowledgeSeedPath = path.resolve(__dirname, "../packages/shared/src/data/knowledge.seed.ts");
  if (!fs.existsSync(knowledgeSeedPath)) {
    console.error("Knowledge seed file not found:", knowledgeSeedPath);
    process.exit(1);
  }

  const rawFile = fs.readFileSync(knowledgeSeedPath, "utf-8");
  const jsonMatch = rawFile.match(/export const KNOWLEDGE_CARDS_SEED: KnowledgeCard\[\] = (\[[\s\S]*?\]);\s*$/);

  if (!jsonMatch) {
    console.error("Could not parse KNOWLEDGE_CARDS_SEED array from file.");
    process.exit(1);
  }

  let cards: any[] = [];
  try {
    cards = JSON.parse(jsonMatch[1]);
  } catch (err) {
    console.error("Failed to parse JSON from knowledge.seed.ts:", err);
    process.exit(1);
  }

  let sanitizedCount = 0;
  let medicalFlagCount = 0;

  for (const card of cards) {
    if (card.text) {
      const original = card.text;
      card.text = sanitizeText(card.text);
      if (card.text !== original) sanitizedCount++;
    }

    if (card.concept_evidence) {
      for (const [k, v] of Object.entries(card.concept_evidence)) {
        if (typeof v === "string") {
          card.concept_evidence[k] = sanitizeSnippet(v);
        }
      }
    }

    const medFlags = checkMedicalFlags(card.text);
    if (medFlags.length > 0) {
      medicalFlagCount++;
    }
  }

  // Re-write sanitized knowledge seed
  const updatedContent = `/**
 * Bundled Knowledge Cards Seed for Bodywise Match
 * Sanitized via scripts/sanitize-catalogue.ts
 * Strictly zero emojis, pictographs, or decorative symbols.
 */

export interface KnowledgeCard {
  productId: string;
  slug: string;
  name: string;
  category: string;
  format: string;
  text: string;
  concepts: string[];
  concept_evidence: Record<string, string>;
  concept_status: "auto" | "reviewed";
  is_demo: boolean;
}

export const KNOWLEDGE_CARDS_SEED: KnowledgeCard[] = ${JSON.stringify(cards, null, 2)};
`;

  fs.writeFileSync(knowledgeSeedPath, updatedContent, "utf-8");

  console.log(`==> Sanitization complete!`);
  console.log(`    Total knowledge cards: ${cards.length}`);
  console.log(`    Cards sanitized (emojis/symbols removed): ${sanitizedCount}`);
  console.log(`    Cards with medical wording noted: ${medicalFlagCount}`);
}

main();
