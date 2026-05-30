import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CheckCheck, XCircle, Search, Users, Shield, BarChart2, Clock } from "lucide-react";

type Tab = "members" | "leaders" | "approvals" | "reports";

const REJECTION_REASONS = [
  "Incomplete application",
  "Already a member",
  "Does not meet requirements",
  "Spam/suspicious account",
  "Other",
];

export default function Admin() {
  const { currentUser, allUsers, pendingUsers, approveUser, rejectUser } = useAuth();
  const { teamMembers } = useApp();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);

  if (!currentUser || currentUser.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const approvedUsers = allUsers.filter((u) => u.status === "approved");
  const leaders = approvedUsers.filter((u) => u.role === "leader");

  const filteredMembers = approvedUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLeaders = leaders.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleReject = () => {
    if (!rejectId) return;
    rejectUser(rejectId, rejectReason);
    setRejectId(null);
    setRejectReason(REJECTION_REASONS[0]);
  };

  const roleData = [
    { name: "Admin", count: approvedUsers.filter((u) => u.role === "admin").length, color: "#a855f7" },
    { name: "Leaders", count: leaders.length, color: "#00d8fe" },
    { name: "Members", count: approvedUsers.filter((u) => u.role === "member").length, color: "#00e57d" },
  ];

  const avgCompletion = teamMembers.length
    ? Math.round(teamMembers.reduce((a, m) => a + m.completionRate, 0) / teamMembers.length)
    : 0;

  const topStreak = [...teamMembers].sort((a, b) => b.streak - a.streak).slice(0, 3);

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "members", label: "Members", icon: Users },
    { id: "leaders", label: "Leaders", icon: Shield },
    { id: "approvals", label: "Approvals", icon: Clock, badge: pendingUsers.length },
    { id: "reports", label: "Reports", icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your organization.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => { setTab(t.id); setSearch(""); }}
              size="sm"
              data-testid={`button-tab-${t.id}`}
              className="gap-2 relative flex-shrink-0"
            >
              <Icon size={15} /> {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs font-black px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-members" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((u) => (
                  <tr key={u.id} data-testid={`row-member-${u.id}`} className="border-b border-border last:border-0 hover:bg-card/50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        u.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                        u.role === "leader" ? "bg-primary/20 text-primary" :
                        "bg-muted/30 text-muted-foreground"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        u.status === "approved" ? "bg-green-500/10 text-green-500" :
                        u.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-destructive/10 text-destructive"
                      }`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {new Date(u.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaders Tab */}
      {tab === "leaders" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search leaders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-leaders" />
          </div>
          <div className="space-y-3">
            {filteredLeaders.map((leader) => {
              const teamCount = teamMembers.filter((m) => m.leaderId === leader.id).length;
              return (
                <Card key={leader.id} data-testid={`card-leader-${leader.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {leader.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{leader.name}</div>
                      <div className="text-sm text-muted-foreground">{leader.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-lg text-primary">{teamCount}</div>
                      <div className="text-xs text-muted-foreground">team members</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredLeaders.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No leaders found.</p>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {tab === "approvals" && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
              <CheckCheck size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-semibold">No pending applications</p>
              <p className="text-sm mt-1">All applications have been reviewed.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground font-medium">{pendingUsers.length} application{pendingUsers.length > 1 ? "s" : ""} waiting for review</p>
              {pendingUsers.map((user) => (
                <Card key={user.id} data-testid={`card-approval-${user.id}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                            user.role === "leader" ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
                          }`}>{user.role}</span>
                          {user.leaderName && (
                            <span className="text-xs text-muted-foreground">Leader: <span className="text-foreground font-medium">{user.leaderName}</span></span>
                          )}
                          {user.sponsorName && (
                            <span className="text-xs text-muted-foreground">Sponsor: <span className="text-foreground font-medium">{user.sponsorName}</span></span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Applied {new Date(user.joinedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => approveUser(user.id)}
                        className="flex-1 gap-2 font-bold"
                        data-testid={`button-approve-${user.id}`}
                      >
                        <CheckCheck size={16} /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejectId(user.id)}
                        className="flex-1 gap-2 font-bold text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                        data-testid={`button-reject-${user.id}`}
                      >
                        <XCircle size={16} /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Members", value: approvedUsers.length, color: "text-primary" },
              { label: "Avg Completion", value: `${avgCompletion}%`, color: "text-green-500" },
              { label: "Pending Apps", value: pendingUsers.length, color: "text-yellow-500" },
              { label: "Leaders", value: leaders.length, color: "text-purple-400" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-semibold">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Members by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={roleData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1b1e", border: "1px solid #2d2e32", borderRadius: "8px", fontSize: "12px" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Streaks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStreak.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm ${
                    i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-zinc-400 text-black" : "bg-amber-700 text-white"
                  }`}>{i + 1}</div>
                  <div className="flex-1 font-medium">{m.name}</div>
                  <div className="font-black text-orange-500">{m.streak}d</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Select a reason for rejecting this application:</p>
            <div className="space-y-2">
              {REJECTION_REASONS.map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  rejectReason === r ? "border-destructive bg-destructive/10" : "border-border hover:border-destructive/40"
                }`}>
                  <input type="radio" className="sr-only" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    rejectReason === r ? "border-destructive" : "border-muted-foreground"
                  }`}>
                    {rejectReason === r && <div className="w-2 h-2 rounded-full bg-destructive" />}
                  </div>
                  <span className="text-sm font-medium">{r}</span>
                </label>
              ))}
            </div>
            <Button variant="destructive" onClick={handleReject} className="w-full font-bold" data-testid="button-confirm-reject">
              Reject Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
