import { NextRequest, NextResponse } from "next/server";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const product = DEMO_CATALOGUE_SEED.find((p) => p.slug === slug);

  if (!product) {
    return NextResponse.json({ error: "Product not found", slug }, { status: 404 });
  }

  return NextResponse.json({ product });
}
