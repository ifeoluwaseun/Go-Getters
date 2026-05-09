import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
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
  const { tasks, completeTask, addTask } = useApp();
  const [filter, setFilter] = useState<Filter>("Today");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Prospecting");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueTime, setDueTime] = useState("");

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

  function handleAdd() {
    if (!title.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask({ title: title.trim(), category, priority, dueTime: dueTime || undefined, status: "pending", hasEvidence: false, recurring: false, date: today });
    setTitle("");
    setDueTime("");
    setShowModal(false);
  }

  function TaskGroup({ title: groupTitle, items, emptyMsg }: { title: string; items: Task[]; emptyMsg?: string }) {
    if (items.length === 0 && !emptyMsg) return null;
    return (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{groupTitle} · {items.length}</Text>
        {items.length === 0 ? (
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>{emptyMsg}</Text>
        ) : (
          items.map((t) => <TaskCard key={t.id} task={t} onComplete={completeTask} />)
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
            </ScrollView>

            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={[styles.addText, { color: colors.primaryForeground }]}>Add Task</Text>
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
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modal: { flex: 1, padding: 24, gap: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingVertical: 10, gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  categoryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  addBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  addText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
