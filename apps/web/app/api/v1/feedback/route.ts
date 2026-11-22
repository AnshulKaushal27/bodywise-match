import { NextRequest, NextResponse } from "next/server";
import { FeedbackSchema } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = FeedbackSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid feedback payload", issues: validated.error.issues },
        { status: 400 }
      );
    }

    // In-memory acknowledgment (privacy-first: zero PII persisted)
    return NextResponse.json({
      success: true,
      message: "Thank you for helping improve the discovery experience.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
