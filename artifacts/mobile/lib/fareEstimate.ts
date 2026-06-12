import { supabase } from "./supabase";

export interface FareBreakdown {
  distanceMiles: number;
  baseFare: number;
  luggageFee: number;
  totalFare: number;
  perMileRate: number;
  minFare: number;
}

const EARTH_RADIUS_MILES = 3958.8;

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function estimateFare(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  luggageCount: number,
): Promise<FareBreakdown> {
  const keys = ["min_fare", "per_mile_rate", "per_luggage_fee", "min_distance_threshold"];

  const { data, error } = await supabase
    .from("pricing_settings")
    .select("key, value")
    .in("key", keys);

  if (error) throw new Error(`Could not load pricing: ${error.message}`);

  const byKey = new Map<string, number>(
    (data ?? []).map((r) => [String(r.key), Number(r.value)]),
  );

  const get = (k: string) => {
    const v = byKey.get(k);
    if (v === undefined || !Number.isFinite(v))
      throw new Error(`Pricing key "${k}" is not configured in pricing_settings.`);
    return v;
  };

  const minFare = get("min_fare");
  const perMileRate = get("per_mile_rate");
  const perLuggageFee = get("per_luggage_fee");
  const minDistanceThreshold = get("min_distance_threshold");

  const distanceMiles = round2(haversineMiles(pickupLat, pickupLng, dropoffLat, dropoffLng));

  const baseFare =
    distanceMiles <= minDistanceThreshold
      ? minFare
      : minFare + (distanceMiles - minDistanceThreshold) * perMileRate;

  const luggageFee = luggageCount * perLuggageFee;

  return {
    distanceMiles,
    baseFare: round2(baseFare),
    luggageFee: round2(luggageFee),
    totalFare: round2(baseFare + luggageFee),
    perMileRate,
    minFare,
  };
}
