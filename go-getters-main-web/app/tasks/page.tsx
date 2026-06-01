"use client";

import { useRef, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Task, TaskPriority, Goal } from "@/types";
import { CheckCircle2, Circle, Clock, Flame, AlertCircle, Plus, Flag, Upload, X, ImageIcon, Eye, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

export default function Tasks() {
  const { tasks, goals, completeTask, addEvidence, addTask, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");

  // Add Task state
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDueTime, setAddDueTime] = useState("");
  const [addCategory, setAddCategory] = useState("Prospecting");
  const [addPriority, setAddPriority] = useState<TaskPriority>("medium");
  const [addGoalId, setAddGoalId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Evidence state
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evType, setEvType] = useState<"screenshot" | "link" | "image">("screenshot");
  const [evDescription, setEvDescription] = useState("");
  const [evLink, setEvLink] = useState("");
  const [evLoading, setEvLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const filteredTasks = todayTasks.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const overdue = filteredTasks.filter(t => t.status === "overdue");
  const pending = filteredTasks.filter(t => t.status === "pending");
  const completed = filteredTasks.filter(t => t.status === "completed");

  function openEvidenceDialog(task: Task) {
    setEvidenceTask(task);
    setEvType("screenshot");
    setUploadedImage(null);
    setUploadedFileName("");
    setEvDescription("");
    setEvLink("");
  }

  function closeEvidenceDialog() {
    setEvidenceTask(null);
    setEvType("screenshot");
    setUploadedImage(null);
    setUploadedFileName("");
    setEvDescription("");
    setEvLink("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleAddTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setAddLoading(true);
    try {
      await addTask({
        title: addTitle.trim(),
        category: addCategory,
        priority: addPriority,
        dueTime: addDueTime || undefined,
        status: "pending",
        hasEvidence: false,
        recurring: false,
        date: todayStr,
        goalId: addGoalId || undefined,
      });
      setAddTitle("");
      setAddDueTime("");
      setAddCategory("Prospecting");
      setAddPriority("medium");
      setAddGoalId("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAddEvidenceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!evidenceTask || !evDescription.trim()) return;
    setEvLoading(true);
    try {
      await addEvidence({
        taskId: evidenceTask.id,
        taskTitle: evidenceTask.title,
        type: evType,
        description: evDescription.trim(),
        link: evType === "link" ? evLink : undefined,
        uri: (evType === "screenshot" || evType === "image") && uploadedImage ? uploadedImage : undefined,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userName: currentUser?.name ?? "You",
      });
      closeEvidenceDialog();
    } catch (err) {
      console.error("Failed to submit proof:", err);
    } finally {
      setEvLoading(false);
    }
  }

  function TaskRow({ task }: { task: Task }) {
    const linkedGoal = task.goalId ? goals.find(g => g.id === task.goalId) ?? null : null;
    return (
      <div className={`p-4 md:p-5 rounded-2xl border bg-[#16171b]/40 backdrop-blur-md transition-all ${
        task.status === "completed" 
          ? "border-border/40 opacity-70" 
          : task.status === "overdue" 
          ? "border-destructive/40 bg-destructive/5 hover:border-destructive/60" 
          : "border-border/80 hover:border-primary/20 bg-[#16171b]/20"
      } flex items-start gap-4`}>
        <button
          onClick={() => task.status !== "completed" && completeTask(task.id)}
          className={`mt-0.5 flex-shrink-0 cursor-pointer transition-colors ${
            task.status === "completed" ? "text-green-500" : "text-muted-foreground hover:text-primary"
          }`}
          disabled={task.status === "completed"}
        >
          {task.status === "completed" ? (
            <CheckCircle2 size={22} className="fill-green-500/10" />
          ) : (
            <Circle size={22} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap font-sans">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
              task.priority === "high" ? "bg-red-500/20 text-red-400" :
              task.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-gray-500/20 text-gray-400"
            }`}>{task.priority}</span>
            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-wider">{task.category}</span>
            {linkedGoal && (
              <span className="text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: linkedGoal.color + "22", color: linkedGoal.color }}>
                <Flag size={10} />
                {linkedGoal.title}
              </span>
            )}
            {task.hasEvidence && (
              <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">Proof submitted</span>
            )}
          </div>
          <h3 className={`font-bold text-base mb-1.5 truncate ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
            {task.dueTime && (
              <div className="flex items-center gap-1">
                <Clock size={13} />
                <span className={task.status === "overdue" ? "text-destructive font-black" : ""}>{task.dueTime}</span>
              </div>
            )}
            {task.recurring && (
              <div className="flex items-center gap-1 text-orange-500 font-bold"><Flame size={13} />Daily</div>
            )}
          </div>
        </div>

        <button
          onClick={() => openEvidenceDialog(task)}
          className="flex-shrink-0 text-xs bg-white/5 hover:bg-white/10 border border-border/80 px-3 py-1.5 rounded-lg text-foreground font-bold flex items-center gap-1 cursor-pointer transition-all"
        >
          {task.hasEvidence ? <><Eye size={12} /> Proof</> : <><Upload size={12} /> Proof</>}
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Today's Tasks
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Execute your plan. Protect your streak.</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/20 font-medium">
          {(["all", "pending", "overdue", "completed"] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === f 
                  ? "bg-primary text-black" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task lists */}
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-destructive"><AlertCircle size={16} /> Action Required</h2>
              <div className="space-y-3.5">
                {overdue.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            </div>
          )}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">Up Next</h2>
              <div className="space-y-3.5">
                {pending.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">Done</h2>
              <div className="space-y-3.5">
                {completed.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            </div>
          )}
          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
              <p className="text-sm text-muted-foreground font-bold">No tasks found for this view.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Use "Add Task" to create your first task for today.</p>
            </div>
          )}
        </div>

        {/* ── Evidence submission Dialog modal ── */}
        {evidenceTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={closeEvidenceDialog}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {evidenceTask.hasEvidence ? "View Proof" : "Submit Proof"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[280px]">
                    Task: "{evidenceTask.title}"
                  </p>
                </div>
                <button 
                  onClick={closeEvidenceDialog}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {evidenceTask.hasEvidence ? (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
                      <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-400 text-sm">Proof successfully submitted</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your team leader has been notified and is reviewing this entry.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEvidenceTask({ ...evidenceTask, hasEvidence: false })}
                      className="w-full h-11 bg-white/5 hover:bg-white/10 text-foreground border border-border/80 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Submit Additional Proof
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddEvidenceSubmit} className="space-y-4 font-medium">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["screenshot", "link", "image"] as const).map(t => (
                          <button 
                            key={t} 
                            type="button"
                            onClick={() => { setEvType(t); setUploadedImage(null); setUploadedFileName(""); }}
                            className={`border rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              evType === t 
                                ? "border-primary bg-primary/10 text-primary" 
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {evType === "link" && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link URL</label>
                        <input 
                          type="url" 
                          placeholder="https://" 
                          required
                          value={evLink}
                          onChange={(e) => setEvLink(e.target.value)}
                          className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                        />
                      </div>
                    )}

                    {(evType === "screenshot" || evType === "image") && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload Image</label>
                        <input 
                          ref={fileInputRef} 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileChange} 
                        />
                        {uploadedImage ? (
                          <div className="relative rounded-xl overflow-hidden border border-border bg-black/20">
                            <img src={uploadedImage} alt="Preview" className="w-full max-h-40 object-cover" />
                            <button 
                              type="button"
                              onClick={() => { setUploadedImage(null); setUploadedFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="absolute top-2.5 right-2.5 bg-black/70 rounded-full p-1.5 hover:bg-black/90 cursor-pointer"
                            >
                              <X size={14} className="text-white" />
                            </button>
                            <p className="text-[10px] text-muted-foreground px-3 py-1.5 border-t border-border/40 truncate bg-background/50 font-mono">{uploadedFileName}</p>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border border-dashed border-border/80 rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
                          >
                            <ImageIcon size={22} className="text-muted-foreground/60" />
                            <span className="text-xs font-bold uppercase tracking-wider">Click to upload image</span>
                            <span className="text-[10px] text-muted-foreground/60">PNG, JPG, GIF supported</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Describe what you accomplished..."
                        value={evDescription}
                        onChange={(e) => setEvDescription(e.target.value)}
                        className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={evLoading}
                      className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-2"
                    >
                      {evLoading ? "Submitting..." : "Submit Proof for Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Add Task Dialog modal ── */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdd(false)}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">New Task</h2>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleAddTaskSubmit} className="space-y-4.5 font-medium">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="What needs to get done?"
                      autoFocus
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Time (optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 14:00"
                      value={addDueTime}
                      onChange={(e) => setAddDueTime(e.target.value)}
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
                          onClick={() => setAddPriority(p)}
                          className={`flex-1 border rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            addPriority === p
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
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          type="button" 
                          onClick={() => setAddCategory(cat)}
                          className={`text-[10px] px-3.5 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            addCategory === cat 
                              ? "border-primary bg-primary/15 text-primary" 
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {goals.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link to Goal (optional)</label>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-border rounded-xl p-2 bg-background/30">
                        <button 
                          type="button" 
                          onClick={() => setAddGoalId("")}
                          className={`text-left text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            addGoalId === "" 
                              ? "bg-white/5 text-foreground font-bold" 
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          }`}
                        >
                          None
                        </button>
                        {goals.map(g => (
                          <button 
                            key={g.id} 
                            type="button" 
                            onClick={() => setAddGoalId(g.id)}
                            className={`text-left text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                              addGoalId === g.id 
                                ? "bg-primary/10 text-primary font-bold" 
                                : "text-foreground hover:bg-white/5 hover:text-foreground"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                            <span className="truncate">{g.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={addLoading}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-3"
                  >
                    {addLoading ? "Adding..." : "Add Task"}
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
