import { and, desc, eq } from "drizzle-orm";
import { milesBetween } from "./geo";
import { getDb } from "./db";
import {
  stays,
  type Stay,
  type StayCategory,
  type NewStay,
} from "./schema";

export async function listStays(
  userId: string,
  filters?: {
    category?: StayCategory | "all";
    status?: "all" | "todo" | "completed";
    favoritesOnly?: boolean;
    city?: string | null;
    radiusMiles?: number | null;
    center?: { lat: number; lng: number } | null;
  },
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(stays)
    .where(eq(stays.userId, userId))
    .orderBy(desc(stays.createdAt));

  return rows.filter((stay) => {
    if (filters?.favoritesOnly && !stay.favorited) return false;
    if (
      filters?.category &&
      filters.category !== "all" &&
      stay.category !== filters.category
    ) {
      return false;
    }
    if (filters?.status === "todo" && stay.completed) return false;
    if (filters?.status === "completed" && !stay.completed) return false;

    const city = filters?.city?.trim();
    const radius = filters?.radiusMiles;
    const center = filters?.center;

    if (city && radius && center) {
      if (stay.latitude == null || stay.longitude == null) {
        return Boolean(
          stay.city && stay.city.toLowerCase().includes(city.toLowerCase()),
        );
      }
      return (
        milesBetween(
          center.lat,
          center.lng,
          stay.latitude,
          stay.longitude,
        ) <= radius
      );
    }

    if (city) {
      return Boolean(
        stay.city && stay.city.toLowerCase().includes(city.toLowerCase()),
      );
    }

    return true;
  });
}

export function uniqueStayCities(rows: Stay[]) {
  const set = new Set<string>();
  for (const stay of rows) {
    const city = stay.city?.trim();
    if (city) set.add(city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getStay(userId: string, id: string) {
  const db = getDb();
  const [stay] = await db
    .select()
    .from(stays)
    .where(and(eq(stays.id, id), eq(stays.userId, userId)));
  return stay ?? null;
}

export async function createStay(
  input: Omit<NewStay, "id" | "createdAt" | "updatedAt">,
) {
  const db = getDb();
  const [created] = await db
    .insert(stays)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateStay(
  userId: string,
  id: string,
  input: Partial<Omit<NewStay, "id" | "createdAt" | "userId">>,
) {
  const db = getDb();
  const [updated] = await db
    .update(stays)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(stays.id, id), eq(stays.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteStay(userId: string, id: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(stays)
    .where(and(eq(stays.id, id), eq(stays.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function toggleStayCompleted(userId: string, id: string) {
  const stay = await getStay(userId, id);
  if (!stay) return null;
  const completed = !stay.completed;
  return updateStay(userId, id, {
    completed,
    completedAt: completed ? new Date() : null,
  });
}

export async function toggleStayFavorite(userId: string, id: string) {
  const stay = await getStay(userId, id);
  if (!stay) return null;
  return updateStay(userId, id, {
    favorited: !stay.favorited,
  });
}
