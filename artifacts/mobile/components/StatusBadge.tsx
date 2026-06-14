import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { RideStatus } from "@/context/RideContext";

interface StatusBadgeProps {
  status: RideStatus;
  size?: "sm" | "md";
}

export function getStatusLabel(status: RideStatus): string {
  switch (status) {
    case "booking_requested":
      return "Booking Requested";
    case "pending_assignment":
      return "Pending Assignment";
    case "confirmed":
      return "Driver Confirmed";
    case "fully_assigned":
      return "Assigned";
    case "driver_en_route":
      return "Driver En Route";
    case "driver_arrived":
      return "Driver Arrived";
    case "ride_started":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function getStatusColor(status: RideStatus, colors: ReturnType<typeof useColors>): string {
  switch (status) {
    case "booking_requested":
      return colors.statusRequested;
    case "pending_assignment":
      return colors.statusPending;
    case "confirmed":
      return colors.statusAssigned;
    case "fully_assigned":
      return colors.statusAssigned;
    case "driver_en_route":
      return colors.statusEnRoute;
    case "driver_arrived":
      return colors.statusArrived;
    case "ride_started":
      return colors.statusStarted;
    case "completed":
      return colors.statusCompleted;
    case "cancelled":
      return colors.statusCancelled;
  }
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = useColors();
  const color = getStatusColor(status, colors);
  const label = getStatusLabel(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "20",
          borderColor: color + "40",
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 3 : 4,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.label,
          {
            color,
            fontSize: size === "sm" ? 11 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
