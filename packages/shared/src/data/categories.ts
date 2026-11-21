/**
 * Official Catalogue Categories & Deterministic Detector
 * Priority Tier 1: An explicitly named category ALWAYS has top priority as a hard filter.
 * Deterministic detection runs BEFORE the LLM on every parse and chat turn.
 */

export type CatalogueCategoryId =
  | "body_wash"
  | "face_wash"
  | "shampoo"
  | "conditioner"
  | "hair_oil"
  | "serum"
  | "sunscreen"
  | "supplement"
  | "moisturizer"
  | "roll_on";

export interface CategoryDefinition {
  id: CatalogueCategoryId;
  displayLabel: string;
  synonyms: string[];
  canonicalProductCategories: string[];
}

export const CATALOGUE_CATEGORIES: CategoryDefinition[] = [
  {
    id: "body_wash",
    displayLabel: "Body wash",
    canonicalProductCategories: ["body_wash"],
    synonyms: [
      "body wash",
      "bodywash",
      "body-wash",
      "body washes",
      "shower gel",
      "shower gels",
      "body cleanser",
      "body cleansers",
      "body scrub",
      "body scrubs",
      "scrub",
      "scrubs",
      "nahane ka sabun",
      "body soap",
      "bath gel",
      "bath wash",
      "exfoliating body wash",
      "exfoliating wash",
    ],
  },
  {
    id: "face_wash",
    displayLabel: "Face wash",
    canonicalProductCategories: ["face_wash"],
    synonyms: [
      "face wash",
      "fash wash",
      "facewash",
      "face-wash",
      "face washes",
      "facial cleanser",
      "facial cleansers",
      "face cleanser",
      "face cleansers",
      "face foam",
      "foam face wash",
      "chehra dhone ka",
      "chehra dhone",
      "facial wash",
    ],
  },
  {
    id: "shampoo",
    displayLabel: "Shampoo",
    canonicalProductCategories: ["shampoo"],
    synonyms: [
      "shampoo",
      "shamppo",
      "shampo",
      "shampoos",
      "shampu",
      "baal dhone ka",
      "scalp wash",
      "scalp shampoo",
      "anti-dandruff shampoo",
      "anti dandruff shampoo",
      "hair cleanser",
      "hair wash",
    ],
  },
  {
    id: "conditioner",
    displayLabel: "Conditioner",
    canonicalProductCategories: ["conditioner"],
    synonyms: [
      "conditioner",
      "conditioners",
      "hair conditioner",
      "hair conditioners",
      "cream conditioner",
    ],
  },
  {
    id: "hair_oil",
    displayLabel: "Hair oil",
    canonicalProductCategories: ["hair_oil"],
    synonyms: [
      "hair oil",
      "hair oils",
      "scalp oil",
      "scalp oils",
      "baal ka tel",
      "champi tel",
      "nourishing hair oil",
    ],
  },
  {
    id: "serum",
    displayLabel: "Serum",
    canonicalProductCategories: ["serum"],
    synonyms: [
      "serum",
      "serums",
      "dropper",
      "face serum",
      "hair serum",
      "hair growth serum",
      "scalp serum",
      "liquid serum",
      "active concentrate",
    ],
  },
  {
    id: "sunscreen",
    displayLabel: "Sunscreen",
    canonicalProductCategories: ["sunscreen"],
    synonyms: [
      "sunscreen",
      "sunscren",
      "sunscreens",
      "sunblock",
      "sun block",
      "spf",
      "spf 50",
      "spf50",
      "sun cream",
      "sun shield",
      "dhoop se bachav",
      "uv protection",
      "sun protection cream",
    ],
  },
  {
    id: "supplement",
    displayLabel: "Gummies / Supplement",
    canonicalProductCategories: ["supplement"],
    synonyms: [
      "biotin gummies",
      "hair gummies",
      "gummies",
      "gummy",
      "multivitamin gummies",
      "supplement",
      "supplements",
      "chewable",
      "chewables",
      "tablets",
      "capsules",
      "daily gummies",
    ],
  },
  {
    id: "moisturizer",
    displayLabel: "Moisturizer / Cream",
    canonicalProductCategories: ["other", "body_wash"],
    synonyms: [
      "moisturizer",
      "mosturizer",
      "moisterizer",
      "moisturiser",
      "moisturizers",
      "moisturisers",
      "face cream",
      "body lotion",
      "body cream",
      "cold cream",
      "day cream",
      "night cream",
      "hydrating cream",
      "malai",
      "lep",
      "lotion",
      "lotions",
      "cream",
      "creams",
    ],
  },
  {
    id: "roll_on",
    displayLabel: "Roll-on",
    canonicalProductCategories: ["other", "serum"],
    synonyms: [
      "underarm roll-on",
      "underarm roll on",
      "foot roll-on",
      "foot roll on",
      "roll-on",
      "roll on",
      "rollon",
      "roller",
      "deo roll on",
      "deodorant roll on",
    ],
  },
];

/**
 * Ambiguity dictionary for single words that could apply to multiple categories.
 */
export const CATEGORY_AMBIGUITY_TABLE: Record<
  string,
  { candidates: CatalogueCategoryId[]; defaultCategory?: CatalogueCategoryId }
> = {
  wash: { candidates: ["body_wash", "face_wash"] },
  cleanser: { candidates: ["face_wash", "body_wash"] },
  oil: { candidates: ["hair_oil", "serum"] },
  pack: { candidates: ["body_wash", "face_wash", "shampoo"] },
};

export interface DetectedCategory {
  categoryId: CatalogueCategoryId;
  displayLabel: string;
  matchedText: string;
  index: number;
}

/**
 * Pre-compiled, longest-match-first category patterns.
 * Guarantee: "body wash" matches body_wash, never face_wash.
 */
interface FlatPattern {
  categoryId: CatalogueCategoryId;
  displayLabel: string;
  synonym: string;
  regex: RegExp;
}

const COMPILED_PATTERNS: FlatPattern[] = (() => {
  const list: FlatPattern[] = [];
  for (const cat of CATALOGUE_CATEGORIES) {
    for (const syn of cat.synonyms) {
      const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Word boundary regex: ensures matching complete tokens
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
      list.push({
        categoryId: cat.id,
        displayLabel: cat.displayLabel,
        synonym: syn,
        regex,
      });
    }
  }
  // Sort longest synonym first
  list.sort((a, b) => b.synonym.length - a.synonym.length);
  return list;
})();

/**
 * Deterministic category detector.
 * Runs BEFORE the LLM on every parse and chat turn.
 * Longest-match-first with word boundaries.
 */
export function detectExplicitCategories(text: string): DetectedCategory[] {
  if (!text || typeof text !== "string") return [];
  const normalized = text.toLowerCase();
  const detected: DetectedCategory[] = [];
  const coveredRanges: Array<{ start: number; end: number }> = [];

  for (const item of COMPILED_PATTERNS) {
    const match = item.regex.exec(normalized);
    if (match) {
      // Find starting index of the actual synonym inside match
      const offset = match[1] ? match[1].length : 0;
      const start = match.index + offset;
      const end = start + item.synonym.length;

      // Avoid overlapping a longer match already claimed
      const overlaps = coveredRanges.some(
        (r) => Math.max(r.start, start) < Math.min(r.end, end)
      );

      if (!overlaps) {
        coveredRanges.push({ start, end });
        const exactSlice = text.slice(start, end);
        detected.push({
          categoryId: item.categoryId,
          displayLabel: item.displayLabel,
          matchedText: exactSlice,
          index: start,
        });
      }
    }
  }

  // Sort by appearance in original string
  detected.sort((a, b) => a.index - b.index);
  return detected;
}

/**
 * Returns the primary detected category, if any.
 */
export function detectPrimaryCategory(text: string): DetectedCategory | null {
  const matches = detectExplicitCategories(text);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Humanizes a category id to its clean UI display label.
 */
export function formatCategoryLabel(catId: string | null | undefined): string {
  if (!catId) return "Any product type";
  const found = CATALOGUE_CATEGORIES.find((c) => c.id === catId);
  if (found) return found.displayLabel;
  // Fallback humanization
  return catId
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
