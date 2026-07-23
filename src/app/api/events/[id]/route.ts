import { NextResponse } from "next/server";
import { isEventCategory } from "@/lib/eventCategories";
import {
  deleteEvent,
  getEvent,
  toggleEventCompleted,
  toggleEventFavorite,
  updateEvent,
} from "@/lib/events";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const event = await getEvent(id);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.toggleCompleted === true) {
      const event = await toggleEventCompleted(id);
      if (!event) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    if (body.toggleFavorite === true) {
      const event = await toggleEventFavorite(id);
      if (!event) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string")
      updates.description = body.description;
    if (typeof body.category === "string" && isEventCategory(body.category)) {
      updates.category = body.category;
    }
    if ("venue" in body) updates.venue = body.venue ? String(body.venue) : null;
    if ("city" in body) updates.city = body.city ? String(body.city) : null;
    if ("startsAt" in body)
      updates.startsAt = body.startsAt ? String(body.startsAt) : null;
    if ("endsAt" in body)
      updates.endsAt = body.endsAt ? String(body.endsAt) : null;
    if (typeof body.isFree === "boolean") updates.isFree = body.isFree;
    if ("imageUrl" in body) {
      updates.imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    }
    if ("mapsUrl" in body) {
      updates.mapsUrl = body.mapsUrl ? String(body.mapsUrl) : null;
    }
    if ("eventUrl" in body) {
      updates.eventUrl = body.eventUrl ? String(body.eventUrl) : null;
    }
    if (typeof body.completed === "boolean") {
      updates.completed = body.completed;
      updates.completedAt = body.completed ? new Date() : null;
    }

    const event = await updateEvent(id, updates);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const event = await deleteEvent(id);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
