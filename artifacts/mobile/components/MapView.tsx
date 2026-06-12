import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useColors } from "@/hooks/useColors";

const PICKUP_COORDS = { latitude: 33.6407, longitude: -84.4277 };
const DROPOFF_COORDS = { latitude: 33.7929, longitude: -84.3871 };

export function NativeMapView({
  driverCoords,
}: {
  driverCoords: { latitude: number; longitude: number };
}) {
  const colors = useColors();

  const mapRegion = {
    latitude: (driverCoords.latitude + DROPOFF_COORDS.latitude) / 2,
    longitude: (driverCoords.longitude + DROPOFF_COORDS.longitude) / 2,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  };

  return (
    <MapView
      style={styles.map}
      region={mapRegion}
      provider={PROVIDER_DEFAULT}
      showsUserLocation={false}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
    >
      <Marker coordinate={driverCoords} title="Driver">
        <View style={[styles.driverMarker, { backgroundColor: colors.navy }]}>
          <Feather name="navigation" size={16} color={colors.gold} />
        </View>
      </Marker>
      <Marker coordinate={PICKUP_COORDS} title="Pickup">
        <View style={[styles.pickupMarker, { backgroundColor: colors.gold }]}>
          <MaterialIcons name="flight-land" size={14} color="#fff" />
        </View>
      </Marker>
      <Marker coordinate={DROPOFF_COORDS} title="Drop-off">
        <View
          style={[
            styles.dropoffMarker,
            { backgroundColor: colors.navy, borderColor: colors.gold },
          ]}
        >
          <Feather name="map-pin" size={14} color={colors.gold} />
        </View>
      </Marker>
      <Polyline
        coordinates={[driverCoords, PICKUP_COORDS, DROPOFF_COORDS]}
        strokeColor={colors.gold}
        strokeWidth={2.5}
        lineDashPattern={[8, 4]}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#C9A84C",
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dropoffMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
