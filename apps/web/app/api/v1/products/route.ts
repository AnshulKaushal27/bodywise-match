import { NextResponse } from "next/server";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    products: DEMO_CATALOGUE_SEED,
    count: DEMO_CATALOGUE_SEED.length,
  });
}
