import { ProductRecord } from "../product";

export interface FamilyVariant {
  variantId: string;
  size_value: number | null;
  size_unit: string | null;
  size_label: string;
  sku: string;
  price_inr: number | null;
  image_url: string | null;
  is_default: boolean;
}

export interface CatalogFamily {
  familyId: string;
  canonical_name: string;
  slug: string;
  category: string;
  format: string;
  primaryProduct: ProductRecord;
  variants: FamilyVariant[];
  allProductIds: string[];
}

export function extractCanonicalName(name: string): string {
  let cleaned = name;
  cleaned = cleaned.replace(/\s*\(\s*\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\s*\)/gi, "");
  cleaned = cleaned.replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\b/gi, "");
  cleaned = cleaned.replace(/\s+\d+(?:\.\d+)?\s*(?:ml|mL|l|g|gm|grams|kg|oz|n|N)\b/gi, "");
  cleaned = cleaned.replace(/\s+\d{2,4}\s*$/g, "");
  cleaned = cleaned.replace(/[\s\-_]+$/, "").trim();
  return cleaned;
}

export function normalizeBaseKey(name: string): string {
  return extractCanonicalName(name)
    .toLowerCase()
    .replace(/[^\w\s%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFamilyIdForProduct(product: ProductRecord): string {
  const baseKey = normalizeBaseKey(product.official_name);
  const slugified = baseKey.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `fam-${slugified || product.slug}`;
}

export function groupProductsIntoFamilies(products: ProductRecord[]): CatalogFamily[] {
  const familiesMap = new Map<string, CatalogFamily>();

  for (const product of products) {
    const familyId = getFamilyIdForProduct(product);
    const existing = familiesMap.get(familyId);

    const variant: FamilyVariant = {
      variantId: `${product.slug}-v1`,
      size_value: null,
      size_unit: null,
      size_label: product.size || "Standard Packaging",
      sku: product.slug,
      price_inr: product.price_inr,
      image_url: product.image_url,
      is_default: !existing, // first one is default
    };

    if (!existing) {
      familiesMap.set(familyId, {
        familyId,
        canonical_name: extractCanonicalName(product.official_name),
        slug: product.slug.replace(/-\d+ml$|-\d+g$|-\d+gm$|-\d+l$/i, ""),
        category: product.category,
        format: product.format,
        primaryProduct: product,
        variants: [variant],
        allProductIds: [product.id],
      });
    } else {
      existing.variants.push(variant);
      existing.allProductIds.push(product.id);
    }
  }

  return Array.from(familiesMap.values());
}
