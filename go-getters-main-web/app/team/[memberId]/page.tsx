"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TeamMessage, TeamMember, Task, Goal, Evidence } from "@/types";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Circle, AlertCircle, Flame, ArrowLeft, Send, CheckCheck, XCircle, Clock, Star, Trophy, Award, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter, useParams } from "next/navigation";

type Tab = "tasks" | "goals" | "evidence" | "messages";

const MSG_TYPE_COLORS: Record<TeamMessage["type"], string> = {
  message: "bg-[#16171b]/50 border-border/80",
  note: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  reminder: "bg-primary/10 border-primary/30 text-primary",
};

const BADGE_ICONS: Record<string, React.ElementType> = {
  consistency: Star,
  performance: Trophy,
  leadership: Award,
  growth: TrendingUp,
};

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

export default function TeamMemberPage() {
  const { teamMembers, approveEvidence, rejectEvidence, sendTeamMessage, teamMessages, loadTeamMessages, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const [tab, setTab] = useState<Tab>("tasks");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<TeamMessage["type"]>("message");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const [memberTasks, setMemberTasks] = useState<Task[]>([]);
  const [memberGoals, setMemberGoals] = useState<Goal[]>([]);
  const [memberEvidence, setMemberEvidence] = useState<Evidence[]>([]);
  const [loadingMemberData, setLoadingMemberData] = useState(true);

  // Handle redirects if user is not approved or is a standard member
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    } else if (!authLoading && currentUser && currentUser.status === "pending") {
      router.push("/pending");
    } else if (!authLoading && currentUser && currentUser.status === "rejected") {
      router.push("/rejected");
    } else if (!authLoading && currentUser && currentUser.role === "member") {
      router.push("/dashboard");
    }
  }, [currentUser, authLoading, router]);

  // Load team messages and fetch specific member data
  useEffect(() => {
    if (memberId) {
      loadTeamMessages(memberId);
    }
  }, [memberId, loadTeamMessages]);

  useEffect(() => {
    if (!memberId) return;

    async function fetchMemberDetails() {
      setLoadingMemberData(true);
      try {
        // Fetch tasks
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", memberId)
          .order("created_at", { ascending: true });

        // Fetch goals
        const { data: goalsData } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", memberId)
          .order("created_at", { ascending: true });

        // Fetch evidence
        const { data: evidenceData } = await supabase
          .from("evidence")
          .select("*")
          .eq("user_id", memberId)
          .order("uploaded_at", { ascending: false });

        if (tasksData) {
          setMemberTasks(tasksData.map(t => ({
            id: t.id,
            goalId: t.goal_id || undefined,
            title: t.title,
            description: t.description || undefined,
            category: t.category,
            dueTime: t.due_time || undefined,
            priority: t.priority as any,
            status: t.status as any,
            hasEvidence: t.has_evidence,
            recurring: t.recurring,
            notes: t.notes || undefined,
            date: t.date,
            completedAt: t.completed_at || undefined,
          })));
        }

        if (goalsData) {
          setMemberGoals(goalsData.map(g => ({
            id: g.id,
            title: g.title,
            description: g.description,
            weekStart: g.week_start,
            category: g.category,
            progress: g.progress,
            color: g.color,
            taskIds: [],
          })));
        }

        if (evidenceData) {
          setMemberEvidence(evidenceData.map(e => ({
            id: e.id,
            taskId: e.task_id,
            taskTitle: e.task_title,
            type: e.type as any,
            uri: e.uri || undefined,
            link: e.link || undefined,
            description: e.description,
            status: e.status as any,
            feedback: e.feedback || undefined,
            uploadedAt: e.uploaded_at,
            userName: e.user_name,
          })));
        }
      } catch (err) {
        console.error("Failed to load team member data:", err);
      } finally {
        setLoadingMemberData(false);
      }
    }

    fetchMemberDetails();
  }, [memberId]);

  if (authLoading || appLoading || !currentUser || currentUser.status !== "approved" || currentUser.role === "member") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const member = teamMembers.find((m) => m.id === memberId);

  if (!member) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground font-sans">
          <p className="font-bold text-sm">Team member profile not found</p>
          <button 
            onClick={() => router.push("/team")}
            className="h-9 px-4 border border-border/80 hover:bg-white/5 text-foreground font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            Back to Team
          </button>
        </div>
      </Layout>
    );
  }

  const messages = teamMessages[member.id] ?? [];

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;
    sendTeamMessage(member.id, message.trim(), currentUser.id, currentUser.name, msgType);
    setMessage("");
  };

  const handleApproveEvidence = async (evId: string) => {
    try {
      await approveEvidence(evId);
      setMemberEvidence(prev => prev.map(e => e.id === evId ? { ...e, status: "approved" as const } : e));
    } catch (err) {
      console.error("Failed to approve proof:", err);
    }
  };

  const handleRejectSubmit = async (evId: string) => {
    if (!rejectFeedback.trim()) return;
    try {
      await rejectEvidence(evId, rejectFeedback);
      setMemberEvidence(prev => prev.map(e => e.id === evId ? { ...e, status: "rejected" as const, feedback: rejectFeedback } : e));
      setRejectingId(null);
      setRejectFeedback("");
    } catch (err) {
      console.error("Failed to reject proof:", err);
    }
  };

  const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const TABS: { id: Tab; label: string }[] = [
    { id: "tasks", label: `Tasks (${memberTasks.length})` },
    { id: "goals", label: `Goals (${memberGoals.length})` },
    { id: "evidence", label: `Evidence (${memberEvidence.length})` },
    { id: "messages", label: `Notes (${messages.length})` },
  ];

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push("/team")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-black uppercase tracking-wider cursor-pointer transition-all -ml-2 p-2 hover:bg-white/5 rounded-lg"
        >
          <ArrowLeft size={16} /> Back to Team
        </button>

        {/* Member Profile Summary Card */}
        <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-cyan-500/20 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl flex-shrink-0 shadow-[0_0_15px_rgba(0,216,254,0.1)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h1 className="text-2xl font-black text-foreground">{member.name}</h1>
            {member.title && <p className="text-muted-foreground text-xs font-semibold mt-1">{member.title}</p>}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-orange-500" />
                <span className="font-bold text-foreground">{member.streak}</span>d streak
              </span>
              <span><span className="font-bold text-green-500">{member.completionRate}%</span> completion</span>
              <span><span className="font-bold text-primary">{member.points.toLocaleString()}</span> pts</span>
              <span className="font-mono">Last Active: {member.lastActive}</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/20 font-medium">
          {TABS.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                tab === t.id 
                  ? "bg-primary text-black font-black" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Tasks, Goals, Evidence */}
        {loadingMemberData && tab !== "messages" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-wider animate-pulse">Syncing member accountability data...</p>
          </div>
        ) : (
          <>
            {/* Tab Content: Tasks */}
            {tab === "tasks" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {memberTasks.length === 0 ? (
                  <div className="text-center py-10 bg-[#16171b]/10 border border-dashed border-border/60 rounded-2xl">
                    <p className="text-xs text-muted-foreground font-semibold">No tasks scheduled for this member.</p>
                  </div>
                ) : (
                  memberTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                        task.status === "completed" 
                          ? "border-border/40 opacity-70 bg-[#16171b]/10" 
                          : task.status === "overdue" 
                          ? "border-destructive/40 bg-destructive/5" 
                          : "border-border/80 bg-[#16171b]/20"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 fill-green-500/10" />
                      ) : task.status === "overdue" ? (
                        <AlertCircle size={20} className="text-destructive flex-shrink-0" />
                      ) : (
                        <Circle size={20} className="text-muted-foreground/60 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                           {task.title}
                        </p>
                        <div className="flex gap-2.5 mt-1 text-[10px] text-muted-foreground font-black uppercase tracking-wider items-center">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">{task.category}</span>
                          {task.dueTime && <span className="flex items-center gap-0.5"><Clock size={10} /> {task.dueTime}</span>}
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${
                        task.priority === "high" ? "text-red-400 bg-red-500/15 border border-red-500/10" :
                        task.priority === "medium" ? "text-yellow-400 bg-yellow-500/15 border border-yellow-500/10" : "text-muted-foreground bg-white/5"
                      }`}>{task.priority}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab Content: Goals */}
            {tab === "goals" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {memberGoals.length === 0 ? (
                  <div className="text-center py-10 bg-[#16171b]/10 border border-dashed border-border/60 rounded-2xl">
                    <p className="text-xs text-muted-foreground font-semibold">No goals set for this member this week.</p>
                  </div>
                ) : (
                  memberGoals.map((goal) => (
                    <div 
                      key={goal.id} 
                      className="relative overflow-hidden bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-5"
                    >
                      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: goal.color || '#00d8fe' }} />
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div>
                          <span 
                            className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider" 
                            style={{ backgroundColor: (goal.color || '#00d8fe') + "22", color: goal.color || '#00d8fe' }}
                          >
                            {goal.category}
                          </span>
                          <h3 className="font-bold text-foreground text-sm mt-2">{goal.title}</h3>
                          {goal.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{goal.description}</p>}
                        </div>
                        <div className="text-xl font-black font-mono flex-shrink-0" style={{ color: goal.color || '#00d8fe' }}>{goal.progress}%</div>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${goal.progress}%`,
                            backgroundColor: goal.color || '#00d8fe',
                            boxShadow: `0 0 10px ${(goal.color || '#00d8fe')}55`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab Content: Evidence review queue */}
            {tab === "evidence" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {memberEvidence.length === 0 ? (
                  <div className="text-center py-10 bg-[#16171b]/10 border border-dashed border-border/60 rounded-2xl">
                    <p className="text-xs text-muted-foreground font-semibold">No task evidence submitted by this member.</p>
                  </div>
                ) : (
                  memberEvidence.map((ev) => (
                    <div key={ev.id} className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2 items-center">
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">{ev.type}</span>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              ev.status === "approved" ? "text-green-400 bg-green-500/10" :
                              ev.status === "rejected" ? "text-destructive bg-destructive/10" :
                              "text-yellow-400 bg-yellow-500/10 animate-pulse"
                            }`}>{ev.status}</span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{ev.taskTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold flex-shrink-0 font-mono">{timeAgo(ev.uploadedAt)}</div>
                      </div>

                      {ev.status === "pending" && (
                        <div className="flex gap-2 border-t border-border/20 pt-4 flex-wrap">
                          <button 
                            onClick={() => handleApproveEvidence(ev.id)} 
                            className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCheck size={12} /> Approve Proof
                          </button>
                          {rejectingId === ev.id ? (
                            <div className="flex gap-2 w-full mt-2">
                              <input
                                className="flex-1 h-9 bg-background/50 border border-border/80 rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
                                placeholder="Rejection reason..."
                                value={rejectFeedback}
                                onChange={(e) => setRejectFeedback(e.target.value)}
                              />
                              <button 
                                onClick={() => handleRejectSubmit(ev.id)} 
                                className="h-9 px-4 bg-destructive text-destructive-foreground font-black text-xs uppercase tracking-wider rounded-lg hover:bg-destructive/90 transition-all cursor-pointer"
                              >
                                Send
                              </button>
                              <button 
                                onClick={() => setRejectingId(null)} 
                                className="h-9 px-3 border border-border hover:bg-white/5 text-foreground font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setRejectingId(ev.id)} 
                              className="h-8 px-4 border border-destructive text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              <XCircle size={12} /> Reject Proof
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Tab Content: Messages / Accountability Notes */}
        {tab === "messages" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 font-bold">No accountability notes written yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-xl border ${MSG_TYPE_COLORS[msg.type] ?? "bg-[#16171b]/50 border-border/80 text-foreground"}`}>
                    <div className="flex justify-between items-center mb-2 font-medium">
                      <span className="font-bold text-xs">{msg.senderName}</span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize px-2 py-0.5 rounded bg-background/50 font-black tracking-wider text-[9px]">{msg.type}</span>
                        <span className="font-mono">{timeAgo(msg.sentAt)}</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Send note form */}
            <form onSubmit={handleSendMessageSubmit} className="bg-[#16171b]/60 backdrop-blur-md rounded-2xl border border-border/80 p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Send Accountability Note to {member.name.split(" ")[0]}</h3>
              
              <div className="flex gap-2">
                {(["message", "note", "reminder"] as TeamMessage["type"][]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMsgType(t)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg border capitalize transition-colors cursor-pointer ${
                      msgType === t 
                        ? "border-primary bg-primary/10 text-primary font-black" 
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <textarea
                placeholder={`Type your accountability ${msgType} here...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                className="w-full bg-background/50 border border-border/85 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans resize-none"
              />
              
              <button 
                type="submit" 
                disabled={!message.trim()}
                className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send size={14} /> Send {msgType}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
