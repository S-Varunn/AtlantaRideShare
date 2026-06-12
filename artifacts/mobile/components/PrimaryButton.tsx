import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  fullWidth = true,
}: PrimaryButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bg =
    variant === "primary"
      ? colors.gold
      : variant === "secondary"
      ? colors.navy
      : variant === "danger"
      ? colors.destructive
      : "transparent";

  const textColor =
    variant === "primary"
      ? "#fff"
      : variant === "secondary"
      ? "#fff"
      : variant === "danger"
      ? "#fff"
      : variant === "outline"
      ? colors.navy
      : colors.foreground;

  const borderColor =
    variant === "outline" ? colors.navy : "transparent";

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? colors.muted : bg,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "ghost" ? colors.navy : "#fff"}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? colors.mutedForeground : textColor,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
