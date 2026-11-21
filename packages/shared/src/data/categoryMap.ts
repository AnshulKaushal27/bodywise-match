/**
 * Category Implication & Slot Derivation Mapping Table
 * Rule 3: Category implies other slots (body_area, format).
 * Derived slots carry source: 'derived', can never conflict with the category, and are not asked.
 */

import { CatalogueCategoryId } from "./categories";

export interface CategoryImplications {
  derivedBodyArea?: "face" | "body" | "scalp" | "hair" | "underarm";
  derivedFormat?: string;
  allowedBodyAreas: string[];
}

export const CATEGORY_IMPLICATIONS: Record<CatalogueCategoryId, CategoryImplications> = {
  face_wash: {
    derivedBodyArea: "face",
    derivedFormat: "wash",
    allowedBodyAreas: ["face"],
  },
  body_wash: {
    derivedBodyArea: "body",
    derivedFormat: "wash",
    allowedBodyAreas: ["body"],
  },
  shampoo: {
    derivedBodyArea: "scalp",
    derivedFormat: "shampoo",
    allowedBodyAreas: ["scalp", "hair"],
  },
  conditioner: {
    derivedBodyArea: "hair",
    derivedFormat: "conditioner",
    allowedBodyAreas: ["hair"],
  },
  hair_oil: {
    derivedBodyArea: "hair",
    derivedFormat: "oil",
    allowedBodyAreas: ["hair", "scalp"],
  },
  serum: {
    derivedFormat: "serum",
    allowedBodyAreas: ["face", "hair", "scalp"],
  },
  sunscreen: {
    derivedFormat: "lotion",
    allowedBodyAreas: ["face", "body"],
  },
  supplement: {
    derivedFormat: "gummies",
    allowedBodyAreas: ["hair", "body"],
  },
  moisturizer: {
    derivedFormat: "cream",
    allowedBodyAreas: ["face", "body"],
  },
  roll_on: {
    derivedBodyArea: "underarm",
    derivedFormat: "roll-on",
    allowedBodyAreas: ["underarm", "body"],
  },
  kit: {
    derivedFormat: "kit",
    allowedBodyAreas: ["face", "body", "hair", "underarm", "scalp"],
  },
  accessory: {
    derivedFormat: "accessory",
    allowedBodyAreas: ["face", "body", "hair", "scalp"],
  },
  other: {
    allowedBodyAreas: ["face", "body", "hair", "underarm", "scalp"],
  },
};

/**
 * Returns implied slot values for a given category.
 */
export function getImplicationsForCategory(category: CatalogueCategoryId): CategoryImplications | null {
  return CATEGORY_IMPLICATIONS[category] || null;
}

/**
 * Checks if a proposed body area conflicts with an explicit category.
 */
export function isAreaConflictingWithCategory(
  category: CatalogueCategoryId,
  area: string
): boolean {
  const implications = CATEGORY_IMPLICATIONS[category];
  if (!implications) return false;
  if (implications.allowedBodyAreas.length === 0) return false;
  return !implications.allowedBodyAreas.includes(area);
}
