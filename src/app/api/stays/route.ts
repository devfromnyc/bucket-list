import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { isStayCategory } from "@/lib/stayCategories";
import { geocodeCity } from "@/lib/geo";
import { createStay, listStays, uniqueStayCities } from "@/lib/stays";
import { getDb } from "@/lib/db";
import { stays, type StayCategory } from "@/lib/schema";

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
      categoryParam === "all" || isStayCategory(categoryParam)
        ? (categoryParam as StayCategory | "all")
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

    const filtered = await listStays(session.userId, {
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
      .from(stays)
      .where(eq(stays.userId, session.userId))
      .orderBy(desc(stays.createdAt));
    const cities = uniqueStayCities(allRows);

    return NextResponse.json({
      stays: filtered,
      cities,
      center,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stays";
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
      typeof body.category === "string" && isStayCategory(body.category)
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

    const stay = await createStay({
      userId: session.userId,
      title,
      description: String(body.description ?? ""),
      category,
      neighborhood: body.neighborhood
        ? String(body.neighborhood).trim()
        : null,
      city: body.city ? String(body.city).trim() : null,
      latitude: Number.isFinite(latitude as number) ? (latitude as number) : null,
      longitude: Number.isFinite(longitude as number)
        ? (longitude as number)
        : null,
      priceBand: body.priceBand ? String(body.priceBand).trim() : null,
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      mapsUrl: body.mapsUrl ? String(body.mapsUrl) : null,
      bookingUrl: body.bookingUrl ? String(body.bookingUrl) : null,
      completed: false,
      favorited: false,
      completedAt: null,
    });

    return NextResponse.json({ stay }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create stay";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
