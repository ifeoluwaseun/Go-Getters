import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { AppNotification } from '@/types';

const TYPE_CONFIG: Record<AppNotification['type'], { icon: string; color: string }> = {
  reminder: { icon: 'alarm-outline', color: '#fbbf24' },
  achievement: { icon: 'trophy-outline', color: '#fbbf24' },
  alert: { icon: 'warning-outline', color: '#ef4444' },
  announcement: { icon: 'megaphone-outline', color: '#a855f7' },
  streak: { icon: 'flame-outline', color: '#ff6b35' },
};

const LEVEL_BORDER: Record<1 | 2 | 3, string> = { 1: 'transparent', 2: '#fbbf2444', 3: '#ef444444' };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationItem({ notification, onPress }: { notification: AppNotification; onPress: (id: string) => void }) {
  const colors = useColors();
  const conf = TYPE_CONFIG[notification.type];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(notification.id)}
      style={[styles.item, {
        backgroundColor: notification.isRead ? colors.card : colors.primary + '0a',
        borderColor: LEVEL_BORDER[notification.level],
        borderLeftColor: conf.color,
      }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: conf.color + '22' }]}>
        <Ionicons name={conf.icon as any} size={18} color={conf.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{notification.title}</Text>
          {!notification.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>{notification.body}</Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(notification.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderLeftWidth: 3, gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1, marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
