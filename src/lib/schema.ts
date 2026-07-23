import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = [
  "food",
  "entertainment",
  "kid_friendly",
  "parks_outdoor",
  "other",
] as const;

export type Category = (typeof categories)[number];

export const places = pgTable("places", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("other"),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrl: text("image_url"),
  mapsUrl: text("maps_url"),
  completed: boolean("completed").notNull().default(false),
  favorited: boolean("favorited").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Account + bucket-list preferences used to personalize AI and form defaults. */
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  bio: text("bio"),
  homeCity: text("home_city"),
  homeLatitude: doublePrecision("home_latitude"),
  homeLongitude: doublePrecision("home_longitude"),
  defaultRadiusMiles: integer("default_radius_miles").default(25),
  typicallyWithKids: boolean("typically_with_kids").default(false),
  budgetPreference: text("budget_preference").default("flexible"),
  dietaryNotes: text("dietary_notes"),
  interests: text("interests"),
  avoidNotes: text("avoid_notes"),
  preferredVibe: text("preferred_vibe"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
