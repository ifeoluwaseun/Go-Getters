"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TeamMember } from "@/types";
import { Flame, Search, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  if (status === "active") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
      <CheckCircle2 size={11} /> Active
    </span>
  );
  if (status === "at-risk") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md animate-pulse">
      <AlertTriangle size={11} /> At Risk
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
      Inactive
    </span>
  );
}

export default function Team() {
  const { teamMembers, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Handle redirects if user is not approved or not leader/admin
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

  if (authLoading || appLoading || !currentUser || currentUser.status !== "approved" || currentUser.role === "member") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const visible = currentUser.role === "admin"
    ? teamMembers
    : teamMembers.filter((m) => m.leaderId === currentUser.id);

  const filtered = visible.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const avgCompletion = filtered.length
    ? Math.round(filtered.reduce((a, m) => a + m.completionRate, 0) / filtered.length)
    : 0;

  const atRisk = filtered.filter((m) => m.status === "at-risk").length;

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Team Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {currentUser.role === "admin" ? "Complete analytics for all members in the organization" : "Direct reports analytics"}
          </p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-primary font-mono">{filtered.length}</div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">Members</div>
          </div>
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-500 font-mono">{avgCompletion}%</div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">Avg Completion</div>
          </div>
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-4 text-center">
            <div className={`text-2xl font-black font-mono ${atRisk > 0 ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`}>{atRisk}</div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">At Risk</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search team members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-[#16171b]/40 border border-border/80 rounded-xl pl-10 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans"
          />
        </div>

        {/* Member cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
            <Users size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-bold">No members found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((member) => {
              const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div
                  key={member.id}
                  onClick={() => router.push(`/team/${member.id}`)}
                  className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-5 flex items-center gap-4 hover:border-primary/20 hover:bg-[#16171b]/60 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/20 to-cyan-500/20 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:shadow-[0_0_12px_rgba(0,216,254,0.1)] transition-all">
                    {initials}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{member.name}</span>
                      <StatusBadge status={member.status} />
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        member.role === "leader" ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground"
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Flame size={12} className="text-orange-500" />
                        <span className="font-bold text-foreground">{member.streak}</span>d streak
                      </span>
                      <span>
                        <span className="font-bold text-green-500">{member.completionRate}%</span> done
                      </span>
                      <span className="hidden sm:inline font-mono">Last Active: {member.lastActive}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pr-1 hidden sm:block">
                    <div className="text-lg font-black text-primary font-mono">{member.points.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
