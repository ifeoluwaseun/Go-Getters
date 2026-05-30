import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Meeting } from '@/types';

const TYPE_CONFIG: Record<Meeting['type'], { color: string; icon: string }> = {
  accountability: { color: '#ef4444', icon: 'shield-checkmark' },
  team: { color: '#00d8fe', icon: 'people' },
  training: { color: '#fbbf24', icon: 'school' },
  support: { color: '#a855f7', icon: 'heart' },
};

function useCountdown(target: string) {
  const [diff, setDiff] = useState(new Date(target).getTime() - Date.now());
  useEffect(() => {
    const i = setInterval(() => setDiff(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(i);
  }, [target]);
  if (diff <= 0) return 'Starting now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const colors = useColors();
  const conf = TYPE_CONFIG[meeting.type];
  const countdown = useCountdown(meeting.startTime);
  const isPast = new Date(meeting.startTime).getTime() < Date.now();
  const startDate = new Date(meeting.startTime);
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: conf.color + '22' }]}>
          <Ionicons name={conf.icon as any} size={18} color={conf.color} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{meeting.title}</Text>
          <Text style={[styles.host, { color: colors.mutedForeground }]}>Hosted by {meeting.host}</Text>
        </View>
        {!isPast && (
          <View style={[styles.countdownBadge, { backgroundColor: conf.color + '22' }]}>
            <Text style={[styles.countdownText, { color: conf.color }]}>{countdown}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{meeting.description}</Text>
      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{dateStr} at {timeStr}</Text>
        </View>
        <TouchableOpacity style={[styles.joinBtn, { backgroundColor: conf.color }]} onPress={() => Linking.openURL(meeting.link)} activeOpacity={0.8}>
          <Ionicons name="videocam" size={13} color="#fff" />
          <Text style={styles.joinText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  host: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  countdownBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  countdownText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  joinText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
