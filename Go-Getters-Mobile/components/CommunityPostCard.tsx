import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Post } from '@/types';

interface CommunityPostCardProps {
  post: Post;
  onLike: (id: string) => void;
}

const TYPE_CONFIG: Record<Post['type'], { icon: string; color: string; label: string }> = {
  win: { icon: 'trophy', color: '#fbbf24', label: 'Win' },
  motivation: { icon: 'flash', color: '#00d8fe', label: 'Motivation' },
  update: { icon: 'refresh-circle', color: '#00e57d', label: 'Update' },
  announcement: { icon: 'megaphone', color: '#a855f7', label: 'Announcement' },
};

const ROLE_LABELS = { admin: 'Admin', leader: 'Leader', member: 'Member' };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function CommunityPostCard({ post, onLike }: CommunityPostCardProps) {
  const colors = useColors();
  const typeConf = TYPE_CONFIG[post.type];

  function handleLike() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike(post.id);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{post.userName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{post.userName}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.roleChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.roleText, { color: colors.mutedForeground }]}>{ROLE_LABELS[post.userRole]}</Text>
            </View>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.typeChip, { backgroundColor: typeConf.color + '22' }]}>
          <Ionicons name={typeConf.icon as any} size={12} color={typeConf.color} />
          <Text style={[styles.typeText, { color: typeConf.color }]}>{typeConf.label}</Text>
        </View>
      </View>

      <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.action} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? '#ef4444' : colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7}>
          <Ionicons name="arrow-redo-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleChip: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  roleText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  timeText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  content: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, paddingHorizontal: 14, paddingBottom: 14 },
  footer: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, gap: 20 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
