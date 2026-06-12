import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
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

// ── Password strength ─────────────────────────────────────────────────────────

interface StrengthResult {
  score: number; // 0–5
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function getStrength(password: string, destructive: string, gold: string): StrengthResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (password.length === 0) {
    return { score: 0, label: "Too short", color: destructive, checks };
  }
  if (!checks.length) {
    return { score: 1, label: "Too short", color: destructive, checks };
  }

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) return { score, label: "Weak",   color: destructive,    checks };
  if (score === 3)  return { score, label: "Fair",   color: "#ED8936",      checks };
  if (score === 4)  return { score, label: "Good",   color: gold,           checks };
  return              { score, label: "Strong", color: "#48BB78",      checks };
}

function isStrongEnough(s: StrengthResult) {
  return s.score >= 4;
}

// ── Phone formatting ──────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidPhone(raw: string): boolean {
  return raw.replace(/\D/g, "").length === 10;
}

// ── PasswordStrengthMeter ────────────────────────────────────────────────────

function PasswordStrengthMeter({ strength }: { strength: StrengthResult }) {
  const colors = useColors();
  const segments = 5;

  if (strength.score === 0) return null;

  const checks = [
    { key: "length",    label: "At least 8 characters" },
    { key: "uppercase", label: "Uppercase letter (A–Z)" },
    { key: "lowercase", label: "Lowercase letter (a–z)" },
    { key: "number",    label: "Number (0–9)" },
    { key: "special",   label: "Special character (!@#$…)" },
  ] as const;

  return (
    <View style={mStyles.wrapper}>
      {/* Segmented bar */}
      <View style={mStyles.barRow}>
        {Array.from({ length: segments }).map((_, i) => (
          <View
            key={i}
            style={[
              mStyles.segment,
              {
                backgroundColor:
                  i < strength.score ? strength.color : colors.muted,
              },
            ]}
          />
        ))}
        <Text style={[mStyles.strengthLabel, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      {/* Checklist */}
      <View style={mStyles.checklist}>
        {checks.map(({ key, label }) => {
          const met = strength.checks[key];
          return (
            <View key={key} style={mStyles.checkRow}>
              <View
                style={[
                  mStyles.checkIcon,
                  {
                    backgroundColor: met ? "#48BB7820" : colors.muted,
                    borderColor: met ? "#48BB78" : colors.border,
                  },
                ]}
              >
                <Feather
                  name={met ? "check" : "minus"}
                  size={10}
                  color={met ? "#48BB78" : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  mStyles.checkLabel,
                  {
                    color: met ? colors.foreground : colors.mutedForeground,
                    fontFamily: met ? "Inter_500Medium" : "Inter_400Regular",
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const mStyles = StyleSheet.create({
  wrapper: { gap: 10 },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    minWidth: 52,
    textAlign: "right",
  },
  checklist: { gap: 6 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});

// ── SignupScreen ──────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const strength = getStrength(password, colors.destructive, colors.gold);

  // ── Field-level errors (shown after blur) ─────────────────────────────────
  const fieldErrors = {
    fullName:
      touched.fullName && !fullName.trim()
        ? "Full name is required"
        : undefined,
    email:
      touched.email
        ? !email.trim()
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(email)
          ? "Enter a valid email address"
          : undefined
        : undefined,
    phone:
      touched.phone
        ? !phone.trim()
          ? "Phone number is required"
          : !isValidPhone(phone)
          ? "Enter a valid 10-digit US phone number"
          : undefined
        : undefined,
    password:
      touched.password && password.length > 0 && !isStrongEnough(strength)
        ? "Please meet all password requirements"
        : undefined,
  };

  const canSubmit =
    fullName.trim() !== "" &&
    /\S+@\S+\.\S+/.test(email) &&
    isValidPhone(phone) &&
    isStrongEnough(strength);

  const touch = (field: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  const handleSignup = async () => {
    setTouched({ fullName: true, email: true, phone: true, password: true });
    setAuthError(null);
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signup(fullName, email, phone, password);
      if (needsEmailConfirmation) setPendingConfirmation(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Email verification screen ─────────────────────────────────────────────
  if (pendingConfirmation) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.confirmArea}>
            {/* Hero icon */}
            <View style={[styles.confirmRing, { borderColor: colors.gold + "40" }]}>
              <View style={[styles.confirmCircle, { backgroundColor: colors.gold + "18" }]}>
                <Feather name="mail" size={40} color={colors.gold} />
              </View>
            </View>

            <View style={styles.confirmText}>
              <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
                Verify your email
              </Text>
              <Text style={[styles.confirmSubtitle, { color: colors.mutedForeground }]}>
                We sent a confirmation link to
              </Text>
              <Text style={[styles.confirmEmail, { color: colors.foreground }]}>
                {email}
              </Text>
              <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
                Click the link in that email to activate your account. It may take a minute to arrive — check your spam folder if you don't see it.
              </Text>
            </View>

            {/* Steps */}
            <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "mail" as const,        text: "Open your email inbox" },
                { icon: "mouse-pointer" as const, text: "Click the confirmation link" },
                { icon: "log-in" as const,      text: "Return here and sign in" },
              ].map((step, i, arr) => (
                <View
                  key={i}
                  style={[
                    styles.stepRow,
                    i < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={[styles.stepIcon, { backgroundColor: colors.gold + "18" }]}>
                    <Feather name={step.icon} size={16} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepText, { color: colors.foreground }]}>{step.text}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </View>
              ))}
            </View>

            <PrimaryButton title="Go to Sign In" onPress={() => router.replace("/login")} />

            <TouchableOpacity onPress={() => setPendingConfirmation(false)} style={styles.resendBtn}>
              <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                Wrong email?{" "}
                <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>
                  Edit and resend
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Sign up form ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 16, paddingBottom: 16 },
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
          <Text style={[styles.title, { color: colors.foreground }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Join Atlanta Ride Share
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => touch("fullName")}
            placeholder="James Harrison"
            icon="user"
            autoComplete="name"
            autoCapitalize="words"
            error={fieldErrors.fullName}
          />

          <FormInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            onBlur={() => touch("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            icon="mail"
            error={fieldErrors.email}
          />

          <FormInput
            label="Phone Number"
            value={phone}
            onChangeText={handlePhoneChange}
            onBlur={() => touch("phone")}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="(404) 555-0000"
            icon="phone"
            error={fieldErrors.phone}
          />

          {/* Password with strength meter */}
          <View style={styles.passwordGroup}>
            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch("password")}
              secureTextEntry={!showPassword}
              placeholder="Create a strong password"
              icon="lock"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword((v) => !v)}
              error={fieldErrors.password}
            />
            {password.length > 0 && (
              <PasswordStrengthMeter strength={strength} />
            )}
          </View>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By creating an account you agree to our{" "}
          <Text style={{ color: colors.gold }}>Terms of Service</Text> and{" "}
          <Text style={{ color: colors.gold }}>Privacy Policy</Text>.
        </Text>

      </ScrollView>

      {/* Sticky bottom — always visible */}
      <View
        style={[
          styles.ctaArea,
          { paddingBottom: bottomPad + 16, backgroundColor: colors.background },
        ]}
      >
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
            <Text style={[styles.errorText, { color: colors.destructive }]}>{authError}</Text>
          </View>
        )}

        <PrimaryButton
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          disabled={!canSubmit}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.footerLink, { color: colors.gold }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 20,
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
  passwordGroup: { gap: 12 },
  terms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    textAlign: "center",
  },
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
  ctaArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Confirmation screen
  confirmArea: {
    flex: 1,
    alignItems: "center",
    gap: 24,
    paddingTop: 20,
  },
  confirmRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { alignItems: "center", gap: 8, width: "100%" },
  confirmTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  confirmSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  confirmEmail: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  confirmBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 310,
  },
  stepCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  resendBtn: { paddingVertical: 8 },
  resendText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
