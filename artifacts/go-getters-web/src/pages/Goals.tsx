import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Goal } from "@/context/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";

const COLORS = ["#00d8fe", "#00e57d", "#fbbf24", "#a855f7", "#ef4444", "#ec4899", "#f97316"];
const CATEGORIES = ["Recruitment", "Sales", "Growth", "Leadership", "Personal Dev", "Content", "Other"];

interface GoalFormValues {
  title: string;
  description: string;
  category: string;
}

export default function Goals() {
  const { goals, tasks, addGoal } = useApp();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>();

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

  const getLinkedTasks = (goal: Goal) =>
    tasks.filter((t) => goal.taskIds.includes(t.id));

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
                <Label htmlFor="goal-category">Category</Label>
                <select
                  id="goal-category"
                  data-testid="select-goal-category"
                  {...register("category", { required: true })}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                    <div>
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
                  <Progress value={goal.progress} className="h-2" style={{ "--progress-color": goal.color } as React.CSSProperties} />

                  {linked.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Linked Tasks ({completedLinked.length}/{linked.length})
                      </p>
                      {linked.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-sm">
                          <ChevronRight size={14} className="text-muted-foreground" />
                          <span className={t.status === "completed" ? "line-through text-muted-foreground" : ""}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
