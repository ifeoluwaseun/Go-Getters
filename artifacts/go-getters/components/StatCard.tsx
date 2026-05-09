import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  suffix?: string;
  small?: boolean;
}

export function StatCard({ label, value, icon, color, suffix, small }: StatCardProps) {
  const colors = useColors();
  const c = color ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
      <View style={[styles.iconWrap, { backgroundColor: c + '20' }]}>
        <Ionicons name={icon as any} size={small ? 16 : 20} color={c} />
      </View>
      <Text style={[styles.value, { color: colors.foreground, fontSize: small ? 18 : 22 }]}>
        {value}{suffix && <Text style={[styles.suffix, { color: c }]}>{suffix}</Text>}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground, fontSize: small ? 10 : 11 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'flex-start', gap: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: 'Inter_700Bold' },
  suffix: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  label: { fontFamily: 'Inter_500Medium' },
});
