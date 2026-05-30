import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Evidence as EvidenceType } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle2, Clock, XCircle, Plus, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type FilterType = "all" | "pending" | "approved" | "rejected";

interface EvidenceForm {
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

const EV_TYPES = ["screenshot", "link", "image"] as const;

export default function Evidence() {
  const { evidence, tasks, addEvidence, approveEvidence, rejectEvidence } = useApp();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const [evType, setEvType] = useState<EvidenceType["type"]>("screenshot");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);

  const isAdminOrLeader = currentUser?.role === "admin" || currentUser?.role === "leader";
  const filtered = evidence.filter((e) => filter === "all" || e.status === filter);

  async function handleSubmit() {
    const taskId = selectedTaskId || tasks[0]?.id;
    const task = tasks.find(t => t.id === taskId);
    if (!description.trim()) return;
    if (!task) return;
    setLoading(true);
    try {
      await addEvidence({
        taskId: task.id,
        taskTitle: task.title,
        type: evType,
        description: description.trim(),
        link: link || undefined,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userName: currentUser?.name ?? "You",
      });
      setDescription("");
      setLink("");
      setEvType("screenshot");
      setSelectedTaskId("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id: string) {
    await rejectEvidence(id, rejectFeedback[id] || "Please provide clearer proof.");
    setRejectOpen(null);
    setRejectFeedback(prev => ({ ...prev, [id]: "" }));
  }

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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Task selector */}
              <div className="space-y-1.5">
                <Label>Select Task</Label>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No tasks available</p>
                  ) : tasks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`text-left text-sm px-3 py-2 rounded-md transition-colors font-medium ${
                        (selectedTaskId || tasks[0]?.id) === t.id
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-foreground hover:bg-muted border border-transparent"
                      }`}
                    >
                      {t.title}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">{t.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Evidence type */}
              <div className="space-y-1.5">
                <Label>Evidence Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {EV_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEvType(t)}
                      className={`border rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                        evType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link / Image URL */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-link">
                  {evType === "link" ? "Link URL" : "Image URL (optional)"}
                </Label>
                <div className="relative">
                  <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="ev-link"
                    data-testid="input-evidence-link"
                    className="pl-9"
                    placeholder="https://"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-desc">Description</Label>
                <textarea
                  id="ev-desc"
                  data-testid="input-evidence-desc"
                  className="w-full border border-border rounded-md p-3 text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                  placeholder="Describe what you accomplished..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full font-bold"
                disabled={loading || !description.trim()}
                onClick={handleSubmit}
                data-testid="button-submit-evidence-form"
              >
                {loading ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        {ev.type}
                      </span>
                      <StatusBadge status={ev.status} />
                      {isAdminOrLeader && ev.userName && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                          {ev.userName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold truncate">{ev.taskTitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                        <ExternalLink size={11} />
                        {ev.link.length > 50 ? ev.link.slice(0, 50) + "..." : ev.link}
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
                </div>

                {/* Admin approve/reject actions */}
                {isAdminOrLeader && ev.status === "pending" && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {rejectOpen === ev.id ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Rejection reason..."
                          value={rejectFeedback[ev.id] ?? ""}
                          onChange={e => setRejectFeedback(prev => ({ ...prev, [ev.id]: e.target.value }))}
                          className="text-sm h-8"
                        />
                        <Button size="sm" variant="destructive" onClick={() => handleReject(ev.id)} className="flex-shrink-0">Reject</Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectOpen(null)} className="flex-shrink-0">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveEvidence(ev.id)} className="bg-green-600 hover:bg-green-700 text-white h-8 font-semibold">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectOpen(ev.id)} className="border-destructive text-destructive hover:bg-destructive/10 h-8 font-semibold">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
