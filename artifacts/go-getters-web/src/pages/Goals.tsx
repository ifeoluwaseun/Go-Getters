import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Goal } from "@/context/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus, ChevronRight, CheckCircle2, Circle, ListTodo } from "lucide-react";
import { useForm } from "react-hook-form";

const COLORS = ["#00d8fe", "#00e57d", "#fbbf24", "#a855f7", "#ef4444", "#ec4899", "#f97316"];
const CATEGORIES = ["Recruitment", "Money Making", "Growth", "Leadership", "Personal Dev", "Content", "Other"];
const TASK_CATEGORIES = ["Prospecting", "Follow-Up", "Personal Dev", "Leadership", "Content", "Planning", "Sales", "Admin"];
const PRIORITIES = ["high", "medium", "low"] as const;
type Priority = typeof PRIORITIES[number];

interface GoalFormValues {
  title: string;
  description: string;
  category: string;
}

interface TaskFormValues {
  title: string;
  dueTime: string;
}

export default function Goals() {
  const { goals, tasks, addGoal, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>();

  // Add task to goal state
  const [addTaskGoalId, setAddTaskGoalId] = useState<string | null>(null);
  const [taskCategory, setTaskCategory] = useState("Prospecting");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskLoading, setTaskLoading] = useState(false);
  const { register: regTask, handleSubmit: hsTask, reset: resetTask } = useForm<TaskFormValues>();

  const onSubmit = (data: GoalFormValues) => {
    addGoal({
      title: data.title,
      description: data.description,
      category: data.category,
      weekStart: new Date().toISOString().split("T")[0],
      taskIds: [],
      progress: 0,
      color,
    });
    reset();
    setColor(COLORS[0]);
    setOpen(false);
  };

  async function onAddTask(data: TaskFormValues) {
    if (!data.title.trim() || !addTaskGoalId) return;
    setTaskLoading(true);
    try {
      await addTask({
        title: data.title.trim(),
        category: taskCategory,
        priority: taskPriority,
        dueTime: data.dueTime || undefined,
        status: "pending",
        hasEvidence: false,
        recurring: false,
        date: new Date().toISOString().split("T")[0],
        goalId: addTaskGoalId,
      });
      resetTask();
      setTaskCategory("Prospecting");
      setTaskPriority("medium");
      setAddTaskGoalId(null);
    } finally {
      setTaskLoading(false);
    }
  }

  const getLinkedTasks = (goal: Goal) =>
    tasks.filter((t) => t.goalId === goal.id || goal.taskIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Weekly Goals</h1>
          <p className="text-muted-foreground">Set your targets. Track your progress. Win the week.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2" data-testid="button-add-goal">
              <Plus size={18} /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Weekly Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  data-testid="input-goal-title"
                  placeholder="e.g. Recruit 3 new team members"
                  {...register("title", { required: true })}
                  className={errors.title ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-desc">Description</Label>
                <Input
                  id="goal-desc"
                  data-testid="input-goal-desc"
                  placeholder="Brief description..."
                  {...register("description")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c}
                      className="cursor-pointer"
                    >
                      <input type="radio" value={c} {...register("category", { required: true })} className="sr-only" />
                      <span
                        data-testid={`select-goal-category-${c}`}
                        className="block text-xs px-3 py-1.5 rounded-full border font-medium transition-colors border-border text-muted-foreground hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                      >
                        {c}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? "border-white scale-125" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full font-bold" data-testid="button-submit-goal">
                Create Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Task to Goal dialog */}
      <Dialog open={!!addTaskGoalId} onOpenChange={(o) => { if (!o) { setAddTaskGoalId(null); resetTask(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Task to Goal
              <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                {goals.find(g => g.id === addTaskGoalId)?.title}
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={hsTask(onAddTask)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gt-title">Task Title</Label>
              <Input id="gt-title" placeholder="What needs to get done?" autoFocus {...regTask("title", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gt-time">Due Time (optional)</Label>
              <Input id="gt-time" placeholder="e.g. 14:00" {...regTask("dueTime")} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} type="button" onClick={() => setTaskPriority(p)}
                    className={`flex-1 border rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                      taskPriority === p
                        ? p === "high" ? "border-red-500 bg-red-500/10 text-red-500"
                        : p === "medium" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                        : "border-gray-500 bg-gray-500/10 text-gray-400"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {TASK_CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setTaskCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      taskCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >{cat}</button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={taskLoading}>
              {taskLoading ? "Adding..." : "Add Task to Goal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {goals.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No goals yet</p>
          <p className="text-sm mt-1">Set your first weekly goal to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const linked = getLinkedTasks(goal);
            const completedLinked = linked.filter((t) => t.status === "completed");
            return (
              <Card key={goal.id} data-testid={`card-goal-${goal.id}`} className="relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: goal.color }}
                />
                <CardHeader className="pl-6 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider"
                        style={{ backgroundColor: goal.color + "22", color: goal.color }}
                      >
                        {goal.category}
                      </span>
                      <CardTitle className="text-lg mt-2">{goal.title}</CardTitle>
                    </div>
                    <div
                      className="text-2xl font-black flex-shrink-0"
                      style={{ color: goal.color }}
                    >
                      {goal.progress}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-6 space-y-4">
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                  <Progress value={goal.progress} className="h-2" />

                  {/* Linked tasks */}
                  {linked.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tasks ({completedLinked.length}/{linked.length} done)
                      </p>
                      <div className="space-y-1">
                        {linked.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-sm py-0.5">
                            {t.status === "completed"
                              ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              : <Circle size={14} className="text-muted-foreground flex-shrink-0" />
                            }
                            <span className={t.status === "completed" ? "line-through text-muted-foreground" : ""}>
                              {t.title}
                            </span>
                            {t.priority === "high" && (
                              <span className="ml-auto text-xs text-red-500 font-bold">HIGH</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add task button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dashed"
                    onClick={() => setAddTaskGoalId(goal.id)}
                  >
                    <ListTodo size={14} />
                    Add Task to this Goal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
