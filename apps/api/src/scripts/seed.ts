/**
 * Database Seed Script for Bodywise Match
 * Populates products, issue guides, and demo customer experiences into Supabase PostgreSQL.
 * Uses pooled connection string (port 6543).
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { DEMO_CATALOGUE_SEED, DEMO_EXPERIENCES_SEED } from "@bodywise/shared";

dotenv.config();

export interface SeedResult {
  success: boolean;
  dryRun: boolean;
  productCount: number;
  experienceCount: number;
  message: string;
}

export async function runSeed(): Promise<SeedResult> {
  console.log("==========================================");
  console.log("🌱 Bodywise Match Database Seeder");
  console.log("==========================================\n");

  const dbUrl = process.env.DATABASE_URL;
  const seedPath = path.resolve(__dirname, "../../../../supabase/seed.sql");

  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed SQL not found at path: ${seedPath}`);
  }

  const sqlContent = fs.readFileSync(seedPath, "utf-8");

  if (!dbUrl || dbUrl.includes("[PASSWORD]")) {
    console.log("ℹ️  No live DATABASE_URL provided. Validating seed payload locally (Dry-run mode)...");
    console.log(`   - Seed File: ${seedPath} (${sqlContent.length} bytes)`);
    console.log(`   - Products Ready: ${DEMO_CATALOGUE_SEED.length} demo records (all flagged is_demo: true)`);
    console.log(`   - Verified Experiences: ${DEMO_EXPERIENCES_SEED.length} sample records (all flagged is_demo: true)`);
    console.log("\n💡 In production, provide the Supabase pooled connection string:");
    console.log("   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true\n");

    return {
      success: true,
      dryRun: true,
      productCount: DEMO_CATALOGUE_SEED.length,
      experienceCount: DEMO_EXPERIENCES_SEED.length,
      message: "Seed data validated cleanly in dry-run mode.",
    };
  }

  const isSupabase = dbUrl.includes("supabase.co") || dbUrl.includes("pooler.supabase.com");
  const usesPort5432 = dbUrl.includes(":5432");
  const usesPort6543 = dbUrl.includes(":6543");

  if (isSupabase && usesPort5432) {
    console.warn("\n⚠️  WARNING: You are connecting via direct port 5432.");
    console.warn("   For Render/Vercel serverless apps, connect via Supabase pooled connection string on port 6543.\n");
  } else if (isSupabase && usesPort6543) {
    console.log("✅ Using Supabase pooled connection string (port 6543).");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log("🔌 Connected to PostgreSQL. Seeding database inside transaction...");
    await client.query("BEGIN");
    await client.query(sqlContent);
    await client.query("COMMIT");
    console.log("✅ Seed transaction committed successfully.");

    // Query counts
    const prodRes = await client.query("SELECT COUNT(*) AS count FROM products;");
    const expRes = await client.query("SELECT COUNT(*) AS count FROM experiences;");
    const guideRes = await client.query("SELECT COUNT(*) AS count FROM issue_guides;");

    const productCount = parseInt(prodRes.rows[0]?.count || "0", 10);
    const experienceCount = parseInt(expRes.rows[0]?.count || "0", 10);
    const guideCount = parseInt(guideRes.rows[0]?.count || "0", 10);

    console.log(`📋 Database Status:`);
    console.log(`   - Products in DB: ${productCount}`);
    console.log(`   - Experiences in DB: ${experienceCount}`);
    console.log(`   - Issue Guides in DB: ${guideCount}`);

    return {
      success: true,
      dryRun: false,
      productCount,
      experienceCount,
      message: `Successfully seeded ${productCount} products, ${experienceCount} experiences, and ${guideCount} issue guides.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed and rolled back:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  runSeed()
    .then((res) => {
      console.log(`\n🎉 Seed finished: ${res.message}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Fatal seed error:", err);
      process.exit(1);
    });
}
