"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Evidence as EvidenceType } from "@/types";
import { Camera, CheckCircle2, Clock, XCircle, Plus, Link as LinkIcon, ExternalLink, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

type FilterType = "all" | "pending" | "approved" | "rejected";

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return `just now`;
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch (e) {
    return "some time ago";
  }
}

function StatusBadge({ status }: { status: EvidenceType["status"] }) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
      <CheckCircle2 size={11} /> Approved
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
      <XCircle size={11} /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md">
      <Clock size={11} /> Pending
    </span>
  );
}

export default function Evidence() {
  const { evidence, tasks, addEvidence, approveEvidence, rejectEvidence, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const [evType, setEvType] = useState<EvidenceType["type"]>("screenshot");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);

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

  const isAdminOrLeader = currentUser?.role === "admin" || currentUser?.role === "leader";
  const filtered = evidence.filter((e) => filter === "all" || e.status === filter);

  async function handleEvidenceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const taskId = selectedTaskId || tasks[0]?.id;
    const task = tasks.find(t => t.id === taskId);
    if (!description.trim() || !task) return;
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
    } catch (err) {
      console.error("Failed to submit evidence:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectSubmit(id: string) {
    if (loading) return;
    setLoading(true);
    try {
      await rejectEvidence(id, rejectFeedback[id] || "Please provide clearer proof.");
      setRejectOpen(null);
      setRejectFeedback(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to reject evidence:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Evidence Log
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Prove your work. Build trust through accountability.</p>
          </div>
          <button 
            onClick={() => setOpen(true)}
            className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Submit Evidence
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/20 font-medium">
          {(["all", "pending", "approved", "rejected"] as FilterType[]).map((f) => (
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

        {/* Evidence List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
            <Camera size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-bold">No evidence found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Submit your completed task proof to establish your transparency record.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ev) => (
              <div 
                key={ev.id} 
                className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/85 p-5 sm:p-6 transition-all hover:border-primary/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {ev.type}
                      </span>
                      <StatusBadge status={ev.status} />
                      {isAdminOrLeader && ev.userName && (
                        <span className="text-[9px] font-black text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {ev.userName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground truncate">{ev.taskTitle}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ev.description}</p>
                    
                    {ev.link && (
                      <a 
                        href={ev.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2.5 font-semibold"
                      >
                        <ExternalLink size={11} /> Link: {ev.link.length > 40 ? ev.link.slice(0, 40) + "..." : ev.link}
                      </a>
                    )}

                    {ev.feedback && (
                      <div className="text-xs text-destructive mt-3.5 bg-destructive/5 border border-destructive/20 p-3 rounded-lg font-medium">
                        Leader Feedback: {ev.feedback}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold flex-shrink-0 pt-1 font-mono">
                    {timeAgo(ev.uploadedAt)}
                  </div>
                </div>

                {/* Admin actions overlay */}
                {isAdminOrLeader && ev.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-2">
                    {rejectOpen === ev.id ? (
                      <div className="flex gap-2 w-full">
                        <input
                          placeholder="Provide reasons for rejection..."
                          value={rejectFeedback[ev.id] ?? ""}
                          onChange={e => setRejectFeedback(prev => ({ ...prev, [ev.id]: e.target.value }))}
                          className="flex-1 h-9 bg-background/50 border border-border/80 rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                        />
                        <button 
                          onClick={() => handleRejectSubmit(ev.id)} 
                          className="h-9 px-4 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-destructive/90 transition-all cursor-pointer flex-shrink-0"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => setRejectOpen(null)} 
                          className="h-9 px-4 border border-border hover:bg-white/5 text-foreground font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex-shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => approveEvidence(ev.id)} 
                          className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                        >
                          Approve Proof
                        </button>
                        <button 
                          onClick={() => setRejectOpen(ev.id)} 
                          className="h-8 px-4 border border-destructive text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                        >
                          Reject Proof
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Submit Evidence Dialog modal ── */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">Submit Evidence</h2>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleEvidenceSubmit} className="space-y-4.5 font-medium">
                  {/* Task Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Completed Task</label>
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-border rounded-xl p-2 bg-background/30 pr-1">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4 font-bold">No tasks scheduled today</p>
                      ) : (
                        tasks.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTaskId(t.id)}
                            className={`text-left text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                              (selectedTaskId || tasks[0]?.id) === t.id
                                ? "bg-primary/10 text-primary border-primary/30 font-bold"
                                : "text-foreground hover:bg-white/5 border-transparent hover:text-foreground"
                            }`}
                          >
                            <div className="truncate font-bold">{t.title}</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5 font-semibold flex gap-2">
                              <span>Cat: {t.category}</span>
                              {t.status === 'completed' && <span className="text-green-400">Done</span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Evidence Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["screenshot", "link", "image"] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEvType(t)}
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

                  {/* Link / URL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {evType === "link" ? "Link URL" : "Media URL (optional)"}
                    </label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        type="url"
                        placeholder="https://"
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        required={evType === "link"}
                        className="w-full h-11 bg-background/50 border border-border/85 rounded-lg pl-10 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                    <textarea
                      placeholder="Describe what you accomplished..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-background/50 border border-border/85 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !description.trim() || tasks.length === 0}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-3"
                  >
                    {loading ? "Submitting..." : "Submit Proof"}
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
