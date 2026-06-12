import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RideProvider } from "@/context/RideContext";
import { supabase } from "@/lib/supabase";

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN || "localhost:3000";
const apiBaseUrl =
  apiDomain.startsWith("http://") || apiDomain.startsWith("https://")
    ? apiDomain
    : `http://${apiDomain}`;
setBaseUrl(apiBaseUrl);

// Attach the signed-in user's Supabase access token to every API request so the
// server can verify the caller and enforce per-user ownership (e.g. only paying
// for your own rides). Returns null when there is no active session.
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const AUTH_SCREENS = new Set(["welcome", "login", "signup", "forgot-password"]);

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const onAuthScreen = !firstSegment || AUTH_SCREENS.has(firstSegment);

    if (!isAuthenticated && !onAuthScreen) {
      // Protected screen with no session → send to welcome
      router.replace("/welcome");
    } else if (isAuthenticated && onAuthScreen) {
      // Just signed in (or token restored) while on an auth screen → send to app
      router.replace("/(tabs)");
    }
    // Authenticated + already in app, or not authenticated + on auth screen → stay
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="ride-details"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="live-tracking"
        options={{ headerShown: false, presentation: "card" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RideProvider>
                  <RootLayoutNav />
                </RideProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
