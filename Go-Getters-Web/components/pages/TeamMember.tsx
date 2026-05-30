import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, AlertCircle, Flame, ArrowLeft,
  Send, CheckCheck, XCircle, Clock
} from "lucide-react";
import { TeamMessage } from "@/context/types";

type Tab = "tasks" | "goals" | "evidence" | "messages";

const MSG_TYPE_COLORS: Record<TeamMessage["type"], string> = {
  message: "bg-card border-border",
  note: "bg-yellow-500/10 border-yellow-500/30",
  reminder: "bg-primary/10 border-primary/30",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TeamMemberPage({ params }: { params: { memberId: string } }) {
  const { teamMembers, approveEvidence, rejectEvidence, sendTeamMessage, teamMessages } = useApp();
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("tasks");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<TeamMessage["type"]>("message");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const member = teamMembers.find((m) => m.id === params.memberId);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <p className="font-semibold">Member not found</p>
        <Button variant="outline" onClick={() => setLocation("/team")}>Back to Team</Button>
      </div>
    );
  }

  const messages = teamMessages[member.id] ?? [];

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;
    sendTeamMessage(member.id, message.trim(), currentUser.id, currentUser.name, msgType);
    setMessage("");
  };

  const handleReject = (evId: string) => {
    if (!rejectFeedback.trim()) return;
    rejectEvidence(evId, rejectFeedback);
    setRejectingId(null);
    setRejectFeedback("");
  };

  const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const TABS: { id: Tab; label: string }[] = [
    { id: "tasks", label: `Tasks (${member.tasks.length})` },
    { id: "goals", label: `Goals (${member.goals.length})` },
    { id: "evidence", label: `Evidence (${member.evidence.length})` },
    { id: "messages", label: `Messages (${messages.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => setLocation("/team")} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" data-testid="button-back-team">
        <ArrowLeft size={16} /> Back to Team
      </Button>

      {/* Member Header */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black">{member.name}</h1>
            {member.title && <p className="text-muted-foreground text-sm">{member.title}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-orange-500" />
                <span className="font-bold text-foreground">{member.streak}</span>d streak
              </span>
              <span><span className="font-bold text-green-500">{member.completionRate}%</span> completion</span>
              <span><span className="font-bold text-primary">{member.points.toLocaleString()}</span> pts</span>
              <span>Active {member.lastActive}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
            size="sm"
            data-testid={`button-tab-${t.id}`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="space-y-3">
          {member.tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks</p>
          ) : member.tasks.map((task) => (
            <Card key={task.id} data-testid={`card-task-${task.id}`} className={task.status === "overdue" ? "border-destructive/40 bg-destructive/5" : ""}>
              <CardContent className="p-4 flex items-center gap-3">
                {task.status === "completed" ? (
                  <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                ) : task.status === "overdue" ? (
                  <AlertCircle size={20} className="text-destructive flex-shrink-0" />
                ) : (
                  <Circle size={20} className="text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm">{task.category}</span>
                    {task.dueTime && <span className="flex items-center gap-0.5"><Clock size={10} />{task.dueTime}</span>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                  task.priority === "high" ? "text-red-500 bg-red-500/10" :
                  task.priority === "medium" ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground bg-muted/20"
                }`}>{task.priority}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="space-y-4">
          {member.goals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No goals this week</p>
          ) : member.goals.map((goal) => (
            <Card key={goal.id} data-testid={`card-goal-${goal.id}`} className="relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: goal.color }} />
              <CardContent className="pl-6 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ backgroundColor: goal.color + "22", color: goal.color }}>
                      {goal.category}
                    </span>
                    <h3 className="font-bold mt-1.5">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className="text-xl font-black flex-shrink-0" style={{ color: goal.color }}>{goal.progress}%</div>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Evidence Tab */}
      {tab === "evidence" && (
        <div className="space-y-3">
          {member.evidence.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No evidence submitted</p>
          ) : member.evidence.map((ev) => (
            <Card key={ev.id} data-testid={`card-evidence-${ev.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-sm uppercase">{ev.type}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        ev.status === "approved" ? "text-green-500 bg-green-500/10" :
                        ev.status === "rejected" ? "text-destructive bg-destructive/10" :
                        "text-yellow-500 bg-yellow-500/10"
                      }`}>{ev.status}</span>
                    </div>
                    <p className="font-semibold">{ev.taskTitle}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{ev.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(ev.uploadedAt)}</div>
                </div>

                {ev.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveEvidence(ev.id)} className="gap-1.5 font-semibold" data-testid={`button-approve-${ev.id}`}>
                      <CheckCheck size={14} /> Approve
                    </Button>
                    {rejectingId === ev.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          className="flex-1 bg-background border border-input rounded-md px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Rejection reason..."
                          value={rejectFeedback}
                          onChange={(e) => setRejectFeedback(e.target.value)}
                          data-testid="input-reject-reason"
                        />
                        <Button size="sm" variant="destructive" onClick={() => handleReject(ev.id)} data-testid={`button-confirm-reject-${ev.id}`}>
                          Send
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(ev.id)} className="gap-1.5 text-destructive hover:text-destructive" data-testid={`button-reject-${ev.id}`}>
                        <XCircle size={14} /> Reject
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages yet</p>
            ) : messages.map((msg) => (
              <div key={msg.id} data-testid={`card-message-${msg.id}`} className={`p-3 rounded-lg border ${MSG_TYPE_COLORS[msg.type]}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{msg.senderName}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize px-1.5 py-0.5 rounded-sm bg-muted/30">{msg.type}</span>
                    {timeAgo(msg.sentAt)}
                  </div>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Send Message to {member.name.split(" ")[0]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {(["message", "note", "reminder"] as TeamMessage["type"][]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMsgType(t)}
                    data-testid={`button-msg-type-${t}`}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md border capitalize transition-colors ${
                      msgType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={`Send a ${msgType} to ${member.name.split(" ")[0]}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                data-testid="textarea-message"
              />
              <Button onClick={handleSendMessage} className="w-full gap-2 font-bold" disabled={!message.trim()} data-testid="button-send-message">
                <Send size={16} /> Send {msgType.charAt(0).toUpperCase() + msgType.slice(1)}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
