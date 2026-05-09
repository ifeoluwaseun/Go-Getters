import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { LeaderboardRow } from "@/components/LeaderboardRow";

const PERIODS = ["Weekly", "Monthly"] as const;
type Period = typeof PERIODS[number];

const PODIUM_COLORS = ["#fbbf24", "#9ca3af", "#c87941"];
const PODIUM_SIZES = [64, 56, 52];

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { leaderboard } = useApp();
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>("Weekly");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = [80, 110, 70];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: botPad + 100 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Leaderboard</Text>
        <View style={[styles.periodToggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} activeOpacity={0.8} style={[styles.periodBtn, { backgroundColor: period === p ? colors.primary : "transparent" }]}>
              <Text style={[styles.periodText, { color: period === p ? colors.primaryForeground : colors.mutedForeground }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Podium */}
      <View style={styles.podiumSection}>
        <View style={styles.podiumRow}>
          {podiumOrder.map((user, i) => {
            if (!user) return <View key={i} style={{ flex: 1 }} />;
            const rank = [2, 1, 3][i];
            const podColor = PODIUM_COLORS[rank - 1];
            const avatarSize = PODIUM_SIZES[rank - 1];
            return (
              <View key={user.id} style={styles.podiumUser}>
                <View style={[styles.podiumAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: podColor + "33", borderColor: podColor }]}>
                  <Text style={[styles.podiumInitials, { color: podColor, fontSize: avatarSize / 2.8 }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
                  {rank === 1 && <View style={[styles.crown, { backgroundColor: podColor }]}><Ionicons name="trophy" size={10} color="#fff" /></View>}
                </View>
                <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>{user.name.split(" ")[0]}</Text>
                <Text style={[styles.podiumPoints, { color: podColor }]}>{user.points.toLocaleString()}</Text>
                <View style={[styles.podiumBase, { backgroundColor: podColor + "33", height: podiumHeights[i], borderColor: podColor + "44" }]}>
                  <Text style={[styles.podiumRank, { color: podColor }]}>#{rank}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Rest of rankings */}
      <View style={styles.rankList}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Rankings</Text>
        {rest.map((user) => (
          <LeaderboardRow key={user.id} user={user} isCurrentUser={user.id === currentUser?.id} />
        ))}
      </View>

      {/* Stats banner */}
      <View style={[styles.statsBanner, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 20 }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: colors.primary }]}>{leaderboard.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Participants</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: colors.success }]}>{Math.round(leaderboard.reduce((a, u) => a + u.completionRate, 0) / leaderboard.length)}%</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Avg. Completion</Text>
        </View>
        <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: colors.streak }]}>{Math.max(...leaderboard.map((u) => u.streak))}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Best Streak</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  periodToggle: { flexDirection: "row", borderRadius: 20, borderWidth: 1, padding: 3, gap: 2 },
  periodBtn: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  periodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  podiumSection: { paddingHorizontal: 20, paddingBottom: 24 },
  podiumRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8 },
  podiumUser: { flex: 1, alignItems: "center", gap: 6 },
  podiumAvatar: { alignItems: "center", justifyContent: "center", borderWidth: 2 },
  podiumInitials: { fontFamily: "Inter_700Bold" },
  crown: { position: "absolute", top: -10, borderRadius: 10, padding: 4 },
  podiumName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  podiumPoints: { fontSize: 11, fontFamily: "Inter_700Bold" },
  podiumBase: { width: "100%", borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  podiumRank: { fontSize: 18, fontFamily: "Inter_700Bold" },
  rankList: { paddingHorizontal: 20, gap: 0, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  statsBanner: { borderRadius: 16, borderWidth: 1, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 20 },
  statItem: { alignItems: "center", gap: 4 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statDiv: { width: 1, height: 36 },
});
