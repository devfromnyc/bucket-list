import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isEventCategory } from "@/lib/eventCategories";
import { enrichEvent } from "@/lib/gemini";
import {
  ensureProfile,
  formatPreferencesForAi,
} from "@/lib/preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = String(body.query ?? body.title ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const categoryHint =
      typeof body.category === "string" && isEventCategory(body.category)
        ? body.category
        : undefined;

    const session = await getSessionUser();
    const profile = session
      ? await ensureProfile({ email: session.email, name: session.name })
      : null;

    const result = await enrichEvent(
      query,
      categoryHint,
      formatPreferencesForAi(profile),
    );
    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
