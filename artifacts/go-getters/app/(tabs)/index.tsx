import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskCard } from "@/components/TaskCard";
import { StreakBadge } from "@/components/StreakBadge";

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Push yourself, because no one else is going to do it for you.",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { tasks, meetings, achievers, leaderboard, unreadCount, completeTask } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === new Date().toISOString().split("T")[0]), [tasks]);
  const completedToday = todayTasks.filter((t) => t.status === "completed").length;
  const pendingToday = todayTasks.filter((t) => t.status === "pending").length;
  const overdueToday = todayTasks.filter((t) => t.status === "overdue").length;
  const progressPct = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;
  const shownTasks = todayTasks.filter((t) => t.status !== "completed").slice(0, 3);
  const nextMeeting = meetings[0];
  const topAchiever = achievers[0];
  const top3 = leaderboard.slice(0, 3);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const firstName = currentUser?.name?.split(" ")[0] ?? "Go-Getter";

  function progressColor() {
    if (progressPct >= 80) return colors.success;
    if (progressPct >= 50) return colors.primary;
    return colors.warning;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background, paddingHorizontal: 20 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: colors.error }]}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/admin")} style={[styles.avatar, { backgroundColor: colors.primary + "33" }]} activeOpacity={0.8}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{firstName.slice(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Today's Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Progress</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</Text>
            </View>
            <Text style={[styles.progressPct, { color: progressColor() }]}>{progressPct}%</Text>
          </View>
          <ProgressBar progress={progressPct} color={progressColor()} height={10} />
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <View style={[styles.statDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statNum, { color: colors.foreground }]}>{completedToday}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Done</Text>
            </View>
            <View style={styles.progressStat}>
              <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.statNum, { color: colors.foreground }]}>{pendingToday}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Pending</Text>
            </View>
            {overdueToday > 0 && (
              <View style={styles.progressStat}>
                <View style={[styles.statDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.statNum, { color: colors.foreground }]}>{overdueToday}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Overdue</Text>
              </View>
            )}
          </View>
        </View>

        {/* Weekly Momentum */}
        <View style={styles.momentumRow}>
          <StreakBadge count={currentUser?.streak ?? 0} size="md" />
          <View style={[styles.momentumCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.momentumVal, { color: colors.primary }]}>{currentUser?.consistency ?? 0}%</Text>
            <Text style={[styles.momentumLbl, { color: colors.mutedForeground }]}>Consistency</Text>
          </View>
          <View style={[styles.momentumCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.momentumVal, { color: colors.success }]}>{currentUser?.completionRate ?? 0}%</Text>
            <Text style={[styles.momentumLbl, { color: colors.mutedForeground }]}>Completion</Text>
          </View>
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")} activeOpacity={0.7}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {shownTasks.length === 0 ? (
            <View style={[styles.emptyTasks, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All tasks completed!</Text>
            </View>
          ) : (
            shownTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={completeTask} compact />)
          )}
        </View>

        {/* Next Meeting */}
        {nextMeeting && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Meeting</Text>
            <TouchableOpacity onPress={() => router.push("/meetings")} style={[styles.meetingBanner, { backgroundColor: colors.secondary + "22", borderColor: colors.secondary + "44" }]} activeOpacity={0.8}>
              <View style={[styles.meetingIcon, { backgroundColor: colors.primary + "22" }]}>
                <Ionicons name="videocam" size={22} color={colors.primary} />
              </View>
              <View style={styles.meetingInfo}>
                <Text style={[styles.meetingTitle, { color: colors.foreground }]} numberOfLines={1}>{nextMeeting.title}</Text>
                <Text style={[styles.meetingHost, { color: colors.mutedForeground }]}>Hosted by {nextMeeting.host}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Achiever Spotlight */}
        {topAchiever && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Achiever Spotlight</Text>
              <TouchableOpacity onPress={() => router.push("/achievers")} activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>All achievers</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.achieverCard, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
              <View style={[styles.achieverAvatar, { backgroundColor: colors.primary + "33" }]}>
                <Text style={[styles.achieverInitials, { color: colors.primary }]}>{topAchiever.userName.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.achieverInfo}>
                <Text style={[styles.achieverName, { color: colors.foreground }]}>{topAchiever.userName}</Text>
                <View style={[styles.badgeChip, { backgroundColor: colors.primary }]}>
                  <Ionicons name="trophy" size={11} color={colors.primaryForeground} />
                  <Text style={[styles.badgeText2, { color: colors.primaryForeground }]}>{topAchiever.badge}</Text>
                </View>
              </View>
              <View style={styles.achieverStats}>
                <Text style={[styles.achieverPct, { color: colors.primary }]}>{topAchiever.completionRate}%</Text>
                <Text style={[styles.achieverLbl, { color: colors.mutedForeground }]}>Completion</Text>
              </View>
            </View>
          </View>
        )}

        {/* Leaderboard Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Leaderboard</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")} activeOpacity={0.7}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Full board</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.leaderPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {top3.map((user, i) => (
              <View key={user.id} style={[styles.leaderRow, i < 2 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}]}>
                <Text style={[styles.leaderRank, { color: ["#fbbf24", "#9ca3af", "#c87941"][i] }]}>#{user.rank}</Text>
                <View style={[styles.leaderAvatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.leaderInitials, { color: colors.primary }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={[styles.leaderName, { color: colors.foreground }]} numberOfLines={1}>{user.name}</Text>
                <Text style={[styles.leaderPoints, { color: colors.foreground }]}>{user.points.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Motivation */}
        <View style={[styles.quoteCard, { backgroundColor: colors.secondary }]}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={[styles.quoteText, { color: "#fff" }]}>{quote}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, gap: 20 },
  progressCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 14 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressPct: { fontSize: 28, fontFamily: "Inter_700Bold" },
  progressStats: { flexDirection: "row", gap: 20 },
  progressStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 12, fontFamily: "Inter_400Regular" },
  momentumRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  momentumCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  momentumVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  momentumLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyTasks: { borderRadius: 14, padding: 24, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  meetingBanner: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  meetingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  meetingHost: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  achieverCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  achieverAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  achieverInitials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  achieverInfo: { flex: 1, gap: 6 },
  achieverName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  badgeChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText2: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  achieverStats: { alignItems: "center" },
  achieverPct: { fontSize: 22, fontFamily: "Inter_700Bold" },
  achieverLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  leaderPreview: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  leaderRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  leaderRank: { fontSize: 14, fontFamily: "Inter_700Bold", width: 28 },
  leaderAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  leaderInitials: { fontSize: 12, fontFamily: "Inter_700Bold" },
  leaderName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  leaderPoints: { fontSize: 13, fontFamily: "Inter_700Bold" },
  quoteCard: { borderRadius: 16, padding: 20, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  quoteText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 22 },
});
