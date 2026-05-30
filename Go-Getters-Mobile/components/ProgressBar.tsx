import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  backgroundColor?: string;
}

export function ProgressBar({ progress, height = 8, color, showLabel = false, label, backgroundColor }: ProgressBarProps) {
  const colors = useColors();
  const clamp = Math.min(Math.max(progress, 0), 100);
  const barColor = color ?? colors.primary;
  const bgColor = backgroundColor ?? colors.muted;

  return (
    <View>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>}
          {showLabel && <Text style={[styles.pct, { color: barColor }]}>{Math.round(clamp)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: bgColor, borderRadius: height / 2 }]}>
        <View
          style={[styles.fill, { width: `${clamp}%`, backgroundColor: barColor, borderRadius: height / 2 }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  pct: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
