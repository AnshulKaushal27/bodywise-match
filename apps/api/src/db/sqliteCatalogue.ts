/**
 * Persistent SQLite Product Catalogue Database
 * Powered by native Node.js DatabaseSync (zero external binary dependencies).
 * Stores complete product records: descriptions, quantity/size, allergens/cautions,
 * ingredients, usage directions, and delivery support knowledge with FTS5 indexing.
 */

import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import * as fs from "node:fs";
import { DEMO_CATALOGUE_SEED, SUPPORT_SEED } from "@bodywise/shared";

export interface SqliteProductRecord {
  id: string;
  slug: string;
  official_name: string;
  brand_line: string;
  category: string;
  format: string;
  size: string;
  official_description: string;
  label_directions: string;
  ingredients: string[];
  cautions: string[] | null;
  fragrance_free: boolean;
  price_inr: number | null;
  supported_goals: string[];
  suitable_for: string[] | null;
  source_url: string | null;
  image_url: string | null;
}

export interface DeliverySupportRecord {
  id: string;
  title: string;
  type: string;
  description: string;
  recommended_for: string;
  target_url: string;
  text: string;
}

let dbInstance: DatabaseSync | null = null;

export function getCatalogueDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  // Persistent storage directory in apps/api/data
  const dbDir = path.resolve(__dirname, "../../data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "catalogue.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for high concurrency & reliability
  try {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  } catch {
    // Ignore PRAGMA errors on specific platforms
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      official_name TEXT NOT NULL,
      brand_line TEXT,
      category TEXT,
      format TEXT,
      size TEXT,
      official_description TEXT,
      label_directions TEXT,
      ingredients TEXT,
      cautions TEXT,
      fragrance_free INTEGER,
      price_inr INTEGER,
      supported_goals TEXT,
      suitable_for TEXT,
      source_url TEXT,
      image_url TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      id UNINDEXED,
      slug,
      official_name,
      category,
      format,
      size,
      official_description,
      label_directions,
      ingredients,
      cautions,
      supported_goals
    );

    CREATE TABLE IF NOT EXISTS support_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT,
      description TEXT,
      recommended_for TEXT,
      target_url TEXT,
      text TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS support_fts USING fts5(
      id UNINDEXED,
      title,
      description,
      recommended_for,
      text
    );
  `);

  // Seed if table is empty
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number };
  if (!countRow || countRow.cnt === 0) {
    seedCatalogueData(db);
  }

  dbInstance = db;
  return dbInstance;
}

function seedCatalogueData(db: DatabaseSync) {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, slug, official_name, brand_line, category, format, size,
      official_description, label_directions, ingredients, cautions,
      fragrance_free, price_inr, supported_goals, suitable_for, source_url, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO products_fts (
      id, slug, official_name, category, format, size,
      official_description, label_directions, ingredients, cautions, supported_goals
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of DEMO_CATALOGUE_SEED) {
    const ingredientsJson = JSON.stringify(p.ingredients || []);
    const cautionsJson = p.cautions ? JSON.stringify(p.cautions) : null;
    const goalsJson = JSON.stringify(p.supported_goals || []);
    const suitableJson = p.suitable_for ? JSON.stringify(p.suitable_for) : null;

    insertProduct.run(
      p.id,
      p.slug,
      p.official_name,
      p.brand_line || "Be Bodywise",
      p.category,
      p.format,
      p.size,
      p.official_description,
      p.label_directions,
      ingredientsJson,
      cautionsJson,
      p.fragrance_free ? 1 : 0,
      p.price_inr ?? null,
      goalsJson,
      suitableJson,
      p.source_url ?? null,
      p.image_url ?? null
    );

    insertFts.run(
      p.id,
      p.slug,
      p.official_name,
      p.category,
      p.format,
      p.size,
      p.official_description,
      p.label_directions,
      (p.ingredients || []).join(" "),
      (p.cautions || []).join(" "),
      (p.supported_goals || []).join(" ")
    );
  }

  // Seed Support Topics
  const insertSupport = db.prepare(`
    INSERT INTO support_topics (id, title, type, description, recommended_for, target_url, text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSupportFts = db.prepare(`
    INSERT INTO support_fts (id, title, description, recommended_for, text)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const s of SUPPORT_SEED) {
    insertSupport.run(s.id, s.title, s.type, s.description, s.recommended_for, s.target_url, s.text);
    insertSupportFts.run(s.id, s.title, s.description, s.recommended_for, s.text);
  }

  // Add detailed delivery FAQs into support table
  const deliveryFaqs = [
    {
      id: "delayed-delivery-faq",
      title: "Delayed Delivery & Tracking Status",
      type: "guide",
      description: "Standard delivery timeline is 3-5 business days. Check AWB tracking number in SMS/email.",
      recommended_for: "Parcels taking more than 3-5 business days, stuck tracking, courier delay",
      target_url: "/help/delayed_delivery",
      text: "Delivery timeline: Orders typically take 3-5 business days to arrive. You can track your parcel using the AWB tracking link sent to your registered mobile number and email via courier SMS. If 5 business days have passed without updates, contact courier or reach out to Be Bodywise customer care.",
    },
    {
      id: "damaged-delivery-faq",
      title: "Damaged or Leaked Parcel",
      type: "guide",
      description: "Take clear photos of outer box, shipping label, and damaged product. Email support@bebodywise.com within 48 hours.",
      recommended_for: "Broken bottles, leaked serum, torn box on delivery",
      target_url: "/help/damaged_product",
      text: "Damaged parcel protocol: Take 2-3 clear photos of the damaged bottle, batch code on base, and outer shipping label with AWB. Email support@bebodywise.com or WhatsApp +91 81286 88128 within 48 hours for immediate replacement.",
    },
    {
      id: "wrong-item-faq",
      title: "Wrong Item or Missing Item",
      type: "guide",
      description: "Verify package contents against packing slip. Report missing or incorrect items with invoice picture.",
      recommended_for: "Received wrong variant, missing freebie or bundle item",
      target_url: "/help/wrong_item",
      text: "Wrong or missing item: Check the printed invoice inside the box. Send a photo of the received items alongside the invoice to support@bebodywise.com. Replacements are dispatched within 24-48 hours.",
    },
  ];

  for (const df of deliveryFaqs) {
    insertSupport.run(df.id, df.title, df.type, df.description, df.recommended_for, df.target_url, df.text);
    insertSupportFts.run(df.id, df.title, df.description, df.recommended_for, df.text);
  }
}

/**
 * Searches the SQLite persistent database using FTS5 with fallback to LIKE.
 * Returns enriched product records with quantity, descriptions, allergens, and usage directions.
 */
interface ProductTableRow {
  id: string;
  slug: string;
  official_name: string;
  brand_line: string;
  category: string;
  format: string;
  size: string;
  official_description: string;
  label_directions: string;
  ingredients: string;
  cautions: string | null;
  fragrance_free: number;
  price_inr: number | null;
  supported_goals: string;
  suitable_for: string | null;
  source_url: string | null;
  image_url: string | null;
}

interface SupportTableRow {
  id: string;
  title: string;
  type: string;
  description: string;
  recommended_for: string;
  target_url: string;
  text: string;
}

function computeProductQueryRelevance(row: ProductTableRow, cleanQuery: string, words: string[]): number {
  const name = row.official_name.toLowerCase();
  const slug = row.slug.toLowerCase();
  const queryLower = cleanQuery.toLowerCase();
  let score = 0;

  // Exact match or substring in official_name
  if (name.includes(queryLower)) {
    score += 500;
  }
  if (slug.includes(queryLower.replace(/\s+/g, "-"))) {
    score += 400;
  }

  // Multi-word phrase matches in official_name
  for (let i = 0; i <= words.length - 4; i++) {
    const p4 = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`.toLowerCase();
    if (name.includes(p4)) score += 250;
  }
  for (let i = 0; i <= words.length - 3; i++) {
    const p3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
    if (name.includes(p3)) score += 150;
  }
  for (let i = 0; i <= words.length - 2; i++) {
    const p2 = `${words[i]} ${words[i + 1]}`.toLowerCase();
    if (name.includes(p2)) score += 60;
  }

  // Word token matches in official_name
  for (const w of words) {
    const wLower = w.toLowerCase();
    if (wLower.length > 2 && name.includes(wLower)) {
      score += 15;
    }
  }

  return score;
}

const SEARCH_STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "hai", "hain", "ho", "hona", "hone", "pe", "par", "ka", "ki", "ke", "ko", "se", "me", "mein",
  "aur", "ya", "bhi", "toh", "to", "ye", "yeh", "wo", "woh",
  "mera", "meri", "mere", "mujhe", "mujhko", "apna", "apni", "apne",
  "hum", "humein", "hamara", "humara", "humari", "aap", "aapka", "aapki", "aapke",
  "karna", "karni", "kare", "karein", "karen", "karo", "kar", "karte", "karti",
  "rehta", "rehti", "rehte", "rahta", "rahti", "rahte", "hota", "hoti", "hote",
  "tha", "thi", "the", "chahiye", "batao", "bataiye", "bata", "bataein", "wala", "wali", "wale"
]);

export function searchCatalogueProducts(
  query: string,
  options?: { category?: string; limit?: number }
): SqliteProductRecord[] {
  const db = getCatalogueDb();
  const limit = options?.limit || 5;
  const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, " ").trim();

  let results: ProductTableRow[] = [];
  const words = cleanQuery.split(/\s+/).filter((w) => w.length > 1);
  const searchWords = words.filter((w) => !SEARCH_STOPWORDS.has(w.toLowerCase()));

  if (searchWords.length > 0) {
    try {
      // Build FTS query with OR matching
      const ftsMatch = searchWords.map((w) => `"${w}"*`).join(" OR ");
      const stmt = db.prepare(`
        SELECT p.*, bm25(products_fts) as rank
        FROM products_fts fts
        JOIN products p ON fts.id = p.id
        WHERE products_fts MATCH ?
        ORDER BY rank ASC
        LIMIT 25
      `);
      results = stmt.all(ftsMatch) as unknown as ProductTableRow[];
    } catch {
      // Fallback to LIKE if FTS expression syntax error
      results = [];
    }
  }

  // Fallback to LIKE query if FTS yielded few results and searchWords exist
  if (results.length === 0 && searchWords.length > 0) {
    const likePattern = `%${searchWords[0]}%`;
    const stmt = db.prepare(`
      SELECT * FROM products
      WHERE official_name LIKE ?
         OR official_description LIKE ?
         OR format LIKE ?
         OR category LIKE ?
      LIMIT 25
    `);
    results = stmt.all(likePattern, likePattern, likePattern, likePattern) as unknown as ProductTableRow[];
  }

  // Filter by category if requested
  if (options?.category) {
    results = results.filter((r) => r.category === options.category);
  }

  // Re-rank results based on phrase matching and keyword density
  if (words.length > 0 && results.length > 1) {
    results.sort((a, b) => {
      const scoreA = computeProductQueryRelevance(a, cleanQuery, words);
      const scoreB = computeProductQueryRelevance(b, cleanQuery, words);
      return scoreB - scoreA;
    });
  }

  results = results.slice(0, limit);

  return results.map((row) => ({
    id: row.id,
    slug: row.slug,
    official_name: row.official_name,
    brand_line: row.brand_line,
    category: row.category,
    format: row.format,
    size: row.size,
    official_description: row.official_description,
    label_directions: row.label_directions,
    ingredients: parseJsonSafe(row.ingredients, []),
    cautions: parseJsonSafe(row.cautions, null),
    fragrance_free: Boolean(row.fragrance_free),
    price_inr: row.price_inr,
    supported_goals: parseJsonSafe(row.supported_goals, []),
    suitable_for: parseJsonSafe(row.suitable_for, null),
    source_url: row.source_url,
    image_url: row.image_url,
  }));
}

/**
 * Retrieves a single product by slug or id directly from SQLite.
 */
export function getCatalogueProductBySlug(slugOrId: string): SqliteProductRecord | null {
  const db = getCatalogueDb();
  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE slug = ? OR id = ?
    LIMIT 1
  `);
  const row = stmt.get(slugOrId, slugOrId) as unknown as ProductTableRow | undefined;
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    official_name: row.official_name,
    brand_line: row.brand_line,
    category: row.category,
    format: row.format,
    size: row.size,
    official_description: row.official_description,
    label_directions: row.label_directions,
    ingredients: parseJsonSafe(row.ingredients, []),
    cautions: parseJsonSafe(row.cautions, null),
    fragrance_free: Boolean(row.fragrance_free),
    price_inr: row.price_inr,
    supported_goals: parseJsonSafe(row.supported_goals, []),
    suitable_for: parseJsonSafe(row.suitable_for, null),
    source_url: row.source_url,
    image_url: row.image_url,
  };
}

/**
 * Searches delivery & order support knowledge from SQLite.
 */
export function searchDeliverySupportKnowledge(
  query: string,
  limit = 3
): DeliverySupportRecord[] {
  const db = getCatalogueDb();
  const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, " ").trim();

  let results: SupportTableRow[] = [];
  if (cleanQuery.length > 0) {
    try {
      const words = cleanQuery.split(/\s+/).filter((w) => w.length > 1);
      if (words.length > 0) {
        const ftsMatch = words.map((w) => `"${w}"*`).join(" OR ");
        const stmt = db.prepare(`
          SELECT s.*
          FROM support_fts fts
          JOIN support_topics s ON fts.id = s.id
          WHERE support_fts MATCH ?
          LIMIT ?
        `);
        results = stmt.all(ftsMatch, limit) as unknown as SupportTableRow[];
      }
    } catch {
      results = [];
    }
  }

  if (results.length === 0) {
    const stmt = db.prepare(`SELECT * FROM support_topics LIMIT ?`);
    results = stmt.all(limit) as unknown as SupportTableRow[];
  }

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    description: r.description,
    recommended_for: r.recommended_for,
    target_url: r.target_url,
    text: r.text,
  }));
}

function parseJsonSafe<T>(val: unknown, fallback: T): T {
  if (typeof val !== "string") return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
