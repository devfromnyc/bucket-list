import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { geocodeCity } from "@/lib/geo";
import { planItinerary } from "@/lib/itinerary";
import { listPlaces } from "@/lib/places";
import {
  ensureProfile,
  formatPreferencesForAi,
} from "@/lib/preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const includeSaved = body.includeSaved !== false;
    const session = await getSessionUser();
    const profile = session
      ? await ensureProfile({ email: session.email, name: session.name })
      : null;

    const location =
      String(body.location ?? "").trim() || profile?.homeCity?.trim() || "";
    const radiusMiles =
      body.radiusMiles != null && body.radiusMiles !== ""
        ? Number(body.radiusMiles)
        : (profile?.defaultRadiusMiles ?? null);

    let savedPlaces: string[] = [];
    if (includeSaved) {
      try {
        let center: { lat: number; lng: number } | null = null;
        if (
          profile?.homeLatitude != null &&
          profile?.homeLongitude != null &&
          location &&
          profile.homeCity &&
          location.toLowerCase() === profile.homeCity.toLowerCase()
        ) {
          center = {
            lat: profile.homeLatitude,
            lng: profile.homeLongitude,
          };
        } else if (location && radiusMiles && Number.isFinite(radiusMiles)) {
          const geo = await geocodeCity(location);
          if (geo) center = { lat: geo.lat, lng: geo.lng };
        }
        const places = await listPlaces({
          status: "todo",
          city: location || null,
          radiusMiles:
            location && radiusMiles && Number.isFinite(radiusMiles)
              ? radiusMiles
              : null,
          center,
        });
        savedPlaces = places
          .map((p) => `${p.title}${p.city ? ` — ${p.city}` : ""} (${p.category})`)
          .slice(0, 20);
      } catch {
        savedPlaces = [];
      }
    }

    const plan = await planItinerary({
      location,
      radiusMiles:
        radiusMiles && Number.isFinite(radiusMiles) ? radiusMiles : null,
      mood:
        String(body.mood ?? "").trim() ||
        profile?.preferredVibe?.trim() ||
        "",
      duration: String(body.duration ?? "").trim(),
      withKids:
        body.withKids !== undefined
          ? Boolean(body.withKids)
          : Boolean(profile?.typicallyWithKids),
      budget:
        String(body.budget ?? "").trim() ||
        profile?.budgetPreference ||
        "flexible",
      criteria: String(body.criteria ?? "").trim(),
      savedPlaces,
      preferenceContext: formatPreferencesForAi(profile),
    });

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
