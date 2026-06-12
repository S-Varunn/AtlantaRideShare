import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset email. Try again.";
      Alert.alert("Error", msg);
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
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {!submitted ? (
          <>
            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: colors.gold + "20" }]}>
                <Feather name="lock" size={28} color={colors.gold} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            <FormInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              icon="mail"
            />

            <PrimaryButton title="Send Reset Link" onPress={handleSubmit} loading={loading} />
          </>
        ) : (
          <View style={styles.successArea}>
            <View style={[styles.successCircle, { backgroundColor: colors.statusCompleted + "20" }]}>
              <Feather name="check" size={36} color={colors.statusCompleted} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Email Sent</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              If an account exists with{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>
                {email}
              </Text>
              , you will receive a password reset link shortly.
            </Text>
            <PrimaryButton
              title="Back to Sign In"
              onPress={() => router.replace("/login")}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  successArea: {
    flex: 1,
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
