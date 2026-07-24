import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isStayCategory } from "@/lib/stayCategories";
import {
  deleteStay,
  getStay,
  toggleStayCompleted,
  toggleStayFavorite,
  updateStay,
} from "@/lib/stays";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const stay = await getStay(session.userId, id);
    if (!stay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ stay });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stay";
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

    if (body.toggleCompleted === true) {
      const stay = await toggleStayCompleted(session.userId, id);
      if (!stay) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ stay });
    }

    if (body.toggleFavorite === true) {
      const stay = await toggleStayFavorite(session.userId, id);
      if (!stay) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ stay });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string")
      updates.description = body.description;
    if (typeof body.category === "string" && isStayCategory(body.category)) {
      updates.category = body.category;
    }
    if ("neighborhood" in body) {
      updates.neighborhood = body.neighborhood
        ? String(body.neighborhood)
        : null;
    }
    if ("city" in body) updates.city = body.city ? String(body.city) : null;
    if ("priceBand" in body) {
      updates.priceBand = body.priceBand ? String(body.priceBand) : null;
    }
    if ("imageUrl" in body) {
      updates.imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    }
    if ("mapsUrl" in body) {
      updates.mapsUrl = body.mapsUrl ? String(body.mapsUrl) : null;
    }
    if ("bookingUrl" in body) {
      updates.bookingUrl = body.bookingUrl ? String(body.bookingUrl) : null;
    }
    if (typeof body.completed === "boolean") {
      updates.completed = body.completed;
      updates.completedAt = body.completed ? new Date() : null;
    }

    const stay = await updateStay(session.userId, id, updates);
    if (!stay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ stay });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update stay";
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
    const stay = await deleteStay(session.userId, id);
    if (!stay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete stay";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
