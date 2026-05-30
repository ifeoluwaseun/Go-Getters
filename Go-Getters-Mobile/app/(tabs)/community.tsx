import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { Post } from "@/types";

const FILTERS = ["All", "Wins", "Announcements", "Motivation"] as const;
type Filter = typeof FILTERS[number];

const POST_TYPES: { id: Post["type"]; label: string; icon: string; color: string }[] = [
  { id: "win", label: "Win", icon: "trophy", color: "#fbbf24" },
  { id: "motivation", label: "Motivation", icon: "flash", color: "#00d8fe" },
  { id: "update", label: "Update", icon: "refresh-circle", color: "#00e57d" },
];

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts, likePost, addPost } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<Post["type"]>("win");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    if (filter === "All") return posts;
    if (filter === "Wins") return posts.filter((p) => p.type === "win");
    if (filter === "Announcements") return posts.filter((p) => p.type === "announcement");
    if (filter === "Motivation") return posts.filter((p) => p.type === "motivation");
    return posts;
  }, [posts, filter]);

  function handlePost() {
    if (!content.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addPost(content.trim(), postType);
    setContent("");
    setShowModal(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.postBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={[styles.postBtnText, { color: colors.primaryForeground }]}>Post</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8} style={[styles.chip, { backgroundColor: filter === f ? colors.primary : colors.muted, borderColor: filter === f ? colors.primary : colors.border }]}>
              <Text style={[styles.chipText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommunityPostCard post={item} onLike={likePost} />}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 100, gap: 0 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet. Be the first to share!</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share with the team</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => setPostType(t.id)} activeOpacity={0.8} style={[styles.typeChip, { backgroundColor: postType === t.id ? t.color + "22" : colors.muted, borderColor: postType === t.id ? t.color : colors.border }]}>
                  <Ionicons name={t.icon as any} size={16} color={postType === t.id ? t.color : colors.mutedForeground} />
                  <Text style={[styles.typeText, { color: postType === t.id ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
              placeholder="What's your win? Share your progress, motivation, or update with the team..."
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              autoFocus
              textAlignVertical="top"
            />

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handlePost} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={18} color={colors.primaryForeground} />
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Post to Community</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  postBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  filterRow: { flexDirection: "row", gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  modal: { flex: 1, padding: 24, gap: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  textarea: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 140 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16, gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
