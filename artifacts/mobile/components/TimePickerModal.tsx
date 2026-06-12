import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// ─── Time options ─────────────────────────────────────────────────────────────

interface TimeOption {
  label: string;   // "9:00 AM"
  hour: number;    // 0–23
  minute: number;  // 0 or 30
}

function buildTimeOptions(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? "AM" : "PM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayHour}:${m === 0 ? "00" : "30"} ${period}`;
      opts.push({ label, hour: h, minute: m });
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

export function formatTimeDisplay(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute === 0 ? "00" : "30"} ${period}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimePickerModal({ visible, hour, minute, onConfirm, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selHour, setSelHour] = useState(hour);
  const [selMin, setSelMin] = useState(minute);

  // Sync when opened
  React.useEffect(() => {
    if (visible) {
      setSelHour(hour);
      setSelMin(minute);
    }
  }, [visible, hour, minute]);

  // Group options into AM / PM sections for clarity
  const amOptions = TIME_OPTIONS.filter((t) => t.hour < 12);
  const pmOptions = TIME_OPTIONS.filter((t) => t.hour >= 12);

  function TimeChip({ opt }: { opt: TimeOption }) {
    const isSelected = opt.hour === selHour && opt.minute === selMin;
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? colors.navy : colors.card,
            borderColor: isSelected ? colors.navy : colors.border,
          },
        ]}
        onPress={() => { setSelHour(opt.hour); setSelMin(opt.minute); }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            { color: isSelected ? colors.gold : colors.foreground },
          ]}
        >
          {opt.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Select Time</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Selected time banner */}
        <View style={[styles.selectedBanner, { backgroundColor: colors.navy }]}>
          <Feather name="clock" size={16} color={colors.gold} />
          <Text style={[styles.selectedText, { color: "#fff" }]}>
            {formatTimeDisplay(selHour, selMin)}
          </Text>
        </View>

        <ScrollView
          style={{ maxHeight: 300 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeContent}
        >
          {/* AM */}
          <Text style={[styles.period, { color: colors.mutedForeground }]}>Morning (AM)</Text>
          <View style={styles.chipGrid}>
            {amOptions.map((opt) => <TimeChip key={opt.label} opt={opt} />)}
          </View>

          {/* PM */}
          <Text style={[styles.period, { color: colors.mutedForeground, marginTop: 16 }]}>Afternoon & Evening (PM)</Text>
          <View style={styles.chipGrid}>
            {pmOptions.map((opt) => <TimeChip key={opt.label} opt={opt} />)}
          </View>
        </ScrollView>

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.navy }]}
          onPress={() => { onConfirm(selHour, selMin); onClose(); }}
        >
          <Text style={styles.confirmText}>Confirm Time</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:          { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle:         { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle:     { fontSize: 18, fontFamily: "Inter_700Bold" },
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 16 },
  selectedText:   { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  timeContent:    { paddingBottom: 8 },
  period:         { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  chipGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  chipText:       { fontSize: 14, fontFamily: "Inter_500Medium" },
  confirmBtn:     { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  confirmText:    { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
