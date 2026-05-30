import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ProgressBar } from "@/components/ProgressBar";
import { TeamMember, MemberStatus } from "@/types";

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; icon: string }> = {
  active: { label: "Active", color: "#00e57d", icon: "checkmark-circle" },
  "at-risk": { label: "At Risk", color: "#fbbf24", icon: "warning" },
  inactive: { label: "Inactive", color: "#ef4444", icon: "alert-circle" },
};

const ROLE_LABELS = { admin: "Admin", leader: "Leader", sponsor: "Sponsor", member: "Member" };
const ROLE_COLORS = { admin: "#a855f7", leader: "#00d8fe", sponsor: "#ff6b35", member: "#6b7280" };

const FILTERS = ["All", "Active", "At Risk", "Inactive"] as const;
type Filter = typeof FILTERS[number];

function MemberCard({ member, unreadMessages, onPress }: { member: TeamMember; unreadMessages: number; onPress: () => void }) {
  const colors = useColors();
  const conf = STATUS_CONFIG[member.status];
  const roleColor = ROLE_COLORS[member.role];
  const completedToday = member.tasks.filter((t) => t.status === "completed").length;
  const overdueToday = member.tasks.filter((t) => t.status === "overdue").length;
  const isAtRisk = member.status === "at-risk" || member.status === "inactive";
  const pendingEvidence = member.evidence.filter((e) => e.status === "pending").length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.card, borderColor: isAtRisk ? conf.color + "55" : colors.border, borderLeftColor: conf.color }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "33", borderColor: roleColor + "55", borderWidth: 2 }]}>
          <Text style={[styles.initials, { color: roleColor }]}>{member.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[member.role]}</Text>
            </View>
            {unreadMessages > 0 && (
              <View style={[styles.msgBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.msgBadgeText}>{unreadMessages}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.statusChip, { backgroundColor: conf.color + "18" }]}>
              <Ionicons name={conf.icon as any} size={11} color={conf.color} />
              <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
            </View>
            <Text style={[styles.lastActive, { color: colors.mutedForeground }]}>{member.lastActive}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="flame" size={13} color="#ff6b35" />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{member.streak}d</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{member.completionRate}%</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>rate</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="list" size={13} color={colors.primary} />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{completedToday}/{member.tasks.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>today</Text>
        </View>
        {overdueToday > 0 && (
          <>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Ionicons name="alert-circle" size={13} color={colors.error} />
              <Text style={[styles.statVal, { color: colors.error }]}>{overdueToday} overdue</Text>
            </View>
          </>
        )}
        {pendingEvidence > 0 && (
          <>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Ionicons name="camera" size={13} color="#fbbf24" />
              <Text style={[styles.statVal, { color: "#fbbf24" }]}>{pendingEvidence} pending</Text>
            </View>
          </>
        )}
      </View>

      <ProgressBar
        progress={member.completionRate}
        height={5}
        color={member.completionRate >= 80 ? colors.success : member.completionRate >= 60 ? "#fbbf24" : colors.error}
      />

      <View style={styles.cardFooter}>
        <Text style={[styles.goalsSub, { color: colors.mutedForeground }]}>
          {member.goals.length} goal{member.goals.length !== 1 ? "s" : ""} · {member.goals.length > 0 ? Math.round(member.goals.reduce((a, g) => a + g.progress, 0) / member.goals.length) : 0}% avg
        </Text>
        <View style={styles.viewRow}>
          <Text style={[styles.viewText, { color: colors.primary }]}>Full Review</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TeamScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { teamMembers, teamMessages } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (currentUser?.role !== "leader" && currentUser?.role !== "admin") {
    return (
      <View style={[styles.locked, { backgroundColor: colors.background }]}>
        <View style={[styles.lockedIcon, { backgroundColor: colors.muted }]}>
          <Ionicons name="lock-closed" size={40} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Leader Access Only</Text>
        <Text style={[styles.lockedDesc, { color: colors.mutedForeground }]}>
          The Team Review page is restricted to Team Leaders only. Contact your leader for team updates.
        </Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={[styles.lockedBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.lockedBtnText, { color: colors.primaryForeground }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const visibleMembers = currentUser?.role === "admin"
    ? teamMembers
    : teamMembers.filter((m) => m.leaderId === currentUser?.id);

  const filtered =
    filter === "All" ? visibleMembers
    : filter === "Active" ? visibleMembers.filter((m) => m.status === "active")
    : filter === "At Risk" ? visibleMembers.filter((m) => m.status === "at-risk")
    : visibleMembers.filter((m) => m.status === "inactive");

  const activeCount = visibleMembers.filter((m) => m.status === "active").length;
  const atRiskCount = visibleMembers.filter((m) => m.status === "at-risk").length;
  const avgCompletion = visibleMembers.length > 0 ? Math.round(visibleMembers.reduce((a, m) => a + m.completionRate, 0) / visibleMembers.length) : 0;
  const pendingEvidenceTotal = visibleMembers.reduce((a, m) => a + m.evidence.filter((e) => e.status === "pending").length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={[styles.leaderBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.bannerIcon, { backgroundColor: colors.primary + "33" }]}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Team Leader View</Text>
                <Text style={styles.bannerSub}>Full access · review every member's tasks, goals, evidence & messages</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/team-report")} activeOpacity={0.8}
                style={[styles.reportBtn, { backgroundColor: colors.primary + "33" }]}>
                <Ionicons name="bar-chart-outline" size={15} color={colors.primary} />
                <Text style={[styles.reportBtnText, { color: colors.primary }]}>Report</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.overviewRow}>
              {[
                { label: "Members", value: visibleMembers.length, color: colors.primary },
                { label: "Active", value: activeCount, color: "#00e57d" },
                { label: "At Risk", value: atRiskCount, color: atRiskCount > 0 ? "#fbbf24" : "#00e57d" },
                { label: "Avg Done", value: `${avgCompletion}%`, color: colors.foreground },
              ].map((s) => (
                <View key={s.label} style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.overviewVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {pendingEvidenceTotal > 0 && (
              <View style={[styles.pendingAlert, { backgroundColor: "#fbbf2412", borderColor: "#fbbf2440" }]}>
                <Ionicons name="camera" size={15} color="#fbbf24" />
                <Text style={[styles.pendingText, { color: "#fbbf24" }]}>{pendingEvidenceTotal} evidence submission{pendingEvidenceTotal > 1 ? "s" : ""} waiting for your review</Text>
              </View>
            )}

            <View style={styles.filtersRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8}
                  style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.muted, borderColor: filter === f ? colors.primary : colors.border }]}>
                  <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            unreadMessages={(teamMessages[item.id] || []).length}
            onPress={() => router.push({ pathname: "/team-member", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No members found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  locked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  lockedIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  lockedTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  lockedDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  lockedBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  lockedBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  reportBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  leaderBanner: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
  bannerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  bannerSub: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular" },
  overviewRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  overviewCard: { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1, alignItems: "center", gap: 2 },
  overviewVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  overviewLbl: { fontSize: 10, fontFamily: "Inter_500Medium" },
  pendingAlert: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  pendingText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  filtersRow: { flexDirection: "row", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 17, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  memberName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  roleBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  msgBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  msgBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  lastActive: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, height: 14 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalsSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, gap: 10, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
