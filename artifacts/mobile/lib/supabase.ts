import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// On web, React Strict Mode double-mounts components which causes two concurrent
// callers to fight over the same Web Locks API lock used by @supabase/gotrue-js.
// After 5 s the second caller steals the lock, aborting the first request and
// emitting a false SIGNED_OUT event that boots the user to the welcome screen.
// Fix: provide a no-op lock implementation on web so the Web Locks API is never
// used. We don't need cross-tab token synchronisation in this app.
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    ...(Platform.OS === "web" ? { lock: noopLock } : {}),
  },
});
