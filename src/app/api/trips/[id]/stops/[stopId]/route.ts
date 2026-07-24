import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isTripStopKind } from "@/lib/tripLabels";
import {
  deleteTripStop,
  getTrip,
  updateTripStop,
} from "@/lib/trips";

type Params = { params: Promise<{ id: string; stopId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: tripId, stopId } = await params;
    const trip = await getTrip(session.userId, tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if ("notes" in body) {
      updates.notes = body.notes ? String(body.notes).trim() : null;
    }
    if ("startTime" in body) {
      updates.startTime = body.startTime ? String(body.startTime).trim() : null;
    }
    if ("mapsUrl" in body) {
      updates.mapsUrl = body.mapsUrl ? String(body.mapsUrl).trim() : null;
    }
    if ("imageUrl" in body) {
      updates.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    }
    if (typeof body.dayIndex === "number" && Number.isFinite(body.dayIndex)) {
      updates.dayIndex = Math.max(0, Math.floor(body.dayIndex));
    }
    if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
      updates.sortOrder = body.sortOrder;
    }
    if (typeof body.kind === "string" && isTripStopKind(body.kind)) {
      updates.kind = body.kind;
    }

    const stop = await updateTripStop(tripId, stopId, updates);
    if (!stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }
    return NextResponse.json({ stop });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update stop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: tripId, stopId } = await params;
    const trip = await getTrip(session.userId, tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const stop = await deleteTripStop(tripId, stopId);
    if (!stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete stop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
