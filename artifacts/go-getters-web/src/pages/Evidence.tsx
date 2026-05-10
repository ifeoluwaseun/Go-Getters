import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Evidence as EvidenceType } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";

type FilterType = "all" | "pending" | "approved" | "rejected";

interface EvidenceForm {
  taskTitle: string;
  type: EvidenceType["type"];
  description: string;
  link: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: EvidenceType["status"] }) {
  if (status === "approved") return (
    <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={12} /> Approved
    </span>
  );
  if (status === "rejected") return (
    <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
      <XCircle size={12} /> Rejected
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
      <Clock size={12} /> Pending
    </span>
  );
}

export default function Evidence() {
  const { evidence, tasks, addEvidence } = useApp();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, watch, reset } = useForm<EvidenceForm>({
    defaultValues: { type: "screenshot" },
  });
  const evidenceType = watch("type");

  const filtered = evidence.filter((e) => filter === "all" || e.status === filter);

  const onSubmit = (data: EvidenceForm) => {
    const matchingTask = tasks.find((t) => t.title.toLowerCase().includes(data.taskTitle.toLowerCase()));
    addEvidence({
      taskId: matchingTask?.id ?? "manual",
      taskTitle: data.taskTitle,
      type: data.type,
      description: data.description,
      link: data.type === "link" ? data.link : undefined,
      status: "pending",
      uploadedAt: new Date().toISOString(),
      userName: currentUser?.name ?? "You",
    });
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Evidence Log</h1>
          <p className="text-muted-foreground">Prove your work. Build trust through accountability.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2" data-testid="button-submit-evidence">
              <Plus size={18} /> Submit Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Evidence</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-task">Task Name</Label>
                <Input
                  id="ev-task"
                  data-testid="input-evidence-task"
                  placeholder="e.g. Morning Prospecting"
                  {...register("taskTitle", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Evidence Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["screenshot", "link", "image"] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex items-center justify-center border rounded-md py-2 text-sm font-semibold cursor-pointer transition-colors ${
                        evidenceType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <input type="radio" value={t} {...register("type")} className="sr-only" />
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-desc">Description</Label>
                <Input
                  id="ev-desc"
                  data-testid="input-evidence-desc"
                  placeholder="Brief description of what you did..."
                  {...register("description", { required: true })}
                />
              </div>
              {evidenceType === "link" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ev-link">Link URL</Label>
                  <Input
                    id="ev-link"
                    data-testid="input-evidence-link"
                    placeholder="https://"
                    {...register("link")}
                  />
                </div>
              )}
              <Button type="submit" className="w-full font-bold" data-testid="button-submit-evidence-form">
                Submit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["all", "pending", "approved", "rejected"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            size="sm"
            data-testid={`button-filter-${f}`}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <Camera size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No evidence found</p>
          <p className="text-sm mt-1">Submit evidence to build your accountability record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <Card key={ev.id} data-testid={`card-evidence-${ev.id}`}>
              <CardContent className="p-4 sm:p-6 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {ev.type}
                    </span>
                    <StatusBadge status={ev.status} />
                  </div>
                  <h3 className="font-bold truncate">{ev.taskTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                  {ev.link && (
                    <a href={ev.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 block truncate">
                      {ev.link}
                    </a>
                  )}
                  {ev.feedback && (
                    <p className="text-xs text-destructive mt-2 bg-destructive/10 px-2 py-1 rounded">
                      Feedback: {ev.feedback}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0 pt-1">
                  {timeAgo(ev.uploadedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
