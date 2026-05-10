import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Task } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Clock, Flame, AlertCircle, Plus, Flag } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

const CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITIES = ["high", "medium", "low"] as const;
type Priority = typeof PRIORITIES[number];

interface AddTaskForm {
  title: string;
  dueTime: string;
}

interface EvidenceForm {
  taskId: string;
  type: "screenshot" | "link" | "image";
  description: string;
  link: string;
}

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

  // Evidence dialog state
  const [evidenceTaskId, setEvidenceTaskId] = useState<string | null>(null);
  const [evType, setEvType] = useState<EvidenceForm["type"]>("screenshot");
  const [evLoading, setEvLoading] = useState(false);
  const { register: regEv, handleSubmit: hsEv, reset: resetEv } = useForm<EvidenceForm>({ defaultValues: { type: "screenshot" } });

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.date === today);

  const filteredTasks = todayTasks.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const overdue = filteredTasks.filter(t => t.status === "overdue");
  const pending = filteredTasks.filter(t => t.status === "pending");
  const completed = filteredTasks.filter(t => t.status === "completed");

  function getGoalForTask(task: Task) {
    if (!task.goalId) return null;
    return goals.find(g => g.id === task.goalId) ?? null;
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
    const task = tasks.find(t => t.id === evidenceTaskId);
    if (!task) return;
    setEvLoading(true);
    try {
      await addEvidence({
        taskId: task.id,
        taskTitle: task.title,
        type: evType,
        description: data.description,
        link: evType === "link" ? data.link : undefined,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userName: currentUser?.name ?? "You",
      });
      resetEv();
      setEvType("screenshot");
      setEvidenceTaskId(null);
    } finally {
      setEvLoading(false);
    }
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const linkedGoal = getGoalForTask(task);
    return (
      <Card className={`overflow-hidden transition-all duration-200 ${
        task.status === "completed" ? "opacity-70" : ""
      } ${task.status === "overdue" ? "border-destructive/50 bg-destructive/5" : ""}`}>
        <CardContent className="p-4 sm:p-6 flex items-start gap-4">
          <button
            onClick={() => task.status !== "completed" && completeTask(task.id)}
            className={`mt-0.5 flex-shrink-0 transition-colors ${
              task.status === "completed" ? "text-green-500" : "text-muted-foreground hover:text-primary"
            }`}
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
              }`}>
                {task.priority}
              </span>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-sm font-medium">
                {task.category}
              </span>
              {linkedGoal && (
                <span
                  className="text-xs px-2 py-0.5 rounded-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: linkedGoal.color + "22", color: linkedGoal.color }}
                >
                  <Flag size={10} />
                  {linkedGoal.title.length > 22 ? linkedGoal.title.slice(0, 22) + "…" : linkedGoal.title}
                </span>
              )}
            </div>

            <h3 className={`font-bold text-lg mb-1 truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {task.dueTime && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className={task.status === "overdue" ? "text-destructive font-bold" : ""}>{task.dueTime}</span>
                </div>
              )}
              {task.recurring && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame size={14} />
                  Daily
                </div>
              )}
            </div>
          </div>

          {task.status === "completed" && !task.hasEvidence && (
            <Dialog open={evidenceTaskId === task.id} onOpenChange={(o) => { setEvidenceTaskId(o ? task.id : null); if (!o) resetEv(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex flex-shrink-0">Add Proof</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Evidence for "{task.title}"</DialogTitle>
                </DialogHeader>
                <form onSubmit={hsEv(onSubmitEvidence)} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Evidence Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["screenshot", "link", "image"] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEvType(t)}
                          className={`border rounded-md py-2 text-sm font-semibold transition-colors ${
                            evType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
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
                      <Label htmlFor="ev-url">Image URL (optional)</Label>
                      <Input id="ev-url" placeholder="https://..." {...regEv("link")} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="ev-desc">Description</Label>
                    <Input id="ev-desc" placeholder="Describe what you accomplished..." {...regEv("description", { required: true })} />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={evLoading}>
                    {evLoading ? "Submitting..." : "Submit for Review"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Today's Tasks</h1>
          <p className="text-muted-foreground">Execute your plan. Protect your streak.</p>
        </div>

        <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) { resetTask(); setAddGoalId(""); } }}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Plus size={18} /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={hsTask(onAddTask)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="What needs to get done?"
                  autoFocus
                  {...regTask("title", { required: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-time">Due Time (optional)</Label>
                <Input
                  id="task-time"
                  placeholder="e.g. 14:00"
                  {...regTask("dueTime")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAddPriority(p)}
                      className={`flex-1 border rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                        addPriority === p
                          ? p === "high" ? "border-red-500 bg-red-500/10 text-red-500"
                          : p === "medium" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                          : "border-gray-500 bg-gray-500/10 text-gray-400"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        addCategory === cat
                          ? "border-primary bg-primary/10 text-primary"
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
                  <Label>Link to Goal <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-border rounded-md p-2">
                    <button
                      type="button"
                      onClick={() => setAddGoalId("")}
                      className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                        addGoalId === "" ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      None
                    </button>
                    {goals.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setAddGoalId(g.id)}
                        className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                          addGoalId === g.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"
                        }`}
                      >
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

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">All</Button>
        <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")} size="sm">Pending</Button>
        <Button variant={filter === "overdue" ? "default" : "outline"} onClick={() => setFilter("overdue")} size="sm">Overdue</Button>
        <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")} size="sm">Completed</Button>
      </div>

      <div className="space-y-8">
        {overdue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertCircle size={20} /> Action Required
            </h2>
            {overdue.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Up Next</h2>
            {pending.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-muted-foreground">Done</h2>
            {completed.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="font-semibold">No tasks found for this view.</p>
            <p className="text-sm mt-1">Use "Add Task" to create your first task for today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
