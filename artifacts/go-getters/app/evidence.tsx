import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Evidence, EvidenceType } from "@/types";

const STATUS_CONFIG: Record<Evidence["status"], { label: string; color: string; icon: string }> = {
  pending: { label: "Pending Review", color: "#fbbf24", icon: "time-outline" },
  approved: { label: "Approved", color: "#00e57d", icon: "checkmark-circle-outline" },
  rejected: { label: "Rejected", color: "#ef4444", icon: "close-circle-outline" },
};

const TYPE_OPTIONS: { id: EvidenceType; label: string; icon: string }[] = [
  { id: "screenshot", label: "Screenshot", icon: "phone-landscape-outline" },
  { id: "image", label: "Photo", icon: "camera-outline" },
  { id: "link", label: "Link", icon: "link-outline" },
  { id: "voice", label: "Voice Note", icon: "mic-outline" },
];

const TASK_OPTIONS = [
  "Morning Prospecting",
  "Follow up with leads",
  "Read personal dev book",
  "Team check-in call",
  "Post daily win",
  "Evening review",
];

export default function EvidenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { evidence, tasks, addEvidence } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [evType, setEvType] = useState<EvidenceType>("screenshot");
  const [selectedTask, setSelectedTask] = useState(tasks[0]?.id ?? "");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleSubmit() {
    if (!desc.trim()) { Alert.alert("Please add a description"); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const task = tasks.find((t) => t.id === selectedTask);
    addEvidence({
      taskId: selectedTask,
      taskTitle: task?.title ?? "Task",
      type: evType,
      link: evType === "link" ? link : undefined,
      description: desc.trim(),
      status: "pending",
      uploadedAt: new Date().toISOString(),
      userName: "You",
    });
    setDesc(""); setLink(""); setShowModal(false);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
        {/* Header stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Submitted", value: evidence.length, color: colors.primary, icon: "cloud-upload-outline" },
            { label: "Approved", value: evidence.filter((e) => e.status === "approved").length, color: "#00e57d", icon: "checkmark-circle-outline" },
            { label: "Pending", value: evidence.filter((e) => e.status === "pending").length, color: "#fbbf24", icon: "time-outline" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="cloud-upload" size={20} color={colors.primaryForeground} />
          <Text style={[styles.uploadText, { color: colors.primaryForeground }]}>Submit Evidence</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Evidence History</Text>

        {evidence.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="camera-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No evidence submitted yet</Text>
          </View>
        ) : (
          evidence.map((ev) => {
            const conf = STATUS_CONFIG[ev.status];
            return (
              <View key={ev.id} style={[styles.evCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: conf.color }]}>
                <View style={styles.evHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: conf.color + "22" }]}>
                    <Ionicons name={TYPE_OPTIONS.find((t) => t.id === ev.type)?.icon as any ?? "document-outline"} size={16} color={conf.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.evTask, { color: colors.foreground }]} numberOfLines={1}>{ev.taskTitle}</Text>
                    <Text style={[styles.evTime, { color: colors.mutedForeground }]}>{timeAgo(ev.uploadedAt)}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: conf.color + "22" }]}>
                    <Ionicons name={conf.icon as any} size={12} color={conf.color} />
                    <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
                  </View>
                </View>
                <Text style={[styles.evDesc, { color: colors.mutedForeground }]}>{ev.description}</Text>
                {ev.feedback && ev.status === "rejected" && (
                  <View style={[styles.feedbackBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "33" }]}>
                    <Ionicons name="information-circle-outline" size={13} color={colors.error} />
                    <Text style={[styles.feedbackText, { color: colors.error }]}>{ev.feedback}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Submit Evidence</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Evidence Type</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => setEvType(t.id)} activeOpacity={0.8} style={[styles.typeChip, { backgroundColor: evType === t.id ? colors.primary + "22" : colors.muted, borderColor: evType === t.id ? colors.primary : colors.border }]}>
                  <Ionicons name={t.icon as any} size={16} color={evType === t.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.typeText, { color: evType === t.id ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 16 }]}>Related Task</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskScroll}>
              {tasks.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => setSelectedTask(t.id)} activeOpacity={0.8} style={[styles.taskChip, { backgroundColor: selectedTask === t.id ? colors.primary + "22" : colors.muted, borderColor: selectedTask === t.id ? colors.primary : colors.border }]}>
                  <Text style={[styles.taskText, { color: selectedTask === t.id ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>{t.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {evType === "link" && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 16 }]}>Link URL</Text>
                <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="https://..." placeholderTextColor={colors.mutedForeground} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" />
              </>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 16 }]}>Description</Text>
            <TextInput style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="Describe what you accomplished and the evidence you're submitting..." placeholderTextColor={colors.mutedForeground} value={desc} onChangeText={setDesc} multiline numberOfLines={4} textAlignVertical="top" />
          </ScrollView>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} activeOpacity={0.85}>
            <Ionicons name="cloud-upload" size={18} color={colors.primaryForeground} />
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Submit for Review</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", gap: 6 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 14, gap: 8, marginBottom: 24 },
  uploadText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  empty: { borderRadius: 14, padding: 32, alignItems: "center", borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  evCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 8 },
  evHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  evTask: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  evTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  evDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  feedbackBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10, borderWidth: 1 },
  feedbackText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  modal: { flex: 1, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  typeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  taskScroll: { marginBottom: 4 },
  taskChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, maxWidth: 180 },
  taskText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 100, marginBottom: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16, gap: 8, marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
