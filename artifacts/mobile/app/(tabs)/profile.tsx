import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useProfile, type SavedPlace, type UserPreferences } from "@/hooks/useProfile";
import { MapboxAddressSearch } from "@/components/MapboxAddressSearch";
import { useColors } from "@/hooks/useColors";

// ─── Sub-components ──────────────────────────────────────────────────────────

function ModalContainer({
  visible,
  title,
  onClose,
  onSave,
  saving,
  colors,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={mStyles.overlay}>
        <View style={[mStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[mStyles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[mStyles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={mStyles.sheetBody}>{children}</View>
          <TouchableOpacity
            style={[mStyles.saveBtn, { backgroundColor: colors.navy }]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={mStyles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={mStyles.fieldGroup}>
      <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[mStyles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  colors,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[mStyles.stepperRow, { borderBottomColor: colors.border }]}>
      <Text style={[mStyles.stepperLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={mStyles.stepperControls}>
        <TouchableOpacity
          style={[mStyles.stepBtn, { backgroundColor: colors.muted }]}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[mStyles.stepValue, { color: colors.foreground }]}>{value}</Text>
        <TouchableOpacity
          style={[mStyles.stepBtn, { backgroundColor: colors.muted }]}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SavedPlaceItem({
  place,
  onEdit,
  onDelete,
  colors,
}: {
  place: SavedPlace;
  onEdit: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const iconMap: Record<string, string> = { home: "home", work: "business", airport: "flight", custom: "place" };
  return (
    <View style={[styles.savedPlaceRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.savedPlaceIcon, { backgroundColor: colors.gold + "20" }]}>
        <MaterialIcons name={iconMap[place.type] as any} size={18} color={colors.gold} />
      </View>
      <View style={styles.savedPlaceText}>
        <Text style={[styles.savedPlaceLabel, { color: colors.foreground }]}>{place.label}</Text>
        <Text style={[styles.savedPlaceAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
          {place.address}
        </Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
        <Feather name="edit-2" size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
        <Feather name="trash-2" size={15} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  colors,
  danger,
  loading: rowLoading,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border, opacity: rowLoading ? 0.6 : 1 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={rowLoading}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.destructive + "15" : colors.muted }]}>
        {rowLoading ? (
          <ActivityIndicator size="small" color={danger ? colors.destructive : colors.foreground} />
        ) : (
          <Feather name={icon as any} size={17} color={danger ? colors.destructive : colors.foreground} />
        )}
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground, flex: 1 }]}>
        {rowLoading ? "Signing out…" : label}
      </Text>
      {value && !rowLoading ? (
        <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : null}
      {!danger && !rowLoading && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const PLACE_TYPES = [
  { key: "home", label: "Home", icon: "home" },
  { key: "work", label: "Work", icon: "business" },
  { key: "airport", label: "Airport", icon: "flight" },
  { key: "custom", label: "Custom", icon: "place" },
] as const;

const NOTIFICATION_OPTIONS = ["all", "important", "none"] as const;
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Portuguese"];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const {
    profile,
    savedPlaces,
    preferences,
    paymentMethods,
    loading,
    saving,
    updateProfile,
    changePassword,
    addSavedPlace,
    updateSavedPlace,
    deleteSavedPlace,
    updatePreferences,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
  } = useProfile();

  // Payment modal state
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardSaving, setCardSaving] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardType, setCardType] = useState<"credit_card" | "corporate_account">("credit_card");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  // Edit profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Change password modal
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Saved place modal
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [placeType, setPlaceType] = useState<SavedPlace["type"]>("custom");
  const [placeLat, setPlaceLat] = useState<number | undefined>(undefined);
  const [placeLng, setPlaceLng] = useState<number | undefined>(undefined);

  // Preferences modal
  const [showPrefs, setShowPrefs] = useState(false);
  const [draftPrefs, setDraftPrefs] = useState<UserPreferences>(preferences);

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "U";
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : "—";

  const handleLogout = () => {
    if (signingOut) return;
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    setSigningOut(true);
    try {
      await logout();
      // Navigation is handled by _layout auth state listener,
      // but we also push explicitly as a fallback.
      router.replace("/welcome");
    } catch (e) {
      setSigningOut(false);
      console.error("Sign out error:", e);
    }
  };

  // Edit profile handlers
  const openEditProfile = () => {
    setEditName(user?.fullName ?? "");
    setEditPhone(user?.phone ?? "");
    setShowEditProfile(true);
  };

  const saveProfile = async () => {
    try {
      await updateProfile({ full_name: editName.trim(), phone: editPhone.trim() });
      setShowEditProfile(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update profile.");
    }
  };

  // Change password handlers
  const savePassword = async () => {
    if (newPw !== confirmPw) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    try {
      await changePassword(newPw);
      setShowChangePw(false);
      setNewPw("");
      setConfirmPw("");
      Alert.alert("Success", "Your password has been updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update password.");
    }
  };

  // Saved place handlers
  const openAddPlace = () => {
    setEditingPlace(null);
    setPlaceLabel("");
    setPlaceAddress("");
    setPlaceType("custom");
    setPlaceLat(undefined);
    setPlaceLng(undefined);
    setShowPlaceModal(true);
  };

  const openEditPlace = (place: SavedPlace) => {
    setEditingPlace(place);
    setPlaceLabel(place.label);
    setPlaceAddress(place.address);
    setPlaceType(place.type);
    setPlaceLat(place.latitude);
    setPlaceLng(place.longitude);
    setShowPlaceModal(true);
  };

  const savePlaceModal = async () => {
    if (!placeLabel.trim() || !placeAddress.trim()) {
      Alert.alert("Error", "Label and address are required.");
      return;
    }
    const placeData: Omit<SavedPlace, "id"> = {
      label: placeLabel.trim(),
      address: placeAddress.trim(),
      type: placeType,
      latitude: placeLat,
      longitude: placeLng,
    };
    try {
      if (editingPlace) {
        await updateSavedPlace(editingPlace.id, placeData);
      } else {
        await addSavedPlace(placeData);
      }
      setShowPlaceModal(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save place.");
    }
  };

  const confirmDeletePlace = (place: SavedPlace) => {
    Alert.alert("Delete Place", `Remove "${place.label}" from saved places?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedPlace(place.id);
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete place.");
          }
        },
      },
    ]);
  };

  // Payment handlers
  const openAddCard = () => {
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardType("credit_card");
    setShowAddCard(true);
  };

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectCardBrand = (num: string): string => {
    const d = num.replace(/\s/g, "");
    if (d.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (d.startsWith("6")) return "Discover";
    return "Card";
  };

  const saveCard = async () => {
    const digits = cardNumber.replace(/\s/g, "");
    if (cardType === "credit_card") {
      if (!cardName.trim()) { Alert.alert("Error", "Please enter the cardholder name."); return; }
      if (digits.length < 13) { Alert.alert("Error", "Please enter a valid card number."); return; }
      if (cardExpiry.length < 5) { Alert.alert("Error", "Please enter a valid expiry date."); return; }
    }
    setCardSaving(true);
    try {
      const last_four = cardType === "credit_card" ? digits.slice(-4) : undefined;
      const brand = cardType === "credit_card" ? detectCardBrand(digits) : "Corporate";
      const label = cardType === "corporate_account" ? "Corporate Account" : `${brand} ····${last_four}`;
      await addPaymentMethod({ type: cardType, label, last_four });
      setShowAddCard(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not add payment method.");
    } finally {
      setCardSaving(false);
    }
  };

  const confirmDeleteCard = (pm: { id: string; label: string }) => {
    Alert.alert("Remove Card", `Remove "${pm.label}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deletePaymentMethod(pm.id).catch(() => {}) },
    ]);
  };

  // Preferences handlers
  const openPrefs = () => {
    setDraftPrefs({ ...preferences });
    setShowPrefs(true);
  };

  const savePrefsModal = async () => {
    try {
      await updatePreferences(draftPrefs);
      setShowPrefs(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save preferences.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.navy }]}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName ?? "—"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
            <Text style={styles.profilePhone}>{user?.phone || profile?.phone || ""}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editHeaderBtn, { backgroundColor: colors.gold + "30" }]}
            onPress={openEditProfile}
          >
            <Feather name="edit-2" size={15} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Member Since", value: memberYear },
            { label: "Saved Places", value: savedPlaces.length.toString() },
            { label: "Notifications", value: preferences.notifications === "all" ? "All" : preferences.notifications === "important" ? "Key" : "Off" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Saved Places */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Places</Text>
          {savedPlaces.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No saved places yet.</Text>
          )}
          {savedPlaces.map((place) => (
            <SavedPlaceItem
              key={place.id}
              place={place}
              onEdit={() => openEditPlace(place)}
              onDelete={() => confirmDeletePlace(place)}
              colors={colors}
            />
          ))}
          <TouchableOpacity style={styles.addPlace} onPress={openAddPlace}>
            <Feather name="plus" size={16} color={colors.gold} />
            <Text style={[styles.addPlaceText, { color: colors.gold }]}>Add New Place</Text>
          </TouchableOpacity>
        </View>

        {/* Travel Preferences */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Travel Preferences</Text>
          <SettingRow
            icon="users"
            label="Default Passengers"
            value={preferences.default_passengers.toString()}
            onPress={openPrefs}
            colors={colors}
          />
          <SettingRow
            icon="package"
            label="Default Luggage"
            value={preferences.default_luggage.toString()}
            onPress={openPrefs}
            colors={colors}
          />
          <SettingRow
            icon="bell"
            label="Notifications"
            value={preferences.notifications === "all" ? "All" : preferences.notifications === "important" ? "Important" : "None"}
            onPress={openPrefs}
            colors={colors}
          />
          <SettingRow
            icon="globe"
            label="Language"
            value={preferences.language}
            onPress={openPrefs}
            colors={colors}
          />
        </View>

        {/* Payment */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Methods</Text>

          {paymentMethods.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No payment methods saved.</Text>
          )}

          {paymentMethods.map((pm) => (
            <View key={pm.id} style={[styles.paymentRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.paymentIconBox, { backgroundColor: colors.navy + "12" }]}>
                <Feather
                  name={pm.type === "corporate_account" ? "briefcase" : "credit-card"}
                  size={18}
                  color={colors.navy}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, { color: colors.foreground }]}>{pm.label}</Text>
                {pm.is_default && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.gold + "22" }]}>
                    <Text style={[styles.defaultBadgeText, { color: colors.gold }]}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.paymentActions}>
                {!pm.is_default && (
                  <TouchableOpacity
                    style={[styles.paymentActionBtn, { borderColor: colors.border }]}
                    onPress={() => setDefaultPaymentMethod(pm.id)}
                  >
                    <Text style={[styles.paymentActionText, { color: colors.navy }]}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => confirmDeleteCard(pm)} style={styles.paymentDelBtn}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addPlace} onPress={openAddCard}>
            <Feather name="plus" size={16} color={colors.gold} />
            <Text style={[styles.addPlaceText, { color: colors.gold }]}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
          <SettingRow icon="edit-2" label="Edit Profile" onPress={openEditProfile} colors={colors} />
          <SettingRow icon="lock" label="Change Password" onPress={() => setShowChangePw(true)} colors={colors} />
          <SettingRow icon="shield" label="Privacy Settings" colors={colors} />
          <SettingRow icon="help-circle" label="About Atlanta Ride Share" colors={colors} />
          <SettingRow icon="log-out" label="Sign Out" onPress={handleLogout} colors={colors} danger loading={signingOut} />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>Atlanta Ride Share v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <ModalContainer
        visible={showEditProfile}
        title="Edit Profile"
        onClose={() => setShowEditProfile(false)}
        onSave={saveProfile}
        saving={saving}
        colors={colors}
      >
        <FieldInput label="Full Name" value={editName} onChangeText={setEditName} placeholder="James Harrison" colors={colors} />
        <FieldInput label="Phone Number" value={editPhone} onChangeText={setEditPhone} placeholder="+1 (404) 555-0000" keyboardType="phone-pad" colors={colors} />
      </ModalContainer>

      {/* Change Password Modal */}
      <ModalContainer
        visible={showChangePw}
        title="Change Password"
        onClose={() => { setShowChangePw(false); setNewPw(""); setConfirmPw(""); }}
        onSave={savePassword}
        colors={colors}
      >
        <FieldInput label="New Password" value={newPw} onChangeText={setNewPw} placeholder="Min. 8 characters" secureTextEntry colors={colors} />
        <FieldInput label="Confirm Password" value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat password" secureTextEntry colors={colors} />
      </ModalContainer>

      {/* Add / Edit Saved Place Modal */}
      <ModalContainer
        visible={showPlaceModal}
        title={editingPlace ? "Edit Place" : "Add Saved Place"}
        onClose={() => setShowPlaceModal(false)}
        onSave={savePlaceModal}
        colors={colors}
      >
        <FieldInput label="Label" value={placeLabel} onChangeText={setPlaceLabel} placeholder="e.g. Home, Mom's House" colors={colors} />
        <View style={{ gap: 6 }}>
          <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>Address</Text>
          <MapboxAddressSearch
            value={placeAddress}
            onChangeText={(text) => {
              setPlaceAddress(text);
              // Clear coordinates if user manually edits the text
              setPlaceLat(undefined);
              setPlaceLng(undefined);
            }}
            onSelect={(result) => {
              setPlaceAddress(result.address);
              setPlaceLat(result.latitude);
              setPlaceLng(result.longitude);
            }}
            placeholder="Search for an address…"
            colors={colors}
          />
          {placeLat !== undefined && (
            <View style={styles.coordBadge}>
              <Feather name="check-circle" size={12} color={colors.statusCompleted} />
              <Text style={[styles.coordText, { color: colors.statusCompleted }]}>
                Location confirmed
              </Text>
            </View>
          )}
        </View>
        <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground, marginTop: 4 }]}>Type</Text>
        <View style={mStyles.typeRow}>
          {PLACE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                mStyles.typeBtn,
                { borderColor: placeType === t.key ? colors.gold : colors.border, backgroundColor: placeType === t.key ? colors.gold + "18" : colors.muted },
              ]}
              onPress={() => setPlaceType(t.key)}
            >
              <MaterialIcons name={t.icon as any} size={16} color={placeType === t.key ? colors.gold : colors.mutedForeground} />
              <Text style={[mStyles.typeBtnText, { color: placeType === t.key ? colors.gold : colors.mutedForeground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalContainer>

      {/* Preferences Modal */}
      <ModalContainer
        visible={showPrefs}
        title="Travel Preferences"
        onClose={() => setShowPrefs(false)}
        onSave={savePrefsModal}
        saving={saving}
        colors={colors}
      >
        <Stepper label="Default Passengers" value={draftPrefs.default_passengers} onChange={(n) => setDraftPrefs((p) => ({ ...p, default_passengers: n }))} min={1} max={10} colors={colors} />
        <Stepper label="Default Luggage" value={draftPrefs.default_luggage} onChange={(n) => setDraftPrefs((p) => ({ ...p, default_luggage: n }))} min={0} max={10} colors={colors} />

        <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Notifications</Text>
        <View style={mStyles.typeRow}>
          {NOTIFICATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                mStyles.typeBtn,
                { borderColor: draftPrefs.notifications === opt ? colors.gold : colors.border, backgroundColor: draftPrefs.notifications === opt ? colors.gold + "18" : colors.muted },
              ]}
              onPress={() => setDraftPrefs((p) => ({ ...p, notifications: opt }))}
            >
              <Text style={[mStyles.typeBtnText, { color: draftPrefs.notifications === opt ? colors.gold : colors.mutedForeground, textTransform: "capitalize" }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Language</Text>
        <View style={mStyles.typeRow}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                mStyles.typeBtn,
                { borderColor: draftPrefs.language === lang ? colors.gold : colors.border, backgroundColor: draftPrefs.language === lang ? colors.gold + "18" : colors.muted },
              ]}
              onPress={() => setDraftPrefs((p) => ({ ...p, language: lang }))}
            >
              <Text style={[mStyles.typeBtnText, { color: draftPrefs.language === lang ? colors.gold : colors.mutedForeground }]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalContainer>

      {/* Add Payment Method Modal */}
      <ModalContainer
        visible={showAddCard}
        title="Add Payment Method"
        onClose={() => setShowAddCard(false)}
        onSave={saveCard}
        saving={cardSaving}
        colors={colors}
      >
        {/* Type selector */}
        <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
        <View style={[mStyles.typeRow, { marginBottom: 8 }]}>
          {[
            { key: "credit_card" as const, label: "Credit Card", icon: "credit-card" },
            { key: "corporate_account" as const, label: "Corporate", icon: "briefcase" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                mStyles.typeBtn,
                { flex: 1, justifyContent: "center", borderColor: cardType === t.key ? colors.gold : colors.border, backgroundColor: cardType === t.key ? colors.gold + "18" : colors.muted },
              ]}
              onPress={() => setCardType(t.key)}
            >
              <Feather name={t.icon as any} size={14} color={cardType === t.key ? colors.gold : colors.mutedForeground} />
              <Text style={[mStyles.typeBtnText, { color: cardType === t.key ? colors.gold : colors.mutedForeground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {cardType === "credit_card" && (
          <>
            <FieldInput
              label="Cardholder Name"
              value={cardName}
              onChangeText={setCardName}
              placeholder="James Harrison"
              colors={colors}
            />
            <View style={mStyles.fieldGroup}>
              <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>Card Number</Text>
              <TextInput
                style={[mStyles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>
            <View style={mStyles.fieldGroup}>
              <Text style={[mStyles.fieldLabel, { color: colors.mutedForeground }]}>Expiry Date</Text>
              <TextInput
                style={[mStyles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                value={cardExpiry}
                onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                placeholder="MM/YY"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </>
        )}

        {cardType === "corporate_account" && (
          <View style={[styles.corporateNote, { backgroundColor: colors.navy + "10", borderColor: colors.navy + "30" }]}>
            <Feather name="info" size={16} color={colors.navy} />
            <Text style={[styles.corporateNoteText, { color: colors.navy }]}>
              A corporate account will be linked to your company billing. Contact dispatch to verify your account.
            </Text>
          </View>
        )}
      </ModalContainer>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutConfirm} animationType="fade" transparent presentationStyle="overFullScreen">
        <View style={mStyles.overlay}>
          <View style={[soStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[soStyles.iconWrap, { backgroundColor: colors.destructive + "15" }]}>
              <Feather name="log-out" size={26} color={colors.destructive} />
            </View>
            <Text style={[soStyles.title, { color: colors.foreground }]}>Sign Out</Text>
            <Text style={[soStyles.body, { color: colors.mutedForeground }]}>
              Are you sure you want to sign out of your Atlanta Ride Share account?
            </Text>
            <View style={soStyles.btnRow}>
              <TouchableOpacity
                style={[soStyles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowSignOutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[soStyles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[soStyles.signOutBtn, { backgroundColor: colors.destructive }]}
                onPress={confirmSignOut}
                activeOpacity={0.8}
              >
                <Text style={soStyles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16, flexGrow: 1 },
  profileHeader: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 22, color: "#fff", fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 17, color: "#fff", fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  profilePhone: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  editHeaderBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase", paddingVertical: 14 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", paddingBottom: 12 },
  savedPlaceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  savedPlaceIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  savedPlaceText: { flex: 1, gap: 2 },
  savedPlaceLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  savedPlaceAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  iconBtn: { padding: 4 },
  addPlace: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  addPlaceText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1 },
  settingIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular", marginRight: 4 },
  version: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", paddingBottom: 8 },
  coordBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  coordText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  // Payment
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  paymentIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  paymentLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  defaultBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  defaultBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4 },
  paymentActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  paymentActionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  paymentActionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  paymentDelBtn: { padding: 6 },
  corporateNote: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  corporateNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingBottom: Platform.OS === "ios" ? 34 : 24 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sheetBody: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { marginHorizontal: 20, marginTop: 20, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  stepperLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepValue: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" },
});

const soStyles = StyleSheet.create({
  card: {
    marginHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  signOutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
