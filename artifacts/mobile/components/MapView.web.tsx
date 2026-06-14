import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function NativeMapView(_props: {
  driverCoords: { latitude: number; longitude: number };
  pickupCoords: { latitude: number; longitude: number };
  dropoffCoords: { latitude: number; longitude: number };
}) {
  const colors = useColors();
  return (
    <View style={[styles.mapPlaceholder, { backgroundColor: colors.muted }]}>
      <View
        style={[styles.routeLine, { backgroundColor: colors.gold }]}
      />
      <View
        style={[
          styles.driverDot,
          { backgroundColor: colors.navy, borderColor: colors.gold },
        ]}
      >
        <Feather name="navigation" size={18} color={colors.gold} />
      </View>
      <View
        style={[styles.pickupDot, { backgroundColor: colors.gold }]}
      />
      <View
        style={[
          styles.dropoffDot,
          { backgroundColor: colors.navy, borderColor: colors.gold },
        ]}
      />
      <View
        style={[
          styles.mapLabel,
          { backgroundColor: colors.card },
        ]}
      >
        <Feather name="map" size={14} color={colors.gold} />
        <Text
          style={[
            styles.mapLabelText,
            { color: colors.foreground },
          ]}
        >
          Live tracking active — scan QR code to view on device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  routeLine: {
    position: "absolute",
    width: 3,
    height: "55%",
    left: "45%",
    top: "15%",
    borderRadius: 2,
    opacity: 0.7,
    transform: [{ rotate: "-20deg" }],
  },
  driverDot: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    left: "35%",
    top: "20%",
  },
  pickupDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    left: "30%",
    top: "55%",
  },
  dropoffDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    left: "56%",
    top: "67%",
  },
  mapLabel: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mapLabelText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
});
