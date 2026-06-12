import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface SavedPlace {
  id: string;
  label: string;
  address: string;
  type: "home" | "work" | "airport" | "custom";
  latitude?: number;
  longitude?: number;
}

export interface UserPreferences {
  default_passengers: number;
  default_luggage: number;
  notifications: "all" | "important" | "none";
  language: string;
}

export interface PaymentMethod {
  id: string;
  type: "corporate_account" | "credit_card" | "invoice";
  label: string;
  last_four?: string;
  is_default: boolean;
}

export interface ProfileData {
  full_name: string;
  phone: string;
  created_at?: string;
}

export function useProfile() {
  const { user, session, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_passengers: 1,
    default_luggage: 0,
    notifications: "all",
    language: "English",
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = session?.user?.id;

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileRes, placesRes, prefsRes, paymentsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, created_at")
          .eq("id", userId)
          .single(),
        supabase
          .from("saved_places")
          .select("id, label, address, type, latitude, longitude")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_preferences")
          .select("default_passengers, default_luggage, notifications, language")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("payment_methods")
          .select("id, type, label, last_four, is_default")
          .eq("user_id", userId)
          .order("is_default", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (!placesRes.error && placesRes.data) setSavedPlaces(placesRes.data as SavedPlace[]);
      if (!prefsRes.error && prefsRes.data) setPreferences(prefsRes.data as UserPreferences);
      if (!paymentsRes.error && paymentsRes.data) setPaymentMethods(paymentsRes.data as PaymentMethod[]);
    } catch {
      // silently fall through — UI shows defaults
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Profile update ---
  async function updateProfile(data: { full_name: string; phone: string }) {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name, phone: data.phone, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  // --- Change password ---
  async function changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  // --- Saved Places ---
  async function addSavedPlace(place: Omit<SavedPlace, "id">) {
    if (!userId) return;
    const { data, error } = await supabase
      .from("saved_places")
      .insert({ ...place, user_id: userId })
      .select("id, label, address, type, latitude, longitude")
      .single();
    if (error) throw new Error(error.message);
    setSavedPlaces((prev) => [...prev, data as SavedPlace]);
  }

  async function updateSavedPlace(id: string, place: Omit<SavedPlace, "id">) {
    if (!userId) return;
    const { error } = await supabase
      .from("saved_places")
      .update({
        label: place.label,
        address: place.address,
        type: place.type,
        latitude: place.latitude ?? null,
        longitude: place.longitude ?? null,
      })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    setSavedPlaces((prev) => prev.map((p) => (p.id === id ? { id, ...place } : p)));
  }

  async function deleteSavedPlace(id: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("saved_places")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
  }

  // --- Payment Methods ---
  async function addPaymentMethod(data: {
    type: PaymentMethod["type"];
    label: string;
    last_four?: string;
  }) {
    if (!userId) return;
    const isFirst = paymentMethods.length === 0;
    const { data: row, error } = await supabase
      .from("payment_methods")
      .insert({ user_id: userId, ...data, is_default: isFirst })
      .select("id, type, label, last_four, is_default")
      .single();
    if (error) throw new Error(error.message);
    setPaymentMethods((prev) => [...prev, row as PaymentMethod]);
  }

  async function deletePaymentMethod(id: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  }

  async function setDefaultPaymentMethod(id: string) {
    if (!userId) return;
    // Clear current default then set new one
    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("payment_methods").update({ is_default: true }).eq("id", id).eq("user_id", userId);
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, is_default: p.id === id })));
  }

  // --- Preferences ---
  async function updatePreferences(prefs: Partial<UserPreferences>) {
    if (!userId) return;
    setSaving(true);
    try {
      const next = { ...preferences, ...prefs };
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      setPreferences(next);
    } finally {
      setSaving(false);
    }
  }

  return {
    profile,
    savedPlaces,
    preferences,
    paymentMethods,
    loading,
    saving,
    fetchAll,
    updateProfile,
    changePassword,
    addSavedPlace,
    updateSavedPlace,
    deleteSavedPlace,
    updatePreferences,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
  };
}
