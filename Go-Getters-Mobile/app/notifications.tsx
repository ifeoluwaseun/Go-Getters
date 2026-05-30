import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { NotificationItem } from "@/components/NotificationItem";

const LEVEL_LABELS: Record<1 | 2 | 3, { label: string; desc: string; color: string }> = {
  1: { label: "Gentle Reminder", desc: "Friendly nudge to stay on track", color: "#00d8fe" },
  2: { label: "Accountability Alert", desc: "You're falling behind — take action", color: "#fbbf24" },
  3: { label: "Urgent Intervention", desc: "Immediate support recommended", color: "#ef4444" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllRead, unreadCount } = useApp();

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Sub-header */}
      <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.unreadText, { color: colors.mutedForeground }]}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem notification={item} onPress={markNotificationRead} />}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.escalationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.escalationTitle, { color: colors.foreground }]}>Escalation System</Text>
            <View style={styles.levels}>
              {([1, 2, 3] as const).map((level) => {
                const conf = LEVEL_LABELS[level];
                return (
                  <View key={level} style={styles.levelRow}>
                    <View style={[styles.levelNum, { backgroundColor: conf.color + "22", borderColor: conf.color + "44" }]}>
                      <Text style={[styles.levelNumText, { color: conf.color }]}>{level}</Text>
                    </View>
                    <View>
                      <Text style={[styles.levelLabel, { color: colors.foreground }]}>{conf.label}</Text>
                      <Text style={[styles.levelDesc, { color: colors.mutedForeground }]}>{conf.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  unreadText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  markAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  escalationCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 16 },
  escalationTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 12 },
  levels: { gap: 10 },
  levelRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  levelNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0 },
  levelNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  levelLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  levelDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
