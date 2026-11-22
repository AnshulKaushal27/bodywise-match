import { NextRequest, NextResponse } from "next/server";
import { processVisualScan } from "@/lib/server/visualScanService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      image?: string;
      image_base64?: string;
      imageBase64?: string;
      preset?: string;
    };

    const imageBase64 = body.imageBase64 || body.image_base64 || body.image;
    const preset = body.preset;

    if (!imageBase64 && !preset) {
      return NextResponse.json(
        { error: "Please provide either an image or a preset product identifier." },
        { status: 400 }
      );
    }

    const result = await processVisualScan({
      imageBase64,
      preset,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[VisualScan Route] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error during visual scan" },
      { status: 500 }
    );
  }
}
