import { NextRequest, NextResponse } from "next/server";
import { parseFilterIntent } from "@/lib/server/filterIntentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      active_filters?: {
        search?: string;
        categories?: string[];
        formats?: string[];
        goals?: string[];
        fragrance?: string;
      };
    };

    if (typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Invalid input. 'query' string is required." },
        { status: 400 }
      );
    }

    const result = await parseFilterIntent({
      query: body.query,
      active_filters: body.active_filters,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[ParseFilter Route] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error during filter intent parsing" },
      { status: 500 }
    );
  }
}
