import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { categories, isCategory } from "./categories";
import { eventCategories, isEventCategory } from "./eventCategories";
import { stayCategories, isStayCategory } from "./stayCategories";
import { geocodeCity } from "./geo";

const enrichSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  mapsUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  notes: z.string().optional(),
});

export type EnrichResult = {
  title: string;
  description: string;
  category: (typeof categories)[number];
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  imageUrl: string | null;
  notes?: string;
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

export async function enrichPlace(
  query: string,
  categoryHint?: string,
  preferenceContext?: string,
) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const prompt = `Research this place or activity from the internet and return ONLY a JSON object (no markdown) with these keys:
- title: cleaned official or common name
- description: 2-4 engaging sentences about what it is and why someone might want to go
- category: one of ${categories.join(", ")}
- city: city and state/region string (e.g. "Concord, NC"), or null
- latitude: approximate latitude as a number, or null
- longitude: approximate longitude as a number, or null
- mapsUrl: a Google Maps search or place URL if you can find one, otherwise null
- imageUrl: a publicly accessible image URL of the place if you can find one, otherwise null
- notes: brief note about confidence / anything the user should verify

User query: "${query}"
${categoryHint ? `Preferred category hint: ${categoryHint}` : ""}
${preferenceContext ? `\n${preferenceContext}\nIf the query is ambiguous, prefer places near their home city.` : ""}

Prefer real Google Maps links when possible (maps.google.com or google.com/maps).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = enrichSchema.parse(extractJson(text));

  let city = parsed.city?.trim() || null;
  let latitude =
    typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
      ? parsed.latitude
      : null;
  let longitude =
    typeof parsed.longitude === "number" && Number.isFinite(parsed.longitude)
      ? parsed.longitude
      : null;

  // Backfill coords from city when the model omits them
  if ((!latitude || !longitude) && city) {
    const geo = await geocodeCity(city);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
    }
  } else if ((!latitude || !longitude) && query) {
    const geo = await geocodeCity(query);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
      if (!city && geo.displayName) {
        city = geo.displayName.split(",").slice(0, 2).join(",").trim();
      }
    }
  }

  return {
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    category: isCategory(parsed.category) ? parsed.category : "other",
    city,
    latitude,
    longitude,
    mapsUrl: parsed.mapsUrl,
    imageUrl: parsed.imageUrl,
    notes: parsed.notes,
  } satisfies EnrichResult;
}

const enrichEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  venue: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isFree: z.boolean().optional(),
  mapsUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  eventUrl: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type EnrichEventResult = {
  title: string;
  description: string;
  category: (typeof eventCategories)[number];
  venue: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isFree: boolean;
  mapsUrl: string | null;
  imageUrl: string | null;
  eventUrl: string | null;
  notes?: string;
};

export async function enrichEvent(
  query: string,
  categoryHint?: string,
  preferenceContext?: string,
) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const prompt = `Research this event from the internet (concert, community event, festival, free public event, sports, etc.) and return ONLY a JSON object (no markdown) with these keys:
- title: cleaned event name
- description: 2-4 engaging sentences about what it is and why someone might go
- category: one of ${eventCategories.join(", ")}
- venue: venue or location name, or null
- city: city and state/region string (e.g. "Concord, NC"), or null
- latitude: approximate latitude as a number, or null
- longitude: approximate longitude as a number, or null
- startsAt: human-readable start date/time string if known (e.g. "Sat Jul 26, 2026 · 7:00 PM"), or null
- endsAt: human-readable end date/time if known, or null
- isFree: true if free/public admission, otherwise false
- mapsUrl: Google Maps URL for the venue if possible, otherwise null
- imageUrl: a publicly accessible image URL if found, otherwise null
- eventUrl: official listing / tickets / info page URL if found, otherwise null
- notes: brief note about confidence / anything the user should verify

User query: "${query}"
${categoryHint ? `Preferred category hint: ${categoryHint}` : ""}
${preferenceContext ? `\n${preferenceContext}\nIf the query is ambiguous, prefer events near their home city.` : ""}

Prefer real upcoming or known event details when available.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = enrichEventSchema.parse(extractJson(text));

  let city = parsed.city?.trim() || null;
  let latitude =
    typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
      ? parsed.latitude
      : null;
  let longitude =
    typeof parsed.longitude === "number" && Number.isFinite(parsed.longitude)
      ? parsed.longitude
      : null;

  const geoQuery = [parsed.venue, city].filter(Boolean).join(", ") || query;
  if ((!latitude || !longitude) && geoQuery) {
    const geo = await geocodeCity(geoQuery);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
      if (!city && geo.displayName) {
        city = geo.displayName.split(",").slice(0, 2).join(",").trim();
      }
    }
  }

  return {
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    category: isEventCategory(parsed.category) ? parsed.category : "other",
    venue: parsed.venue?.trim() || null,
    city,
    latitude,
    longitude,
    startsAt: parsed.startsAt?.trim() || null,
    endsAt: parsed.endsAt?.trim() || null,
    isFree: Boolean(parsed.isFree),
    mapsUrl: parsed.mapsUrl,
    imageUrl: parsed.imageUrl,
    eventUrl: parsed.eventUrl?.trim() || null,
    notes: parsed.notes,
  } satisfies EnrichEventResult;
}

const enrichStaySchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  priceBand: z.string().nullable().optional(),
  mapsUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  bookingUrl: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type EnrichStayResult = {
  title: string;
  description: string;
  category: (typeof stayCategories)[number];
  neighborhood: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  priceBand: string | null;
  mapsUrl: string | null;
  imageUrl: string | null;
  bookingUrl: string | null;
  notes?: string;
};

export async function enrichStay(
  query: string,
  categoryHint?: string,
  preferenceContext?: string,
) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const prompt = `Research this hotel, Airbnb, vacation rental, hostel, or other stay from the internet (think “hotels near me” / Google Maps style research) and return ONLY a JSON object (no markdown) with these keys:
- title: cleaned property or hotel name
- description: 2-4 engaging sentences about the stay, vibe, and why someone might book it (mention amenities or neighborhood feel when known). Do NOT invent live room rates or availability — suggest checking Maps/listing for current prices.
- category: one of ${stayCategories.join(", ")}
- neighborhood: neighborhood or area name if known, or null
- city: city and state/region string (e.g. "Concord, NC"), or null
- latitude: approximate latitude as a number, or null
- longitude: approximate longitude as a number, or null
- priceBand: rough vibe only if publicly mentioned (e.g. "$", "$$", "$$$", "budget", "mid-range", "luxury"), or null — never invent a nightly rate
- mapsUrl: Google Maps search or place URL if possible, otherwise null
- imageUrl: a publicly accessible image URL if found, otherwise null
- bookingUrl: official site, Airbnb/Booking/Hotels.com listing, or Maps place URL if found, otherwise null
- notes: brief note about confidence / remind user to verify prices on Maps or the listing

User query: "${query}"
${categoryHint ? `Preferred stay type hint: ${categoryHint}` : ""}
${preferenceContext ? `\n${preferenceContext}\nIf the query is ambiguous, prefer stays near their home city and budget preference.` : ""}

Prefer real Google Maps links when possible (maps.google.com or google.com/maps).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = enrichStaySchema.parse(extractJson(text));

  let city = parsed.city?.trim() || null;
  let latitude =
    typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
      ? parsed.latitude
      : null;
  let longitude =
    typeof parsed.longitude === "number" && Number.isFinite(parsed.longitude)
      ? parsed.longitude
      : null;

  const geoQuery =
    [parsed.title, parsed.neighborhood, city].filter(Boolean).join(", ") ||
    query;
  if ((!latitude || !longitude) && geoQuery) {
    const geo = await geocodeCity(geoQuery);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
      if (!city && geo.displayName) {
        city = geo.displayName.split(",").slice(0, 2).join(",").trim();
      }
    }
  }

  return {
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    category: isStayCategory(parsed.category) ? parsed.category : "other",
    neighborhood: parsed.neighborhood?.trim() || null,
    city,
    latitude,
    longitude,
    priceBand: parsed.priceBand?.trim() || null,
    mapsUrl: parsed.mapsUrl,
    imageUrl: parsed.imageUrl,
    bookingUrl: parsed.bookingUrl?.trim() || null,
    notes: parsed.notes,
  } satisfies EnrichStayResult;
}

export async function streamChat(
  messages: { role: "user" | "model"; parts: { text: string }[] }[],
  preferenceContext?: string,
) {
  const genAI = getClient();
  const prefs = preferenceContext?.trim()
    ? `\n\n${preferenceContext.trim()}`
    : "";
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are a friendly local outing and bucket-list idea coach for bucketlist.ai.
Help the user brainstorm places to eat, things to do, kid-friendly activities, parks, entertainment, concerts, community events, festivals, free public events, hotels, Airbnbs, and other stays.
When you suggest a specific place, include the place name clearly (e.g. **Place Name**) so it can be added to a list.
When you suggest a specific event, say so clearly and bold the event name (e.g. **Event Name**) so it can be saved under Events.
When you suggest a specific hotel or stay, say so clearly and bold the stay name (e.g. **Stay Name**) so it can be saved under Stays.
Keep replies concise and practical. Prefer their home city and preferences when set; only ask clarifying questions when something important is still missing. For stays, remind them to check Google Maps or the listing for live prices and availability.${prefs}`,
  });

  const chat = model.startChat({
    history: messages.slice(0, -1),
  });

  const last = messages[messages.length - 1];
  const stream = await chat.sendMessageStream(last.parts[0]?.text ?? "");
  return stream;
}
