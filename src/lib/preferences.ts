import { eq } from "drizzle-orm";
import { geocodeCity } from "./geo";
import { getDb } from "./db";
import { profiles, type Profile } from "./schema";

export const DEFAULT_PROFILE_EMAIL = "owner@local";

export type PreferenceUpdates = {
  name?: string | null;
  bio?: string | null;
  homeCity?: string | null;
  defaultRadiusMiles?: number | null;
  typicallyWithKids?: boolean;
  budgetPreference?: string | null;
  dietaryNotes?: string | null;
  interests?: string | null;
  avoidNotes?: string | null;
  preferredVibe?: string | null;
};

export async function getProfileByEmail(email: string) {
  const db = getDb();
  const key = email.trim().toLowerCase() || DEFAULT_PROFILE_EMAIL;
  const [row] = await db.select().from(profiles).where(eq(profiles.email, key));
  return row ?? null;
}

export async function ensureProfile(input: {
  email?: string | null;
  name?: string | null;
}) {
  const db = getDb();
  const email =
    (input.email?.trim().toLowerCase() || DEFAULT_PROFILE_EMAIL).slice(0, 320);
  const existing = await getProfileByEmail(email);
  if (existing) {
    if (input.name?.trim() && input.name.trim() !== existing.name) {
      const [updated] = await db
        .update(profiles)
        .set({ name: input.name.trim(), updatedAt: new Date() })
        .where(eq(profiles.email, email))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      email,
      name: input.name?.trim() || null,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updatePreferences(
  email: string,
  updates: PreferenceUpdates,
) {
  const db = getDb();
  const profile = await ensureProfile({ email });

  let homeLatitude = profile.homeLatitude;
  let homeLongitude = profile.homeLongitude;
  let homeCity =
    updates.homeCity !== undefined ? updates.homeCity : profile.homeCity;

  if (updates.homeCity !== undefined) {
    const city = updates.homeCity?.trim() || null;
    homeCity = city;
    if (city) {
      const geo = await geocodeCity(city);
      homeLatitude = geo?.lat ?? null;
      homeLongitude = geo?.lng ?? null;
    } else {
      homeLatitude = null;
      homeLongitude = null;
    }
  }

  const [updated] = await db
    .update(profiles)
    .set({
      name:
        updates.name !== undefined
          ? updates.name?.trim() || null
          : profile.name,
      bio:
        updates.bio !== undefined ? updates.bio?.trim() || null : profile.bio,
      homeCity,
      homeLatitude,
      homeLongitude,
      defaultRadiusMiles:
        updates.defaultRadiusMiles !== undefined
          ? updates.defaultRadiusMiles
          : profile.defaultRadiusMiles,
      typicallyWithKids:
        updates.typicallyWithKids !== undefined
          ? updates.typicallyWithKids
          : profile.typicallyWithKids,
      budgetPreference:
        updates.budgetPreference !== undefined
          ? updates.budgetPreference?.trim() || "flexible"
          : profile.budgetPreference,
      dietaryNotes:
        updates.dietaryNotes !== undefined
          ? updates.dietaryNotes?.trim() || null
          : profile.dietaryNotes,
      interests:
        updates.interests !== undefined
          ? updates.interests?.trim() || null
          : profile.interests,
      avoidNotes:
        updates.avoidNotes !== undefined
          ? updates.avoidNotes?.trim() || null
          : profile.avoidNotes,
      preferredVibe:
        updates.preferredVibe !== undefined
          ? updates.preferredVibe?.trim() || null
          : profile.preferredVibe,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  return updated;
}

/** Compact blurb injected into AI system prompts. */
export function formatPreferencesForAi(profile: Profile | null | undefined) {
  if (!profile) return "";

  const lines: string[] = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.bio) lines.push(`Bio: ${profile.bio}`);
  if (profile.interests) {
    lines.push(
      `Interests (prioritize these for place and event recommendations): ${profile.interests}`,
    );
  }
  if (profile.homeCity) lines.push(`Home city: ${profile.homeCity}`);
  if (profile.defaultRadiusMiles)
    lines.push(`Usual search radius: about ${profile.defaultRadiusMiles} miles`);
  if (profile.typicallyWithKids) lines.push("Often plans with kids");
  if (profile.budgetPreference)
    lines.push(`Budget preference: ${profile.budgetPreference}`);
  if (profile.preferredVibe) lines.push(`Preferred vibe: ${profile.preferredVibe}`);
  if (profile.dietaryNotes) lines.push(`Dietary notes: ${profile.dietaryNotes}`);
  if (profile.avoidNotes) lines.push(`Avoid: ${profile.avoidNotes}`);

  if (lines.length === 0) return "";
  return `Known user preferences (use these so they don’t have to repeat themselves; lean hard on Interests for suggestions; still respect any overrides in the current request):\n${lines.join("\n")}`;
}
