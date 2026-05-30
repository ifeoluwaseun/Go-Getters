import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { MeetingCard } from "@/components/MeetingCard";

export default function MeetingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { meetings } = useApp();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const upcoming = meetings.filter((m) => new Date(m.startTime).getTime() > Date.now() - 3600000);
  const past = meetings.filter((m) => new Date(m.startTime).getTime() <= Date.now() - 3600000);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
      {/* Support Call Prompt */}
      <View style={[styles.supportBanner, { backgroundColor: colors.secondary }]}>
        <View style={styles.supportLeft}>
          <Text style={styles.supportTitle}>Need support?</Text>
          <Text style={styles.supportDesc}>If you're struggling to stay consistent, book an accountability call with a leader.</Text>
        </View>
        <View style={[styles.supportBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.supportBtnText, { color: colors.primaryForeground }]}>Book Call</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Upcoming Meetings</Text>
      {upcoming.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No upcoming meetings scheduled</Text>
        </View>
      ) : (
        upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)
      )}

      {past.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}>Past Meetings</Text>
          {past.map((m) => <MeetingCard key={m.id} meeting={m} />)}
        </>
      )}

      {/* Meeting types info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>Meeting Types</Text>
        {[
          { label: "Accountability", desc: "Weekly team check-in and progress review", color: "#ef4444" },
          { label: "Training", desc: "Skill building and technique development", color: "#fbbf24" },
          { label: "Team", desc: "Community building and team alignment", color: "#00d8fe" },
          { label: "Support", desc: "1:1 accountability and intervention sessions", color: "#a855f7" },
        ].map((t) => (
          <View key={t.label} style={styles.typeRow}>
            <View style={[styles.typeDot, { backgroundColor: t.color }]} />
            <View>
              <Text style={[styles.typeLabel, { color: colors.foreground }]}>{t.label}</Text>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  supportBanner: { borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  supportLeft: { flex: 1 },
  supportTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  supportDesc: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  supportBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  supportBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  empty: { borderRadius: 14, padding: 24, borderWidth: 1, alignItems: "center", marginBottom: 16 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12, marginTop: 16 },
  infoTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  typeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  typeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  typeLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
});
