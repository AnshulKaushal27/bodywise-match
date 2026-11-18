import { NextResponse } from "next/server";
import { FALLBACK_CATALOGUE_GOALS } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    goals: FALLBACK_CATALOGUE_GOALS,
  });
}
