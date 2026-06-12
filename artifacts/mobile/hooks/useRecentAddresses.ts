import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recent_addresses_v1";
const MAX_ENTRIES = 8;

export interface RecentAddress {
  address: string;
  latitude?: number;
  longitude?: number;
}

export function useRecentAddresses() {
  const [recents, setRecents] = useState<RecentAddress[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecents(JSON.parse(raw) as RecentAddress[]);
      })
      .catch(() => {});
  }, []);

  const addRecentAddress = useCallback(async (entry: RecentAddress) => {
    if (!entry.address.trim()) return;
    setRecents((prev) => {
      const deduped = prev.filter(
        (r) => r.address.toLowerCase() !== entry.address.toLowerCase()
      );
      const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { recents, addRecentAddress };
}
