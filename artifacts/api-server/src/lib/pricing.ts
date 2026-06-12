import { getSupabaseAdmin } from "./supabaseAdmin";

export interface PricingSettings {
  minDistanceThreshold: number;
  minFare: number;
  perMileRate: number;
  perLuggageFee: number;
}

export interface FareBreakdown {
  distanceInMiles: number;
  luggageCount: number;
  baseFare: number;
  luggageFee: number;
  totalFare: number;
  pricing: PricingSettings;
}

/**
 * Thrown when the `pricing_settings` table is missing or has invalid values for
 * one of the required pricing keys. Distinct from generic failures so callers can
 * surface an explicit, actionable "missing pricing config" error.
 */
export class PricingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingConfigError";
  }
}

const EARTH_RADIUS_MILES = 3958.8;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Great-circle distance between two coordinates, in miles.
 */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

const PRICING_KEYS = {
  minDistanceThreshold: "min_distance_threshold",
  minFare: "min_fare",
  perMileRate: "per_mile_rate",
  perLuggageFee: "per_luggage_fee",
} as const;

/**
 * Loads pricing configuration from the `pricing_settings` table.
 *
 * The table is a key/value store (`key` text, `value` numeric), so each pricing
 * parameter lives in its own row. We fetch the rows we need and assemble them
 * into a typed object.
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  const supabase = getSupabaseAdmin();
  const wantedKeys = Object.values(PRICING_KEYS);
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("key, value")
    .in("key", wantedKeys);

  if (error) {
    throw new Error(`Failed to load pricing_settings: ${error.message}`);
  }

  const byKey = new Map<string, number>(
    (data ?? []).map((row) => [String(row.key), Number(row.value)]),
  );

  const read = (key: string): number => {
    const value = byKey.get(key);
    if (value === undefined || !Number.isFinite(value)) {
      throw new PricingConfigError(
        `pricing_settings missing "${key}". Seed the pricing_settings table first.`,
      );
    }
    return value;
  };

  return {
    minDistanceThreshold: read(PRICING_KEYS.minDistanceThreshold),
    minFare: read(PRICING_KEYS.minFare),
    perMileRate: read(PRICING_KEYS.perMileRate),
    perLuggageFee: read(PRICING_KEYS.perLuggageFee),
  };
}

/**
 * Computes the total ride fare from distance and luggage using the
 * configurable pricing rules stored in the `pricing_settings` table.
 *
 * - If distance <= min_distance_threshold -> base fare is min_fare.
 * - Otherwise -> min_fare + ((distance - min_distance_threshold) * per_mile_rate).
 * - Total = base fare + (luggageCount * per_luggage_fee).
 */
export async function calculateFare(
  distanceInMiles: number,
  luggageCount: number,
): Promise<FareBreakdown> {
  if (!Number.isFinite(distanceInMiles) || distanceInMiles < 0) {
    throw new Error("distanceInMiles must be a non-negative finite number");
  }
  if (!Number.isInteger(luggageCount) || luggageCount < 0) {
    throw new Error("luggageCount must be a non-negative integer");
  }

  const pricing = await getPricingSettings();

  const baseFare =
    distanceInMiles <= pricing.minDistanceThreshold
      ? pricing.minFare
      : pricing.minFare +
        (distanceInMiles - pricing.minDistanceThreshold) * pricing.perMileRate;

  const luggageFee = luggageCount * pricing.perLuggageFee;
  const totalFare = round2(baseFare + luggageFee);

  return {
    distanceInMiles: round2(distanceInMiles),
    luggageCount,
    baseFare: round2(baseFare),
    luggageFee: round2(luggageFee),
    totalFare,
    pricing,
  };
}
