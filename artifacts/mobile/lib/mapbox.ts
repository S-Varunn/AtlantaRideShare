const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_KEY ?? "";
const BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";

// Bounding box covering the Atlanta, GA to Charlotte, NC corridor:
// Southwest: near Atlanta (Longitude -84.6, Latitude 33.5)
// Northeast: near Charlotte (Longitude -80.5, Latitude 35.4)
const BBOX = "-84.6,33.5,-80.5,35.4";

export interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [longitude, latitude]
  context?: Array<{ id: string; text: string }>;
}

const LOCAL_SUGGESTIONS: MapboxFeature[] = [
  {
    id: "local-clt-airport",
    place_name: "Charlotte Douglas International Airport (CLT), 5501 Josh Birmingham Pkwy, Charlotte, NC 28208",
    text: "Charlotte Douglas International Airport (CLT)",
    center: [-80.9431, 35.2140],
  },
  {
    id: "local-atl-airport",
    place_name: "Hartsfield-Jackson Atlanta International Airport (ATL), 6000 N Terminal Pkwy, Atlanta, GA 30320",
    text: "Hartsfield-Jackson Atlanta International Airport (ATL)",
    center: [-84.4277, 33.6407],
  },
];

export async function geocodeSuggest(
  query: string,
  limit = 6
): Promise<MapboxFeature[]> {
  const queryClean = query.toLowerCase().trim();
  console.log("[mapbox] geocodeSuggest query:", queryClean);
  if (!queryClean || queryClean.length < 2) {
    console.log("[mapbox] Query clean length < 2, returning empty");
    return [];
  }

  // Filter local suggestions based on the query matching name, text, or common aliases
  const matchingLocals = LOCAL_SUGGESTIONS.filter((item) => {
    const nameMatch = item.place_name.toLowerCase().includes(queryClean);
    const textMatch = item.text.toLowerCase().includes(queryClean);

    let aliases: string[] = [];
    if (item.id === "local-clt-airport") {
      aliases = ["clt", "charlotte douglas", "charlotte airport", "douglas airport", "charlotte douglas international airport"];
    } else if (item.id === "local-atl-airport") {
      aliases = ["atl", "atlanta airport", "hartsfield", "jackson", "hartsfield-jackson", "hartsfield jackson", "atlanta international airport"];
    }

    const aliasMatch = aliases.some((alias) => alias.includes(queryClean) || queryClean.includes(alias));
    return nameMatch || textMatch || aliasMatch;
  });

  let apiFeatures: MapboxFeature[] = [];

  if (TOKEN && !TOKEN.includes("pk.eyJ1...") && TOKEN !== "") {
    try {
      const url =
        `${BASE}/${encodeURIComponent(query)}.json` +
        `?access_token=${TOKEN}` +
        `&autocomplete=true` +
        `&limit=${limit}` +
        `&types=address,place,poi` +
        `&bbox=${BBOX}` + // Restrict results to Bounding Box
        `&country=US`;

      console.log("[mapbox] Querying Mapbox API...");
      const res = await fetch(url);
      console.log("[mapbox] Mapbox response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        apiFeatures = (data.features ?? []) as MapboxFeature[];
        console.log("[mapbox] Mapbox API returned features count:", apiFeatures.length);
      } else {
        console.log("[mapbox] Mapbox query failed");
      }
    } catch (err) {
      console.warn("[mapbox] Mapbox API error:", err);
    }
  }

  // Combine local and API suggestions, filter out duplicates
  const combined = [...matchingLocals];
  for (const feat of apiFeatures) {
    const isDuplicate = combined.some(
      (local) =>
        local.place_name.toLowerCase().includes(feat.text.toLowerCase()) ||
        feat.place_name.toLowerCase().includes(local.text.toLowerCase())
    );
    if (!isDuplicate) {
      combined.push(feat);
    }
  }

  return combined.slice(0, limit);
}
