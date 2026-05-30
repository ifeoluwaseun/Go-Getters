import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TaskCard } from "@/components/TaskCard";
import { Task, TaskPriority } from "@/types";

const FILTERS = ["Today", "This Week", "All"] as const;
type Filter = typeof FILTERS[number];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#fbbf24" },
  { value: "low", label: "Low", color: "#6b7280" },
];

const CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, goals, completeTask, addTask, addEvidence } = useApp();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<Filter>("Today");

  // New task modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Prospecting");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueTime, setDueTime] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // Proof modal
  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofDesc, setProofDesc] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [proofType, setProofType] = useState<"screenshot" | "image" | "link">("screenshot");
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    if (filter === "Today") return tasks.filter((t) => t.date === today);
    if (filter === "This Week") {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      return tasks.filter((t) => t.date >= weekAgo);
    }
    return tasks;
  }, [tasks, filter, today]);

  const pending = filtered.filter((t) => t.status === "pending");
  const overdue = filtered.filter((t) => t.status === "overdue");
  const completed = filtered.filter((t) => t.status === "completed");
  const completedPct = filtered.length > 0 ? Math.round((completed.length / filtered.length) * 100) : 0;

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  function handleAdd() {
    if (!title.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask({
      title: title.trim(),
      category,
      priority,
      dueTime: dueTime || undefined,
      status: "pending",
      hasEvidence: false,
      recurring: false,
      date: today,
      goalId: selectedGoalId || undefined,
    });
    setTitle(""); setDueTime(""); setSelectedGoalId(""); setShowModal(false);
  }

  async function pickProofImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow access to your photo library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProofImageUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }

  async function takeProofPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow camera access."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProofImageUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }

  async function handleSubmitProof() {
    if (!proofDesc.trim() || !proofTask) { Alert.alert("Please add a description"); return; }
    setProofSubmitting(true);
    try {
      await addEvidence({
        taskId: proofTask.id,
        taskTitle: proofTask.title,
        type: proofType,
        link: proofType === "link" ? proofLink : undefined,
        uri: proofImageUri ?? undefined,
        description: proofDesc.trim(),
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userName: currentUser?.name ?? "You",
      });
      setProofTask(null); setProofDesc(""); setProofLink(""); setProofImageUri(null); setProofType("screenshot");
      Alert.alert("Submitted!", "Your proof has been submitted for review.");
    } catch {
      Alert.alert("Error", "Could not submit proof. Please try again.");
    } finally {
      setProofSubmitting(false);
    }
  }

  function TaskGroup({ title: groupTitle, items, emptyMsg }: { title: string; items: Task[]; emptyMsg?: string }) {
    if (items.length === 0 && !emptyMsg) return null;
    return (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{groupTitle} · {items.length}</Text>
        {items.length === 0 ? (
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>{emptyMsg}</Text>
        ) : (
          items.map((t) => {
            const linkedGoal = goals.find(g => g.id === t.goalId);
            return (
              <View key={t.id}>
                <TaskCard task={t} onComplete={completeTask} />
                {linkedGoal && (
                  <View style={[styles.goalBadge, { backgroundColor: linkedGoal.color + "22", borderColor: linkedGoal.color + "44" }]}>
                    <Ionicons name="flag" size={10} color={linkedGoal.color} />
                    <Text style={[styles.goalBadgeText, { color: linkedGoal.color }]} numberOfLines={1}>{linkedGoal.title}</Text>
                  </View>
                )}
                {/* Add Proof button for every task */}
                <TouchableOpacity
                  style={[styles.proofBtn, { backgroundColor: t.hasEvidence ? colors.muted : colors.primary + "18", borderColor: t.hasEvidence ? colors.border : colors.primary + "44" }]}
                  onPress={() => { setProofTask(t); setProofType("screenshot"); setProofDesc(""); setProofImageUri(null); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={t.hasEvidence ? "checkmark-circle" : "camera-outline"} size={13} color={t.hasEvidence ? colors.mutedForeground : colors.primary} />
                  <Text style={[styles.proofBtnText, { color: t.hasEvidence ? colors.mutedForeground : colors.primary }]}>
                    {t.hasEvidence ? "Proof submitted" : "Add Proof"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Tasks</Text>
          <View style={[styles.pctBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.pctText, { color: colors.primary }]}>{completedPct}% done</Text>
          </View>
        </View>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8} style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.muted, borderColor: filter === f ? colors.primary : colors.border }]}>
              <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: botPad + 100 }]} showsVerticalScrollIndicator={false}>
        {overdue.length > 0 && <TaskGroup title="Overdue" items={overdue} />}
        <TaskGroup title="Pending" items={pending} emptyMsg="No pending tasks — you're crushing it!" />
        <TaskGroup title="Completed" items={completed} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: botPad + (Platform.OS === "web" ? 84 : 90) }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* New Task Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Task</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Task Title</Text>
                <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="What needs to get done?" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} autoFocus />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Due Time (optional)</Text>
                <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="e.g. 14:00" placeholderTextColor={colors.mutedForeground} value={dueTime} onChangeText={setDueTime} keyboardType="numeric" />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <TouchableOpacity key={p.value} onPress={() => setPriority(p.value)} activeOpacity={0.8} style={[styles.priorityChip, { backgroundColor: priority === p.value ? p.color + "33" : colors.muted, borderColor: priority === p.value ? p.color : colors.border }]}>
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.priorityLabel, { color: priority === p.value ? p.color : colors.mutedForeground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat} onPress={() => setCategory(cat)} activeOpacity={0.8} style={[styles.categoryChip, { backgroundColor: category === cat ? colors.primary + "22" : colors.muted, borderColor: category === cat ? colors.primary : colors.border }]}>
                      <Text style={[styles.categoryText, { color: category === cat ? colors.primary : colors.mutedForeground }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {goals.length > 0 && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Link to Goal <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
                  <TouchableOpacity onPress={() => setShowGoalPicker(!showGoalPicker)} style={[styles.goalSelector, { backgroundColor: colors.muted, borderColor: selectedGoal ? selectedGoal.color : colors.border }]} activeOpacity={0.8}>
                    {selectedGoal ? (
                      <View style={styles.selectedGoal}>
                        <View style={[styles.goalDot, { backgroundColor: selectedGoal.color }]} />
                        <Text style={[styles.goalSelectorText, { color: colors.foreground }]} numberOfLines={1}>{selectedGoal.title}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.goalSelectorText, { color: colors.mutedForeground }]}>Select a goal...</Text>
                    )}
                    <Ionicons name={showGoalPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {showGoalPicker && (
                    <View style={[styles.goalDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <TouchableOpacity onPress={() => { setSelectedGoalId(""); setShowGoalPicker(false); }} style={[styles.goalOption, { backgroundColor: !selectedGoalId ? colors.muted : "transparent" }]} activeOpacity={0.7}>
                        <Text style={[styles.goalOptionText, { color: colors.mutedForeground }]}>None</Text>
                      </TouchableOpacity>
                      {goals.map(g => (
                        <TouchableOpacity key={g.id} onPress={() => { setSelectedGoalId(g.id); setShowGoalPicker(false); }} style={[styles.goalOption, { backgroundColor: selectedGoalId === g.id ? g.color + "22" : "transparent" }]} activeOpacity={0.7}>
                          <View style={[styles.goalDot, { backgroundColor: g.color }]} />
                          <Text style={[styles.goalOptionText, { color: colors.foreground }]} numberOfLines={1}>{g.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={[styles.addText, { color: colors.primaryForeground }]}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Proof Modal */}
      <Modal visible={!!proofTask} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setProofTask(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Proof</Text>
                {proofTask && <Text style={[styles.proofTaskName, { color: colors.mutedForeground }]} numberOfLines={1}>{proofTask.title}</Text>}
              </View>
              <TouchableOpacity onPress={() => setProofTask(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Evidence Type</Text>
              <View style={[styles.priorityRow, { marginBottom: 20 }]}>
                {([
                  { id: "screenshot" as const, label: "Screenshot", icon: "phone-landscape-outline" },
                  { id: "image" as const, label: "Photo", icon: "camera-outline" },
                  { id: "link" as const, label: "Link", icon: "link-outline" },
                ]).map(t => (
                  <TouchableOpacity key={t.id} onPress={() => { setProofType(t.id); setProofImageUri(null); }} activeOpacity={0.8}
                    style={[styles.priorityChip, { flex: 1, backgroundColor: proofType === t.id ? colors.primary + "22" : colors.muted, borderColor: proofType === t.id ? colors.primary : colors.border }]}>
                    <Ionicons name={t.icon as any} size={14} color={proofType === t.id ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.priorityLabel, { color: proofType === t.id ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(proofType === "screenshot" || proofType === "image") && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Upload Image</Text>
                  {proofImageUri ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: proofImageUri }} style={styles.imagePreview} resizeMode="cover" />
                      <TouchableOpacity style={styles.removeImage} onPress={() => setProofImageUri(null)} activeOpacity={0.8}>
                        <Ionicons name="close-circle" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePickerRow}>
                      <TouchableOpacity style={[styles.imagePickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={pickProofImage} activeOpacity={0.8}>
                        <Ionicons name="images-outline" size={22} color={colors.primary} />
                        <Text style={[styles.imagePickerText, { color: colors.foreground }]}>Library</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.imagePickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={takeProofPhoto} activeOpacity={0.8}>
                        <Ionicons name="camera-outline" size={22} color={colors.primary} />
                        <Text style={[styles.imagePickerText, { color: colors.foreground }]}>Camera</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {proofType === "link" && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Link URL</Text>
                  <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="https://..." placeholderTextColor={colors.mutedForeground} value={proofLink} onChangeText={setProofLink} keyboardType="url" autoCapitalize="none" />
                </View>
              )}

              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
                <TextInput style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="Describe what you accomplished..." placeholderTextColor={colors.mutedForeground} value={proofDesc} onChangeText={setProofDesc} multiline numberOfLines={4} textAlignVertical="top" />
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, opacity: proofSubmitting ? 0.7 : 1 }]} onPress={handleSubmitProof} activeOpacity={0.85} disabled={proofSubmitting}>
              <Ionicons name="cloud-upload" size={18} color={colors.primaryForeground} />
              <Text style={[styles.addText, { color: colors.primaryForeground }]}>{proofSubmitting ? "Submitting..." : "Submit Proof"}</Text>
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
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  pctBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pctText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  filters: { flexDirection: "row", gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 8 },
  group: { gap: 4, marginBottom: 8 },
  groupTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  emptyMsg: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 8 },
  goalBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: "flex-start", marginTop: -6, marginBottom: 2, marginLeft: 4 },
  goalBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", maxWidth: 200 },
  proofBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start", marginBottom: 8, marginLeft: 4 },
  proofBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modal: { flex: 1, padding: 24, gap: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  proofTaskName: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 100 },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingVertical: 10, gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  categoryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  goalSelector: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedGoal: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  goalDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  goalSelectorText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  goalDropdown: { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  goalOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  goalOptionText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  imagePickerRow: { flexDirection: "row", gap: 10 },
  imagePickerBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 8 },
  imagePickerText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  imagePreviewWrap: { position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  imagePreview: { width: "100%", height: 180 },
  removeImage: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12 },
  addBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8 },
  addText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
