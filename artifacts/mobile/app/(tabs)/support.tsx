import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/components/PrimaryButton";
import { FormInput } from "@/components/TextInput";

const FAQ_ITEMS = [
  {
    question: "How do I track my driver?",
    answer:
      "Once your driver is assigned and en route, open your active ride and tap 'Track Live' to view your driver's real-time location on the map.",
  },
  {
    question: "When will my driver be assigned?",
    answer:
      "Our dispatch team reviews every booking and assigns a driver and vehicle based on your pickup time and requirements. You'll receive a notification as soon as your driver is assigned.",
  },
  {
    question: "Can I choose my driver?",
    answer:
      "Atlanta Ride Share is a managed dispatch service. Our team selects the best driver and vehicle for your booking based on availability and requirements.",
  },
  {
    question: "What vehicles are available?",
    answer:
      "Our fleet includes luxury sedans (Mercedes-Benz S-Class, BMW 7 Series) and SUVs (Cadillac Escalade, Lincoln Navigator). Your dispatch team selects the right vehicle.",
  },
  {
    question: "How do I cancel a booking?",
    answer:
      "You can cancel from the ride detail screen. Please note our cancellation policy: cancellations within 2 hours of pickup may incur a fee.",
  },
  {
    question: "What is the estimated fare?",
    answer:
      "Fare estimates are shown during booking. Final pricing depends on actual distance and time. Corporate and account customers may have fixed pricing.",
  },
];

function FAQItem({ item }: { item: (typeof FAQ_ITEMS)[0] }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.75}
    >
      <View style={styles.faqRow}>
        <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{item.question}</Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>
      {expanded && (
        <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [issueText, setIssueText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const handleDispatch = () => {
    Linking.openURL("tel:+14045550100").catch(() => {
      Alert.alert("Contact Dispatch", "Call us at +1 (404) 555-0100 for immediate assistance.");
    });
  };

  const handleEmail = () => {
    Linking.openURL("mailto:dispatch@vantagerides.com").catch(() => {
      Alert.alert("Email Support", "Reach us at dispatch@vantagerides.com");
    });
  };

  const handleSubmitIssue = async () => {
    if (!issueText.trim()) {
      Alert.alert("Required", "Please describe your issue.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setIssueText("");
    Alert.alert(
      "Issue Reported",
      "Your report has been received. Our support team will follow up within 2 hours.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 16, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Support</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Contact our dispatch team or find answers to common questions.
      </Text>

      {/* Primary Contact */}
      <View style={[styles.dispatchCard, { backgroundColor: colors.navy }]}>
        <View style={styles.dispatchTop}>
          <View style={[styles.dispatchIcon, { backgroundColor: colors.gold + "30" }]}>
            <Feather name="radio" size={24} color={colors.gold} />
          </View>
          <View style={styles.dispatchText}>
            <Text style={styles.dispatchTitle}>Contact Dispatch</Text>
            <Text style={styles.dispatchSub}>Available 24/7 for your journey</Text>
          </View>
        </View>
        <View style={styles.dispatchBtns}>
          <TouchableOpacity
            style={[styles.dispatchBtn, { backgroundColor: colors.gold }]}
            onPress={handleDispatch}
            activeOpacity={0.8}
          >
            <Feather name="phone" size={16} color="#fff" />
            <Text style={styles.dispatchBtnText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dispatchBtn, { backgroundColor: "rgba(255,255,255,0.1)" }]}
            onPress={handleEmail}
            activeOpacity={0.8}
          >
            <Feather name="mail" size={16} color="#fff" />
            <Text style={styles.dispatchBtnText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick support options */}
      <View style={styles.optionsGrid}>
        {[
          { icon: "message-circle", label: "Ride Issue", sub: "Problem with a ride" },
          { icon: "file-text", label: "Booking Help", sub: "Change or modify" },
          { icon: "shield", label: "Safety Report", sub: "Report an incident" },
          { icon: "credit-card", label: "Billing", sub: "Payment questions" },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(opt.label, "Please call dispatch or use the contact form below.")
            }
          >
            <Feather name={opt.icon as any} size={22} color={colors.gold} />
            <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
            <Text style={[styles.optSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Report an Issue */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Report an Issue</Text>
        <View
          style={[
            styles.textArea,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FormInput
            value={issueText}
            onChangeText={setIssueText}
            multiline
            numberOfLines={5}
            placeholder="Describe your issue in detail — include your booking ID if applicable..."
            containerStyle={{ flex: 1 }}
          />
        </View>
        <PrimaryButton
          title={submitting ? "Submitting..." : "Submit Report"}
          onPress={handleSubmitIssue}
          loading={submitting}
        />
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Frequently Asked Questions
        </Text>
        {FAQ_ITEMS.map((item) => (
          <FAQItem key={item.question} item={item} />
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Atlanta Ride Share
        </Text>
        <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>
          24/7 Dispatch: +1 (404) 555-0100
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: -12,
  },
  dispatchCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  dispatchTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dispatchIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  dispatchText: {
    flex: 1,
  },
  dispatchTitle: {
    fontSize: 17,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  dispatchSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  dispatchBtns: {
    flexDirection: "row",
    gap: 10,
  },
  dispatchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dispatchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  optLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  optSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    padding: 4,
  },
  faqItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  faqQ: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  faqA: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  footerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
