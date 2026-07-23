/** Great-circle distance in miles between two WGS84 points. */
export function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type GeoPoint = { lat: number; lng: number; displayName?: string };

/** Free OpenStreetMap Nominatim geocode for a city / area name. */
export async function geocodeCity(query: string): Promise<GeoPoint | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "WanderlistBucketList/1.0 (personal app)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string; display_name?: string }[];
  if (!data[0]) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export type RadiusMiles = (typeof RADIUS_OPTIONS)[number];
