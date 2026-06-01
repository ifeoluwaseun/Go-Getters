"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, TrendingDown, Minus, Flame, Trophy, Star, Award } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

type Tab = "leaderboard" | "achievers";

const BADGE_ICONS: Record<string, React.ElementType> = {
  consistency: Star,
  performance: Trophy,
  leadership: Award,
  growth: TrendingUp,
};

export default function Leaderboard() {
  const { leaderboard, achievers, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("leaderboard");

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

  const getRoleBadge = (role: string) => {
    if (role === "admin") return "bg-purple-500/20 text-purple-400";
    if (role === "leader") return "bg-primary/20 text-primary";
    return "bg-white/5 text-muted-foreground";
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-tr from-yellow-400 to-amber-500 text-black";
    if (rank === 2) return "bg-gradient-to-tr from-zinc-300 to-zinc-400 text-black";
    if (rank === 3) return "bg-gradient-to-tr from-amber-600 to-amber-700 text-white";
    return "bg-white/5 text-muted-foreground border border-border/80";
  };

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Rankings reset weekly. Keep executing. Protect your status.</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 border-b border-border/20 pb-1 font-medium">
          <button 
            onClick={() => setTab("leaderboard")} 
            className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "leaderboard" 
                ? "bg-primary text-black font-black" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            <Trophy size={14} /> Rankings
          </button>
          <button 
            onClick={() => setTab("achievers")} 
            className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "achievers" 
                ? "bg-primary text-black font-black" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            <Star size={14} /> Weekly Achievers
          </button>
        </div>

        {/* Tab 1: Rankings */}
        {tab === "leaderboard" && (
          <div className="space-y-3.5">
            {leaderboard.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              return (
                <div 
                  key={user.id} 
                  className={`bg-[#16171b]/40 backdrop-blur-md rounded-2xl border transition-all p-4 flex items-center gap-4 ${
                    isCurrentUser 
                      ? "border-primary/60 bg-primary/5 shadow-[0_0_15px_rgba(0,216,254,0.05)]" 
                      : "border-border/80 hover:border-primary/10"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 font-mono ${getRankMedal(user.rank)}`}>
                    {user.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">You</span>
                      )}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider capitalize ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Flame size={13} className="text-orange-500" />
                        <span className="font-bold text-foreground">{user.streak}</span> streak
                      </span>
                      <span>
                        <span className="font-bold text-green-500">{user.completionRate}%</span> done
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pr-1.5">
                    <div className="text-xl font-black text-primary font-mono">{user.points.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">pts</div>
                  </div>

                  <div className="flex-shrink-0 pr-1">
                    {user.change === "up" ? (
                      <TrendingUp size={16} className="text-green-400" />
                    ) : user.change === "down" ? (
                      <TrendingDown size={16} className="text-destructive" />
                    ) : (
                      <Minus size={16} className="text-muted-foreground/60" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Weekly Achievers */}
        {tab === "achievers" && (
          <div className="grid gap-6 md:grid-cols-2">
            {achievers.length > 0 ? (
              achievers.map((achiever) => {
                const Icon = BADGE_ICONS[achiever.category] ?? Trophy;
                return (
                  <div 
                    key={achiever.id} 
                    className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 relative overflow-hidden transition-all hover:border-primary/15"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-3.5 mb-5 relative">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(0,216,254,0.1)]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-primary uppercase tracking-wider">{achiever.badge}</div>
                        <div className="font-bold text-base text-foreground leading-tight mt-0.5">{achiever.userName}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                      <div className="bg-[#0d0d0f]/40 border border-border/50 rounded-xl p-2.5">
                        <div className="text-base font-black text-orange-500">{achiever.streak}</div>
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Streak</div>
                      </div>
                      <div className="bg-[#0d0d0f]/40 border border-border/50 rounded-xl p-2.5">
                        <div className="text-base font-black text-green-500">{achiever.completionRate}%</div>
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Rate</div>
                      </div>
                      <div className="bg-[#0d0d0f]/40 border border-border/50 rounded-xl p-2.5">
                        <div className="text-base font-black text-primary">{achiever.points}</div>
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Pts</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl text-muted-foreground">
                <Star size={40} className="mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-sm">No achievers spotlighted yet</p>
                <p className="text-xs mt-1">Consistency metrics reset weekly. Complete your tasks to appear here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
