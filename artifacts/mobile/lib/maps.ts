import { Linking, Platform, ActionSheetIOS, Alert } from "react-native";

/**
 * Open a given coordinate in Google Maps or Apple Maps, presenting a picker if on iOS,
 * or using the native intent chooser / Google Maps on Android / Web.
 */
export function openInMaps(latitude: number, longitude: number, label?: string) {
  const queryLabel = label ? label.trim() : "Destination";
  const encodedLabel = encodeURIComponent(queryLabel);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const appleMapsUrl = `maps://?q=${encodedLabel}&ll=${latitude},${longitude}`;

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Apple Maps", "Google Maps"],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          Linking.openURL(appleMapsUrl).catch(() => {
            Linking.openURL(googleMapsUrl);
          });
        } else if (buttonIndex === 2) {
          Linking.openURL(googleMapsUrl);
        }
      }
    );
  } else {
    // On Android/Web, try to trigger Android's native chooser using geo scheme, fallback to web URL
    const androidUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;
    Alert.alert(
      "Open Maps",
      `Open location in map application?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Maps",
          onPress: () => {
            Linking.openURL(androidUrl).catch(() => {
              Linking.openURL(googleMapsUrl);
            });
          },
        },
      ]
    );
  }
}
