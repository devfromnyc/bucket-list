import { NextResponse } from "next/server";
import { isCategory } from "@/lib/categories";
import { geocodeCity } from "@/lib/geo";
import { createPlace, listPlaces, uniqueCities } from "@/lib/places";
import type { Category } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { places } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category") ?? "all";
    const statusParam = searchParams.get("status") ?? "all";
    const cityParam = searchParams.get("city")?.trim() || null;
    const radiusParam = searchParams.get("radiusMiles");
    const radiusMiles = radiusParam ? Number(radiusParam) : null;
    const favoritesOnly = searchParams.get("favorites") === "1";

    const category =
      categoryParam === "all" || isCategory(categoryParam)
        ? (categoryParam as Category | "all")
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

    const filtered = await listPlaces({
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

    // Cities list from full table (not filtered) for the dropdown
    const db = getDb();
    const allRows = await db.select().from(places).orderBy(desc(places.createdAt));
    const cities = uniqueCities(allRows);

    return NextResponse.json({
      places: filtered,
      cities,
      center,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load places";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const category =
      typeof body.category === "string" && isCategory(body.category)
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

    const place = await createPlace({
      title,
      description: String(body.description ?? ""),
      category,
      city: body.city ? String(body.city).trim() : null,
      latitude: Number.isFinite(latitude as number) ? (latitude as number) : null,
      longitude: Number.isFinite(longitude as number)
        ? (longitude as number)
        : null,
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      mapsUrl: body.mapsUrl ? String(body.mapsUrl) : null,
      completed: false,
      favorited: false,
      completedAt: null,
    });

    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create place";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
