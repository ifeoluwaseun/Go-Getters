import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Task } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Clock, Flame, AlertCircle, Plus, Flag, Upload, X, ImageIcon, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

const CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITIES = ["high", "medium", "low"] as const;
type Priority = typeof PRIORITIES[number];

interface AddTaskForm { title: string; dueTime: string; }
interface EvidenceForm { description: string; link: string; }

export default function Tasks() {
  const { tasks, goals, completeTask, addEvidence, addTask } = useApp();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");

  // Add Task state
  const [showAdd, setShowAdd] = useState(false);
  const [addCategory, setAddCategory] = useState("Prospecting");
  const [addPriority, setAddPriority] = useState<Priority>("medium");
  const [addGoalId, setAddGoalId] = useState<string>("");
  const [addLoading, setAddLoading] = useState(false);
  const { register: regTask, handleSubmit: hsTask, reset: resetTask } = useForm<AddTaskForm>();

  // Evidence dialog — single shared dialog driven by state
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evType, setEvType] = useState<"screenshot" | "link" | "image">("screenshot");
  const [evLoading, setEvLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register: regEv, handleSubmit: hsEv, reset: resetEv } = useForm<EvidenceForm>();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const filteredTasks = todayTasks.filter(t => filter === "all" ? true : t.status === filter);
  const overdue = filteredTasks.filter(t => t.status === "overdue");
  const pending = filteredTasks.filter(t => t.status === "pending");
  const completed = filteredTasks.filter(t => t.status === "completed");

  function openEvidenceDialog(task: Task) {
    setEvidenceTask(task);
    setEvType("screenshot");
    setUploadedImage(null);
    setUploadedFileName("");
    resetEv();
  }

  function closeEvidenceDialog() {
    setEvidenceTask(null);
    resetEv();
    setEvType("screenshot");
    setUploadedImage(null);
    setUploadedFileName("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImage(ev.target?.result as string); };
    reader.readAsDataURL(file);
  }

  async function onAddTask(data: AddTaskForm) {
    if (!data.title.trim()) return;
    setAddLoading(true);
    try {
      await addTask({
        title: data.title.trim(),
        category: addCategory,
        priority: addPriority,
        dueTime: data.dueTime || undefined,
        status: "pending",
        hasEvidence: false,
        recurring: false,
        date: today,
        goalId: addGoalId || undefined,
      });
      resetTask();
      setAddCategory("Prospecting");
      setAddPriority("medium");
      setAddGoalId("");
      setShowAdd(false);
    } finally {
      setAddLoading(false);
    }
  }

  async function onSubmitEvidence(data: EvidenceForm) {
    if (!evidenceTask) return;
    setEvLoading(true);
    try {
      await addEvidence({
        taskId: evidenceTask.id,
        taskTitle: evidenceTask.title,
        type: evType,
        description: data.description,
        link: evType === "link" ? data.link : undefined,
        uri: (evType === "screenshot" || evType === "image") && uploadedImage ? uploadedImage : undefined,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userName: currentUser?.name ?? "You",
      });
      closeEvidenceDialog();
    } finally {
      setEvLoading(false);
    }
  }

  // Find the submitted evidence for the active task (if viewing)
  const activeEvidence = evidenceTask
    ? tasks.find(t => t.id === evidenceTask.id)?.hasEvidence
      ? null // we show the submit form anyway so user can add another
      : null
    : null;
  void activeEvidence; // suppress unused warning

  function TaskRow({ task }: { task: Task }) {
    const linkedGoal = task.goalId ? goals.find(g => g.id === task.goalId) ?? null : null;
    return (
      <Card className={`overflow-hidden transition-all duration-200 ${task.status === "completed" ? "opacity-70" : ""} ${task.status === "overdue" ? "border-destructive/50 bg-destructive/5" : ""}`}>
        <CardContent className="p-4 sm:p-6 flex items-start gap-4">
          <button
            onClick={() => task.status !== "completed" && completeTask(task.id)}
            className={`mt-0.5 flex-shrink-0 transition-colors ${task.status === "completed" ? "text-green-500" : "text-muted-foreground hover:text-primary"}`}
            disabled={task.status === "completed"}
          >
            {task.status === "completed" ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                task.priority === "high" ? "bg-red-500/20 text-red-500" :
                task.priority === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                "bg-gray-500/20 text-gray-500"
              }`}>{task.priority}</span>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-sm font-medium">{task.category}</span>
              {linkedGoal && (
                <span className="text-xs px-2 py-0.5 rounded-sm font-medium flex items-center gap-1" style={{ backgroundColor: linkedGoal.color + "22", color: linkedGoal.color }}>
                  <Flag size={10} />
                  {linkedGoal.title.length > 22 ? linkedGoal.title.slice(0, 22) + "…" : linkedGoal.title}
                </span>
              )}
              {task.hasEvidence && (
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-sm font-medium">Proof submitted</span>
              )}
            </div>
            <h3 className={`font-bold text-lg mb-1 truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {task.dueTime && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className={task.status === "overdue" ? "text-destructive font-bold" : ""}>{task.dueTime}</span>
                </div>
              )}
              {task.recurring && (
                <div className="flex items-center gap-1 text-orange-500"><Flame size={14} />Daily</div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 text-xs gap-1"
            onClick={() => openEvidenceDialog(task)}
          >
            {task.hasEvidence ? <><Eye size={12} /> View Proof</> : <><Upload size={12} /> Add Proof</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Today's Tasks</h1>
          <p className="text-muted-foreground">Execute your plan. Protect your streak.</p>
        </div>
        <Button className="font-bold gap-2" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["all", "pending", "overdue", "completed"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} size="sm" className="capitalize">{f}</Button>
        ))}
      </div>

      {/* Task groups */}
      <div className="space-y-8">
        {overdue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-destructive"><AlertCircle size={20} /> Action Required</h2>
            {overdue.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Up Next</h2>
            {pending.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-muted-foreground">Done</h2>
            {completed.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="font-semibold">No tasks found for this view.</p>
            <p className="text-sm mt-1">Use "Add Task" to create your first task for today.</p>
          </div>
        )}
      </div>

      {/* ── Single shared Evidence Dialog ── */}
      <Dialog open={!!evidenceTask} onOpenChange={(open) => { if (!open) closeEvidenceDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {evidenceTask?.hasEvidence ? "Proof" : "Submit Proof"}{evidenceTask ? ` · "${evidenceTask.title}"` : ""}
            </DialogTitle>
          </DialogHeader>

          {evidenceTask?.hasEvidence ? (
            /* View mode — show existing evidence info */
            <div className="space-y-4 pt-2">
              <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-400 text-sm">Proof submitted</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Awaiting leader review</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                // Switch to re-submit mode
                setEvidenceTask({ ...evidenceTask, hasEvidence: false });
              }}>
                Submit Additional Proof
              </Button>
            </div>
          ) : (
            /* Submit mode */
            <form onSubmit={hsEv(onSubmitEvidence)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Evidence Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["screenshot", "link", "image"] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { setEvType(t); setUploadedImage(null); setUploadedFileName(""); }}
                      className={`border rounded-md py-2 text-sm font-semibold transition-colors ${evType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {t === "screenshot" ? "Screenshot" : t === "link" ? "Link" : "Image"}
                    </button>
                  ))}
                </div>
              </div>

              {evType === "link" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ev-link">Link URL</Label>
                  <Input id="ev-link" placeholder="https://" {...regEv("link")} />
                </div>
              )}

              {(evType === "screenshot" || evType === "image") && (
                <div className="space-y-1.5">
                  <Label>Upload Image</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {uploadedImage ? (
                    <div className="relative rounded-md overflow-hidden border border-border">
                      <img src={uploadedImage} alt="Preview" className="w-full max-h-40 object-cover" />
                      <button type="button"
                        onClick={() => { setUploadedImage(null); setUploadedFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80">
                        <X size={14} className="text-white" />
                      </button>
                      <p className="text-xs text-muted-foreground px-2 py-1 bg-muted/80">{uploadedFileName}</p>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-md py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                      <ImageIcon size={24} />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs">PNG, JPG, GIF supported</span>
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="ev-desc">Description <span className="text-muted-foreground font-normal">(required)</span></Label>
                <Input id="ev-desc" placeholder="Describe what you accomplished..." {...regEv("description", { required: true })} />
              </div>

              <Button type="submit" className="w-full font-bold" disabled={evLoading}>
                {evLoading ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Task Dialog ── */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) { resetTask(); setAddGoalId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <form onSubmit={hsTask(onAddTask)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Task Title</Label>
              <Input id="task-title" placeholder="What needs to get done?" autoFocus {...regTask("title", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-time">Due Time (optional)</Label>
              <Input id="task-time" placeholder="e.g. 14:00" {...regTask("dueTime")} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} type="button" onClick={() => setAddPriority(p)}
                    className={`flex-1 border rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                      addPriority === p
                        ? p === "high" ? "border-red-500 bg-red-500/10 text-red-500"
                        : p === "medium" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                        : "border-gray-500 bg-gray-500/10 text-gray-400"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setAddCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${addCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {goals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to Goal <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-border rounded-md p-2">
                  <button type="button" onClick={() => setAddGoalId("")}
                    className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${addGoalId === "" ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50"}`}>
                    None
                  </button>
                  {goals.map(g => (
                    <button key={g.id} type="button" onClick={() => setAddGoalId(g.id)}
                      className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${addGoalId === g.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="truncate">{g.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full font-bold" disabled={addLoading}>
              {addLoading ? "Adding..." : "Add Task"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
