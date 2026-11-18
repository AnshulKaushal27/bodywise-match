import * as fs from "fs";
import * as path from "path";

interface ProductUrlEntry {
  url: string;
  slug: string;
  collection: string;
  discovered_at: string;
}

function categorizeSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("body-wash") || s.includes("bodywash") || s.includes("urea-lotion") || s.includes("body-scrub") || s.includes("body-lotion") || s.includes("aha-body") || s.includes("underarm")) {
    return "body_care";
  }
  if (s.includes("face-wash") || s.includes("facewash") || s.includes("acne") || s.includes("pimple") || s.includes("pigmentation") || s.includes("moisturizer") || s.includes("sunscreen") || s.includes("spf")) {
    return "skin_care";
  }
  if (s.includes("hair") || s.includes("shampoo") || s.includes("conditioner") || s.includes("frizz") || s.includes("scalp") || s.includes("dandruff") || s.includes("brow-lash")) {
    return "hair_care";
  }
  if (s.includes("gummies") || s.includes("multivitamin") || s.includes("magnesium") || s.includes("calcium") || s.includes("collagen")) {
    return "nutrition";
  }
  return "other";
}

async function main() {
  const sitemapPath = path.resolve(process.cwd(), "data/raw/sitemap-products.xml");
  const xml = fs.readFileSync(sitemapPath, "utf-8");
  const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());

  const discoveredAt = new Date().toISOString();
  const entries: ProductUrlEntry[] = locMatches.map(url => {
    const slug = url.split("/").pop() || "";
    return {
      url,
      slug,
      collection: categorizeSlug(slug),
      discovered_at: discoveredAt,
    };
  });

  // Sort: primary categories (body, skin, hair) first, then others
  const priorityOrder: Record<string, number> = {
    body_care: 1,
    skin_care: 2,
    hair_care: 3,
    nutrition: 4,
    other: 5,
  };

  entries.sort((a, b) => {
    const prioA = priorityOrder[a.collection] || 99;
    const prioB = priorityOrder[b.collection] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return a.slug.localeCompare(b.slug);
  });

  const outPath = path.resolve(process.cwd(), "data/raw/product-urls.json");
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`Total product URLs discovered: ${entries.length}`);
  const counts = entries.reduce<Record<string, number>>((acc, cur) => {
    acc[cur.collection] = (acc[cur.collection] || 0) + 1;
    return acc;
  }, {});
  console.log("Breakdown by collection:", counts);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
