import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { getPlace } from "@/lib/places";
import { getStay } from "@/lib/stays";
import { isTripStopKind } from "@/lib/tripLabels";
import {
  createTripStop,
  getTrip,
  nextSortOrder,
} from "@/lib/trips";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: tripId } = await params;
    const trip = await getTrip(session.userId, tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const dayIndex =
      typeof body.dayIndex === "number" && Number.isFinite(body.dayIndex)
        ? Math.max(0, Math.floor(body.dayIndex))
        : 0;

    let kind =
      typeof body.kind === "string" && isTripStopKind(body.kind)
        ? body.kind
        : "custom";
    let refId =
      typeof body.refId === "string" && body.refId.trim()
        ? body.refId.trim()
        : null;
    let title = String(body.title ?? "").trim();
    let notes = body.notes ? String(body.notes).trim() : null;
    let mapsUrl = body.mapsUrl ? String(body.mapsUrl).trim() : null;
    let imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    let startTime = body.startTime ? String(body.startTime).trim() : null;

    if (kind === "place" && refId) {
      const place = await getPlace(session.userId, refId);
      if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
      }
      title = title || place.title;
      mapsUrl = mapsUrl || place.mapsUrl;
      imageUrl = imageUrl || place.imageUrl;
      notes = notes || place.description || null;
    } else if (kind === "event" && refId) {
      const event = await getEvent(session.userId, refId);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      title = title || event.title;
      mapsUrl = mapsUrl || event.mapsUrl;
      imageUrl = imageUrl || event.imageUrl;
      startTime = startTime || event.startsAt;
      notes = notes || event.description || null;
    } else if (kind === "stay" && refId) {
      const stay = await getStay(session.userId, refId);
      if (!stay) {
        return NextResponse.json({ error: "Stay not found" }, { status: 404 });
      }
      title = title || stay.title;
      mapsUrl = mapsUrl || stay.mapsUrl || stay.bookingUrl;
      imageUrl = imageUrl || stay.imageUrl;
      notes = notes || stay.description || null;
    } else if (kind !== "custom") {
      kind = "custom";
      refId = null;
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const sortOrder =
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : await nextSortOrder(tripId, dayIndex);

    const stop = await createTripStop({
      tripId,
      dayIndex,
      sortOrder,
      kind,
      refId,
      title,
      notes,
      startTime,
      mapsUrl,
      imageUrl,
    });

    return NextResponse.json({ stop }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add stop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
