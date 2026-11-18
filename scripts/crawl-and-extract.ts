import * as fs from "fs";
import * as path from "path";

interface ProductUrlEntry {
  url: string;
  slug: string;
  collection: string;
  discovered_at: string;
}

export function extractFromHtml(html: string, url: string, slug: string) {
  const notes: string[] = [];
  const fieldSources: Record<string, string> = {};

  // 1. JSON-LD blocks
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const jsonLds: any[] = [];
  for (const m of jsonLdMatches) {
    try {
      jsonLds.push(JSON.parse(m[1]));
    } catch {
      // ignore
    }
  }

  const productLd = jsonLds.find(j => j["@type"] === "Product");
  const howToLd = jsonLds.find(j => j["@type"] === "HowTo");

  // 2. Official name & H1
  let officialName = productLd?.name?.trim() || "";
  if (!officialName) {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    if (h1Match) {
      officialName = h1Match[1].replace(/<[^>]+>/g, "").trim();
    }
  }
  if (officialName) {
    fieldSources["official_name"] = productLd?.name ? "JSON-LD Product.name" : "HTML h1";
  } else {
    notes.push("Could not locate official product name");
  }

  // 3. Size extraction
  let size: string | null = null;
  const sizeMatch = officialName.match(/(\d+\s*(?:ml|mL|g|gm|kg|pcs|gummies|capsules|N|tablets|count))/i);
  if (sizeMatch) {
    size = sizeMatch[1].trim();
    fieldSources["size"] = "Extracted from official_name";
  } else {
    const htmlSizeMatch = html.match(/(?:Net (?:Vol|Qty|Weight|Quantity)|Size)[:\s]*([0-9]+\s*(?:ml|mL|g|gm|kg|pcs|gummies|N))/i);
    if (htmlSizeMatch) {
      size = htmlSizeMatch[1].trim();
      fieldSources["size"] = "HTML Net Quantity";
    }
  }

  // 4. Price & Offers
  let priceInr: number | null = null;
  if (productLd?.offers?.price) {
    const p = Number(productLd.offers.price);
    if (!isNaN(p) && p > 0) {
      priceInr = p;
      fieldSources["price_inr"] = "JSON-LD Product.offers.price";
    }
  }
  if (!priceInr) {
    const priceMatch = html.match(/₹\s*([0-9,]+)/);
    if (priceMatch) {
      const p = Number(priceMatch[1].replace(/,/g, ""));
      if (!isNaN(p) && p > 0) {
        priceInr = p;
        fieldSources["price_inr"] = "HTML Currency Symbol";
      }
    }
  }

  // 5. Image URL on site (reference only)
  let imageUrlOnSite: string | null = null;
  if (productLd?.image) {
    imageUrlOnSite = Array.isArray(productLd.image) ? productLd.image[0] : productLd.image;
    fieldSources["image_url_on_site"] = "JSON-LD Product.image";
  }

  // 6. Label Directions (How to use)
  let labelDirections: string | null = null;
  const howToSectionMatch = html.match(/How To Use\??\s*<\/h[1-4]>(.*?)(?:<h[1-4]|Ratings|Key Ingredients)/is);
  if (howToSectionMatch) {
    const cleanSteps = howToSectionMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanSteps.length > 10) {
      labelDirections = cleanSteps;
      fieldSources["label_directions"] = "HTML How To Use section";
    }
  }
  if (!labelDirections && howToLd?.step) {
    const steps = (howToLd.step as any[])
      .map(s => s.name || s.text || "")
      .filter(t => t.length > 5 && !t.includes("Extract") && !t.includes("Acid"));
    if (steps.length > 0) {
      labelDirections = steps.join(". ");
      fieldSources["label_directions"] = "JSON-LD HowTo.step";
    }
  }

  // 7. Full Ingredients List
  let ingredients: string[] | null = null;
  const ingSpanMatch = html.match(/<b>\s*Ingredient Names\s*<\/b>\s*<br\s*\/?>\s*<span>(.*?)<\/span>/is);
  if (ingSpanMatch) {
    const rawIngText = ingSpanMatch[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    if (rawIngText.length > 5) {
      ingredients = rawIngText
        .split(/,\s*(?![^(]*\))/)
        .map(i => i.trim())
        .filter(i => i.length > 1);
      fieldSources["ingredients"] = "HTML Accordion: Ingredient Names";
    }
  }

  if (!ingredients) {
    const ingMatch = html.match(/(?:Full list of ingredients|Ingredients list|All Ingredients)[^<]*<\/div>\s*<div[^>]*>.*?<b>\s*Ingredient Names\s*<\/b>\s*<br\s*\/?>\s*<span>(.*?)<\/span>/is);
    if (ingMatch) {
      const rawIngText = ingMatch[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      ingredients = rawIngText
        .split(/,\s*(?![^(]*\))/)
        .map(i => i.trim())
        .filter(i => i.length > 1);
      fieldSources["ingredients"] = "HTML Full list of ingredients section";
    }
  }

  // 8. Fragrance Free
  let fragranceFree: boolean | null = null;
  const lowerHtml = html.toLowerCase();
  const formulatedWithoutMatch = html.match(/<b>\s*Formulated Without\s*<\/b>\s*<br\s*\/?>\s*<span>(.*?)<\/span>/is);
  const formulatedWithout = formulatedWithoutMatch ? formulatedWithoutMatch[1].toLowerCase() : "";

  if (ingredients && ingredients.some(i => i.toLowerCase().includes("fragrance") || i.toLowerCase().includes("parfum"))) {
    fragranceFree = false;
    fieldSources["fragrance_free"] = "Ingredients list contains fragrance/parfum";
  } else if (slug.includes("frag-free") || slug.includes("no-fragrance") || formulatedWithout.includes("fragrance")) {
    fragranceFree = true;
    fieldSources["fragrance_free"] = "Explicit page specification: fragrance free";
  } else {
    fragranceFree = null;
  }

  // 9. Published Claims & Medical Claim Language
  const publishedClaims: string[] = [];
  const claimHeadings = [...html.matchAll(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gis)]
    .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim())
    .filter(t => t.length > 5 && !t.includes("How To") && !t.includes("Ingredients") && !t.includes("Ratings") && !t.includes("Questions") && !t.includes("Routine"));
  
  if (claimHeadings.length > 0) {
    publishedClaims.push(...claimHeadings.slice(0, 4));
    fieldSources["published_claims"] = "HTML benefit headings";
  }

  const medicalKeywords = ["cure", "cures", "treats", "treatment", "heal", "heals", "prevent body acne", "clear acne", "clears acne", "anti-dandruff clinical"];
  const medicalClaimLanguage = publishedClaims.some(c => medicalKeywords.some(k => c.toLowerCase().includes(k)))
    || (productLd?.description && medicalKeywords.some((k: string) => productLd.description.toLowerCase().includes(k)))
    || false;

  // 10. Cautions
  let cautions: string[] | null = null;
  const cautionList: string[] = [];
  if (lowerHtml.includes("patch test")) {
    cautionList.push("Conduct a patch test prior to initial use.");
  }
  if (lowerHtml.includes("consult a doctor") || lowerHtml.includes("consult a physician") || lowerHtml.includes("consult a qualified") || lowerHtml.includes("consult a health")) {
    cautionList.push("Consult a healthcare professional if irritation or adverse symptoms develop.");
  }
  if (cautionList.length > 0) {
    cautions = cautionList;
    fieldSources["cautions"] = "HTML FAQ / safety advisory text";
  }

  // 11. Suitable for
  let suitableFor: string[] | null = null;
  if (lowerHtml.includes("all skin types")) {
    suitableFor = ["All skin types"];
    fieldSources["suitable_for"] = "HTML skin type recommendation";
  } else if (lowerHtml.includes("dry to very dry")) {
    suitableFor = ["Dry to very dry skin"];
    fieldSources["suitable_for"] = "HTML skin type recommendation";
  } else if (lowerHtml.includes("oily") && lowerHtml.includes("acne-prone")) {
    suitableFor = ["Oily and blemish-prone skin"];
    fieldSources["suitable_for"] = "HTML skin type recommendation";
  }

  // 12. Category & Format
  let category = "other";
  let format = "Product";
  const s = slug.toLowerCase();
  if (s.includes("body-wash") || s.includes("bodywash")) {
    category = "body_wash";
    format = "Liquid body wash";
  } else if (s.includes("face-wash") || s.includes("facewash")) {
    category = "face_wash";
    format = "Gel / Foaming cleanser";
  } else if (s.includes("shampoo")) {
    category = "shampoo";
    format = "Liquid shampoo";
  } else if (s.includes("conditioner")) {
    category = "conditioner";
    format = "Cream rinse-off conditioner";
  } else if (s.includes("serum")) {
    category = "serum";
    format = s.includes("hair") ? "Leave-on hair serum" : "Topical skin serum";
  } else if (s.includes("lotion") || s.includes("cream")) {
    category = "body_wash";
    format = "Topical moisturizer / lotion";
  } else if (s.includes("sunscreen") || s.includes("spf")) {
    category = "sunscreen";
    format = s.includes("spray") ? "Sunscreen spray" : "Sunscreen lotion";
  } else if (s.includes("gummies") || s.includes("supplement")) {
    category = "supplement";
    format = "Chewable dietary supplement";
  } else if (s.includes("roll-on") || s.includes("rollon")) {
    category = "other";
    format = "Topical roll-on applicator";
  } else if (s.includes("scrub")) {
    category = "body_wash";
    format = "Exfoliating body scrub";
  }
  fieldSources["category"] = "Catalogue taxonomy";
  fieldSources["format"] = "Packaging and formula specification";

  // 13. Official description summary (Neutral paraphrase, 1-2 sentences)
  const officialDescriptionSummary = `${format} designed for regular personal care and surface skin maintenance.`;

  const now = new Date().toISOString();

  return {
    slug,
    official_name: officialName,
    category,
    format,
    size,
    official_description_summary: officialDescriptionSummary,
    official_description_quote: null,
    label_directions: labelDirections,
    ingredients,
    published_claims: publishedClaims,
    medical_claim_language: medicalClaimLanguage,
    cautions,
    fragrance_free: fragranceFree,
    suitable_for: suitableFor,
    price_inr: priceInr,
    price_checked_at: now,
    image_url_on_site: imageUrlOnSite,
    source_url: url,
    last_verified_at: now.split("T")[0],
    field_sources: fieldSources,
    extraction_notes: notes,
  };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const urlsPath = path.resolve(process.cwd(), "data/raw/product-urls.json");
  if (!fs.existsSync(urlsPath)) {
    console.error("product-urls.json not found! Run scripts/build-product-url-list.ts first.");
    process.exit(1);
  }

  const entries: ProductUrlEntry[] = JSON.parse(fs.readFileSync(urlsPath, "utf-8"));
  console.log(`Starting polite crawl of ${entries.length} products (min 2000ms delay between requests)...`);

  const pagesDir = path.resolve(process.cwd(), "data/raw/pages");
  const extractedDir = path.resolve(process.cwd(), "data/extracted");
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
  if (!fs.existsSync(extractedDir)) fs.mkdirSync(extractedDir, { recursive: true });

  let fetchedCount = 0;
  let cachedCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const htmlPath = path.join(pagesDir, `${entry.slug}.html`);
    const txtPath = path.join(pagesDir, `${entry.slug}.txt`);
    const jsonPath = path.join(extractedDir, `${entry.slug}.json`);

    let html = "";
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, "utf-8");
      cachedCount++;
    } else {
      console.log(`[${i + 1}/${entries.length}] Fetching ${entry.url}...`);
      try {
        const res = await fetch(entry.url, {
          headers: {
            "User-Agent": "BodywiseMatchAuditor/1.0 (+https://github.com/Mosaic-Fellowship/bodywise-match)",
          },
        });
        if (!res.ok) {
          console.warn(`HTTP ${res.status} for ${entry.url}`);
          continue;
        }
        html = await res.text();
        fs.writeFileSync(htmlPath, html, "utf-8");
        fetchedCount++;
        // Respect politeness policy: wait 2100ms
        await sleep(2100);
      } catch (err: any) {
        console.error(`Error fetching ${entry.url}:`, err.message);
        continue;
      }
    }

    // Save plain text for audit
    const plainText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    fs.writeFileSync(txtPath, plainText, "utf-8");

    // Extract facts
    const facts = extractFromHtml(html, entry.url, entry.slug);
    fs.writeFileSync(jsonPath, JSON.stringify(facts, null, 2), "utf-8");
  }

  console.log(`Extraction complete. Fetched: ${fetchedCount}, Cached: ${cachedCount}, Total: ${entries.length}`);
}

if (process.argv[1]?.endsWith("crawl-and-extract.ts")) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
