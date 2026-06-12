import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RideCard } from "@/components/RideCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RideContext";
import { useColors } from "@/hooks/useColors";
import { useProfile } from "@/hooks/useProfile";

const QUICK_ACTIONS = [
  { icon: "flight-land" as const, label: "Airport\nPickup", rideType: "airport_pickup" },
  { icon: "schedule" as const, label: "Schedule\nRide", rideType: "scheduled_ride" },
  { icon: "work" as const, label: "Corporate\nRide", rideType: "corporate_ride" },
  { icon: "hotel" as const, label: "Hotel\nTransfer", rideType: "hotel_transfer" },
];

function QuickAction({
  icon,
  label,
  rideType,
}: {
  icon: string;
  label: string;
  rideType: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() =>
        router.push({ pathname: "/(tabs)/book", params: { preselect: rideType } })
      }
      activeOpacity={0.7}
    >
      <View style={[styles.qaIcon, { backgroundColor: colors.gold + "18" }]}>
        <MaterialIcons name={icon as any} size={20} color={colors.gold} />
      </View>
      <Text style={[styles.qaLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const PLACE_TYPE_ICONS: Record<string, string> = {
  home:    "home",
  work:    "business",
  airport: "flight",
  custom:  "place",
};

function SavedPlaceChip({ label, address, icon }: { label: string; address: string; icon: string }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.placeChip, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: "/(tabs)/book", params: { prefillPickup: address } })
      }
    >
      <MaterialIcons name={icon as any} size={16} color={colors.navy} />
      <Text style={[styles.placeChipText, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rides, getActiveRide, getUpcomingRides, getTotalUnreadNotifications } = useRides();
  const { savedPlaces, loading: placesLoading } = useProfile();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const activeRide = getActiveRide();
  const upcomingRides = getUpcomingRides().filter(
    (r) => r.status === "booking_requested" || r.status === "pending_assignment"
  );
  const unreadCount = getTotalUnreadNotifications();

  const firstName = user?.fullName?.split(" ")[0] ?? "Guest";

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {getTimeOfDay()},
          </Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/rides")}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: colors.gold }]}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Book a Ride CTA */}
      <TouchableOpacity
        style={[styles.bookCta, { backgroundColor: colors.navy }]}
        onPress={() => router.push("/(tabs)/book")}
        activeOpacity={0.85}
      >
        <View>
          <Text style={styles.ctaLabel}>Ready to travel?</Text>
          <Text style={styles.ctaTitle}>Book a Ride</Text>
        </View>
        <View style={[styles.ctaArrow, { backgroundColor: colors.gold }]}>
          <Feather name="arrow-right" size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Active ride card */}
      {activeRide && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Ride</Text>
          <TouchableOpacity
            style={[styles.activeCard, { backgroundColor: colors.navy, borderColor: colors.gold + "30" }]}
            onPress={() =>
              router.push({ pathname: "/ride-details", params: { rideId: activeRide.id } })
            }
            activeOpacity={0.8}
          >
            <View style={styles.activeCardTop}>
              <StatusBadge status={activeRide.status} />
              <TouchableOpacity
                style={[styles.trackBtn, { backgroundColor: colors.gold }]}
                onPress={() =>
                  router.push({ pathname: "/live-tracking", params: { rideId: activeRide.id } })
                }
              >
                <Text style={styles.trackBtnText}>Track Live</Text>
                <Feather name="map-pin" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.activeLocations}>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: colors.gold }]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {activeRide.pickupAddress}
                </Text>
              </View>
              <View style={[styles.locDash, { borderColor: colors.gold + "40" }]} />
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: "#fff" }]} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {activeRide.dropoffAddress}
                </Text>
              </View>
            </View>
            {activeRide.driver && (
              <View style={[styles.driverRow, { borderTopColor: colors.gold + "20" }]}>
                <View style={[styles.driverAvatar, { backgroundColor: colors.gold + "30" }]}>
                  <Text style={[styles.driverInitial, { color: colors.gold }]}>
                    {activeRide.driver.firstName[0]}
                  </Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName} numberOfLines={1} ellipsizeMode="tail">
                    {activeRide.driver.firstName} {activeRide.driver.lastName}
                  </Text>
                  {activeRide.vehicle && (
                    <Text style={styles.vehicleText} numberOfLines={1} ellipsizeMode="tail">
                      {activeRide.vehicle.color} {activeRide.vehicle.make} {activeRide.vehicle.model}
                    </Text>
                  )}
                </View>
                <View style={styles.pickup}>
                  <Feather name="clock" size={12} color={colors.gold} />
                  <Text style={styles.pickupTime} numberOfLines={1}>{activeRide.pickupTime}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Book</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((qa) => (
            <QuickAction key={qa.rideType} {...qa} />
          ))}
        </View>
      </View>

      {/* Saved Places */}
      {(savedPlaces.length > 0 || placesLoading) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Places</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Text style={[styles.seeAll, { color: colors.gold }]}>Manage</Text>
            </TouchableOpacity>
          </View>
          {placesLoading ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <View style={styles.placesRow}>
              {savedPlaces.slice(0, 4).map((place) => (
                <SavedPlaceChip
                  key={place.id}
                  label={place.label}
                  address={place.address}
                  icon={PLACE_TYPE_ICONS[place.type] ?? "place"}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Upcoming requests */}
      {upcomingRides.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Pending Requests
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/rides")}>
              <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingRides.slice(0, 2).map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 4,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  bookCta: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  ctaLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  ctaTitle: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  ctaArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  activeCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  activeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  activeLocations: {
    gap: 0,
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locDash: {
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    height: 14,
    marginLeft: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  locationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverInitial: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  driverInfo: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  driverName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  vehicleText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  pickup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    paddingLeft: 6,
  },
  pickupTime: {
    fontSize: 12,
    color: "#C9A84C",
    fontFamily: "Inter_600SemiBold",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAction: {
    width: "47.5%",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  placesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  placeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  placeChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
