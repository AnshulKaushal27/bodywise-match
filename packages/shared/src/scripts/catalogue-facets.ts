/**
 * Catalogue Facets Analysis Script
 * Analyzes DEMO_CATALOGUE_SEED for facet value distributions, askability, and data anomalies.
 * Strictly read-only: does not modify catalogue data.
 */

import { DEMO_CATALOGUE_SEED } from "../data/catalogue.seed";
import { ProductRecord } from "../product";

export interface FacetDistribution {
  category: string;
  totalProducts: number;
  formats: Record<string, number>;
  bodyAreas: Record<string, number>;
  timeOfDay: Record<string, number>;
  fragrance: { free: number; scented: number; unverified: number };
  goals: Record<string, number>;
  askableFacets: string[];
  anomalies: string[];
}

export function detectBodyArea(p: ProductRecord): string {
  const text = `${p.official_name} ${p.official_description} ${p.label_directions} ${(p.suitable_for || []).join(" ")}`.toLowerCase();
  if (/\b(underarm|armpit|axilla)\b/.test(text)) return "underarm";
  if (/\b(scalp|hair|follicle|roots)\b/.test(text) && !/\b(body\s*hair)\b/.test(text)) {
    if (/\b(scalp)\b/.test(text)) return "scalp";
    return "hair";
  }
  if (/\b(face|facial|cheeks|forehead|lips)\b/.test(text) || p.slug.includes("peptide-ceramide-moisturizer") || p.official_name.toLowerCase().includes("pigmentation repair cream")) return "face";
  if (/\b(body|legs|arms|back|elbows|knees)\b/.test(text)) return "body";
  return "unspecified";
}

export function detectTimeOfDay(p: ProductRecord): string {
  const text = `${p.label_directions} ${p.official_description}`.toLowerCase();
  const am = /\b(morning|am|daytime|sun|spf|before stepping out)\b/.test(text);
  const pm = /\b(night|pm|bedtime|overnight|evening|before sleeping)\b/.test(text);
  if (am && pm) return "both";
  if (am) return "morning";
  if (pm) return "night";
  return "any_time";
}

export function analyzeCatalogueFacets(catalogue: ProductRecord[]): Record<string, FacetDistribution> {
  const results: Record<string, FacetDistribution> = {};

  for (const p of catalogue) {
    const cat = p.category;
    if (!results[cat]) {
      results[cat] = {
        category: cat,
        totalProducts: 0,
        formats: {},
        bodyAreas: {},
        timeOfDay: {},
        fragrance: { free: 0, scented: 0, unverified: 0 },
        goals: {},
        askableFacets: [],
        anomalies: [],
      };
    }
    const dist = results[cat];
    dist.totalProducts += 1;

    // Format
    dist.formats[p.format] = (dist.formats[p.format] || 0) + 1;

    // Body Area
    const area = detectBodyArea(p);
    dist.bodyAreas[area] = (dist.bodyAreas[area] || 0) + 1;

    // Time of day
    const tod = detectTimeOfDay(p);
    dist.timeOfDay[tod] = (dist.timeOfDay[tod] || 0) + 1;

    // Fragrance
    if (p.fragrance_free === true) dist.fragrance.free += 1;
    else if (p.fragrance_free === false) dist.fragrance.scented += 1;
    else dist.fragrance.unverified += 1;

    // Goals
    for (const g of p.supported_goals) {
      dist.goals[g] = (dist.goals[g] || 0) + 1;
    }

    // Anomalies check
    const lowerName = p.official_name.toLowerCase();
    if (cat === "body_wash" && (lowerName.includes("lotion") || lowerName.includes("cream") || p.format.toLowerCase().includes("lotion"))) {
      dist.anomalies.push(`[${p.slug}] "${p.official_name}" is a lotion/cream filed under body_wash`);
    }
    if (cat === "other" && (lowerName.includes("moisturizer") || lowerName.includes("roll-on") || p.format.toLowerCase().includes("roll-on"))) {
      dist.anomalies.push(`[${p.slug}] "${p.official_name}" (${p.format}) filed under generic category "other"`);
    }
  }

  // Determine askable facets per category
  for (const cat of Object.keys(results)) {
    const dist = results[cat];
    const askable: string[] = [];

    // Format askable if >= 2 distinct formats with count > 0
    if (Object.keys(dist.formats).length >= 2) askable.push("format");

    // Body area askable if >= 2 distinct areas (excluding unspecified)
    const validAreas = Object.keys(dist.bodyAreas).filter((k) => k !== "unspecified");
    if (validAreas.length >= 2) askable.push("body_area");

    // Time of day askable ONLY if differentiated (morning or night exists, not just any_time)
    const amCount = dist.timeOfDay["morning"] || 0;
    const pmCount = dist.timeOfDay["night"] || 0;
    if ((amCount > 0 && pmCount > 0) || (amCount > 0 && dist.totalProducts > amCount) || (pmCount > 0 && dist.totalProducts > pmCount)) {
      askable.push("time_of_day");
    }

    // Fragrance askable if both free and scented exist
    if (dist.fragrance.free > 0 && dist.fragrance.scented > 0) {
      askable.push("fragrance_pref");
    }

    dist.askableFacets = askable;
  }

  return results;
}

export function printCatalogueFacetsReport(catalogue: ProductRecord[] = DEMO_CATALOGUE_SEED) {
  console.log("=================================================");
  console.log("📊 BODYWISE CATALOGUE FACET DISTRIBUTION REPORT");
  console.log("=================================================\n");

  const analysis = analyzeCatalogueFacets(catalogue);

  for (const [cat, data] of Object.entries(analysis)) {
    console.log(`\n📦 CATEGORY: ${cat.toUpperCase()} (${data.totalProducts} products)`);
    console.log(`   Formats:        ${JSON.stringify(data.formats)}`);
    console.log(`   Body Areas:     ${JSON.stringify(data.bodyAreas)}`);
    console.log(`   Time of Day:    ${JSON.stringify(data.timeOfDay)}`);
    console.log(`   Fragrance:      Free: ${data.fragrance.free}, Scented: ${data.fragrance.scented}, Unverified: ${data.fragrance.unverified}`);
    console.log(`   Askable Facets: [${data.askableFacets.join(", ") || "none"}]`);
    if (data.anomalies.length > 0) {
      console.log(`   ⚠️  Anomalies (${data.anomalies.length}):`);
      for (const a of data.anomalies) {
        console.log(`      - ${a}`);
      }
    }
  }

  console.log("\n=================================================");
  console.log("🔎 SUMMARY OF ASKABLE QUESTIONS BY CATALOGUE DATA");
  console.log("=================================================");
  console.log("- product_type: Askable across entire catalogue (spans 8 categories).");
  console.log("- body_area:    Askable within 'serum' (hair vs face), 'sunscreen' (face vs body), and global search.");
  console.log("- time_of_day:  Only supported where directions or SPF explicitly differentiate (e.g. morning SPF vs night serums).");
  console.log("- format:       Askable within 'body_wash' (wash vs scrub vs lotion), 'sunscreen' (lotion vs spray).");
  console.log("- fragrance:    Askable within 'body_wash', 'serum', and 'sunscreen' where both free and scented exist.");
  console.log("=================================================\n");
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  (process.argv[1].includes("catalogue-facets.ts") || process.argv[1].includes("catalogue-facets.js"));

if (process.env.NODE_ENV !== "test" && isDirectRun) {
  printCatalogueFacetsReport();
}

