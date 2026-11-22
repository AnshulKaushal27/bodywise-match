import { NextRequest, NextResponse } from "next/server";
import { matchMultiNeeds, DEMO_CATALOGUE_SEED, ParsedRequest } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsedRequest = body.parsed_request as ParsedRequest;

    if (!parsedRequest) {
      return NextResponse.json({ error: "Missing 'parsed_request' object." }, { status: 400 });
    }

    const result = matchMultiNeeds(parsedRequest, DEMO_CATALOGUE_SEED);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
