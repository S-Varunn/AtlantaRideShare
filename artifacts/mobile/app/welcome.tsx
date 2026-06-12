import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: "#0d1620" }]}>
      <LinearGradient
        colors={["#0d1620", "#1a2332", "#0d1620"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View
        style={[
          styles.inner,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 24 },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <Image
            source={require("@/assets/images/logo_transparent.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Hero car image */}
        <View style={styles.heroArea}>
          <Image
            source={require("@/assets/images/hero_car.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "#0d1620"]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* Tagline */}
        <View style={styles.taglineArea}>
          <Text style={[styles.headline, { color: "#fff" }]}>
            Premium. Punctual. Professional.
          </Text>
          <Text style={[styles.subtext, { color: "rgba(255,255,255,0.55)" }]}>
            Managed executive transportation for discerning Atlanta travelers.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttons}>
          <PrimaryButton
            title="Get Started"
            onPress={() => router.push("/signup")}
            variant="primary"
          />
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 220,
    height: 220,
  },
  heroArea: {
    width: "100%",
    height: 190,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  taglineArea: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  headline: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  buttons: {
    width: "100%",
    gap: 14,
  },
  loginBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
});
