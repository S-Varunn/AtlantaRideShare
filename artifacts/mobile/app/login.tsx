import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/PrimaryButton";
import { FormInput } from "@/components/TextInput";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [touched, setTouched] = useState({ email: false, password: false });
  const touch = (field: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const emailError =
    touched.email
      ? !email.trim()
        ? "Email is required"
        : !isValidEmail(email)
        ? "Enter a valid email address"
        : undefined
      : undefined;

  const passwordError =
    touched.password && !password
      ? "Password is required"
      : undefined;

  const canSubmit = isValidEmail(email) && password.length > 0;

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    setAuthError(null);
    if (!canSubmit) return;
    setLoading(true);
    try {
      await login(email, password);
      // _layout.tsx navigates to /(tabs) when isAuthenticated becomes true
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const isUnconfirmed =
        raw.toLowerCase().includes("email not confirmed") ||
        raw.toLowerCase().includes("confirm");
      if (isUnconfirmed) {
        setAuthError(
          "Your email isn't confirmed yet. Check your inbox for the confirmation link, click it, then sign in."
        );
      } else {
        setAuthError(raw || "Incorrect email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo_transparent.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to your Atlanta Ride Share account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Email Address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setAuthError(null);
            }}
            onBlur={() => touch("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            icon="mail"
            error={emailError}
          />

          <View style={styles.passwordGroup}>
            <FormInput
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setAuthError(null);
              }}
              onBlur={() => touch("password")}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              icon="lock"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword((v) => !v)}
              error={passwordError}
            />

            <TouchableOpacity
              onPress={() => router.push("/forgot-password")}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: colors.gold }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auth error */}
        {authError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.destructive + "1A",
                borderColor: colors.destructive + "55",
              },
            ]}
          >
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {authError}
            </Text>
          </View>
        )}

        <PrimaryButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
            New to Atlanta Ride Share?
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.createBtn,
            { borderColor: colors.navy, backgroundColor: colors.card },
          ]}
          onPress={() => router.replace("/signup")}
          activeOpacity={0.8}
        >
          <Feather name="user-plus" size={16} color={colors.navy} />
          <Text style={[styles.createBtnText, { color: colors.navy }]}>
            Create an account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 22,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { gap: 8 },
  logo: { width: 120, height: 120, marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
  passwordGroup: { gap: 8 },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  createBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
