import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const PERIODS = ["Weekly", "Monthly"] as const;
type Period = typeof PERIODS[number];

const MONTHLY_CATEGORIES = [
  { id: "consistency", label: "Most Consistent", icon: "trending-up", color: "#00d8fe" },
  { id: "performance", label: "Highest Performer", icon: "trophy", color: "#fbbf24" },
  { id: "growth", label: "Fastest Growth", icon: "rocket", color: "#00e57d" },
  { id: "leadership", label: "Leadership Award", icon: "shield-checkmark", color: "#a855f7" },
  { id: "recruitment", label: "Recruitment Champion", icon: "people", color: "#ff6b35" },
  { id: "content", label: "Content Creator", icon: "create", color: "#ec4899" },
];

const BADGE_COLORS: Record<string, string> = {
  "Most Consistent": "#00d8fe",
  "Highest Performer": "#fbbf24",
  "Fastest Growth": "#00e57d",
  "Leadership Award": "#a855f7",
};

export default function AchieversScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { achievers } = useApp();
  const [period, setPeriod] = useState<Period>("Weekly");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
      {/* Period Toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {PERIODS.map((p) => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)} activeOpacity={0.8} style={[styles.toggleBtn, { backgroundColor: period === p ? colors.primary : "transparent" }]}>
            <Text style={[styles.toggleText, { color: period === p ? colors.primaryForeground : colors.mutedForeground }]}>{p} Achievers</Text>
          </TouchableOpacity>
        ))}
      </View>

      {period === "Weekly" ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week's Champions</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Generated automatically based on consistency, completion rate, and evidence</Text>

          {achievers.map((achiever, index) => {
            const color = BADGE_COLORS[achiever.badge] ?? colors.primary;
            const isFirst = index === 0;
            return (
              <View key={achiever.id} style={[styles.achieverCard, { backgroundColor: colors.card, borderColor: isFirst ? color + "66" : colors.border, borderWidth: isFirst ? 2 : 1 }]}>
                {isFirst && (
                  <View style={[styles.featuredBanner, { backgroundColor: color }]}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.featuredText}>TOP ACHIEVER</Text>
                  </View>
                )}
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: color + "33", borderColor: color + "66", borderWidth: 2, width: isFirst ? 72 : 56, height: isFirst ? 72 : 56, borderRadius: isFirst ? 36 : 28 }]}>
                    <Text style={[styles.avatarText, { color, fontSize: isFirst ? 24 : 18 }]}>{achiever.userName.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.foreground, fontSize: isFirst ? 18 : 15 }]}>{achiever.userName}</Text>
                    <View style={[styles.badge, { backgroundColor: color }]}>
                      <Ionicons name="ribbon" size={11} color="#fff" />
                      <Text style={styles.badgeText}>{achiever.badge}</Text>
                    </View>
                  </View>
                  <View style={[styles.rankCircle, { backgroundColor: color + "22", borderColor: color + "44", borderWidth: 1 }]}>
                    <Text style={[styles.rankNum, { color }]}>#{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{achiever.completionRate}%</Text>
                    <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Done</Text>
                  </View>
                  <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons name="flame" size={14} color={colors.streak} />
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{achiever.streak}</Text>
                    <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Days</Text>
                  </View>
                  <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{achiever.points}</Text>
                    <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Points</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Awards</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Recognizing outstanding performance across all categories</Text>
          <View style={styles.monthlyGrid}>
            {MONTHLY_CATEGORIES.map((cat) => (
              <View key={cat.id} style={[styles.monthlyCard, { backgroundColor: colors.card, borderColor: cat.color + "44", borderWidth: 1 }]}>
                <View style={[styles.monthlyIcon, { backgroundColor: cat.color + "22" }]}>
                  <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                </View>
                <Text style={[styles.monthlyLabel, { color: colors.foreground }]}>{cat.label}</Text>
                <View style={[styles.tbaChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tbaText, { color: colors.mutedForeground }]}>To be announced</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Recognition banner */}
      <View style={[styles.banner, { backgroundColor: colors.secondary }]}>
        <Ionicons name="trophy" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Keep Pushing</Text>
          <Text style={styles.bannerDesc}>Achievers are selected based on consistency, task completion, and evidence uploads. Stay consistent to get recognized.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 24, gap: 4 },
  toggleBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  toggleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 20 },
  achieverCard: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  featuredBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  featuredText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold" },
  userName: { fontFamily: "Inter_700Bold", marginBottom: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  rankCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 14, paddingTop: 0 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, height: 20 },
  monthlyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  monthlyCard: { width: "47%", borderRadius: 16, padding: 18, alignItems: "center", gap: 10 },
  monthlyIcon: { width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  monthlyLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  tbaChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tbaText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  banner: { borderRadius: 16, padding: 18, flexDirection: "row", gap: 14, alignItems: "flex-start" },
  bannerTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  bannerDesc: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
