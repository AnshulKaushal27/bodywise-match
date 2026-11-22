import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseUserConcern } from "@/lib/server/parseService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawInput = body.user_input || "";
    if (typeof rawInput !== "string" || !rawInput.trim()) {
      return NextResponse.json(
        { error: "Field 'user_input' is required and must be non-empty." },
        { status: 400 }
      );
    }

    const requestId = randomUUID();
    const result = await parseUserConcern(rawInput, requestId);

    return NextResponse.json({
      request_id: requestId,
      parsed_needs: result.parsed_needs,
      parsed_request: result.parsed_request,
      strategy: result.strategy,
      source: result.source,
      model: result.model,
      latencyMs: result.latencyMs,
      error_category: result.error_category,
      fallback_reason: result.fallback_reason,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
