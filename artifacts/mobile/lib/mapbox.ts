const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_KEY ?? "";
const BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [longitude, latitude]
  context?: Array<{ id: string; text: string }>;
}

export async function geocodeSuggest(
  query: string,
  limit = 6
): Promise<MapboxFeature[]> {
  if (!query.trim() || query.length < 3 || !TOKEN) return [];
  try {
    const url =
      `${BASE}/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}` +
      `&autocomplete=true` +
      `&limit=${limit}` +
      `&types=address,place,poi` +
      `&country=US`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []) as MapboxFeature[];
  } catch {
    return [];
  }
}
