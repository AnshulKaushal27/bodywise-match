import { NextRequest, NextResponse } from "next/server";
import { testGroqDebug } from "@/lib/server/groq";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const debugToken = process.env.DEBUG_TOKEN;
  const headerToken = req.headers.get("x-debug-token");

  // In production, require x-debug-token if DEBUG_TOKEN is configured
  if (isProduction && debugToken && headerToken !== debugToken) {
    return NextResponse.json(
      { error: "Debug endpoint disabled without valid x-debug-token header." },
      { status: 403 }
    );
  }

  const result = await testGroqDebug();
  return NextResponse.json(result);
}
