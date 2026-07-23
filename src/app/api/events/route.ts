import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { isEventCategory } from "@/lib/eventCategories";
import { geocodeCity } from "@/lib/geo";
import { createEvent, listEvents, uniqueEventCities } from "@/lib/events";
import { getDb } from "@/lib/db";
import { events, type EventCategory } from "@/lib/schema";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category") ?? "all";
    const statusParam = searchParams.get("status") ?? "all";
    const cityParam = searchParams.get("city")?.trim() || null;
    const radiusParam = searchParams.get("radiusMiles");
    const radiusMiles = radiusParam ? Number(radiusParam) : null;
    const favoritesOnly = searchParams.get("favorites") === "1";

    const category =
      categoryParam === "all" || isEventCategory(categoryParam)
        ? (categoryParam as EventCategory | "all")
        : "all";
    const status =
      statusParam === "todo" || statusParam === "completed"
        ? statusParam
        : "all";

    let center: { lat: number; lng: number } | null = null;
    if (cityParam && radiusMiles && Number.isFinite(radiusMiles)) {
      const geo = await geocodeCity(cityParam);
      if (geo) center = { lat: geo.lat, lng: geo.lng };
    }

    const filtered = await listEvents(session.userId, {
      category,
      status,
      favoritesOnly,
      city: cityParam,
      radiusMiles:
        cityParam && radiusMiles && Number.isFinite(radiusMiles)
          ? radiusMiles
          : null,
      center,
    });

    const db = getDb();
    const allRows = await db
      .select()
      .from(events)
      .where(eq(events.userId, session.userId))
      .orderBy(desc(events.createdAt));
    const cities = uniqueEventCities(allRows);

    return NextResponse.json({
      events: filtered,
      cities,
      center,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const category =
      typeof body.category === "string" && isEventCategory(body.category)
        ? body.category
        : "other";

    const latitude =
      typeof body.latitude === "number" && Number.isFinite(body.latitude)
        ? body.latitude
        : body.latitude != null && body.latitude !== ""
          ? Number(body.latitude)
          : null;
    const longitude =
      typeof body.longitude === "number" && Number.isFinite(body.longitude)
        ? body.longitude
        : body.longitude != null && body.longitude !== ""
          ? Number(body.longitude)
          : null;

    const event = await createEvent({
      userId: session.userId,
      title,
      description: String(body.description ?? ""),
      category,
      venue: body.venue ? String(body.venue).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      latitude: Number.isFinite(latitude as number) ? (latitude as number) : null,
      longitude: Number.isFinite(longitude as number)
        ? (longitude as number)
        : null,
      startsAt: body.startsAt ? String(body.startsAt) : null,
      endsAt: body.endsAt ? String(body.endsAt) : null,
      isFree: Boolean(body.isFree),
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      mapsUrl: body.mapsUrl ? String(body.mapsUrl) : null,
      eventUrl: body.eventUrl ? String(body.eventUrl) : null,
      completed: false,
      favorited: false,
      completedAt: null,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
