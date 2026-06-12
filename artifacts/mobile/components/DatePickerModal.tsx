import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// ─── Generate next N days ─────────────────────────────────────────────────────

function generateDates(count = 60): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function formatDateLabel(d: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DatePickerModal({ visible, value, onConfirm, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const dates = generateDates(60);

  const [selected, setSelected] = useState<Date>(value);
  const flatRef = useRef<FlatList>(null);

  // Scroll to selected date when modal opens
  useEffect(() => {
    if (!visible) return;
    setSelected(value);
    const idx = dates.findIndex((d) => d.toDateString() === value.toDateString());
    const safeIdx = idx >= 0 ? idx : 0;
    setTimeout(() => {
      flatRef.current?.scrollToIndex({ index: safeIdx, animated: false, viewPosition: 0.3 });
    }, 100);
  }, [visible]);

  const ITEM_H = 56;

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
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Select Date</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Selected date display */}
        <View style={[styles.selectedBanner, { backgroundColor: colors.navy }]}>
          <Feather name="calendar" size={16} color={colors.gold} />
          <Text style={[styles.selectedText, { color: "#fff" }]}>
            {formatDateDisplay(selected)}
          </Text>
        </View>

        {/* Date list */}
        <FlatList
          ref={flatRef}
          data={dates}
          keyExtractor={(d) => d.toISOString()}
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item, index }) => {
            const isSelected = item.toDateString() === selected.toDateString();
            const isToday = index === 0;
            return (
              <TouchableOpacity
                style={[
                  styles.dateRow,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: colors.gold + "14" },
                ]}
                onPress={() => setSelected(item)}
                activeOpacity={0.7}
              >
                <View style={styles.dateRowLeft}>
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: isSelected ? colors.gold : colors.foreground },
                    ]}
                  >
                    {formatDateLabel(item, index)}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayBadge, { backgroundColor: colors.gold + "20" }]}>
                      <Text style={[styles.todayText, { color: colors.gold }]}>TODAY</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.dateSub, { color: colors.mutedForeground }]}>
                  {item.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </Text>
                {isSelected && (
                  <Feather name="check" size={16} color={colors.gold} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.navy }]}
          onPress={() => { onConfirm(selected); onClose(); }}
        >
          <Text style={styles.confirmText}>Confirm Date</Text>
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
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 12 },
  selectedText:   { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dateRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, height: 56 },
  dateRowLeft:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  dateLabel:      { fontSize: 15, fontFamily: "Inter_500Medium" },
  todayBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  todayText:      { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  dateSub:        { fontSize: 13, fontFamily: "Inter_400Regular" },
  confirmBtn:     { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  confirmText:    { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
