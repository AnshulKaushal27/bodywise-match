/**
 * Explicit Product Type & Category Mapping Table
 * Maps colloquial user terms (English & Hinglish) to real catalogue types and categories.
 * Strictly prevents silent fallback to "Serum" (Section G.3).
 */

import { ProductCategory } from "../product";

export type CatalogueType =
  | "moisturizer"
  | "serum"
  | "face_wash"
  | "body_wash"
  | "shampoo"
  | "conditioner"
  | "hair_oil"
  | "sunscreen"
  | "supplement"
  | "roll_on";

export interface TypeMappingEntry {
  type: CatalogueType;
  displayName: string;
  synonyms: string[];
  canonicalCategories: ProductCategory[];
  supportedBodyAreas: string[];
  requiresAreaSplit?: boolean;
}

export const PRODUCT_TYPE_MAPPINGS: TypeMappingEntry[] = [
  {
    type: "moisturizer",
    displayName: "Moisturizer / Cream",
    synonyms: [
      "cream",
      "moisturizer",
      "moisturiser",
      "lotion",
      "malai",
      "lep",
      "cold cream",
      "day cream",
      "night cream",
      "face cream",
      "body lotion",
      "body cream",
    ],
    // In catalogue: face moisturizer is under 'other' (1% Peptide & Ceramide), body lotions under 'body_wash'
    canonicalCategories: ["other", "body_wash"],
    supportedBodyAreas: ["face", "body"],
    requiresAreaSplit: true,
  },
  {
    type: "serum",
    displayName: "Leave-on Serum",
    synonyms: ["serum", "dropper", "concentrate", "ark", "face serum", "hair serum"],
    canonicalCategories: ["serum"],
    supportedBodyAreas: ["hair", "face"],
    requiresAreaSplit: true,
  },
  {
    type: "face_wash",
    displayName: "Face Wash / Cleanser",
    synonyms: ["face wash", "facewash", "facial cleanser", "face cleanser", "face foam", "chehra dhone"],
    canonicalCategories: ["face_wash"],
    supportedBodyAreas: ["face"],
  },
  {
    type: "body_wash",
    displayName: "Body Wash / Scrub",
    synonyms: ["body wash", "bodywash", "shower gel", "body cleanser", "body scrub", "scrub", "bath"],
    canonicalCategories: ["body_wash"],
    supportedBodyAreas: ["body"],
  },
  {
    type: "shampoo",
    displayName: "Shampoo",
    synonyms: ["shampoo", "anti-dandruff shampoo", "scalp wash", "shampu"],
    canonicalCategories: ["shampoo"],
    supportedBodyAreas: ["hair", "scalp"],
  },
  {
    type: "conditioner",
    displayName: "Conditioner",
    synonyms: ["conditioner", "hair conditioner", "cream conditioner"],
    canonicalCategories: ["conditioner"],
    supportedBodyAreas: ["hair"],
  },
  {
    type: "hair_oil",
    displayName: "Hair Oil",
    synonyms: ["hair oil", "scalp oil", "tel", "tel lagana", "champi", "hair massage oil"],
    canonicalCategories: ["hair_oil"],
    supportedBodyAreas: ["hair", "scalp"],
  },
  {
    type: "sunscreen",
    displayName: "Sunscreen / Sun Protection",
    synonyms: ["sunscreen", "sunblock", "spf", "sun cream", "sun shield", "dhoop se bachav"],
    canonicalCategories: ["sunscreen", "body_wash"],
    supportedBodyAreas: ["face", "body"],
  },
  {
    type: "supplement",
    displayName: "Daily Gummies / Supplement",
    synonyms: ["gummies", "gummy", "supplement", "chewable", "capsule", "biotin", "tablets"],
    canonicalCategories: ["supplement"],
    supportedBodyAreas: ["hair", "body"],
  },
  {
    type: "roll_on",
    displayName: "Roll-On Applicator",
    synonyms: ["roll-on", "roll on", "roller", "underarm roll-on", "foot roll-on"],
    canonicalCategories: ["other"],
    supportedBodyAreas: ["underarm", "body"],
  },
];

/**
 * Resolves a user phrase into a canonical CatalogueType, if any.
 * Never guesses "serum" unless user terms specifically warrant it.
 */
export function mapUserPhraseToProductType(phrase: string): CatalogueType | null {
  const normalized = phrase.toLowerCase().trim();
  for (const entry of PRODUCT_TYPE_MAPPINGS) {
    for (const syn of entry.synonyms) {
      const regex = new RegExp(`(^|\\b)${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
      if (regex.test(normalized)) {
        return entry.type;
      }
    }
  }
  return null;
}

