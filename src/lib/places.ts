import { asc, desc, eq } from "drizzle-orm";
import { milesBetween } from "./geo";
import { getDb } from "./db";
import { places, type Category, type NewPlace, type Place } from "./schema";

export async function listPlaces(filters?: {
  category?: Category | "all";
  status?: "all" | "todo" | "completed";
  favoritesOnly?: boolean;
  city?: string | null;
  radiusMiles?: number | null;
  center?: { lat: number; lng: number } | null;
}) {
  const db = getDb();
  const rows = await db.select().from(places).orderBy(desc(places.createdAt));

  return rows.filter((place) => {
    if (filters?.favoritesOnly && !place.favorited) return false;
    if (
      filters?.category &&
      filters.category !== "all" &&
      place.category !== filters.category
    ) {
      return false;
    }
    if (filters?.status === "todo" && place.completed) return false;
    if (filters?.status === "completed" && !place.completed) return false;

    const city = filters?.city?.trim();
    const radius = filters?.radiusMiles;
    const center = filters?.center;

    if (city && radius && center) {
      if (place.latitude == null || place.longitude == null) {
        return Boolean(
          place.city &&
            place.city.toLowerCase().includes(city.toLowerCase()),
        );
      }
      return (
        milesBetween(
          center.lat,
          center.lng,
          place.latitude,
          place.longitude,
        ) <= radius
      );
    }

    if (city) {
      return Boolean(
        place.city &&
          place.city.toLowerCase().includes(city.toLowerCase()),
      );
    }

    return true;
  });
}

export function uniqueCities(rows: Place[]) {
  const set = new Set<string>();
  for (const place of rows) {
    const city = place.city?.trim();
    if (city) set.add(city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getPlace(id: string) {
  const db = getDb();
  const [place] = await db.select().from(places).where(eq(places.id, id));
  return place ?? null;
}

export async function createPlace(
  input: Omit<NewPlace, "id" | "createdAt" | "updatedAt">,
) {
  const db = getDb();
  const [created] = await db
    .insert(places)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updatePlace(
  id: string,
  input: Partial<Omit<NewPlace, "id" | "createdAt">>,
) {
  const db = getDb();
  const [updated] = await db
    .update(places)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(places.id, id))
    .returning();
  return updated ?? null;
}

export async function deletePlace(id: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(places)
    .where(eq(places.id, id))
    .returning();
  return deleted ?? null;
}

export async function toggleCompleted(id: string) {
  const place = await getPlace(id);
  if (!place) return null;
  const completed = !place.completed;
  return updatePlace(id, {
    completed,
    completedAt: completed ? new Date() : null,
  });
}

export async function toggleFavorite(id: string) {
  const place = await getPlace(id);
  if (!place) return null;
  return updatePlace(id, {
    favorited: !place.favorited,
  });
}

export async function countPlaces() {
  const db = getDb();
  const rows = await db
    .select({ id: places.id })
    .from(places)
    .orderBy(asc(places.createdAt));
  return rows.length;
}
