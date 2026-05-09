import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { GoalCard } from "@/components/GoalCard";
import { ProgressBar } from "@/components/ProgressBar";

const GOAL_COLORS = ["#00d8fe", "#00e57d", "#fbbf24", "#a855f7", "#ef4444", "#ff6b35"];
const GOAL_CATEGORIES = ["Recruitment", "Sales", "Growth", "Leadership", "Content", "Mindset", "Health", "Finance"];

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, tasks, addGoal } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Growth");
  const [colorIdx, setColorIdx] = useState(0);

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;

  function handleAddGoal() {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), description: desc.trim(), weekStart: new Date().toISOString().split("T")[0], category, taskIds: [], progress: 0, color: GOAL_COLORS[colorIdx] });
    setTitle(""); setDesc(""); setShowModal(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: botPad + 100 }} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewTitle}>Weekly Goals</Text>
              <Text style={styles.overviewSub}>{goals.length} active goals this week</Text>
            </View>
            <View style={[styles.overviewPct, { backgroundColor: colors.primary + "33" }]}>
              <Text style={[styles.overviewPctText, { color: colors.primary }]}>{totalProgress}%</Text>
              <Text style={[styles.overviewPctSub, { color: colors.mutedForeground }]}>avg</Text>
            </View>
          </View>
          <ProgressBar progress={totalProgress} color={colors.primary} height={8} />
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Goals</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color={colors.primaryForeground} />
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add Goal</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="flag-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No goals yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Set your first weekly goal to start tracking your progress</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const goalTasks = tasks.filter((t) => goal.taskIds.includes(t.id));
              const completedTasks = goalTasks.filter((t) => t.status === "completed").length;
              return <GoalCard key={goal.id} goal={goal} taskCount={goalTasks.length} completedCount={completedTasks} />;
            })
          )}
        </View>

        {/* Status Guide */}
        <View style={[styles.statusGuide, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>Goal Status Guide</Text>
          {[
            { label: "Ahead of Schedule", color: colors.success, icon: "trending-up" },
            { label: "On Track", color: colors.primary, icon: "checkmark-circle" },
            { label: "Falling Behind", color: colors.warning, icon: "warning" },
            { label: "Overdue", color: colors.error, icon: "alert-circle" },
          ].map((s) => (
            <View key={s.label} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: s.color }]} />
              <Ionicons name={s.icon as any} size={14} color={s.color} />
              <Text style={[styles.statusLabel, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Weekly Goal</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Goal Title</Text>
              <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="What do you want to achieve this week?" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} autoFocus />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="Add more detail about your goal..." placeholderTextColor={colors.mutedForeground} value={desc} onChangeText={setDesc} multiline numberOfLines={3} textAlignVertical="top" />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {GOAL_CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)} activeOpacity={0.8} style={[styles.catChip, { backgroundColor: category === cat ? colors.primary + "22" : colors.muted, borderColor: category === cat ? colors.primary : colors.border }]}>
                    <Text style={[styles.catText, { color: category === cat ? colors.primary : colors.mutedForeground }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Goal Color</Text>
              <View style={styles.colorRow}>
                {GOAL_COLORS.map((c, i) => (
                  <TouchableOpacity key={c} onPress={() => setColorIdx(i)} style={[styles.colorDot, { backgroundColor: c, borderWidth: colorIdx === i ? 3 : 0, borderColor: colors.foreground }]} activeOpacity={0.8} />
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: GOAL_COLORS[colorIdx] }]} onPress={handleAddGoal} activeOpacity={0.85}>
            <Ionicons name="flag" size={18} color="#fff" />
            <Text style={styles.submitText}>Set Goal</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overviewCard: { borderRadius: 16, padding: 20, gap: 16, marginBottom: 24 },
  overviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  overviewTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  overviewSub: { color: "#ffffff99", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  overviewPct: { borderRadius: 12, padding: 10, alignItems: "center" },
  overviewPctText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  overviewPctSub: { fontSize: 10, fontFamily: "Inter_500Medium" },
  section: { gap: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 4 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  statusGuide: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10, marginTop: 24 },
  statusTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modal: { flex: 1, padding: 24, gap: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  catText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16, gap: 8, marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
