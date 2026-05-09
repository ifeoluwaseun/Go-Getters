import React, { useMemo, useState } from "react";
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

function MemberCard({ member, onPress }: { member: TeamMember; onPress: () => void }) {
  const colors = useColors();
  const conf = STATUS_CONFIG[member.status];
  const roleColor = ROLE_COLORS[member.role];
  const todayTasks = member.tasks;
  const completedToday = todayTasks.filter((t) => t.status === "completed").length;
  const overdueToday = todayTasks.filter((t) => t.status === "overdue").length;
  const isAtRisk = member.status === "at-risk" || member.status === "inactive";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isAtRisk ? conf.color + "55" : colors.border,
          borderLeftColor: conf.color,
        },
      ]}
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
          <Ionicons name="flame" size={13} color={colors.streak} />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{member.streak}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>streak</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{member.completionRate}%</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>done</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="list" size={13} color={colors.primary} />
          <Text style={[styles.statVal, { color: colors.foreground }]}>{completedToday}/{todayTasks.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>today</Text>
        </View>
        {overdueToday > 0 && (
          <>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Ionicons name="alert-circle" size={13} color={colors.error} />
              <Text style={[styles.statVal, { color: colors.error }]}>{overdueToday}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>overdue</Text>
            </View>
          </>
        )}
      </View>

      <ProgressBar progress={member.completionRate} height={5} color={member.completionRate >= 80 ? colors.success : member.completionRate >= 60 ? colors.warning : colors.error} />

      <View style={styles.cardFooter}>
        <View style={styles.goalsRow}>
          <Ionicons name="flag-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.goalsText, { color: colors.mutedForeground }]}>{member.goals.length} goals · {member.goals.reduce((a, g) => a + g.progress, 0) / Math.max(member.goals.length, 1) | 0}% avg</Text>
        </View>
        <View style={styles.viewRow}>
          <Text style={[styles.viewText, { color: colors.primary }]}>View</Text>
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
  const { teamMembers } = useApp();
  const [filter, setFilter] = useState<Filter>("All");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const visibleMembers = useMemo(() => {
    const role = currentUser?.role;
    const id = currentUser?.id;
    if (role === "admin") return teamMembers;
    if (role === "leader") return teamMembers.filter((m) => m.sponsorId === id || m.role !== "admin");
    if (role === "sponsor") return teamMembers.filter((m) => m.sponsorId === id);
    return [];
  }, [teamMembers, currentUser]);

  const filtered = useMemo(() => {
    if (filter === "All") return visibleMembers;
    if (filter === "Active") return visibleMembers.filter((m) => m.status === "active");
    if (filter === "At Risk") return visibleMembers.filter((m) => m.status === "at-risk");
    if (filter === "Inactive") return visibleMembers.filter((m) => m.status === "inactive");
    return visibleMembers;
  }, [visibleMembers, filter]);

  const activeCount = visibleMembers.filter((m) => m.status === "active").length;
  const atRiskCount = visibleMembers.filter((m) => m.status === "at-risk").length;
  const avgCompletion = visibleMembers.length > 0 ? Math.round(visibleMembers.reduce((a, m) => a + m.completionRate, 0) / visibleMembers.length) : 0;

  const roleTitle = currentUser?.role === "sponsor" ? "My Recruits" : currentUser?.role === "leader" ? "My Team" : "All Members";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Role context banner */}
            <View style={[styles.contextBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.bannerIcon, { backgroundColor: colors.primary + "33" }]}>
                <Ionicons name={currentUser?.role === "sponsor" ? "person-add" : "people"} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{roleTitle}</Text>
                <Text style={styles.bannerSub}>
                  {currentUser?.role === "sponsor"
                    ? "People you directly brought into the team"
                    : currentUser?.role === "leader"
                    ? "Review your team members' tasks, goals & evidence"
                    : "Full organization view — all members"}
                </Text>
              </View>
            </View>

            {/* Overview stats */}
            <View style={styles.overviewRow}>
              <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.overviewVal, { color: colors.primary }]}>{visibleMembers.length}</Text>
                <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Members</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.overviewVal, { color: colors.success }]}>{activeCount}</Text>
                <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.overviewVal, { color: atRiskCount > 0 ? colors.warning : colors.success }]}>{atRiskCount}</Text>
                <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>At Risk</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.overviewVal, { color: colors.foreground }]}>{avgCompletion}%</Text>
                <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Avg Done</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8} style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.muted, borderColor: filter === f ? colors.primary : colors.border }]}>
                  <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPress={() => router.push({ pathname: "/team-member", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No members found</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {filter !== "All" ? `No ${filter.toLowerCase()} members` : "Your team members will appear here"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contextBanner: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 14 },
  bannerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  bannerSub: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  overviewRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  overviewCard: { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1, alignItems: "center", gap: 2 },
  overviewVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  overviewLbl: { fontSize: 10, fontFamily: "Inter_500Medium" },
  filtersRow: { flexDirection: "row", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  filterChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 17, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  memberName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  roleBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  lastActive: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, height: 14 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  goalsText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, gap: 10, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
