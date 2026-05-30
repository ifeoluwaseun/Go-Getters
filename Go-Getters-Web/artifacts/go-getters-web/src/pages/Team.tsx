import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TeamMember } from "@/context/types";
import { Flame, Search, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  if (status === "active") return (
    <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> Active
    </span>
  );
  if (status === "at-risk") return (
    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
      <AlertTriangle size={11} /> At Risk
    </span>
  );
  return (
    <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
      Inactive
    </span>
  );
}

export default function Team() {
  const { teamMembers } = useApp();
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  if (!currentUser || currentUser.role === "member") {
    setLocation("/dashboard");
    return null;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          {currentUser.role === "admin" ? "All members across the organization" : "Your team members"}
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-primary">{filtered.length}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-green-500">{avgCompletion}%</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Avg Completion</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-black ${atRisk > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>{atRisk}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">At Risk</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-members"
        />
      </div>

      {/* Member List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => {
            const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <Card
                key={member.id}
                data-testid={`card-member-${member.id}`}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setLocation(`/team/${member.id}`)}
              >
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{member.name}</span>
                      <StatusBadge status={member.status} />
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        member.role === "leader" ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame size={12} className="text-orange-500" />
                        <span className="font-semibold text-foreground">{member.streak}</span>d streak
                      </span>
                      <span>
                        <span className="font-semibold text-green-500">{member.completionRate}%</span> done
                      </span>
                      <span className="hidden sm:inline">Active {member.lastActive}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-lg font-black text-primary">{member.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
