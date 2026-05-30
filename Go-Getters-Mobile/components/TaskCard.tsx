import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onPress?: (task: Task) => void;
  compact?: boolean;
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  high: '#ef4444',
  medium: '#fbbf24',
  low: '#6b7280',
};

const STATUS_LABELS: Record<Task['status'], string> = {
  completed: 'Done',
  pending: 'Pending',
  overdue: 'Overdue',
  skipped: 'Skipped',
};

export function TaskCard({ task, onComplete, onPress, compact }: TaskCardProps) {
  const colors = useColors();
  const isDone = task.status === 'completed';
  const isOverdue = task.status === 'overdue';

  function handleComplete() {
    if (isDone) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(task.id);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(task)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: PRIORITY_COLORS[task.priority], opacity: isDone ? 0.7 : 1 }]}
    >
      <TouchableOpacity onPress={handleComplete} style={[styles.checkbox, { borderColor: isDone ? colors.primary : colors.border, backgroundColor: isDone ? colors.primary : 'transparent' }]} activeOpacity={0.8}>
        {isDone && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground, textDecorationLine: isDone ? 'line-through' : 'none' }]} numberOfLines={compact ? 1 : 2}>{task.title}</Text>
        {!compact && (
          <View style={styles.meta}>
            <View style={[styles.chip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{task.category}</Text>
            </View>
            {task.dueTime && (
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={11} color={isOverdue ? colors.error : colors.mutedForeground} />
                <Text style={[styles.time, { color: isOverdue ? colors.error : colors.mutedForeground }]}>{task.dueTime}</Text>
              </View>
            )}
            {task.hasEvidence && (
              <View style={styles.timeRow}>
                <Ionicons name="camera-outline" size={11} color={colors.primary} />
                <Text style={[styles.time, { color: colors.primary }]}>Evidence</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.right}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
        {isOverdue && !compact && (
          <Ionicons name="warning-outline" size={14} color={colors.error} style={{ marginTop: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderLeftWidth: 3 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  chipText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  right: { alignItems: 'center', marginLeft: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
});
