import { NextRequest, NextResponse } from "next/server";
import { calculateMatchPreview, DEMO_CATALOGUE_SEED, ParsedRequest } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = body.parsed as ParsedRequest;
    const answeredFacets = (body.answeredFacets || {}) as Record<string, string>;

    if (!parsed) {
      return NextResponse.json({ error: "Missing 'parsed' request object." }, { status: 400 });
    }

    const preview = calculateMatchPreview(parsed, DEMO_CATALOGUE_SEED, answeredFacets);
    return NextResponse.json(preview);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
