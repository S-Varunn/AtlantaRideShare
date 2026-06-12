import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RideCard } from "@/components/RideCard";
import { useRides, type Ride } from "@/context/RideContext";
import { useColors } from "@/hooks/useColors";

type Tab = "upcoming" | "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming",  label: "Upcoming"  },
  { key: "active",    label: "Active"    },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// ─── Notification item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  colors,
}: {
  notification: { id: string; title: string; message: string; timestamp: string; read: boolean };
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.notifItem,
        {
          backgroundColor: notification.read ? colors.card : colors.gold + "10",
          borderColor: notification.read ? colors.border : colors.gold + "30",
        },
      ]}
    >
      <View style={[styles.notifDot, { backgroundColor: notification.read ? colors.muted : colors.gold }]} />
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, { color: colors.foreground }]}>{notification.title}</Text>
        <Text style={[styles.notifMsg, { color: colors.mutedForeground }]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
          {new Date(notification.timestamp).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  colors,
  cta = false,
}: {
  message: string;
  colors: ReturnType<typeof useColors>;
  cta?: boolean;
}) {
  return (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={40} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{message}</Text>
      {cta && (
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.navy }]}
          onPress={() => router.push("/(tabs)/book")}
        >
          <Text style={styles.emptyBtnText}>Book a Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RidesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rides, getUpcomingRides, getCompletedRides, getCancelledRides } = useRides();

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [showNotifs, setShowNotifs] = useState(false);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const activeRides    = rides.filter((r) => ["driver_en_route", "driver_arrived", "ride_started"].includes(r.status));
  const upcomingRides  = getUpcomingRides();
  const completedRides = getCompletedRides();
  const cancelledRides = getCancelledRides();

  // Auto-switch to Active when a live ride exists
  useEffect(() => {
    if (activeRides.length > 0) setActiveTab("active");
  }, [activeRides.length]);

  const allNotifications = rides
    .flatMap((r) => r.notifications.map((n) => ({ ...n, rideId: r.id, bookingId: r.bookingId })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getRideList = (): Ride[] => {
    switch (activeTab) {
      case "active":    return activeRides;
      case "upcoming":  return upcomingRides;
      case "completed": return completedRides;
      case "cancelled": return cancelledRides;
    }
  };

  const currentRides = getRideList();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Fixed header ── */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>My Rides</Text>
          <TouchableOpacity
            style={[
              styles.notifToggle,
              { backgroundColor: showNotifs ? colors.navy : colors.card, borderColor: showNotifs ? colors.navy : colors.border },
            ]}
            onPress={() => setShowNotifs((v) => !v)}
          >
            <Feather name="bell" size={18} color={showNotifs ? colors.gold : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ── */}
        {!showNotifs && (
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.navy : colors.mutedForeground },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.tabUnderline, { backgroundColor: colors.gold }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {showNotifs ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notifications</Text>
            {allNotifications.length === 0 ? (
              <EmptyState message="No notifications yet." colors={colors} />
            ) : (
              allNotifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => router.push({ pathname: "/ride-details", params: { rideId: n.rideId } })}
                >
                  <NotificationItem notification={n} colors={colors} />
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            {currentRides.length === 0 ? (
              <EmptyState
                message={`No ${activeTab} rides.`}
                colors={colors}
                cta={activeTab !== "completed" && activeTab !== "cancelled"}
              />
            ) : (
              currentRides.map((ride) => <RideCard key={ride.id} ride={ride} />)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    gap: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  notifToggle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Underline tab bar ────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: "10%",
    right: "10%",
    height: 2,
    borderRadius: 2,
  },
  // ── Content ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  // ── Notification ─────────────────────────────────────────────────────────────
  notifItem: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  notifMsg: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 56,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 4,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
