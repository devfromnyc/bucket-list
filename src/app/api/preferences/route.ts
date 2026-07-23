import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getProfileById,
  updatePreferences,
} from "@/lib/preferences";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await getProfileById(session.userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const { passwordHash: _, ...safe } = profile;
    return NextResponse.json({ profile: safe });
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
    const profile = await updatePreferences(session.userId, {
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

    const { passwordHash: _, ...safe } = profile;
    return NextResponse.json({ profile: safe });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
