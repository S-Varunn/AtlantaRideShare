import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, phone: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(
  sbUser: SupabaseUser,
  profile?: { full_name?: string; phone?: string; avatar_url?: string } | null
): User {
  return {
    id: sbUser.id,
    fullName: profile?.full_name ?? sbUser.user_metadata?.full_name ?? "",
    email: sbUser.email ?? "",
    phone: profile?.phone ?? sbUser.user_metadata?.phone ?? "",
    avatar: profile?.avatar_url ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard: ignore onAuthStateChange events that fire before the initial
  // getSession() call has resolved. Without this, React Strict Mode's
  // double-mount can race and emit a false SIGNED_OUT before we have
  // confirmed the actual session state.
  const initialisedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // 1. Load the current session from storage first.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      initialisedRef.current = true;
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Subscribe to future auth state changes (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      // Drop events that fire before getSession() has settled — these are
      // the spurious SIGNED_OUT events from the Strict Mode lock race.
      if (!initialisedRef.current) return;
      if (!mounted) return;

      setSession(s);
      if (s?.user) {
        fetchProfile(s.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(sbUser: SupabaseUser) {
    try {
      // Use maybeSingle so a missing row returns null instead of throwing.
      let { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", sbUser.id)
        .maybeSingle();

      if (!profile) {
        // No profile row yet — create one from auth metadata.
        // This happens when the Supabase "on auth.users insert" trigger
        // isn't configured, or the user signed up before it was added.
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            id: sbUser.id,
            full_name: sbUser.user_metadata?.full_name ?? "",
            phone: sbUser.user_metadata?.phone ?? "",
          })
          .select("full_name, phone, avatar_url")
          .maybeSingle();
        profile = created;
      }

      setUser(mapSupabaseUser(sbUser, profile));
    } catch {
      // Fall back to auth metadata if the DB is unreachable or RLS blocks us.
      setUser(mapSupabaseUser(sbUser));
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Role gate: only 'customer' accounts may use this app.
    // Check the user_roles table first (admin-assigned roles take precedence).
    // If no row exists there, fall back to the user_metadata.user_role value
    // that was written during signup — new accounts won't have a DB row yet.
    const userId = data.user?.id;
    if (userId) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      const effectiveRole =
        roleRow?.role ?? data.user?.user_metadata?.user_role ?? "customer";

      if (effectiveRole !== "customer") {
        await supabase.auth.signOut();
        throw new Error("Unauthorized access. Use the correct application.");
      }
    }
  }

  async function signup(
    fullName: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, user_role: "customer" } },
    });
    if (error) throw new Error(error.message);
    return { needsEmailConfirmation: !data.session };
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async function refreshProfile(): Promise<void> {
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser) await fetchProfile(sbUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
