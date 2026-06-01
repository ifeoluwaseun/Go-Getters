"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Goal, Task, TaskPriority } from "@/types";
import { Target, Plus, CheckCircle2, Circle, ListTodo, X, Flag } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

const COLORS = ["#00d8fe", "#00e57d", "#fbbf24", "#a855f7", "#ef4444", "#ec4899", "#f97316"];
const CATEGORIES = ["Recruitment", "Money Making", "Growth", "Leadership", "Personal Dev", "Content", "Other"];
const TASK_CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

export default function Goals() {
  const { goals, tasks, addGoal, addTask, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Create Goal Dialog states
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalColor, setGoalColor] = useState(COLORS[0]);
  const [goalCategory, setGoalCategory] = useState(CATEGORIES[0]);
  const [createLoading, setCreateLoading] = useState(false);

  // Add task to goal dialog states
  const [addTaskGoalId, setAddTaskGoalId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskCategory, setTaskCategory] = useState("Prospecting");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskLoading, setTaskLoading] = useState(false);

  // Handle redirects if user is not approved
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    } else if (!authLoading && currentUser && currentUser.status === "pending") {
      router.push("/pending");
    } else if (!authLoading && currentUser && currentUser.status === "rejected") {
      router.push("/rejected");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || appLoading || !currentUser || currentUser.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setCreateLoading(true);
    try {
      await addGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: goalCategory,
        weekStart: todayStr,
        taskIds: [],
        progress: 0,
        color: goalColor,
      });
      setGoalTitle("");
      setGoalDescription("");
      setGoalCategory(CATEGORIES[0]);
      setGoalColor(COLORS[0]);
      setShowAddGoal(false);
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddTaskToGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !addTaskGoalId) return;
    setTaskLoading(true);
    try {
      await addTask({
        title: taskTitle.trim(),
        category: taskCategory,
        priority: taskPriority,
        dueTime: taskDueTime || undefined,
        status: "pending",
        hasEvidence: false,
        recurring: false,
        date: todayStr,
        goalId: addTaskGoalId,
      });
      setTaskTitle("");
      setTaskDueTime("");
      setTaskCategory("Prospecting");
      setTaskPriority("medium");
      setAddTaskGoalId(null);
    } catch (err) {
      console.error("Failed to add task to goal:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  const getLinkedTasks = (goal: Goal) => {
    return tasks.filter(t => t.goalId === goal.id);
  };

  const activeGoal = addTaskGoalId ? goals.find(g => g.id === addTaskGoalId) : null;

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Weekly Goals
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Set your weekly targets. Track your progress. Win the week.</p>
          </div>
          <button 
            onClick={() => setShowAddGoal(true)}
            className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Goal
          </button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
            <Target size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-bold">No weekly goals set yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Establish your first weekly milestone to direct your daily tasks.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {goals.map((goal) => {
              const linked = getLinkedTasks(goal);
              const completedLinked = linked.filter(t => t.status === "completed");
              return (
                <div 
                  key={goal.id} 
                  className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 relative overflow-hidden transition-all duration-200 hover:border-primary/20"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: goal.color || '#00d8fe' }}
                  />
                  
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                        style={{ backgroundColor: (goal.color || '#00d8fe') + "22", color: goal.color || '#00d8fe' }}
                      >
                        {goal.category}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-2 truncate">{goal.title}</h3>
                    </div>
                    <div
                      className="text-2xl font-black font-mono flex-shrink-0"
                      style={{ color: goal.color || '#00d8fe' }}
                    >
                      {goal.progress}%
                    </div>
                  </div>

                  <div className="space-y-4">
                    {goal.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{goal.description}</p>
                    )}
                    
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${goal.progress}%`,
                          backgroundColor: goal.color || '#00d8fe',
                          boxShadow: `0 0 10px ${(goal.color || '#00d8fe')}55`
                        }}
                      ></div>
                    </div>

                    {/* Linked tasks */}
                    {linked.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/20">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                          Tasks checklist ({completedLinked.length}/{linked.length} done)
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {linked.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs font-semibold py-0.5">
                              {t.status === "completed" ? (
                                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 fill-green-500/10" />
                              ) : (
                                <Circle size={15} className="text-muted-foreground/60 flex-shrink-0" />
                              )}
                              <span className={t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}>
                                {t.title}
                              </span>
                              {t.priority === "high" && (
                                <span className="ml-auto text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-sm font-bold">HIGH</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add task button */}
                    <button
                      onClick={() => setAddTaskGoalId(goal.id)}
                      className="w-full h-10 border border-dashed border-border/80 hover:bg-white/5 text-foreground hover:text-primary hover:border-primary/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ListTodo size={14} /> Link Task to Goal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create Goal Dialog modal ── */}
        {showAddGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddGoal(false)}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">New Weekly Goal</h2>
                <button 
                  onClick={() => setShowAddGoal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleCreateGoalSubmit} className="space-y-4.5 font-medium">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Recruit 3 new team members"
                      autoFocus
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Expand outreach funnel and coordinate with lead generators"
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setGoalCategory(c)}
                          className={`text-[10px] px-3.5 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            goalCategory === c
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</label>
                    <div className="flex gap-2.5 pt-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setGoalColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 ${
                            goalColor === c ? "border-white scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={createLoading}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-3"
                  >
                    {createLoading ? "Creating..." : "Create Goal"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Link Task to Goal Dialog modal ── */}
        {addTaskGoalId && activeGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAddTaskGoalId(null)}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Add Task to Goal</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[280px]">
                    Goal: "{activeGoal.title}"
                  </p>
                </div>
                <button 
                  onClick={() => setAddTaskGoalId(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleAddTaskToGoalSubmit} className="space-y-4.5 font-medium">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="What needs to get done?"
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Time (optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 14:00"
                      value={taskDueTime}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                      className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
                    <div className="flex gap-2.5">
                      {PRIORITIES.map(p => (
                        <button 
                          key={p} 
                          type="button" 
                          onClick={() => setTaskPriority(p)}
                          className={`flex-1 border rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            taskPriority === p
                              ? p === "high" 
                                ? "border-red-500 bg-red-500/15 text-red-400"
                                : p === "medium" 
                                ? "border-yellow-500 bg-yellow-500/15 text-yellow-400"
                                : "border-gray-500 bg-gray-500/15 text-gray-300"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {TASK_CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          type="button" 
                          onClick={() => setTaskCategory(cat)}
                          className={`text-[10px] px-3.5 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            taskCategory === cat 
                              ? "border-primary bg-primary/15 text-primary" 
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={taskLoading}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-3"
                  >
                    {taskLoading ? "Linking..." : "Link Task to Goal"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
