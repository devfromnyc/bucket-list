import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isTripStatus } from "@/lib/tripLabels";
import {
  deleteTrip,
  getTripWithStops,
  updateTrip,
} from "@/lib/trips";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const trip = await getTripWithStops(session.userId, id);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    if (body.toggleFavorite === true) {
      const existing = await getTripWithStops(session.userId, id);
      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const trip = await updateTrip(session.userId, id, {
        favorited: !existing.favorited,
      });
      return NextResponse.json({ trip });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if ("destinationCity" in body) {
      updates.destinationCity = body.destinationCity
        ? String(body.destinationCity).trim()
        : null;
    }
    if ("startsOn" in body) {
      updates.startsOn = body.startsOn ? String(body.startsOn).trim() : null;
    }
    if ("endsOn" in body) {
      updates.endsOn = body.endsOn ? String(body.endsOn).trim() : null;
    }
    if ("notes" in body) {
      updates.notes = body.notes ? String(body.notes).trim() : null;
    }
    if (typeof body.status === "string" && isTripStatus(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.favorited === "boolean") {
      updates.favorited = body.favorited;
    }

    const trip = await updateTrip(session.userId, id, updates);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const trip = await deleteTrip(session.userId, id);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
