import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { StreakBadge } from "@/components/StreakBadge";

const ROLE_LABELS = { admin: "Administrator", leader: "Team Leader", sponsor: "Sponsor", member: "Member" };
const ROLE_COLORS = { admin: "#a855f7", leader: "#00d8fe", sponsor: "#ff6b35", member: "#00e57d" };

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { achievements, tasks, teamMembers } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const roleColor = ROLE_COLORS[currentUser?.role ?? "member"];

  const canSeeTeam = currentUser?.role === "admin" || currentUser?.role === "leader" || currentUser?.role === "sponsor";

  const myTeamCount = canSeeTeam
    ? currentUser?.role === "admin"
      ? teamMembers.length
      : teamMembers.filter((m) => m.sponsorId === currentUser?.id).length
    : 0;

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  }

  if (!currentUser) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: botPad + 100 }} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={[styles.hero, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "33", borderColor: roleColor + "66" }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{currentUser.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{currentUser.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "22", borderColor: roleColor + "44" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[currentUser.role]}</Text>
        </View>
        {currentUser.title && (
          <Text style={[styles.titleText, { color: colors.mutedForeground }]}>{currentUser.title}</Text>
        )}
        <StreakBadge count={currentUser.streak} size="md" />

        {/* Team summary banner for leaders/sponsors/admins */}
        {canSeeTeam && myTeamCount > 0 && (
          <TouchableOpacity onPress={() => router.push("/team")} activeOpacity={0.8} style={[styles.teamBanner, { backgroundColor: roleColor + "18", borderColor: roleColor + "33" }]}>
            <View style={[styles.teamBannerIcon, { backgroundColor: roleColor + "33" }]}>
              <Ionicons name="people" size={16} color={roleColor} />
            </View>
            <Text style={[styles.teamBannerText, { color: roleColor }]}>
              {currentUser.role === "sponsor" ? "Your Recruits" : currentUser.role === "leader" ? "Your Team" : "All Members"} · {myTeamCount} {myTeamCount === 1 ? "person" : "people"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={roleColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Performance</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Points", value: currentUser.points.toLocaleString(), icon: "star", color: "#fbbf24" },
            { label: "Completion", value: `${currentUser.completionRate}%`, icon: "checkmark-circle", color: colors.success },
            { label: "Consistency", value: `${currentUser.consistency}%`, icon: "trending-up", color: colors.primary },
            { label: "Tasks Done", value: completedTasks, icon: "list-circle", color: "#a855f7" },
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

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProgressBar progress={currentUser.completionRate} label="Task Completion Rate" showLabel color={colors.success} />
          <ProgressBar progress={currentUser.consistency} label="Consistency Score" showLabel color={colors.primary} />
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Achievements</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{achievements.length}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 0 }}>
          {achievements.map((a) => <AchievementBadge key={a.id} achievement={a} size="md" />)}
        </ScrollView>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Quick Access</Text>
        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            ...(canSeeTeam ? [{ label: currentUser.role === "sponsor" ? "My Recruits" : "My Team", icon: "people-outline", route: "/team", color: roleColor, badge: myTeamCount }] : []),
            { label: "Weekly Goals", icon: "flag-outline", route: "/goals", color: colors.primary },
            { label: "Evidence History", icon: "camera-outline", route: "/evidence", color: "#00e57d" },
            { label: "Achievers", icon: "trophy-outline", route: "/achievers", color: "#fbbf24" },
            { label: "Meetings", icon: "videocam-outline", route: "/meetings", color: "#a855f7" },
            { label: "Notifications", icon: "notifications-outline", route: "/notifications", color: "#ff6b35" },
            ...(currentUser.role === "admin" ? [{ label: "Admin Dashboard", icon: "shield-checkmark-outline", route: "/admin", color: "#a855f7" }] : []),
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} activeOpacity={0.8} style={[styles.menuItem, i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}]}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              {"badge" in item && (item.badge as number) > 0 && (
                <View style={[styles.menuBadge, { backgroundColor: item.color }]}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Login hint for current role */}
      <View style={[styles.roleHint, { backgroundColor: colors.muted, borderColor: colors.border, marginHorizontal: 20 }]}>
        <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
        <Text style={[styles.roleHintText, { color: colors.mutedForeground }]}>
          Signed in as <Text style={{ color: roleColor, fontFamily: "Inter_600SemiBold" }}>{ROLE_LABELS[currentUser.role]}</Text>
          {currentUser.role === "sponsor" ? " — you can view your direct recruits' tasks, goals & evidence" : currentUser.role === "leader" ? " — you can review all team members' progress" : currentUser.role === "admin" ? " — full organization access" : ""}
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.error + "18", borderColor: colors.error + "44", marginHorizontal: 20 }]} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", padding: 24, gap: 10, borderBottomWidth: 1, marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  roleBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  titleText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  teamBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  teamBannerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  teamBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 20, marginTop: 20, gap: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  menu: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  menuBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
  menuBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  roleHint: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 20, marginBottom: 4 },
  roleHintText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, paddingVertical: 14, gap: 8, marginTop: 16, marginBottom: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
