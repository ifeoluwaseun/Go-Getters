import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { GoalCard } from "@/components/GoalCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Goal, TaskPriority } from "@/types";

const GOAL_COLORS = ["#00d8fe", "#00e57d", "#fbbf24", "#a855f7", "#ef4444", "#ff6b35"];
const GOAL_CATEGORIES = ["Recruitment", "Money Making", "Growth", "Leadership", "Content", "Mindset", "Health", "Finance"];
const TASK_CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#fbbf24" },
  { value: "low", label: "Low", color: "#6b7280" },
];

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, tasks, addGoal, addTask } = useApp();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Growth");
  const [colorIdx, setColorIdx] = useState(0);

  // Add task to goal state
  const [addTaskGoal, setAddTaskGoal] = useState<Goal | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskCategory, setTaskCategory] = useState("Prospecting");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const today = new Date().toISOString().split("T")[0];
  const totalProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;

  function handleAddGoal() {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), description: desc.trim(), weekStart: today, category, taskIds: [], progress: 0, color: GOAL_COLORS[colorIdx] });
    setTitle(""); setDesc(""); setShowGoalModal(false);
  }

  async function handleAddTask() {
    if (!taskTitle.trim() || !addTaskGoal) return;
    try {
      await addTask({
        title: taskTitle.trim(),
        category: taskCategory,
        priority: taskPriority,
        dueTime: taskDueTime || undefined,
        status: "pending",
        hasEvidence: false,
        recurring: false,
        date: today,
        goalId: addTaskGoal.id,
      });
      setTaskTitle(""); setTaskDueTime(""); setTaskCategory("Prospecting"); setTaskPriority("medium");
      setAddTaskGoal(null);
      Alert.alert("Task Added", `Task linked to "${addTaskGoal.title}" and added to today's list.`);
    } catch {
      Alert.alert("Error", "Could not add task. Please try again.");
    }
  }

  function getLinkedTasks(goal: Goal) {
    return tasks.filter(t => t.goalId === goal.id || goal.taskIds.includes(t.id));
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
            <TouchableOpacity onPress={() => setShowGoalModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
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
              const goalTasks = getLinkedTasks(goal);
              const completedTasks = goalTasks.filter((t) => t.status === "completed").length;
              return (
                <View key={goal.id}>
                  <GoalCard goal={goal} taskCount={goalTasks.length} completedCount={completedTasks} />
                  {/* Linked tasks mini-list */}
                  {goalTasks.length > 0 && (
                    <View style={[styles.taskList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {goalTasks.slice(0, 4).map(t => (
                        <View key={t.id} style={styles.taskRow}>
                          <Ionicons
                            name={t.status === "completed" ? "checkmark-circle" : "ellipse-outline"}
                            size={14}
                            color={t.status === "completed" ? "#00e57d" : colors.mutedForeground}
                          />
                          <Text
                            style={[styles.taskText, { color: t.status === "completed" ? colors.mutedForeground : colors.foreground }]}
                            numberOfLines={1}
                          >
                            {t.title}
                          </Text>
                          {t.priority === "high" && (
                            <Text style={styles.highBadge}>HIGH</Text>
                          )}
                        </View>
                      ))}
                      {goalTasks.length > 4 && (
                        <Text style={[styles.moreTasks, { color: colors.mutedForeground }]}>
                          +{goalTasks.length - 4} more tasks
                        </Text>
                      )}
                    </View>
                  )}
                  {/* Add task to goal button */}
                  <TouchableOpacity
                    onPress={() => setAddTaskGoal(goal)}
                    style={[styles.addTaskBtn, { borderColor: goal.color + "66" }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="list-outline" size={14} color={goal.color} />
                    <Text style={[styles.addTaskBtnText, { color: goal.color }]}>Add Task to this Goal</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showGoalModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGoalModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Weekly Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)} activeOpacity={0.7}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Task to Goal Modal */}
      <Modal visible={!!addTaskGoal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddTaskGoal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Task to Goal</Text>
                {addTaskGoal && (
                  <Text style={[styles.goalSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {addTaskGoal.title}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setAddTaskGoal(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Task Title</Text>
                <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="What needs to get done?" placeholderTextColor={colors.mutedForeground} value={taskTitle} onChangeText={setTaskTitle} autoFocus />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Due Time (optional)</Text>
                <TextInput style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]} placeholder="e.g. 14:00" placeholderTextColor={colors.mutedForeground} value={taskDueTime} onChangeText={setTaskDueTime} keyboardType="numeric" />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <TouchableOpacity key={p.value} onPress={() => setTaskPriority(p.value)} activeOpacity={0.8} style={[styles.priorityChip, { backgroundColor: taskPriority === p.value ? p.color + "33" : colors.muted, borderColor: taskPriority === p.value ? p.color : colors.border }]}>
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.priorityLabel, { color: taskPriority === p.value ? p.color : colors.mutedForeground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
                <View style={styles.categoryGrid}>
                  {TASK_CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat} onPress={() => setTaskCategory(cat)} activeOpacity={0.8} style={[styles.catChip, { backgroundColor: taskCategory === cat ? colors.primary + "22" : colors.muted, borderColor: taskCategory === cat ? colors.primary : colors.border }]}>
                      <Text style={[styles.catText, { color: taskCategory === cat ? colors.primary : colors.mutedForeground }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: addTaskGoal?.color ?? colors.primary }]}
              onPress={handleAddTask}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.submitText}>Add Task to Goal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  section: { gap: 4 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 4 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  taskList: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginTop: -8, marginBottom: 4, gap: 6 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  highBadge: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ef4444", backgroundColor: "#ef444420", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  moreTasks: { fontSize: 11, fontFamily: "Inter_400Regular", paddingTop: 2 },
  addTaskBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", paddingVertical: 10, marginBottom: 16 },
  addTaskBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modal: { flex: 1, padding: 24, gap: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  goalSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  catText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingVertical: 10, gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16, gap: 8, marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
