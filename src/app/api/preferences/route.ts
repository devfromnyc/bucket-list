import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ensureProfile,
  updatePreferences,
} from "@/lib/preferences";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await ensureProfile({
      email: session.email,
      name: session.name,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const profile = await updatePreferences(session.email, {
      name: body.name,
      bio: body.bio,
      homeCity: body.homeCity,
      defaultRadiusMiles:
        body.defaultRadiusMiles === "" || body.defaultRadiusMiles == null
          ? null
          : Number(body.defaultRadiusMiles),
      typicallyWithKids: Boolean(body.typicallyWithKids),
      budgetPreference: body.budgetPreference,
      dietaryNotes: body.dietaryNotes,
      interests: body.interests,
      avoidNotes: body.avoidNotes,
      preferredVibe: body.preferredVibe,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
