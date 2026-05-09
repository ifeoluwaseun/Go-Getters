import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import { Evidence } from "@/types";

const INACTIVE_USERS = [
  { id: "u10", name: "Jake M.", lastSeen: "3 days ago", missedTasks: 8, consistency: 32 },
  { id: "u11", name: "Olivia R.", lastSeen: "2 days ago", missedTasks: 5, consistency: 45 },
  { id: "u12", name: "Tyler B.", lastSeen: "5 days ago", missedTasks: 12, consistency: 18 },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, evidence, leaderboard, approveEvidence, rejectEvidence } = useApp();
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "compliance">("overview");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalUsers = leaderboard.length + INACTIVE_USERS.length;
  const activeUsers = leaderboard.length;
  const avgCompletion = Math.round(leaderboard.reduce((a, u) => a + u.completionRate, 0) / leaderboard.length);
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingEvidence = evidence.filter((e) => e.status === "pending");

  function handleApprove(id: string) {
    Alert.alert("Approve Evidence", "Approve this submission?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveEvidence(id) },
    ]);
  }

  function handleReject(id: string) {
    Alert.alert("Reject Evidence", "Reject with feedback: 'Please provide clearer proof of completion.'", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => rejectEvidence(id, "Please provide clearer proof of completion.") },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Admin Banner */}
      <View style={[styles.adminBanner, { backgroundColor: colors.secondary }]}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.adminText}>Admin Dashboard — Full Access</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {(["overview", "evidence", "compliance"] as const).map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8} style={[styles.tab, { borderBottomColor: activeTab === tab ? colors.primary : "transparent", borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "overview" ? "Overview" : tab === "evidence" ? `Evidence${pendingEvidence.length > 0 ? ` (${pendingEvidence.length})` : ""}` : "Compliance"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              {[
                { label: "Total Users", value: totalUsers, icon: "people", color: colors.primary },
                { label: "Active Today", value: activeUsers, icon: "pulse", color: colors.success },
                { label: "Avg Completion", value: `${avgCompletion}%`, icon: "trending-up", color: "#fbbf24" },
                { label: "Tasks Done", value: completedTasks, icon: "checkmark-circle", color: "#a855f7" },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + "22" }]}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Team Performance</Text>
            {leaderboard.slice(0, 5).map((user) => (
              <View key={user.id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primary + "33" }]}>
                  <Text style={[styles.userInitials, { color: colors.primary }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                  <ProgressBar progress={user.completionRate} height={5} color={user.completionRate >= 80 ? colors.success : user.completionRate >= 50 ? colors.warning : colors.error} />
                </View>
                <Text style={[styles.userPct, { color: colors.foreground }]}>{user.completionRate}%</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "evidence" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Pending Review</Text>
            {pendingEvidence.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All evidence reviewed</Text>
              </View>
            ) : (
              pendingEvidence.map((ev: Evidence) => (
                <View key={ev.id} style={[styles.evCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.evHeader}>
                    <View style={[styles.evIcon, { backgroundColor: colors.warning + "22" }]}>
                      <Ionicons name="time" size={16} color={colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.evTask, { color: colors.foreground }]} numberOfLines={1}>{ev.taskTitle}</Text>
                      <Text style={[styles.evUser, { color: colors.mutedForeground }]}>By {ev.userName}</Text>
                    </View>
                  </View>
                  <Text style={[styles.evDesc, { color: colors.mutedForeground }]}>{ev.description}</Text>
                  <View style={styles.evActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + "18", borderColor: colors.error + "44" }]} onPress={() => handleReject(ev.id)} activeOpacity={0.8}>
                      <Ionicons name="close" size={16} color={colors.error} />
                      <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]} onPress={() => handleApprove(ev.id)} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "compliance" && (
          <>
            <View style={[styles.complianceOverview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.compTitle, { color: colors.foreground }]}>Daily Compliance Check</Text>
              <Text style={[styles.compSub, { color: colors.mutedForeground }]}>Runs every day at 11:00 AM. Detects users who did not update goals or complete tasks.</Text>
              <View style={styles.compStats}>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.success }]}>{activeUsers}</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Compliant</Text>
                </View>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.error }]}>{INACTIVE_USERS.length}</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Inactive</Text>
                </View>
                <View style={styles.compStat}>
                  <Text style={[styles.compStatVal, { color: colors.foreground }]}>{Math.round((activeUsers / totalUsers) * 100)}%</Text>
                  <Text style={[styles.compStatLbl, { color: colors.mutedForeground }]}>Rate</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Inactive Users — Action Required</Text>
            {INACTIVE_USERS.map((user) => (
              <View key={user.id} style={[styles.inactiveCard, { backgroundColor: colors.card, borderColor: colors.error + "44", borderLeftColor: colors.error }]}>
                <View style={styles.inactiveHeader}>
                  <View style={[styles.userAvatar, { backgroundColor: colors.error + "22" }]}>
                    <Text style={[styles.userInitials, { color: colors.error }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                    <Text style={[styles.lastSeen, { color: colors.mutedForeground }]}>Last seen: {user.lastSeen}</Text>
                  </View>
                  <View style={[styles.consistencyBadge, { backgroundColor: colors.error + "22" }]}>
                    <Text style={[styles.consistencyText, { color: colors.error }]}>{user.consistency}%</Text>
                  </View>
                </View>
                <Text style={[styles.missedText, { color: colors.mutedForeground }]}>{user.missedTasks} tasks missed this week</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.warning + "22", borderColor: colors.warning + "44" }]} activeOpacity={0.8}>
                    <Ionicons name="notifications" size={13} color={colors.warning} />
                    <Text style={[styles.smallBtnText, { color: colors.warning }]}>Send Reminder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.error + "22", borderColor: colors.error + "44" }]} activeOpacity={0.8}>
                    <Ionicons name="call" size={13} color={colors.error} />
                    <Text style={[styles.smallBtnText, { color: colors.error }]}>Trigger Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  adminBanner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  adminText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabsRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 12, marginBottom: 8 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  userInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  userPct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  empty: { borderRadius: 14, padding: 32, borderWidth: 1, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  evCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  evHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  evIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  evTask: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  evUser: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  evDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  evActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  complianceOverview: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 10 },
  compTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  compSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  compStats: { flexDirection: "row", justifyContent: "space-around" },
  compStat: { alignItems: "center", gap: 4 },
  compStatVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  compStatLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inactiveCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 8 },
  inactiveHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  lastSeen: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  consistencyBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  consistencyText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  missedText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10 },
  smallBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingVertical: 8 },
  smallBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
