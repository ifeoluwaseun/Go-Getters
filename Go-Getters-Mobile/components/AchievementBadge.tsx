import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Achievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md';
}

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  const colors = useColors();
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: achievement.color + '18', borderColor: achievement.color + '44' }]}>
      <View style={[styles.iconWrap, { backgroundColor: achievement.color + '22', width: isSm ? 36 : 48, height: isSm ? 36 : 48, borderRadius: isSm ? 18 : 24 }]}>
        <Ionicons name={achievement.icon as any} size={isSm ? 18 : 24} color={achievement.color} />
      </View>
      <Text style={[styles.title, { color: colors.foreground, fontSize: isSm ? 11 : 12 }]} numberOfLines={1}>{achievement.title}</Text>
      {!isSm && <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{achievement.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', width: 100, marginRight: 10 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 2 },
  desc: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
