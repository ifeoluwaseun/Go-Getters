import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import { MemberStatus, TaskStatus } from "@/types";

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; icon: string }> = {
  active: { label: "Active", color: "#00e57d", icon: "checkmark-circle" },
  "at-risk": { label: "At Risk", color: "#fbbf24", icon: "warning" },
  inactive: { label: "Inactive", color: "#ef4444", icon: "alert-circle" },
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { color: string; icon: string }> = {
  completed: { color: "#00e57d", icon: "checkmark-circle" },
  pending: { color: "#fbbf24", icon: "time-outline" },
  overdue: { color: "#ef4444", icon: "alert-circle" },
  skipped: { color: "#6b7280", icon: "close-circle-outline" },
};

const EVIDENCE_STATUS: Record<string, { color: string; label: string }> = {
  approved: { color: "#00e57d", label: "Approved" },
  pending: { color: "#fbbf24", label: "Pending" },
  rejected: { color: "#ef4444", label: "Rejected" },
};

const PRIORITY_COLORS = { high: "#ef4444", medium: "#fbbf24", low: "#6b7280" };
const ROLE_COLORS = { admin: "#a855f7", leader: "#00d8fe", sponsor: "#ff6b35", member: "#6b7280" };
const ROLE_LABELS = { admin: "Admin", leader: "Leader", sponsor: "Sponsor", member: "Member" };

const TABS = ["Overview", "Tasks", "Goals", "Evidence"] as const;
type Tab = typeof TABS[number];

export default function TeamMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { teamMembers } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const member = teamMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Ionicons name="person-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Member not found</Text>
      </View>
    );
  }

  const statusConf = STATUS_CONFIG[member.status];
  const roleColor = ROLE_COLORS[member.role];
  const completedTasks = member.tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = member.tasks.filter((t) => t.status === "overdue").length;
  const pendingEvidence = member.evidence.filter((e) => e.status === "pending").length;
  const avgGoalProgress = member.goals.length > 0 ? Math.round(member.goals.reduce((a, g) => a + g.progress, 0) / member.goals.length) : 0;

  function handleSendReminder() {
    Alert.alert("Reminder Sent", `A gentle accountability reminder has been sent to ${member.name}.`);
  }

  function handleScheduleCall() {
    Alert.alert("Support Call", `A support call request has been sent to ${member.name}. They'll receive a calendar invite.`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Member Hero */}
      <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.heroAvatar, { backgroundColor: roleColor + "33", borderColor: roleColor + "55", borderWidth: 2 }]}>
          <Text style={[styles.heroInitials, { color: roleColor }]}>{member.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{member.name}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[member.role]}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConf.color + "22" }]}>
              <Ionicons name={statusConf.icon as any} size={11} color={statusConf.color} />
              <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
            </View>
          </View>
          <Text style={[styles.heroEmail, { color: colors.mutedForeground }]}>{member.email}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]} onPress={handleSendReminder} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Send Reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "44" }]} onPress={handleScheduleCall} activeOpacity={0.8}>
          <Ionicons name="call-outline" size={16} color={colors.warning} />
          <Text style={[styles.actionText, { color: colors.warning }]}>Schedule Call</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const badge = tab === "Tasks" && overdueTasks > 0 ? overdueTasks : tab === "Evidence" && pendingEvidence > 0 ? pendingEvidence : null;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8} style={[styles.tab, { borderBottomColor: activeTab === tab ? colors.primary : "transparent", borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>{tab}</Text>
              {badge !== null && <View style={[styles.tabBadge, { backgroundColor: colors.error }]}><Text style={styles.tabBadgeText}>{badge}</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
        {activeTab === "Overview" && (
          <>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {[
                { label: "Streak", value: `${member.streak}d`, icon: "flame", color: "#ff6b35" },
                { label: "Points", value: member.points.toLocaleString(), icon: "star", color: "#fbbf24" },
                { label: "Completion", value: `${member.completionRate}%`, icon: "checkmark-circle", color: colors.success },
                { label: "Consistency", value: `${member.consistency}%`, icon: "trending-up", color: colors.primary },
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

            {/* Progress bars */}
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ProgressBar progress={member.completionRate} label="Task Completion Rate" showLabel color={member.completionRate >= 80 ? colors.success : colors.warning} />
              <ProgressBar progress={member.consistency} label="Consistency Score" showLabel color={colors.primary} />
              <ProgressBar progress={avgGoalProgress} label="Goal Progress (avg)" showLabel color="#a855f7" />
            </View>

            {/* Today's summary */}
            <View style={[styles.todaySummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Today's Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: colors.success }]}>{completedTasks}</Text>
                  <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Completed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: colors.warning }]}>{member.tasks.filter((t) => t.status === "pending").length}</Text>
                  <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Pending</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: colors.error }]}>{overdueTasks}</Text>
                  <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Overdue</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: "#a855f7" }]}>{member.goals.length}</Text>
                  <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Goals</Text>
                </View>
              </View>
            </View>

            {/* Last active */}
            <View style={[styles.lastActiveCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={15} color={colors.mutedForeground} />
              <Text style={[styles.lastActiveText, { color: colors.mutedForeground }]}>Last active: <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{member.lastActive}</Text></Text>
            </View>
          </>
        )}

        {activeTab === "Tasks" && (
          <>
            {member.tasks.length === 0 ? (
              <EmptyState icon="list-outline" text="No tasks assigned" />
            ) : (
              <>
                {overdueTasks > 0 && (
                  <View style={[styles.alertBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "33" }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={[styles.alertText, { color: colors.error }]}>{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""} — consider reaching out to help.</Text>
                  </View>
                )}
                {member.tasks.map((task) => {
                  const conf = TASK_STATUS_CONFIG[task.status];
                  return (
                    <View key={task.id} style={[styles.taskRow, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
                      <Ionicons name={conf.icon as any} size={18} color={conf.color} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
                        <View style={styles.taskMeta}>
                          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                          <Text style={[styles.taskMetaText, { color: colors.mutedForeground }]}>{task.category}</Text>
                          {task.dueTime && <Text style={[styles.taskMetaText, { color: colors.mutedForeground }]}>· {task.dueTime}</Text>}
                          {task.hasEvidence && <Ionicons name="camera" size={11} color={colors.primary} />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {activeTab === "Goals" && (
          <>
            {member.goals.length === 0 ? (
              <EmptyState icon="flag-outline" text="No goals set this week" />
            ) : (
              member.goals.map((goal) => (
                <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: goal.color }]}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                    <Text style={[styles.goalTitle, { color: colors.foreground }]}>{goal.title}</Text>
                    <Text style={[styles.goalPct, { color: goal.color }]}>{goal.progress}%</Text>
                  </View>
                  <Text style={[styles.goalDesc, { color: colors.mutedForeground }]}>{goal.description}</Text>
                  <ProgressBar progress={goal.progress} height={6} color={goal.color} />
                  <Text style={[styles.goalCategory, { color: colors.mutedForeground }]}>{goal.category}</Text>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "Evidence" && (
          <>
            {member.evidence.length === 0 ? (
              <EmptyState icon="camera-outline" text="No evidence submitted" />
            ) : (
              member.evidence.map((ev) => {
                const conf = EVIDENCE_STATUS[ev.status];
                return (
                  <View key={ev.id} style={[styles.evCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
                    <View style={styles.evHeader}>
                      <View style={[styles.evIcon, { backgroundColor: conf.color + "22" }]}>
                        <Ionicons name="camera" size={15} color={conf.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.evTask, { color: colors.foreground }]} numberOfLines={1}>{ev.taskTitle}</Text>
                        <Text style={[styles.evTime, { color: colors.mutedForeground }]}>{new Date(ev.uploadedAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={[styles.evStatusChip, { backgroundColor: conf.color + "22" }]}>
                        <Text style={[styles.evStatusText, { color: conf.color }]}>{conf.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.evDesc, { color: colors.mutedForeground }]}>{ev.description}</Text>
                    {ev.feedback && (
                      <View style={[styles.feedbackRow, { backgroundColor: colors.error + "12", borderColor: colors.error + "33" }]}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.error} />
                        <Text style={[styles.feedbackText, { color: colors.error }]}>{ev.feedback}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={36} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  hero: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14, borderBottomWidth: 1 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  heroInitials: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroMeta: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  roleText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heroEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionBar: { flexDirection: "row", gap: 10, padding: 12, borderBottomWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14, flexDirection: "row", justifyContent: "center", gap: 4 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 14, marginBottom: 14 },
  todaySummary: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 14 },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 14 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  lastActiveCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  lastActiveText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  alertBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  alertText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 12, marginBottom: 8 },
  taskTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  priorityDot: { width: 7, height: 7, borderRadius: 3.5 },
  taskMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  goalCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 8 },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  goalPct: { fontSize: 15, fontFamily: "Inter_700Bold" },
  goalDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  goalCategory: { fontSize: 11, fontFamily: "Inter_500Medium" },
  evCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14, marginBottom: 10, gap: 8 },
  evHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  evIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  evTask: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  evTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  evStatusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  evStatusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  evDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  feedbackRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, borderRadius: 8, borderWidth: 1, padding: 8 },
  feedbackText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  emptyState: { borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
