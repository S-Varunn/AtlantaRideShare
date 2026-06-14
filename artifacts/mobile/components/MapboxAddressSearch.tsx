import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { geocodeSuggest, type MapboxFeature } from "@/lib/mapbox";
import { useColors } from "@/hooks/useColors";

export interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
}

export function MapboxAddressSearch({
  value,
  onChangeText,
  onSelect,
  placeholder = "Search address…",
  colors,
}: Props) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRef = useRef(false);

  const search = useCallback(async (q: string) => {
    console.log("[MapboxAddressSearch] search called with query:", q);
    if (q.length < 3) {
      console.log("[MapboxAddressSearch] query length < 3, clearing suggestions");
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setFetching(true);
    try {
      const results = await geocodeSuggest(q);
      console.log("[MapboxAddressSearch] geocodeSuggest results:", results.map(r => r.text));
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch (err) {
      console.error("[MapboxAddressSearch] geocodeSuggest failed:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  const handleSelect = (feature: MapboxFeature) => {
    selectedRef.current = true;
    setSuggestions([]);
    setOpen(false);
    onSelect({
      address: feature.place_name,
      longitude: feature.center[0],
      latitude: feature.center[1],
    });
  };

  const handleChangeText = (text: string) => {
    selectedRef.current = false;
    onChangeText(text);
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.muted,
            borderColor: open ? colors.gold : colors.border,
          },
        ]}
      >
        <Feather name="map-pin" size={16} color={colors.mutedForeground} style={styles.pin} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {fetching && (
          <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />
        )}
        {!fetching && value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText("");
              setSuggestions([]);
              setOpen(false);
            }}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {open && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {suggestions.map((f, i) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.suggestion,
                i < suggestions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => handleSelect(f)}
              activeOpacity={0.7}
            >
              <View style={[styles.suggIcon, { backgroundColor: colors.gold + "18" }]}>
                <Feather name="map-pin" size={13} color={colors.gold} />
              </View>
              <View style={styles.suggText}>
                <Text
                  style={[styles.suggMain, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {f.text}
                </Text>
                <Text
                  style={[styles.suggSub, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {f.place_name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  pin: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  spinner: {
    marginLeft: 6,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  suggIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  suggText: {
    flex: 1,
    gap: 1,
  },
  suggMain: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  suggSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
