"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { CheckCheck, XCircle, Search, Users, Shield, BarChart2, Clock, X, Flag, Flame, Calendar, Award } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

type Tab = "members" | "leaders" | "approvals" | "reports";

const REJECTION_REASONS = [
  "Incomplete application",
  "Already a member",
  "Does not meet requirements",
  "Spam/suspicious account",
  "Other",
];

export default function Admin() {
  const { currentUser, allUsers, pendingUsers, approveUser, rejectUser, adminUpdateUser, isLoading: authLoading } = useAuth();
  const { teamMembers, isLoading: appLoading } = useApp();
  const router = useRouter();
  
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);

  // Connection states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [assignedLeaderId, setAssignedLeaderId] = useState("none");
  const [assignedSponsorName, setAssignedSponsorName] = useState("");

  // Handle redirects if user is not approved or not admin
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    } else if (!authLoading && currentUser && currentUser.status === "pending") {
      router.push("/pending");
    } else if (!authLoading && currentUser && currentUser.status === "rejected") {
      router.push("/rejected");
    } else if (!authLoading && currentUser && currentUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || appLoading || !currentUser || currentUser.status !== "approved" || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
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

  const handleRejectSubmit = async () => {
    if (!rejectId) return;
    try {
      await rejectUser(rejectId, rejectReason);
      setRejectId(null);
      setRejectReason(REJECTION_REASONS[0]);
    } catch (err) {
      console.error("Failed to reject application:", err);
    }
  };

  const handleSaveConnection = async () => {
    if (!selectedUser) return;
    try {
      const selectedLeader = approvedUsers.find(u => u.id === assignedLeaderId);
      const leaderId = selectedLeader ? selectedLeader.id : null;
      const leaderName = selectedLeader ? selectedLeader.name : null;

      // Handle Sponsor Matching
      let sponsorId: string | null = null;
      let sponsorName = assignedSponsorName.trim() || null;
      if (sponsorName) {
        const exactMatch = approvedUsers.find(
          u => u.name.trim().toLowerCase() === sponsorName!.toLowerCase()
        );
        if (exactMatch) {
          sponsorId = exactMatch.id;
          sponsorName = exactMatch.name;
        }
      } else {
        sponsorName = null;
      }

      if (isApproving) {
        await approveUser(selectedUser.id);
      }

      await adminUpdateUser(selectedUser.id, {
        leaderId: leaderId || undefined,
        leaderName: leaderName || undefined,
        sponsorId: sponsorId || undefined,
        sponsorName: sponsorName || undefined
      });

      setManageModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to save connections:", err);
    }
  };

  const adminCount = approvedUsers.filter((u) => u.role === "admin").length;
  const leaderCount = leaders.length;
  const memberCount = approvedUsers.filter((u) => u.role === "member").length;
  const maxRoleCount = Math.max(adminCount, leaderCount, memberCount, 1);

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
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage users, approve registrations, and review organization health.</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/20 font-medium">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button 
                key={t.id} 
                onClick={() => { setTab(t.id); setSearch(""); }}
                className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t.id 
                    ? "bg-primary text-black font-black" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Icon size={14} /> 
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Members */}
        {tab === "members" && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search approved members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-[#16171b]/40 border border-border/80 rounded-xl pl-10 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
              />
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-border bg-[#16171b]/20 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/60 bg-[#16171b]/60 text-muted-foreground font-black uppercase tracking-wider">
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4 hidden sm:table-cell">Email</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4 hidden md:table-cell">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-foreground/80">
                    {filteredMembers.map((u) => (
                      <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-[#16171b]/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-foreground">{u.name}</td>
                        <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell font-mono">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            u.role === "admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/10" :
                            u.role === "leader" ? "bg-primary/20 text-primary border border-primary/25" :
                            "bg-white/5 text-muted-foreground"
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
                            Approved
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsApproving(false);
                              setAssignedLeaderId(u.leaderId || "none");
                              setAssignedSponsorName(u.sponsorName || "");
                              setManageModalOpen(true);
                            }}
                            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-border text-primary font-bold cursor-pointer transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Leaders */}
        {tab === "leaders" && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search organization leaders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-[#16171b]/40 border border-border/80 rounded-xl pl-10 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
              />
            </div>
            
            <div className="space-y-4">
              {filteredLeaders.map((leader) => {
                const teamCount = teamMembers.filter((m) => m.leaderId === leader.id).length;
                const leaderInitials = leader.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={leader.id} className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-4.5 flex items-center gap-4 hover:border-primary/10 transition-all">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/20 to-cyan-500/20 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                      {leaderInitials}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">{leader.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{leader.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0 pr-1">
                      <div className="font-black text-lg text-primary font-mono">{teamCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">members</div>
                    </div>
                  </div>
                );
              })}
              {filteredLeaders.length === 0 && (
                <div className="text-center py-10 bg-[#16171b]/10 border border-dashed border-border/60 rounded-2xl">
                  <p className="text-xs text-muted-foreground font-semibold">No leaders found matching details.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Approvals */}
        {tab === "approvals" && (
          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-16 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
                <CheckCheck size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-bounce" />
                <p className="text-sm text-muted-foreground font-bold">No pending applications</p>
                <p className="text-xs text-muted-foreground/60 mt-1">All registrations have been reviewed and resolved.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{pendingUsers.length} application{pendingUsers.length > 1 ? "s" : ""} waiting for review</p>
                {pendingUsers.map((user) => {
                  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={user.id} className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0 font-semibold text-xs text-muted-foreground">
                          <div className="font-bold text-base text-foreground leading-tight">{user.name}</div>
                          <div className="font-mono mt-0.5">{user.email}</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              user.role === "leader" ? "bg-primary/20 text-primary border border-primary/25" : "bg-white/5 text-muted-foreground"
                            }`}>{user.role}</span>
                            {user.leaderName && (
                              <span>Leader: <span className="text-foreground font-bold">{user.leaderName}</span></span>
                            )}
                            {user.sponsorName && (
                              <span>Sponsor: <span className="text-foreground font-bold">{user.sponsorName}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsApproving(true);
                            setAssignedLeaderId("none");
                            setAssignedSponsorName(user.sponsorName || "");
                            setManageModalOpen(true);
                          }}
                          className="flex-1 h-10 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCheck size={14} /> Approve User
                        </button>
                        <button
                          onClick={() => setRejectId(user.id)}
                          className="flex-1 h-10 border border-destructive/80 text-destructive hover:bg-destructive/10 font-black uppercase text-xs tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <XCircle size={14} /> Reject User
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Tab 4: Reports */}
        {tab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Members", value: approvedUsers.length, color: "text-primary" },
                { label: "Avg Task Completion", value: `${avgCompletion}%`, color: "text-green-500" },
                { label: "Pending Applications", value: pendingUsers.length, color: "text-yellow-500" },
                { label: "Leaders Pool", value: leaders.length, color: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#16171b]/60 border border-border/80 rounded-xl p-4.5 text-center">
                  <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Custom pure CSS bar chart for high aesthetic & zero build issues */}
            <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Members by Role</h3>
              <div className="space-y-4.5 pt-2">
                {[
                  { name: "Admin Pool", count: adminCount, color: "bg-purple-500", colorText: "text-purple-400" },
                  { name: "Leaders Pool", count: leaderCount, color: "bg-primary", colorText: "text-primary" },
                  { name: "Standard Members", count: memberCount, color: "bg-green-500", colorText: "text-green-500" },
                ].map(r => (
                  <div key={r.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-muted-foreground">{r.name}</span>
                      <span className={`font-black font-mono ${r.colorText}`}>{r.count} users</span>
                    </div>
                    <div className="w-full bg-white/5 h-3 rounded-md overflow-hidden">
                      <div 
                        className={`h-full rounded-md ${r.color} transition-all duration-500`}
                        style={{ width: `${(r.count / maxRoleCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Streaks */}
            <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Streaks Board</h3>
              <div className="space-y-4 font-semibold text-xs text-foreground">
                {topStreak.length > 0 ? (
                  topStreak.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-[#0d0d0f]/20 hover:border-primary/10 transition-all">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs font-mono ${
                        i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-zinc-400 text-black" : "bg-amber-700 text-white"
                      }`}>{i + 1}</div>
                      <div className="flex-1 font-bold text-sm">{m.name}</div>
                      <div className="font-black text-orange-500 text-sm font-mono">{m.streak}d 🔥</div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-muted-foreground">No streaks active across organization.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Modal Dialog ── */}
        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRejectId(null)}></div>
            <div className="relative w-full max-w-md bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">Reject Application</h2>
                <button 
                  onClick={() => setRejectId(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 font-semibold text-xs">
                <p className="text-muted-foreground font-medium leading-relaxed">Select a reason for rejecting this application:</p>
                <div className="space-y-2">
                  {REJECTION_REASONS.map((r) => (
                    <label 
                      key={r} 
                      onClick={() => setRejectReason(r)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        rejectReason === r ? "border-destructive bg-destructive/10 text-destructive-foreground" : "border-border hover:border-destructive/40 text-muted-foreground"
                      }`}
                    >
                      <input type="radio" className="sr-only" value={r} checked={rejectReason === r} readOnly />
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        rejectReason === r ? "border-destructive" : "border-muted-foreground"
                      }`}>
                        {rejectReason === r && <div className="w-2.5 h-2.5 rounded-full bg-destructive" />}
                      </div>
                      <span className="font-bold text-xs">{r}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleRejectSubmit}
                  className="w-full h-11 bg-destructive text-destructive-foreground font-black uppercase text-xs tracking-wider rounded-lg hover:bg-destructive/90 transition-all cursor-pointer mt-2"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Manage Connection (Assign Leader/Sponsor) Dialog modal ── */}
        {manageModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setManageModalOpen(false); setSelectedUser(null); }}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isApproving ? "Approve & Connect Member" : "Manage Member Connections"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[280px]">
                    User: "{selectedUser.name}"
                  </p>
                </div>
                <button 
                  onClick={() => { setManageModalOpen(false); setSelectedUser(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 font-semibold text-xs">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Team Leader</label>
                  <select
                    value={assignedLeaderId}
                    onChange={(e) => setAssignedLeaderId(e.target.value)}
                    className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                  >
                    <option value="none" className="bg-[#16171b]">None / No Leader</option>
                    {approvedUsers.map((u) => (
                      <option key={`opt-leader-${u.id}`} value={u.id} className="bg-[#16171b]">
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sponsor Name (optional)</label>
                  <input
                    value={assignedSponsorName}
                    onChange={(e) => setAssignedSponsorName(e.target.value)}
                    placeholder="Type sponsor's name..."
                    className="w-full h-11 bg-background/50 border border-border/85 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
                  />
                  <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed mt-1">
                    Note: If the typed name exactly matches an approved member, they will be linked as sponsor in the system database.
                  </p>
                </div>

                <button 
                  onClick={handleSaveConnection}
                  className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  {isApproving ? "Approve & Save" : "Save Connections"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
