import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isTripStatus } from "@/lib/tripLabels";
import { createTrip, listTrips } from "@/lib/trips";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const trips = await listTrips(session.userId);
    return NextResponse.json({ trips });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load trips";
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

    const status =
      typeof body.status === "string" && isTripStatus(body.status)
        ? body.status
        : "draft";

    const trip = await createTrip({
      userId: session.userId,
      title,
      destinationCity: body.destinationCity
        ? String(body.destinationCity).trim()
        : null,
      startsOn: body.startsOn ? String(body.startsOn).trim() : null,
      endsOn: body.endsOn ? String(body.endsOn).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      status,
      favorited: false,
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
