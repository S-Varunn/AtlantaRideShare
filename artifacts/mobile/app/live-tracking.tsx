import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeMapView } from "@/components/MapView";
import { StatusBadge } from "@/components/StatusBadge";
import { useRides } from "@/context/RideContext";
import { useColors } from "@/hooks/useColors";

function AnimatedPulse({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          { borderColor: color, transform: [{ scale }], opacity },
        ]}
      />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

export default function LiveTrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { rides } = useRides();

  const ride = rides.find((r) => r.id === rideId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [driverCoords, setDriverCoords] = useState(
    ride?.driverLocation
      ? {
          latitude: ride.driverLocation.latitude,
          longitude: ride.driverLocation.longitude,
        }
      : { latitude: 33.6441, longitude: -84.4324 }
  );

  const [eta] = useState("18 min");

  useEffect(() => {
    if (!ride?.driver) return;
    let step = 0;
    const waypoints = [
      { latitude: 33.6441, longitude: -84.4324 },
      { latitude: 33.6600, longitude: -84.4200 },
      { latitude: 33.6800, longitude: -84.4100 },
      { latitude: 33.7000, longitude: -84.4000 },
      { latitude: 33.7200, longitude: -84.3950 },
    ];
    const interval = setInterval(() => {
      step = (step + 1) % waypoints.length;
      setDriverCoords(waypoints[step]);
    }, 3000);
    return () => clearInterval(interval);
  }, [ride?.driver]);

  if (!ride) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
          Ride not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NativeMapView driverCoords={driverCoords} />

      {/* Header overlay */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.etaChip, { backgroundColor: colors.navy }]}>
          <Feather name="clock" size={14} color={colors.gold} />
          <Text style={styles.etaText}>ETA: {eta}</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View
        style={[
          styles.bottomPanel,
          {
            backgroundColor: colors.card,
            paddingBottom: bottomPad + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={ride.status} />
          <Text style={[styles.rideTypeText, { color: colors.mutedForeground }]}>
            {ride.rideType === "airport_pickup" ? "Airport Pickup" : "Ride"}
          </Text>
        </View>

        {ride.driver && (
          <View style={styles.driverSection}>
            <AnimatedPulse color={colors.gold} />
            <View
              style={[
                styles.driverAvatar,
                { backgroundColor: colors.gold + "20" },
              ]}
            >
              <Text style={[styles.driverInitial, { color: colors.gold }]}>
                {ride.driver.firstName[0]}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>
                {ride.driver.firstName} {ride.driver.lastName}
              </Text>
              {ride.vehicle && (
                <Text
                  style={[
                    styles.vehicleText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}{" "}
                  · {ride.vehicle.licensePlate}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.destinations}>
          <View style={styles.destRow}>
            <View style={[styles.destDot, { backgroundColor: colors.gold }]} />
            <Text
              style={[styles.destText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {ride.pickupAddress}
            </Text>
          </View>
          <View style={[styles.destLine, { borderColor: colors.border }]} />
          <View style={styles.destRow}>
            <View
              style={[
                styles.destDot,
                {
                  backgroundColor: "transparent",
                  borderWidth: 2,
                  borderColor: colors.navy,
                },
              ]}
            />
            <Text
              style={[styles.destText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {ride.dropoffAddress}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.dispatchBtn, { backgroundColor: colors.navy }]}
          onPress={() =>
            Linking.openURL("tel:+14045550100").catch(() => {})
          }
          activeOpacity={0.8}
        >
          <Feather name="phone" size={16} color={colors.gold} />
          <Text style={styles.dispatchBtnText}>Contact Dispatch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  etaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  etaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bottomPanel: {
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideTypeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  vehicleText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  destinations: {
    gap: 0,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  destLine: {
    paddingLeft: 5,
    height: 14,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  destText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  dispatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  dispatchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
});
