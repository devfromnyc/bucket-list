import { NextResponse } from "next/server";
import { isCategory } from "@/lib/categories";
import {
  deletePlace,
  getPlace,
  toggleCompleted,
  toggleFavorite,
  updatePlace,
} from "@/lib/places";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const place = await getPlace(id);
    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ place });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load place";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.toggleCompleted === true) {
      const place = await toggleCompleted(id);
      if (!place) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ place });
    }

    if (body.toggleFavorite === true) {
      const place = await toggleFavorite(id);
      if (!place) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ place });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string")
      updates.description = body.description;
    if (typeof body.category === "string" && isCategory(body.category)) {
      updates.category = body.category;
    }
    if ("imageUrl" in body) {
      updates.imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    }
    if ("mapsUrl" in body) {
      updates.mapsUrl = body.mapsUrl ? String(body.mapsUrl) : null;
    }
    if (typeof body.completed === "boolean") {
      updates.completed = body.completed;
      updates.completedAt = body.completed ? new Date() : null;
    }

    const place = await updatePlace(id, updates);
    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ place });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update place";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const place = await deletePlace(id);
    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete place";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
