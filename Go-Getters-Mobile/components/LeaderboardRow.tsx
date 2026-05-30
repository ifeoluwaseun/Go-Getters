import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LeaderboardUser } from '@/types';

interface LeaderboardRowProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
}

const RANK_COLORS = ['#fbbf24', '#9ca3af', '#c87941'];

export function LeaderboardRow({ user, isCurrentUser }: LeaderboardRowProps) {
  const colors = useColors();
  const rankColor = user.rank <= 3 ? RANK_COLORS[user.rank - 1] : colors.mutedForeground;
  const changeIcon = user.change === 'up' ? 'arrow-up' : user.change === 'down' ? 'arrow-down' : 'remove';
  const changeColor = user.change === 'up' ? colors.success : user.change === 'down' ? colors.error : colors.mutedForeground;

  return (
    <View style={[styles.row, { backgroundColor: isCurrentUser ? colors.primary + '14' : colors.card, borderColor: isCurrentUser ? colors.primary + '44' : colors.border }]}>
      <View style={[styles.rankBox, { backgroundColor: rankColor + '22' }]}>
        <Text style={[styles.rank, { color: rankColor }]}>{user.rank}</Text>
      </View>
      <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{user.name.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{user.name}</Text>
          {isCurrentUser && <View style={[styles.youBadge, { backgroundColor: colors.primary }]}><Text style={[styles.youText, { color: colors.primaryForeground }]}>You</Text></View>}
        </View>
        <View style={styles.stats}>
          <Ionicons name="flame" size={11} color={colors.streak} />
          <Text style={[styles.stat, { color: colors.mutedForeground }]}>{user.streak}d</Text>
          <Text style={[styles.statSep, { color: colors.border }]}>·</Text>
          <Text style={[styles.stat, { color: colors.mutedForeground }]}>{user.completionRate}% done</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.points, { color: colors.foreground }]}>{user.points.toLocaleString()}</Text>
        <View style={styles.changeRow}>
          <Ionicons name={changeIcon as any} size={10} color={changeColor} />
          <Text style={[styles.pts, { color: colors.mutedForeground }]}>pts</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
  rankBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rank: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  youBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  youText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stat: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statSep: { fontSize: 11 },
  right: { alignItems: 'flex-end' },
  points: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  pts: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
