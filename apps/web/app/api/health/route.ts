import { NextResponse } from "next/server";
import { RULES_VERSION, CATALOGUE_VERSION } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const isLlmConfigured = Boolean(
    process.env.GROQ_API_KEY &&
      process.env.GROQ_API_KEY.trim().length > 0 &&
      process.env.LLM_ENABLED !== "false"
  );

  return NextResponse.json({
    status: "ok",
    service: "bodywise-match-web",
    version: "0.2.0",
    rules_version: RULES_VERSION,
    catalogue_version: CATALOGUE_VERSION,
    database: "client_ephemeral",
    llm: isLlmConfigured ? "groq" : "deterministic_only",
    ephemeral_disk: true,
    uptime: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
  });
}
