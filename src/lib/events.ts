import { desc, eq } from "drizzle-orm";
import { milesBetween } from "./geo";
import { getDb } from "./db";
import {
  events,
  type Event,
  type EventCategory,
  type NewEvent,
} from "./schema";

export async function listEvents(filters?: {
  category?: EventCategory | "all";
  status?: "all" | "todo" | "completed";
  favoritesOnly?: boolean;
  city?: string | null;
  radiusMiles?: number | null;
  center?: { lat: number; lng: number } | null;
}) {
  const db = getDb();
  const rows = await db.select().from(events).orderBy(desc(events.createdAt));

  return rows.filter((event) => {
    if (filters?.favoritesOnly && !event.favorited) return false;
    if (
      filters?.category &&
      filters.category !== "all" &&
      event.category !== filters.category
    ) {
      return false;
    }
    if (filters?.status === "todo" && event.completed) return false;
    if (filters?.status === "completed" && !event.completed) return false;

    const city = filters?.city?.trim();
    const radius = filters?.radiusMiles;
    const center = filters?.center;

    if (city && radius && center) {
      if (event.latitude == null || event.longitude == null) {
        return Boolean(
          event.city &&
            event.city.toLowerCase().includes(city.toLowerCase()),
        );
      }
      return (
        milesBetween(
          center.lat,
          center.lng,
          event.latitude,
          event.longitude,
        ) <= radius
      );
    }

    if (city) {
      return Boolean(
        event.city &&
          event.city.toLowerCase().includes(city.toLowerCase()),
      );
    }

    return true;
  });
}

export function uniqueEventCities(rows: Event[]) {
  const set = new Set<string>();
  for (const event of rows) {
    const city = event.city?.trim();
    if (city) set.add(city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getEvent(id: string) {
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id));
  return event ?? null;
}

export async function createEvent(
  input: Omit<NewEvent, "id" | "createdAt" | "updatedAt">,
) {
  const db = getDb();
  const [created] = await db
    .insert(events)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateEvent(
  id: string,
  input: Partial<Omit<NewEvent, "id" | "createdAt">>,
) {
  const db = getDb();
  const [updated] = await db
    .update(events)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteEvent(id: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning();
  return deleted ?? null;
}

export async function toggleEventCompleted(id: string) {
  const event = await getEvent(id);
  if (!event) return null;
  const completed = !event.completed;
  return updateEvent(id, {
    completed,
    completedAt: completed ? new Date() : null,
  });
}

export async function toggleEventFavorite(id: string) {
  const event = await getEvent(id);
  if (!event) return null;
  return updateEvent(id, {
    favorited: !event.favorited,
  });
}
