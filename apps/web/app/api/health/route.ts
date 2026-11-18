import { NextResponse } from "next/server";
import { RULES_VERSION, CATALOGUE_VERSION } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "bodywise-match-web",
    version: "0.1.0",
    rules_version: RULES_VERSION,
    catalogue_version: CATALOGUE_VERSION,
    database: "client_ephemeral",
    llm: "delegated_to_api",
    ephemeral_disk: true,
    uptime: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
  });
}
