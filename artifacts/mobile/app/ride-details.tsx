import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge, getStatusColor, getStatusLabel } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useRides, type Ride, type RideStatus } from "@/context/RideContext";
import { useColors } from "@/hooks/useColors";

const STATUS_STEPS: RideStatus[] = [
  "booking_requested",
  "pending_assignment",
  "fully_assigned",
  "driver_en_route",
  "driver_arrived",
  "ride_started",
  "completed",
];

function StatusTimeline({ status, colors }: { status: RideStatus; colors: ReturnType<typeof useColors> }) {
  if (status === "cancelled") return null;
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <View style={styles.timeline}>
      {STATUS_STEPS.map((step, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const stepColor = isCurrent
          ? getStatusColor(step, colors)
          : isPast
          ? colors.statusCompleted
          : colors.border;

        return (
          <View key={step} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: isCurrent ? stepColor : isPast ? colors.statusCompleted : colors.border,
                    borderColor: isCurrent ? stepColor : isPast ? colors.statusCompleted : colors.border,
                  },
                ]}
              >
                {isPast && <Feather name="check" size={10} color="#fff" />}
                {isCurrent && (
                  <View style={[styles.timelineDotInner, { backgroundColor: "#fff" }]} />
                )}
              </View>
              {i < STATUS_STEPS.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: i < currentIndex ? colors.statusCompleted : colors.border,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  {
                    color: isCurrent ? stepColor : isPast ? colors.foreground : colors.mutedForeground,
                    fontFamily: isCurrent ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {getStatusLabel(step)}
              </Text>
              {isCurrent && (
                <Text style={[styles.timelineCurrent, { color: stepColor }]}>Current Status</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function RideDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { rides, cancelRide, markNotificationsRead } = useRides();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const ride = rides.find((r) => r.id === rideId);

  useEffect(() => {
    if (rideId) markNotificationsRead(rideId);
  }, [rideId]);

  if (!ride) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Ride not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.gold }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canTrack =
    ride.driver &&
    ["fully_assigned", "driver_en_route", "driver_arrived", "ride_started"].includes(ride.status);

  const canCancel = ["booking_requested", "pending_assignment", "fully_assigned"].includes(
    ride.status
  );

  const handleCancel = () => setShowCancelConfirm(true);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelRide(ride!.id);
      setShowCancelConfirm(false);
      router.back();
    } finally {
      setCancelling(false);
    }
  };

  const getRideTypeLabel = (type: Ride["rideType"]) => {
    const map: Record<string, string> = {
      airport_pickup: "Airport Pickup",
      airport_dropoff: "Airport Drop-off",
      corporate_ride: "Corporate Ride",
      hourly_ride: "Hourly Ride",
      hotel_transfer: "Hotel Transfer",
      scheduled_ride: "Scheduled Ride",
    };
    return map[type] ?? type;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 4, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back + title */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookingId, { color: colors.mutedForeground }]}>
            {ride.bookingId}
          </Text>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {getRideTypeLabel(ride.rideType)}
          </Text>
        </View>
        <StatusBadge status={ride.status} size="sm" />
      </View>

      {/* Track button */}
      {canTrack && (
        <TouchableOpacity
          style={[styles.trackBanner, { backgroundColor: colors.navy }]}
          onPress={() =>
            router.push({ pathname: "/live-tracking", params: { rideId: ride.id } })
          }
          activeOpacity={0.85}
        >
          <View style={styles.trackLeft}>
            <View style={[styles.pulseDot, { backgroundColor: colors.gold }]} />
            <Text style={styles.trackBannerText}>Track Driver Live</Text>
          </View>
          <Feather name="map-pin" size={18} color={colors.gold} />
        </TouchableOpacity>
      )}

      {/* Ride status timeline */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ride Progress</Text>
        <StatusTimeline status={ride.status} colors={colors} />
      </View>

      {/* Route */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Route</Text>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.gold }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
            <Text style={[styles.routeAddr, { color: colors.foreground }]}>
              {ride.pickupAddress}
            </Text>
          </View>
        </View>
        <View style={[styles.routeConnector, { borderColor: colors.border }]} />
        <View style={styles.routeRow}>
          <View
            style={[
              styles.routeDot,
              { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.navy },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Drop-off</Text>
            <Text style={[styles.routeAddr, { color: colors.foreground }]}>
              {ride.dropoffAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Trip Details</Text>
        <InfoRow label="Date" value={ride.pickupDate} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Time" value={ride.pickupTime} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Passengers" value={`${ride.passengers} passenger(s)`} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Luggage" value={`${ride.luggage} piece(s)`} colors={colors} />
        {ride.flightNumber && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow label="Flight Number" value={ride.flightNumber} colors={colors} />
          </>
        )}
        {ride.specialInstructions ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow label="Special Instructions" value={ride.specialInstructions} colors={colors} />
          </>
        ) : null}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Estimated Fare" value={ride.estimatedFare} colors={colors} />
      </View>

      {/* Driver & Vehicle */}
      {ride.driver && ride.vehicle ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Assigned Driver</Text>
          <View style={styles.driverRow}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.gold + "20" }]}>
              <Text style={[styles.driverInitial, { color: colors.gold }]}>
                {ride.driver.firstName[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>
                {ride.driver.firstName} {ride.driver.lastName}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={14} color={colors.gold} />
                <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                  {ride.driver.rating.toFixed(2)} rating
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.vehicleInfo}>
            <Feather name="truck" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.vehicleName, { color: colors.foreground }]}>
                {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}
              </Text>
              <Text style={[styles.vehicleDetails, { color: colors.mutedForeground }]}>
                {ride.vehicle.color} · {ride.vehicle.licensePlate}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.pendingCard, { backgroundColor: colors.navy }]}>
          <Feather name="clock" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Driver Pending Assignment</Text>
            <Text style={styles.pendingMsg}>
              Our dispatch team is reviewing your booking. Driver and vehicle details will appear here once assigned.
            </Text>
          </View>
        </View>
      )}

      {/* Notifications for this ride */}
      {ride.notifications.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Updates</Text>
          {[...ride.notifications].reverse().map((n) => (
            <View
              key={n.id}
              style={[styles.notifRow, { borderBottomColor: colors.border }]}
            >
              <View
                style={[
                  styles.notifDot,
                  { backgroundColor: n.read ? colors.border : colors.gold },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                <Text style={[styles.notifMsg, { color: colors.mutedForeground }]}>
                  {n.message}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.dispatchBtn, { backgroundColor: colors.navy }]}
          onPress={() => Linking.openURL("tel:+14045550100").catch(() => {})}
          activeOpacity={0.8}
        >
          <Feather name="phone" size={18} color={colors.gold} />
          <Text style={styles.dispatchBtnText}>Contact Dispatch</Text>
        </TouchableOpacity>
        {canCancel && (
          <PrimaryButton
            title="Cancel Booking"
            onPress={handleCancel}
            variant="danger"
          />
        )}
      </View>

      {/* Cancel confirmation modal */}
      <Modal
        visible={showCancelConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: colors.destructive + "15" }]}>
              <Feather name="alert-triangle" size={28} color={colors.destructive} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Cancel Booking?</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>
              Are you sure you want to cancel this ride?{"\n"}Cancellation fees may apply.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmKeep, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                <Text style={[styles.confirmKeepText, { color: colors.foreground }]}>Keep Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmCancel, { backgroundColor: colors.destructive, opacity: cancelling ? 0.7 : 1 }]}
                onPress={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <Text style={styles.confirmCancelText}>Cancelling…</Text>
                ) : (
                  <Text style={styles.confirmCancelText}>Cancel Ride</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 14,
    flexGrow: 1,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  backLink: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingId: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  trackBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  trackLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackBannerText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  timeline: {
    gap: 0,
  },
  timelineStep: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 13,
  },
  timelineCurrent: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  routeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 16,
    flexShrink: 0,
  },
  routeConnector: {
    marginLeft: 5,
    height: 16,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
  },
  routeLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  routeAddr: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textAlign: "right",
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  driverName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  vehicleDetails: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  pendingCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
  },
  pendingTitle: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  pendingMsg: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  notifRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  notifMsg: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  actions: {
    gap: 12,
    paddingTop: 4,
  },
  dispatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
  },
  dispatchBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Cancel modal ─────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  confirmSheet: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  confirmMsg: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmKeep: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmKeepText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  confirmCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
