import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function PendingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isRejected = currentUser?.status === "rejected";

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 40, paddingBottom: botPad + 40 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isRejected ? "#ef444422" : colors.primary + "22" }]}>
        <Ionicons
          name={isRejected ? "close-circle" : "hourglass-outline"}
          size={56}
          color={isRejected ? "#ef4444" : colors.primary}
        />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        {isRejected ? "Application Not Approved" : "Application Under Review"}
      </Text>

      <Text style={[styles.desc, { color: colors.mutedForeground }]}>
        {isRejected
          ? "Unfortunately your application was not approved at this time. See the reason below."
          : "Your registration has been submitted and is waiting for admin approval. You'll be notified once your account is activated."}
      </Text>

      {/* User info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Name</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>{currentUser?.name ?? "—"}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>{currentUser?.email ?? "—"}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Ionicons name="ribbon-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Role</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {currentUser?.role === "leader" ? "Team Leader" : "Member"}
          </Text>
        </View>
        {currentUser?.leaderName && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Leader</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{currentUser.leaderName}</Text>
            </View>
          </>
        )}
        {currentUser?.sponsorName && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Ionicons name="person-add-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Sponsor</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{currentUser.sponsorName}</Text>
            </View>
          </>
        )}
      </View>

      {/* Status chip */}
      <View style={[styles.statusChip, {
        backgroundColor: isRejected ? "#ef444422" : "#fbbf2422",
        borderColor: isRejected ? "#ef444444" : "#fbbf2444",
      }]}>
        <Ionicons name={isRejected ? "close-circle" : "time-outline"} size={14} color={isRejected ? "#ef4444" : "#fbbf24"} />
        <Text style={[styles.statusText, { color: isRejected ? "#ef4444" : "#fbbf24" }]}>
          {isRejected ? "Not Approved" : "Pending Review"}
        </Text>
      </View>

      {/* Rejection reason */}
      {isRejected && currentUser?.rejectionReason && (
        <View style={[styles.rejectionBox, { backgroundColor: "#ef444412", borderColor: "#ef444433" }]}>
          <Ionicons name="information-circle-outline" size={16} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rejectionTitle, { color: "#ef4444" }]}>Reason</Text>
            <Text style={[styles.rejectionText, { color: "#ef4444" }]}>{currentUser.rejectionReason}</Text>
          </View>
        </View>
      )}

      {/* What happens next */}
      {!isRejected && (
        <View style={[styles.nextSteps, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.nextTitle, { color: colors.foreground }]}>What happens next?</Text>
          {[
            { icon: "checkmark-circle-outline", text: "Admins have been notified of your application", color: colors.success },
            { icon: "shield-checkmark-outline", text: "An admin will review your details shortly", color: colors.primary },
            { icon: "notifications-outline", text: "You'll get access as soon as you're approved", color: "#fbbf24" },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Ionicons name={step.icon as any} size={18} color={step.color} />
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step.text}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}
        style={[styles.logoutBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
        <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>
          {isRejected ? "Try a Different Account" : "Sign Out"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, gap: 20 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, maxWidth: 320 },
  infoCard: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 60 },
  infoValue: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rejectionBox: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  rejectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 3 },
  rejectionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  nextSteps: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  nextTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 14 },
  logoutText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
