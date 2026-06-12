import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DatePickerModal, formatDateDisplay } from "@/components/DatePickerModal";
import { MapboxAddressSearch } from "@/components/MapboxAddressSearch";
import { PrimaryButton } from "@/components/PrimaryButton";
import { FormInput } from "@/components/TextInput";
import { TimePickerModal, formatTimeDisplay } from "@/components/TimePickerModal";
import { useAuth } from "@/context/AuthContext";
import { type CreateRideInput, useRides, type RideType } from "@/context/RideContext";
import { useColors } from "@/hooks/useColors";
import { useRecentAddresses } from "@/hooks/useRecentAddresses";
import { estimateFare, type FareBreakdown } from "@/lib/fareEstimate";

// ─── Constants ────────────────────────────────────────────────────────────────

const RIDE_TYPES: { value: RideType; label: string; icon: string }[] = [
  { value: "airport_pickup",  label: "Airport Pickup",   icon: "trending-down" },
  { value: "airport_dropoff", label: "Airport Drop-off", icon: "trending-up"   },
  { value: "corporate_ride",  label: "Corporate Ride",   icon: "briefcase"     },
  { value: "hourly_ride",     label: "Hourly Ride",      icon: "clock"         },
  { value: "hotel_transfer",  label: "Hotel Transfer",   icon: "home"          },
  { value: "scheduled_ride",  label: "Scheduled Ride",   icon: "calendar"      },
];

function defaultDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultHour(): number {
  const h = new Date().getHours() + 1;
  return h >= 24 ? 0 : h;
}

// ─── Picker field (tappable row) ──────────────────────────────────────────────

function PickerField({
  label,
  value,
  icon,
  onPress,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, letterSpacing: 0.2 }}>
        {label}
      </Text>
      <TouchableOpacity
        style={[pickerFieldStyle.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather name={icon as any} size={18} color={colors.mutedForeground} style={{ paddingHorizontal: 14 }} />
        <Text style={{ flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}>
          {value}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} style={{ paddingRight: 14 }} />
      </TouchableOpacity>
    </View>
  );
}

const pickerFieldStyle = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, height: 50, borderWidth: 1 },
});

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  const colors = useColors();
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor:
                i < step ? colors.gold : i === step ? colors.navy : colors.border,
              width: i === step ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Coord badge ─────────────────────────────────────────────────────────────

function CoordBadge({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.coordBadge}>
      <Feather name="check-circle" size={12} color={colors.statusCompleted} />
      <Text style={[styles.coordText, { color: colors.statusCompleted }]}>
        Location confirmed
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookRideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createRide } = useRides();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const { recents, addRecentAddress } = useRecentAddresses();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [newBookingId, setNewBookingId] = useState("");
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareError, setFareError] = useState<string | null>(null);

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [rideType, setRideType] = useState<RideType>(
    (params.preselect as RideType) ?? "airport_pickup"
  );
  const [pickup, setPickup] = useState((params.prefillPickup as string) ?? "");
  const [pickupLat, setPickupLat] = useState<number | undefined>();
  const [pickupLng, setPickupLng] = useState<number | undefined>();
  const [dropoff, setDropoff] = useState("");
  const [dropoffLat, setDropoffLat] = useState<number | undefined>();
  const [dropoffLng, setDropoffLng] = useState<number | undefined>();
  const [date, setDate] = useState<Date>(defaultDate());
  const [timeHour, setTimeHour] = useState<number>(defaultHour());
  const [timeMin, setTimeMin] = useState<number>(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Step 2 fields ──────────────────────────────────────────────────────────
  const [passengers, setPassengers] = useState("1");
  const [luggage, setLuggage] = useState("0");
  const [flightNumber, setFlightNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const isAirport = rideType === "airport_pickup" || rideType === "airport_dropoff";

  useEffect(() => {
    if (params.preselect) setRideType(params.preselect as RideType);
    if (params.prefillPickup) {
      setPickup(params.prefillPickup as string);
      setPickupLat(undefined);
      setPickupLng(undefined);
    }
  }, [params.preselect, params.prefillPickup]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!pickup.trim()) {
      Alert.alert("Missing Info", "Please enter a pickup address.");
      return false;
    }
    if (!dropoff.trim()) {
      Alert.alert("Missing Info", "Please enter a drop-off address.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === 2) {
      if (pickupLat != null && pickupLng != null && dropoffLat != null && dropoffLng != null) {
        setFareLoading(true);
        setFareBreakdown(null);
        setFareError(null);
        estimateFare(pickupLat, pickupLng, dropoffLat, dropoffLng, parseInt(luggage) || 0)
          .then(setFareBreakdown)
          .catch((e) => setFareError(e instanceof Error ? e.message : "Could not calculate fare"))
          .finally(() => setFareLoading(false));
      } else {
        setFareBreakdown(null);
        setFareError("Add pickup & drop-off addresses with autocomplete for an estimate.");
      }
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const input: CreateRideInput = {
        rideType,
        pickupAddress: pickup,
        pickupLat,
        pickupLng,
        dropoffAddress: dropoff,
        dropoffLat,
        dropoffLng,
        pickupDate: formatDateDisplay(date),
        pickupTime: formatTimeDisplay(timeHour, timeMin),
        passengers: parseInt(passengers) || 1,
        luggage: parseInt(luggage) || 0,
        flightNumber: isAirport && flightNumber ? flightNumber : undefined,
        specialInstructions: specialInstructions || undefined,
        customerName: user?.fullName || undefined,
        estimatedFare: fareBreakdown ? `$${fareBreakdown.totalFare.toFixed(2)}` : undefined,
        estimatedDistance: fareBreakdown ? `${fareBreakdown.distanceMiles} mi` : undefined,
      };
      const newRide = await createRide(input);
      setNewBookingId(newRide.bookingId);
      setConfirmed(true);
    } catch {
      Alert.alert("Error", "Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmed(false);
    setStep(0);
    setPickup("");
    setPickupLat(undefined);
    setPickupLng(undefined);
    setDropoff("");
    setDropoffLat(undefined);
    setDropoffLng(undefined);
    setFlightNumber("");
    setSpecialInstructions("");
    setPassengers("1");
    setLuggage("0");
  };

  // ── Confirmation screen ────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <View
        style={[
          styles.confirmedRoot,
          { backgroundColor: colors.background, paddingTop: topPad + 24, paddingBottom: bottomPad },
        ]}
      >
        <View style={[styles.confirmedCircle, { backgroundColor: colors.gold + "20" }]}>
          <Feather name="check-circle" size={56} color={colors.gold} />
        </View>
        <Text style={[styles.confirmedTitle, { color: colors.foreground }]}>Booking Received</Text>
        <Text style={[styles.confirmedId, { color: colors.gold }]}>{newBookingId}</Text>
        <Text style={[styles.confirmedMsg, { color: colors.mutedForeground }]}>
          Your ride request has been received. Our dispatch team will review your booking and assign
          your driver and vehicle shortly.{"\n\n"}You will be notified at each stage of the process.
        </Text>
        <View style={[styles.confirmedCard, { backgroundColor: colors.navy, borderRadius: 16 }]}>
          <Feather name="shield" size={20} color={colors.gold} />
          <Text style={styles.confirmedCardText}>
            This is a managed dispatch service. Admin will assign your driver and vehicle.
          </Text>
        </View>
        <PrimaryButton
          title="View My Rides"
          onPress={() => {
            resetForm();
            router.push("/(tabs)/rides");
          }}
        />
        <PrimaryButton
          title="Book Another Ride"
          onPress={resetForm}
          variant="outline"
        />
      </View>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
              Step {step + 1} of 3
            </Text>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>
              {step === 0 ? "Ride Details" : step === 1 ? "Trip Details" : "Review & Confirm"}
            </Text>
          </View>
        </View>

        <StepIndicator step={step} total={3} />

        {/* ── Step 1: Route ──────────────────────────────────────────────── */}
        {step === 0 && (
          <View style={styles.formSection}>
            {/* Ride type chips */}
            <Text style={[styles.fieldGroup, { color: colors.foreground }]}>Ride Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rideTypeScroll}
            >
              <View style={styles.rideTypeRow}>
                {RIDE_TYPES.map((rt) => (
                  <TouchableOpacity
                    key={rt.value}
                    style={[
                      styles.rideTypeChip,
                      {
                        backgroundColor:
                          rideType === rt.value ? colors.navy : colors.card,
                        borderColor:
                          rideType === rt.value ? colors.navy : colors.border,
                      },
                    ]}
                    onPress={() => setRideType(rt.value)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={rt.icon as any}
                      size={14}
                      color={rideType === rt.value ? colors.gold : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.rideTypeLabel,
                        { color: rideType === rt.value ? "#fff" : colors.foreground },
                      ]}
                    >
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Pickup */}
            <View style={styles.addressBlock}>
              <View style={styles.addressLabelRow}>
                <Feather name="map-pin" size={14} color={colors.gold} />
                <Text style={[styles.addressLabel, { color: colors.foreground }]}>
                  Pickup Address
                </Text>
              </View>
              <MapboxAddressSearch
                value={pickup}
                onChangeText={(text) => {
                  setPickup(text);
                  setPickupLat(undefined);
                  setPickupLng(undefined);
                }}
                onSelect={(result) => {
                  setPickup(result.address);
                  setPickupLat(result.latitude);
                  setPickupLng(result.longitude);
                  addRecentAddress({ address: result.address, latitude: result.latitude, longitude: result.longitude });
                }}
                placeholder="Search pickup location…"
                colors={colors}
              />
              {pickupLat !== undefined && <CoordBadge colors={colors} />}
              {!pickup && recents.length > 0 && (
                <ScrollView
                  style={[styles.suggestions, { maxHeight: 132 }]}
                  scrollEnabled={recents.length > 3}
                  showsVerticalScrollIndicator={recents.length > 3}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {recents.map((r, i) => (
                    <TouchableOpacity
                      key={r.address}
                      style={[
                        styles.suggRow,
                        { borderBottomColor: i < recents.length - 1 ? colors.border : "transparent" },
                      ]}
                      onPress={() => {
                        setPickup(r.address);
                        setPickupLat(r.latitude);
                        setPickupLng(r.longitude);
                      }}
                    >
                      <Feather name="clock" size={13} color={colors.mutedForeground} />
                      <Text
                        style={[styles.suggText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {r.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Drop-off */}
            <View style={styles.addressBlock}>
              <View style={styles.addressLabelRow}>
                <Feather name="navigation" size={14} color={colors.navy} />
                <Text style={[styles.addressLabel, { color: colors.foreground }]}>
                  Drop-off Address
                </Text>
              </View>
              <MapboxAddressSearch
                value={dropoff}
                onChangeText={(text) => {
                  setDropoff(text);
                  setDropoffLat(undefined);
                  setDropoffLng(undefined);
                }}
                onSelect={(result) => {
                  setDropoff(result.address);
                  setDropoffLat(result.latitude);
                  setDropoffLng(result.longitude);
                  addRecentAddress({ address: result.address, latitude: result.latitude, longitude: result.longitude });
                }}
                placeholder="Search destination…"
                colors={colors}
              />
              {dropoffLat !== undefined && <CoordBadge colors={colors} />}
              {!dropoff && recents.length > 0 && (
                <ScrollView
                  style={[styles.suggestions, { maxHeight: 132 }]}
                  scrollEnabled={recents.length > 3}
                  showsVerticalScrollIndicator={recents.length > 3}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {recents.map((r, i) => (
                    <TouchableOpacity
                      key={r.address}
                      style={[
                        styles.suggRow,
                        { borderBottomColor: i < recents.length - 1 ? colors.border : "transparent" },
                      ]}
                      onPress={() => {
                        setDropoff(r.address);
                        setDropoffLat(r.latitude);
                        setDropoffLng(r.longitude);
                      }}
                    >
                      <Feather name="clock" size={13} color={colors.mutedForeground} />
                      <Text
                        style={[styles.suggText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {r.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Date & Time */}
            <View style={styles.dateTimeRow}>
              <PickerField
                label="Date"
                value={formatDateDisplay(date)}
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
                colors={colors}
              />
              <PickerField
                label="Time"
                value={formatTimeDisplay(timeHour, timeMin)}
                icon="clock"
                onPress={() => setShowTimePicker(true)}
                colors={colors}
              />
            </View>
          </View>
        )}

        {/* ── Step 2: Details ────────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.formSection}>
            <View style={styles.countRow}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Passengers"
                  value={passengers}
                  onChangeText={setPassengers}
                  keyboardType="number-pad"
                  icon="users"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Luggage Pieces"
                  value={luggage}
                  onChangeText={setLuggage}
                  keyboardType="number-pad"
                  icon="package"
                />
              </View>
            </View>

            {isAirport && (
              <FormInput
                label="Flight Number"
                value={flightNumber}
                onChangeText={setFlightNumber}
                placeholder="e.g. DL 847"
                icon="send"
                autoCapitalize="characters"
              />
            )}

            <View style={styles.notesBlock}>
              <Text style={[styles.fieldGroup, { color: colors.foreground, marginBottom: 6 }]}>
                Special Instructions (Optional)
              </Text>
              <RNTextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={4}
                placeholder="Any special requests, meet & greet preferences, accessibility needs…"
                placeholderTextColor={colors.mutedForeground}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* ── Step 3: Review ─────────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.formSection}>
            <View
              style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {[
                ["Ride Type", RIDE_TYPES.find((r) => r.value === rideType)?.label ?? ""],
                ["Pickup", pickup],
                ["Drop-off", dropoff],
                ["Date & Time", `${formatDateDisplay(date)} at ${formatTimeDisplay(timeHour, timeMin)}`],
                ["Passengers", passengers],
                ["Luggage", `${luggage} piece(s)`],
                ...(isAirport && flightNumber ? [["Flight", flightNumber]] : []),
                ...(specialInstructions ? [["Notes", specialInstructions]] : []),
              ].map(([key, val], idx, arr) => (
                <React.Fragment key={key}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                      {key}
                    </Text>
                    <Text
                      style={[styles.summaryVal, { color: colors.foreground, flex: 1, textAlign: "right" }]}
                      numberOfLines={3}
                    >
                      {val}
                    </Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
              <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />

              {/* ── Fare breakdown ─────────────────────────────────────────── */}
              {fareLoading && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Calculating fare…</Text>
                </View>
              )}

              {!fareLoading && fareError && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.mutedForeground, fontStyle: "italic" }]}>
                    {fareError}
                  </Text>
                </View>
              )}

              {!fareLoading && fareBreakdown && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Distance</Text>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                      {fareBreakdown.distanceMiles} mi
                    </Text>
                  </View>
                  <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Base Fare</Text>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                      ${fareBreakdown.baseFare.toFixed(2)}
                    </Text>
                  </View>
                  {fareBreakdown.luggageFee > 0 && (
                    <>
                      <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                          Luggage ({luggage} pc)
                        </Text>
                        <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                          +${fareBreakdown.luggageFee.toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                      Est. Total
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.gold, fontFamily: "Inter_700Bold", fontSize: 16 }]}>
                      ${fareBreakdown.totalFare.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.noticeBox, { backgroundColor: colors.navy }]}>
              <Feather name="info" size={16} color={colors.gold} />
              <Text style={styles.noticeText}>
                Your booking will be sent to our dispatch team for review. A driver and vehicle will
                be assigned shortly after confirmation.
              </Text>
            </View>
          </View>
        )}

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <View style={styles.ctaArea}>
          {step < 2 ? (
            <PrimaryButton title="Continue" onPress={handleNext} />
          ) : (
            <PrimaryButton title="Confirm Booking" onPress={handleConfirm} loading={loading} />
          )}
        </View>
      </ScrollView>

      {/* ── Pickers ─────────────────────────────────────────────────────── */}
      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onConfirm={(d) => setDate(d)}
        onClose={() => setShowDatePicker(false)}
      />
      <TimePickerModal
        visible={showTimePicker}
        hour={timeHour}
        minute={timeMin}
        onConfirm={(h, m) => { setTimeHour(h); setTimeMin(m); }}
        onClose={() => setShowTimePicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { paddingHorizontal: 20, gap: 20, flexGrow: 1 },
  header:         { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:        { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepLabel:      { fontSize: 12, fontFamily: "Inter_400Regular" },
  screenTitle:    { fontSize: 22, fontFamily: "Inter_700Bold" },
  stepIndicator:  { flexDirection: "row", gap: 6, alignItems: "center" },
  stepDot:        { height: 6, borderRadius: 3 },
  formSection:    { gap: 16 },
  fieldGroup:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  rideTypeScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  rideTypeRow:    { flexDirection: "row", gap: 8, paddingRight: 20 },
  rideTypeChip:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
  rideTypeLabel:  { fontSize: 13, fontFamily: "Inter_500Medium", whiteSpace: "nowrap" } as any,
  addressBlock:   { gap: 6 },
  addressLabelRow:{ flexDirection: "row", alignItems: "center", gap: 6 },
  addressLabel:   { fontSize: 13, fontFamily: "Inter_500Medium" },
  coordBadge:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  coordText:      { fontSize: 11, fontFamily: "Inter_500Medium" },
  suggestions:    { marginTop: 4, borderRadius: 12, overflow: "hidden" },
  suggRow:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1 },
  suggText:       { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  dateTimeRow:    { flexDirection: "row", gap: 12 },
  countRow:       { flexDirection: "row", gap: 12 },
  notesBlock:     {},
  textArea:       { borderRadius: 12, borderWidth: 1, minHeight: 110, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  summaryCard:    { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  summaryRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  summaryKey:     { fontSize: 13, fontFamily: "Inter_400Regular", flexShrink: 0 },
  summaryVal:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  sumDivider:     { height: 1, marginHorizontal: 16 },
  noticeBox:      { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, alignItems: "flex-start" },
  noticeText:     { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
  ctaArea:        {},
  confirmedRoot:  { flex: 1, paddingHorizontal: 24, gap: 16, alignItems: "center" },
  confirmedCircle:{ width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  confirmedTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmedId:    { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  confirmedMsg:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmedCard:  { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, width: "100%", marginBottom: 4 },
  confirmedCardText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
});
