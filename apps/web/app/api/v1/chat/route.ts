import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createInitialSessionState } from "@bodywise/shared";
import { handleServerChatTurn } from "@/lib/server/chatService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Invalid request. 'message' string is required and non-empty." },
        { status: 400 }
      );
    }

    const state = body.state || createInitialSessionState();
    const requestId = randomUUID();

    const response = await handleServerChatTurn({
      state,
      message,
      history: body.history,
      pageContext: body.pageContext,
      language: body.language,
      mode: body.mode,
      requestId,
    });

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal chat error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
