import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Ride } from "@/context/RideContext";
import { StatusBadge } from "@/components/StatusBadge";

interface RideCardProps {
  ride: Ride;
  compact?: boolean;
}

function getRideTypeLabel(type: Ride["rideType"]): string {
  switch (type) {
    case "airport_pickup":
      return "Airport Pickup";
    case "airport_dropoff":
      return "Airport Drop-off";
    case "corporate_ride":
      return "Corporate Ride";
    case "hourly_ride":
      return "Hourly Ride";
    case "hotel_transfer":
      return "Hotel Transfer";
    case "scheduled_ride":
      return "Scheduled Ride";
  }
}

export function RideCard({ ride, compact = false }: RideCardProps) {
  const colors = useColors();

  const handlePress = () => {
    router.push({ pathname: "/ride-details", params: { rideId: ride.id } });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.bookingId, { color: colors.mutedForeground }]}>
            {ride.bookingId}
          </Text>
          <Text style={[styles.rideType, { color: colors.foreground }]}>
            {getRideTypeLabel(ride.rideType)}
          </Text>
        </View>
        <StatusBadge status={ride.status} size="sm" />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.locations}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: colors.gold }]} />
          <Text
            style={[styles.locationText, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {ride.pickupAddress}
          </Text>
        </View>
        <View style={styles.locationLine}>
          <View style={[styles.dottedLine, { borderColor: colors.border }]} />
        </View>
        <View style={styles.locationRow}>
          <View
            style={[
              styles.locationDot,
              {
                backgroundColor: "transparent",
                borderWidth: 2,
                borderColor: colors.navy,
              },
            ]}
          />
          <Text
            style={[styles.locationText, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {ride.dropoffAddress}
          </Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {ride.pickupDate}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {ride.pickupTime}
            </Text>
          </View>
          {ride.driver && (
            <View style={styles.metaItem}>
              <Feather name="user" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {ride.driver.firstName}
              </Text>
            </View>
          )}
          <View style={styles.viewButton}>
            <MaterialIcons name="arrow-forward-ios" size={12} color={colors.gold} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  rideType: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  locations: {
    gap: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationLine: {
    paddingLeft: 7,
    height: 14,
    justifyContent: "center",
  },
  dottedLine: {
    height: 14,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  locationText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  viewButton: {
    marginLeft: "auto",
  },
});
