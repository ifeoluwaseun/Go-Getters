import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Goal } from '@/types';
import { ProgressBar } from './ProgressBar';

interface GoalCardProps {
  goal: Goal;
  taskCount: number;
  completedCount: number;
  onPress?: () => void;
}

export function GoalCard({ goal, taskCount, completedCount, onPress }: GoalCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.accent, { backgroundColor: goal.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.categoryChip, { backgroundColor: goal.color + '22' }]}>
            <Text style={[styles.categoryText, { color: goal.color }]}>{goal.category}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{goal.title}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{goal.description}</Text>
        <View style={styles.progressSection}>
          <ProgressBar progress={goal.progress} color={goal.color} height={6} />
          <View style={styles.stats}>
            <Text style={[styles.statsText, { color: colors.mutedForeground }]}>{completedCount}/{taskCount} tasks</Text>
            <Text style={[styles.pct, { color: goal.color }]}>{goal.progress}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 14, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  accent: { width: 4 },
  body: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  progressSection: { gap: 6 },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  statsText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  pct: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
