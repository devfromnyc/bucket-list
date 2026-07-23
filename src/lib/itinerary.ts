import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const stopSchema = z.object({
  time: z.string(),
  title: z.string(),
  activity: z.string(),
  why: z.string(),
  mapsQuery: z.string().nullable().optional(),
});

const itinerarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  moodFit: z.string(),
  stops: z.array(stopSchema).min(1),
  tips: z.array(z.string()).optional(),
});

export type ItineraryStop = z.infer<typeof stopSchema>;
export type ItineraryPlan = z.infer<typeof itinerarySchema>;

export type ItineraryInput = {
  location: string;
  radiusMiles?: number | null;
  mood: string;
  duration: string;
  withKids: boolean;
  budget: string;
  criteria: string;
  savedPlaces?: string[];
  preferenceContext?: string;
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

export async function planItinerary(input: ItineraryInput): Promise<ItineraryPlan> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const saved =
    input.savedPlaces && input.savedPlaces.length > 0
      ? `Prefer weaving in these unfinished bucket-list places when they fit: ${input.savedPlaces.join("; ")}`
      : "The user has no saved places to prioritize — invent a realistic local plan.";

  const prompt = `You are a day-plan coach. The user does not know what to do today and needs a concrete itinerary — not a brainstorm list.

Return ONLY a JSON object (no markdown) with:
- title: short plan name
- summary: 2-3 sentences describing the day vibe
- moodFit: one sentence on how this matches their mood
- stops: array of 3-6 stops, each with:
  - time: e.g. "10:00 AM" or "Afternoon"
  - title: place or activity name
  - activity: what to do there (1-2 sentences)
  - why: why it fits today
  - mapsQuery: short Google Maps search string for the place, or null
- tips: optional array of 2-4 practical tips (parking, weather, packing)

Constraints:
- Location / area: ${input.location || "not specified — assume a typical US metro and say so in the summary"}
- Stay within roughly ${input.radiusMiles ? `${input.radiusMiles} miles of ${input.location}` : "a reasonable local radius of the location"}
- Mood: ${input.mood || "open"}
- Time available: ${input.duration || "half day"}
- With kids: ${input.withKids ? "yes" : "no"}
- Budget vibe: ${input.budget || "flexible"}
- Extra criteria: ${input.criteria || "none"}
- ${saved}
${input.preferenceContext ? `\n${input.preferenceContext}\n` : ""}
Make the plan feel sequential and doable in the stated time window. Keep every stop inside the radius when location is given. Use real-sounding local places. Honor saved preferences unless the current request clearly overrides them.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return itinerarySchema.parse(extractJson(text));
}
