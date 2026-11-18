import { NextRequest, NextResponse } from "next/server";
import { selectNextQuestion, DEMO_CATALOGUE_SEED } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsedNeeds = body.parsed_needs;
    const answeredIds = body.answered_question_ids || [];

    const result = selectNextQuestion(
      parsedNeeds,
      DEMO_CATALOGUE_SEED,
      answeredIds
    );

    return NextResponse.json({
      question: result.question,
      candidate_count: result.candidate_count,
      explanation: result.explanation,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
