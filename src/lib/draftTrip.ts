import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tripStopKinds } from "./tripLabels";

const draftStopSchema = z.object({
  dayIndex: z.number().int().min(0),
  kind: z.string(),
  refId: z.string().uuid().nullable().optional(),
  title: z.string(),
  notes: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  mapsUrl: z.string().nullable().optional(),
});

const draftTripSchema = z.object({
  summary: z.string(),
  stops: z.array(draftStopSchema).min(1),
});

export type DraftTripStop = {
  dayIndex: number;
  kind: (typeof tripStopKinds)[number];
  refId: string | null;
  title: string;
  notes: string | null;
  startTime: string | null;
  mapsUrl: string | null;
  imageUrl: string | null;
};

export type DraftTripResult = {
  summary: string;
  stops: DraftTripStop[];
};

export type DraftTripInput = {
  title: string;
  destinationCity?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  notes?: string | null;
  criteria?: string;
  dayCount?: number;
  preferenceContext?: string;
  savedPlaces: {
    id: string;
    title: string;
    city: string | null;
    category: string;
    mapsUrl: string | null;
    imageUrl: string | null;
  }[];
  savedEvents: {
    id: string;
    title: string;
    city: string | null;
    venue: string | null;
    startsAt: string | null;
    mapsUrl: string | null;
    imageUrl: string | null;
  }[];
  savedStays: {
    id: string;
    title: string;
    city: string | null;
    neighborhood: string | null;
    category: string;
    mapsUrl: string | null;
    bookingUrl: string | null;
    imageUrl: string | null;
    priceBand: string | null;
  }[];
};

function getClient() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(key);
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function isStopKind(value: string): value is (typeof tripStopKinds)[number] {
  return (tripStopKinds as readonly string[]).includes(value);
}

export async function draftTrip(
  input: DraftTripInput,
): Promise<DraftTripResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const dayCount = Math.max(1, Math.min(input.dayCount ?? 3, 14));

  const placesBlob =
    input.savedPlaces.length > 0
      ? input.savedPlaces
          .map(
            (p) =>
              `- id:${p.id} | ${p.title} | ${p.city ?? "unknown city"} | ${p.category}`,
          )
          .join("\n")
      : "(none)";
  const eventsBlob =
    input.savedEvents.length > 0
      ? input.savedEvents
          .map(
            (e) =>
              `- id:${e.id} | ${e.title} | ${e.venue ?? ""} | ${e.city ?? ""} | ${e.startsAt ?? ""}`,
          )
          .join("\n")
      : "(none)";
  const staysBlob =
    input.savedStays.length > 0
      ? input.savedStays
          .map(
            (s) =>
              `- id:${s.id} | ${s.title} | ${s.category} | ${s.neighborhood ?? ""} | ${s.city ?? ""} | ${s.priceBand ?? ""}`,
          )
          .join("\n")
      : "(none)";

  const prompt = `You are building a saved multi-day trip itinerary for bucketlist.ai.
Prefer the user's saved places, events, and stays. You may add a few custom stops when something important is missing (meals, transit, free time).
Do NOT invent live hotel rates or availability.

Return ONLY a JSON object (no markdown) with:
- summary: 2-4 sentences describing the trip vibe and flow
- stops: array of stops, each with:
  - dayIndex: 0-based day number (0 = day 1), from 0 to ${dayCount - 1}
  - kind: one of ${tripStopKinds.join(", ")}
  - refId: the saved item uuid when kind is place/event/stay and you used a listed id; otherwise null
  - title: stop name
  - notes: 1-2 sentences of what to do / why it fits, or null
  - startTime: optional human time like "10:00 AM" or "Evening", or null
  - mapsUrl: Google Maps URL if you know one, else null

Rules:
- Spread stops across ${dayCount} day(s) (dayIndex 0..${dayCount - 1})
- Include at least one stay stop if saved stays exist and dayCount > 1
- When using a saved item, set kind correctly and copy its id into refId exactly
- Prefer destination area: ${input.destinationCity || "not specified"}
- Trip title: ${input.title}
- Dates: ${input.startsOn || "flexible"} → ${input.endsOn || "flexible"}
- User notes: ${input.notes || "none"}
- Extra criteria: ${input.criteria || "none"}
${input.preferenceContext ? `\n${input.preferenceContext}\n` : ""}

Saved places:
${placesBlob}

Saved events:
${eventsBlob}

Saved stays:
${staysBlob}

Aim for a realistic sequence (morning → afternoon → evening). Keep the plan doable.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = draftTripSchema.parse(extractJson(text));

  const placeById = new Map(input.savedPlaces.map((p) => [p.id, p]));
  const eventById = new Map(input.savedEvents.map((e) => [e.id, e]));
  const stayById = new Map(input.savedStays.map((s) => [s.id, s]));

  const stops: DraftTripStop[] = [];

  for (const stop of parsed.stops) {
    const title = stop.title.trim();
    if (!title) continue;

    let kind = isStopKind(stop.kind) ? stop.kind : "custom";
    let refId = stop.refId ?? null;
    let mapsUrl = stop.mapsUrl?.trim() || null;
    let imageUrl: string | null = null;
    let resolvedTitle = title;

    if (kind === "place" && refId && placeById.has(refId)) {
      const p = placeById.get(refId)!;
      resolvedTitle = p.title;
      mapsUrl = mapsUrl || p.mapsUrl;
      imageUrl = p.imageUrl;
    } else if (kind === "event" && refId && eventById.has(refId)) {
      const e = eventById.get(refId)!;
      resolvedTitle = e.title;
      mapsUrl = mapsUrl || e.mapsUrl;
      imageUrl = e.imageUrl;
    } else if (kind === "stay" && refId && stayById.has(refId)) {
      const s = stayById.get(refId)!;
      resolvedTitle = s.title;
      mapsUrl = mapsUrl || s.mapsUrl || s.bookingUrl;
      imageUrl = s.imageUrl;
    } else if (kind !== "custom") {
      // Suggested new stop without a valid saved ref
      kind = "custom";
      refId = null;
    }

    const dayIndex = Math.max(
      0,
      Math.min(dayCount - 1, Number(stop.dayIndex) || 0),
    );

    stops.push({
      dayIndex,
      kind,
      refId,
      title: resolvedTitle,
      notes: stop.notes?.trim() || null,
      startTime: stop.startTime?.trim() || null,
      mapsUrl,
      imageUrl,
    });
  }

  if (stops.length === 0) {
    throw new Error("AI did not return any usable stops");
  }

  return {
    summary: parsed.summary.trim(),
    stops,
  };
}
