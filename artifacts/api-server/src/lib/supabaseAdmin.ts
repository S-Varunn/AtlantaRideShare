import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key.
 *
 * This bypasses Row Level Security and must only ever run on the server. It is
 * used to read trusted pricing data and to update ride payment status. The
 * client is safe to cache because the service-role key does not rotate like an
 * OAuth token.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url =
    process.env["SUPABASE_URL"] ?? process.env["EXPO_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url) {
    throw new Error(
      "SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) environment variable is required.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY secret is required for server-side Supabase access.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
