import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ count, size = 'md' }: StreakBadgeProps) {
  const colors = useColors();
  const sz = { sm: { icon: 14, text: 13, pad: 6 }, md: { icon: 18, text: 16, pad: 8 }, lg: { icon: 24, text: 22, pad: 12 } }[size];

  return (
    <View style={[styles.badge, { backgroundColor: colors.streak + '22', borderColor: colors.streak + '44', padding: sz.pad }]}>
      <Ionicons name="flame" size={sz.icon} color={colors.streak} />
      <Text style={[styles.count, { color: colors.streak, fontSize: sz.text }]}>{count}</Text>
      <Text style={[styles.label, { color: colors.streak }]}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1 },
  count: { fontFamily: 'Inter_700Bold' },
  label: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
