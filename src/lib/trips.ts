import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  tripStops,
  trips,
  type NewTrip,
  type NewTripStop,
  type Trip,
  type TripStop,
} from "./schema";

export type TripWithStops = Trip & { stops: TripStop[] };

export async function listTrips(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.updatedAt));
}

export async function getTrip(userId: string, id: string) {
  const db = getDb();
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)));
  return trip ?? null;
}

export async function getTripWithStops(
  userId: string,
  id: string,
): Promise<TripWithStops | null> {
  const trip = await getTrip(userId, id);
  if (!trip) return null;
  const stops = await listTripStops(trip.id);
  return { ...trip, stops };
}

export async function createTrip(
  input: Omit<NewTrip, "id" | "createdAt" | "updatedAt">,
) {
  const db = getDb();
  const [created] = await db
    .insert(trips)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateTrip(
  userId: string,
  id: string,
  input: Partial<Omit<NewTrip, "id" | "createdAt" | "userId">>,
) {
  const db = getDb();
  const [updated] = await db
    .update(trips)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(trips.id, id), eq(trips.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteTrip(userId: string, id: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function listTripStops(tripId: string) {
  const db = getDb();
  return db
    .select()
    .from(tripStops)
    .where(eq(tripStops.tripId, tripId))
    .orderBy(asc(tripStops.dayIndex), asc(tripStops.sortOrder));
}

export async function getTripStop(tripId: string, stopId: string) {
  const db = getDb();
  const [stop] = await db
    .select()
    .from(tripStops)
    .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, tripId)));
  return stop ?? null;
}

export async function createTripStop(
  input: Omit<NewTripStop, "id" | "createdAt" | "updatedAt">,
) {
  const db = getDb();
  const [created] = await db
    .insert(tripStops)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function createTripStops(
  inputs: Omit<NewTripStop, "id" | "createdAt" | "updatedAt">[],
) {
  if (inputs.length === 0) return [];
  const db = getDb();
  const now = new Date();
  return db
    .insert(tripStops)
    .values(inputs.map((input) => ({ ...input, updatedAt: now })))
    .returning();
}

export async function updateTripStop(
  tripId: string,
  stopId: string,
  input: Partial<Omit<NewTripStop, "id" | "createdAt" | "tripId">>,
) {
  const db = getDb();
  const [updated] = await db
    .update(tripStops)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, tripId)))
    .returning();
  return updated ?? null;
}

export async function deleteTripStop(tripId: string, stopId: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(tripStops)
    .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, tripId)))
    .returning();
  return deleted ?? null;
}

export async function nextSortOrder(tripId: string, dayIndex: number) {
  const stops = await listTripStops(tripId);
  const dayStops = stops.filter((s) => s.dayIndex === dayIndex);
  if (dayStops.length === 0) return 0;
  return Math.max(...dayStops.map((s) => s.sortOrder)) + 1;
}
