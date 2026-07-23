import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { categories, isCategory } from "./categories";
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
Help the user brainstorm places to eat, things to do, kid-friendly activities, parks, and entertainment.
When you suggest a specific place, include the place name clearly (e.g. **Place Name**) so it can be added to a list.
Keep replies concise and practical. Prefer their home city and preferences when set; only ask clarifying questions when something important is still missing.${prefs}`,
  });

  const chat = model.startChat({
    history: messages.slice(0, -1),
  });

  const last = messages[messages.length - 1];
  const stream = await chat.sendMessageStream(last.parts[0]?.text ?? "");
  return stream;
}
