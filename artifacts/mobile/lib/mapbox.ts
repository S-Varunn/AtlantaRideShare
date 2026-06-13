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

// Pre-seeded high-volume landmarks for guaranteed exact matches
const LOCAL_POIS: MapboxFeature[] = [
  {
    id: "poi-atl-airport",
    place_name: "Hartsfield-Jackson Atlanta International Airport (ATL), 6000 N Terminal Pkwy, Atlanta, GA 30320",
    text: "Hartsfield-Jackson Atlanta International Airport (ATL)",
    center: [-84.4277, 33.6407],
  },
  {
    id: "poi-clt-airport",
    place_name: "Charlotte Douglas International Airport (CLT), 5501 Josh Birmingham Pkwy, Charlotte, NC 28208",
    text: "Charlotte Douglas International Airport (CLT)",
    center: [-80.9473, 35.2144],
  },
  {
    id: "poi-mercedes-stadium",
    place_name: "Mercedes-Benz Stadium, 1 AMB Dr NW, Atlanta, GA 30313",
    text: "Mercedes-Benz Stadium",
    center: [-84.4010, 33.7573],
  },
  {
    id: "poi-bank-of-america-stadium",
    place_name: "Bank of America Stadium, 800 S Mint St, Charlotte, NC 28202",
    text: "Bank of America Stadium",
    center: [-80.8528, 35.2258],
  },
  {
    id: "poi-spectrum-center",
    place_name: "Spectrum Center, 333 E Trade St, Charlotte, NC 28202",
    text: "Spectrum Center",
    center: [-80.8392, 35.2251],
  },
  {
    id: "poi-state-farm-arena",
    place_name: "State Farm Arena, 1 State Farm Dr, Atlanta, GA 30303",
    text: "State Farm Arena",
    center: [-84.3973, 33.7573],
  },
  {
    id: "poi-georgia-aquarium",
    place_name: "Georgia Aquarium, 225 Baker St NW, Atlanta, GA 30313",
    text: "Georgia Aquarium",
    center: [-84.3938, 33.7634],
  },
  {
    id: "poi-southpark-mall",
    place_name: "SouthPark Mall, 4400 Sharon Rd, Charlotte, NC 28211",
    text: "SouthPark Mall",
    center: [-80.8301, 35.1519],
  },
  {
    id: "poi-lenox-square",
    place_name: "Lenox Square Mall, 3393 Peachtree Rd NE, Atlanta, GA 30326",
    text: "Lenox Square Mall",
    center: [-84.3597, 33.8471],
  },
  {
    id: "poi-charlotte-marriott",
    place_name: "Charlotte Marriott City Center, 100 W Trade St, Charlotte, NC 28202",
    text: "Charlotte Marriott City Center",
    center: [-80.8421, 35.2275],
  },
];

export async function geocodeSuggest(
  query: string,
  limit = 6
): Promise<MapboxFeature[]> {
  const queryClean = query.toLowerCase().trim();
  if (!queryClean || queryClean.length < 2) return [];

  // 1. Fuzzy match against exact high-priority local POIs
  const localMatches = LOCAL_POIS.filter(poi => {
    return (
      poi.text.toLowerCase().includes(queryClean) ||
      poi.place_name.toLowerCase().includes(queryClean) ||
      (queryClean === "atl" && poi.id.includes("atl")) ||
      (queryClean === "clt" && poi.id.includes("clt"))
    );
  });

  if (!TOKEN) return localMatches.slice(0, limit);

  // 2. Query Mapbox, but bound results strictly to the Atlanta/Charlotte region
  try {
    const url =
      `${BASE}/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}` +
      `&autocomplete=true` +
      `&limit=${limit}` +
      `&types=address,place,poi` +
      `&bbox=${BBOX}` + // Restrict results to Bounding Box
      `&country=US`;

    const res = await fetch(url);
    if (!res.ok) return localMatches.slice(0, limit);
    const data = await res.json();
    const apiFeatures = (data.features ?? []) as MapboxFeature[];

    // 3. Combine local pre-seeded POIs and API results (de-duplicating coordinates)
    const combined = [...localMatches];
    for (const feat of apiFeatures) {
      const isDuplicate = combined.some(item => 
        item.id === feat.id || 
        (Math.abs(item.center[0] - feat.center[0]) < 0.001 && Math.abs(item.center[1] - feat.center[1]) < 0.001)
      );
      if (!isDuplicate) {
        combined.push(feat);
      }
    }
    return combined.slice(0, limit);
  } catch {
    return localMatches.slice(0, limit);
  }
}
