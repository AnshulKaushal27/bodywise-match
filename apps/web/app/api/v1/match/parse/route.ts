import { NextRequest, NextResponse } from "next/server";
import { parseNeedsKeyword } from "@bodywise/shared";
import { randomUUID } from "crypto";

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

    const parsed = parseNeedsKeyword(rawInput);
    return NextResponse.json({
      request_id: randomUUID(),
      parsed_needs: parsed,
      strategy: "A",
      source: "rules",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
