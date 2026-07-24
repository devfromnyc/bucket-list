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

export const eventCategories = [
  "concert",
  "community",
  "free_public",
  "festival",
  "sports",
  "other",
] as const;

export type EventCategory = (typeof eventCategories)[number];

export const stayCategories = [
  "hotel",
  "airbnb",
  "vacation_rental",
  "hostel",
  "other",
] as const;

export type StayCategory = (typeof stayCategories)[number];

/** User account + bucket-list preferences. */
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
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

export const places = pgTable("places", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
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

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("other"),
  venue: text("venue"),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  isFree: boolean("is_free").default(false),
  imageUrl: text("image_url"),
  mapsUrl: text("maps_url"),
  eventUrl: text("event_url"),
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

export const stays = pgTable("stays", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("other"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  priceBand: text("price_band"),
  imageUrl: text("image_url"),
  mapsUrl: text("maps_url"),
  bookingUrl: text("booking_url"),
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

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Stay = typeof stays.$inferSelect;
export type NewStay = typeof stays.$inferInsert;

export const tripStatuses = ["draft", "planned", "done"] as const;
export type TripStatus = (typeof tripStatuses)[number];

export const tripStopKinds = ["place", "event", "stay", "custom"] as const;
export type TripStopKind = (typeof tripStopKinds)[number];

/** Saved multi-day trip combining places, events, and stays. */
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  destinationCity: text("destination_city"),
  startsOn: text("starts_on"),
  endsOn: text("ends_on"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"),
  favorited: boolean("favorited").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tripStops = pgTable("trip_stops", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  kind: text("kind").notNull().default("custom"),
  refId: uuid("ref_id"),
  title: text("title").notNull(),
  notes: text("notes"),
  startTime: text("start_time"),
  mapsUrl: text("maps_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type TripStop = typeof tripStops.$inferSelect;
export type NewTripStop = typeof tripStops.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
