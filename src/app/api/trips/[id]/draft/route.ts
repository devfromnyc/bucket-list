import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { draftTrip } from "@/lib/draftTrip";
import { listEvents } from "@/lib/events";
import { listPlaces } from "@/lib/places";
import { listStays } from "@/lib/stays";
import {
  formatPreferencesForAi,
  getProfileById,
} from "@/lib/preferences";
import {
  createTripStops,
  deleteTripStop,
  getTrip,
  getTripWithStops,
  listTripStops,
  updateTrip,
} from "@/lib/trips";

type Params = { params: Promise<{ id: string }> };

function estimateDayCount(
  startsOn: string | null | undefined,
  endsOn: string | null | undefined,
  fallback: number,
) {
  if (!startsOn || !endsOn) return fallback;
  const start = Date.parse(startsOn);
  const end = Date.parse(endsOn);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return fallback;
  }
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(days, 14));
}

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

    const body = await request.json().catch(() => ({}));
    const apply = body.apply !== false;
    const criteria = String(body.criteria ?? "").trim();
    const dayCount =
      typeof body.dayCount === "number" && Number.isFinite(body.dayCount)
        ? Math.max(1, Math.min(Math.floor(body.dayCount), 14))
        : estimateDayCount(trip.startsOn, trip.endsOn, 3);

    const profile = await getProfileById(session.userId);
    const [places, events, stays] = await Promise.all([
      listPlaces(session.userId, { status: "todo" }),
      listEvents(session.userId, { status: "todo" }),
      listStays(session.userId, { status: "todo" }),
    ]);

    const city = trip.destinationCity?.trim().toLowerCase();
    const filterByCity = <T extends { city: string | null }>(rows: T[]) => {
      if (!city) return rows.slice(0, 25);
      const matched = rows.filter((r) =>
        r.city?.toLowerCase().includes(city),
      );
      return (matched.length > 0 ? matched : rows).slice(0, 25);
    };

    const draft = await draftTrip({
      title: trip.title,
      destinationCity: trip.destinationCity,
      startsOn: trip.startsOn,
      endsOn: trip.endsOn,
      notes: trip.notes,
      criteria,
      dayCount,
      preferenceContext: formatPreferencesForAi(profile),
      savedPlaces: filterByCity(places).map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        category: p.category,
        mapsUrl: p.mapsUrl,
        imageUrl: p.imageUrl,
      })),
      savedEvents: filterByCity(events).map((e) => ({
        id: e.id,
        title: e.title,
        city: e.city,
        venue: e.venue,
        startsAt: e.startsAt,
        mapsUrl: e.mapsUrl,
        imageUrl: e.imageUrl,
      })),
      savedStays: filterByCity(stays).map((s) => ({
        id: s.id,
        title: s.title,
        city: s.city,
        neighborhood: s.neighborhood,
        category: s.category,
        mapsUrl: s.mapsUrl,
        bookingUrl: s.bookingUrl,
        imageUrl: s.imageUrl,
        priceBand: s.priceBand,
      })),
    });

    if (!apply) {
      return NextResponse.json({ draft });
    }

    // Replace existing stops with the draft
    const existing = await listTripStops(tripId);
    for (const stop of existing) {
      await deleteTripStop(tripId, stop.id);
    }

    const orderByDay = new Map<number, number>();
    const created = await createTripStops(
      draft.stops.map((stop) => {
        const sortOrder = orderByDay.get(stop.dayIndex) ?? 0;
        orderByDay.set(stop.dayIndex, sortOrder + 1);
        return {
          tripId,
          dayIndex: stop.dayIndex,
          sortOrder,
          kind: stop.kind,
          refId: stop.refId,
          title: stop.title,
          notes: stop.notes,
          startTime: stop.startTime,
          mapsUrl: stop.mapsUrl,
          imageUrl: stop.imageUrl,
        };
      }),
    );

    const notes = [trip.notes, draft.summary ? `AI draft: ${draft.summary}` : null]
      .filter(Boolean)
      .join("\n\n");

    await updateTrip(session.userId, tripId, {
      notes,
      status: trip.status === "done" ? trip.status : "planned",
    });

    const updated = await getTripWithStops(session.userId, tripId);
    return NextResponse.json({
      trip: updated,
      draft: { ...draft, appliedStops: created.length },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
