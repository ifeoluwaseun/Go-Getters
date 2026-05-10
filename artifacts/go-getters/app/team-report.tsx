import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ProgressBar } from "@/components/ProgressBar";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(sun)}, ${now.getFullYear()}`;
}

const STATUS_COLORS = { active: "#00e57d", "at-risk": "#fbbf24", inactive: "#ef4444" };

export default function TeamReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { teamMembers, evidence } = useApp();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const activeMembers = teamMembers.filter((m) => m.status === "active");
  const atRiskMembers = teamMembers.filter((m) => m.status === "at-risk");
  const inactiveMembers = teamMembers.filter((m) => m.status === "inactive");
  const avgCompletion = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((a, m) => a + m.completionRate, 0) / teamMembers.length)
    : 0;
  const avgStreak = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((a, m) => a + m.streak, 0) / teamMembers.length)
    : 0;
  const totalTasksCompleted = teamMembers.reduce((a, m) => a + m.tasks.filter((t) => t.status === "completed").length, 0);
  const totalTasksOverdue = teamMembers.reduce((a, m) => a + m.tasks.filter((t) => t.status === "overdue").length, 0);
  const pendingEvidenceCount = teamMembers.reduce((a, m) => a + m.evidence.filter((e) => e.status === "pending").length, 0);
  const totalGoals = teamMembers.reduce((a, m) => a + m.goals.length, 0);
  const avgGoalProgress = totalGoals > 0
    ? Math.round(teamMembers.reduce((a, m) => a + m.goals.reduce((b, g) => b + g.progress, 0), 0) / totalGoals)
    : 0;

  const sorted = [...teamMembers].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Week header */}
      <View style={[styles.weekHeader, { backgroundColor: colors.secondary }]}>
        <View style={[styles.weekIcon, { backgroundColor: colors.primary + "33" }]}>
          <Ionicons name="bar-chart" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.weekLabel}>Weekly Team Report</Text>
          <Text style={styles.weekRange}>{getWeekRange()}</Text>
        </View>
      </View>

      {/* High-level stats */}
      <View style={styles.statsGrid}>
        {[
          { label: "Team Size", value: teamMembers.length, icon: "people", color: colors.primary },
          { label: "Avg Completion", value: `${avgCompletion}%`, icon: "checkmark-circle", color: avgCompletion >= 80 ? "#00e57d" : avgCompletion >= 60 ? "#fbbf24" : "#ef4444" },
          { label: "Avg Streak", value: `${avgStreak}d`, icon: "flame", color: "#ff6b35" },
          { label: "Avg Goal", value: `${avgGoalProgress}%`, icon: "flag", color: "#a855f7" },
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

      {/* Activity snapshot */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Activity Snapshot</Text>
        <View style={styles.snapshotRow}>
          {[
            { val: totalTasksCompleted, label: "Tasks Done", color: "#00e57d", icon: "checkmark-circle" },
            { val: totalTasksOverdue, label: "Overdue", color: "#ef4444", icon: "alert-circle" },
            { val: pendingEvidenceCount, label: "Evidence Pending", color: "#fbbf24", icon: "camera" },
            { val: totalGoals, label: "Active Goals", color: "#a855f7", icon: "flag" },
          ].map((s) => (
            <View key={s.label} style={styles.snapshotItem}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.snapshotVal, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.snapshotLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Status distribution */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Member Status Distribution</Text>
        {[
          { label: "Active", count: activeMembers.length, color: "#00e57d", icon: "checkmark-circle" },
          { label: "At Risk", count: atRiskMembers.length, color: "#fbbf24", icon: "warning" },
          { label: "Inactive", count: inactiveMembers.length, color: "#ef4444", icon: "alert-circle" },
        ].map((row) => (
          <View key={row.label} style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Ionicons name={row.icon as any} size={14} color={row.color} />
              <Text style={[styles.statusLabel, { color: colors.foreground }]}>{row.label}</Text>
            </View>
            <ProgressBar
              progress={teamMembers.length > 0 ? (row.count / teamMembers.length) * 100 : 0}
              height={8}
              color={row.color}
            />
            <Text style={[styles.statusCount, { color: row.color }]}>{row.count}</Text>
          </View>
        ))}
      </View>

      {/* At-risk alerts */}
      {atRiskMembers.length > 0 && (
        <View style={[styles.section, { backgroundColor: "#fbbf2412", borderColor: "#fbbf2433" }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="warning" size={16} color="#fbbf24" />
            <Text style={[styles.sectionTitle, { color: "#fbbf24" }]}>Attention Required</Text>
          </View>
          {atRiskMembers.map((m) => {
            const overdue = m.tasks.filter((t) => t.status === "overdue").length;
            return (
              <View key={m.id} style={[styles.alertMemberRow, { borderTopColor: "#fbbf2433" }]}>
                <View style={[styles.alertAvatar, { backgroundColor: "#fbbf2422" }]}>
                  <Text style={[styles.alertInitials, { color: "#fbbf24" }]}>{m.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertName, { color: colors.foreground }]}>{m.name}</Text>
                  <Text style={[styles.alertDetail, { color: colors.mutedForeground }]}>
                    {overdue > 0 ? `${overdue} overdue task${overdue > 1 ? "s" : ""} · ` : ""}{m.streak}d streak · {m.completionRate}% rate
                  </Text>
                </View>
                <View style={[styles.alertBadge, { backgroundColor: "#fbbf2422" }]}>
                  <Text style={[styles.alertBadgeText, { color: "#fbbf24" }]}>{m.completionRate}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Member leaderboard */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Member Performance Ranking</Text>
        {sorted.map((m, i) => {
          const statusColor = STATUS_COLORS[m.status];
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return (
            <View key={m.id} style={[styles.rankRow, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}]}>
              <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>{medal}</Text>
              <View style={[styles.rankAvatar, { backgroundColor: statusColor + "22" }]}>
                <Text style={[styles.rankInitials, { color: statusColor }]}>{m.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, { color: colors.foreground }]}>{m.name}</Text>
                <View style={styles.rankMeta}>
                  <Ionicons name="flame" size={11} color="#ff6b35" />
                  <Text style={[styles.rankMetaText, { color: colors.mutedForeground }]}>{m.streak}d</Text>
                  <Text style={[styles.rankMetaText, { color: colors.mutedForeground }]}>·</Text>
                  <Text style={[styles.rankMetaText, { color: colors.mutedForeground }]}>{m.tasks.filter(t => t.status === "completed").length}/{m.tasks.length} tasks</Text>
                </View>
                <ProgressBar progress={m.completionRate} height={5} color={m.completionRate >= 80 ? "#00e57d" : m.completionRate >= 60 ? "#fbbf24" : "#ef4444"} />
              </View>
              <Text style={[styles.rankPct, { color: m.completionRate >= 80 ? "#00e57d" : m.completionRate >= 60 ? "#fbbf24" : "#ef4444" }]}>{m.completionRate}%</Text>
            </View>
          );
        })}
      </View>

      {/* Evidence pending */}
      {pendingEvidenceCount > 0 && (
        <View style={[styles.section, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="camera" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Evidence Awaiting Review</Text>
          </View>
          <Text style={[styles.evidenceSub, { color: colors.mutedForeground }]}>
            {pendingEvidenceCount} submission{pendingEvidenceCount > 1 ? "s" : ""} from your team are waiting for your approval. Review them in each member's Evidence tab.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  weekHeader: { borderRadius: 16, padding: 16, flexDirection: "row", gap: 14, alignItems: "center" },
  weekIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  weekLabel: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  weekRange: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  snapshotRow: { flexDirection: "row", justifyContent: "space-around" },
  snapshotItem: { alignItems: "center", gap: 4 },
  snapshotVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  snapshotLbl: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 5, width: 70 },
  statusLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  statusCount: { fontSize: 14, fontFamily: "Inter_700Bold", width: 24, textAlign: "right" },
  alertMemberRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  alertAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  alertInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  alertName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  alertDetail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  alertBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  alertBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  rankNum: { fontSize: 14, fontFamily: "Inter_700Bold", width: 28 },
  rankAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  rankInitials: { fontSize: 12, fontFamily: "Inter_700Bold" },
  rankName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  rankMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  rankMetaText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  rankPct: { fontSize: 15, fontFamily: "Inter_700Bold", width: 44, textAlign: "right" },
  evidenceSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
