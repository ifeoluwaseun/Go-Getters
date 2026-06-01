"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Flame, Trophy, Star, Shield, Camera, Heart, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  trophy: Trophy,
  camera: Camera,
  heart: Heart,
  shield: Shield,
};

export default function Profile() {
  const { currentUser, logout, updateUser, isLoading: authLoading } = useAuth();
  const { achievements, isLoading: appLoading } = useApp();
  const router = useRouter();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");

  // Sync profile state when user is loaded
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setTitle(currentUser.title || "");
    }
  }, [currentUser]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ name, title });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getRoleBadge = () => {
    if (currentUser.role === "admin") return "bg-purple-500/20 text-purple-400 border border-purple-500/10";
    if (currentUser.role === "leader") return "bg-primary/20 text-primary border border-primary/25";
    return "bg-white/5 text-muted-foreground";
  };

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300 max-w-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Your execution stats, milestones, and personal records.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="h-10 px-4 border border-destructive/80 text-destructive hover:bg-destructive/10 font-black uppercase text-[11px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        {/* Identity Card */}
        <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-cyan-500/20 border border-primary/20 flex items-center justify-center text-primary font-black text-3xl flex-shrink-0 shadow-[0_0_15px_rgba(0,216,254,0.1)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0 w-full text-center sm:text-left">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4 font-semibold text-xs text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                    className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans font-normal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title / Headline</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Sales Director"
                    className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans font-normal"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button 
                    type="submit"
                    className="h-9 px-4 bg-primary text-black font-black uppercase text-[10px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditing(false)}
                    className="h-9 px-4 border border-border hover:bg-white/5 text-foreground font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-black text-foreground">{currentUser.name}</h2>
                {currentUser.title && <p className="text-muted-foreground text-xs font-semibold mt-1">{currentUser.title}</p>}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3.5 mt-3 text-xs text-muted-foreground font-semibold">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider capitalize ${getRoleBadge()}`}>
                    {currentUser.role}
                  </span>
                  {currentUser.leaderName && (
                    <span>
                      Leader: <span className="text-foreground font-bold">{currentUser.leaderName}</span>
                    </span>
                  )}
                  {currentUser.sponsorName && (
                    <span>
                      Sponsor: <span className="text-foreground font-bold">{currentUser.sponsorName}</span>
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setEditing(true)}
                  className="mt-4.5 h-8.5 px-4 border border-border hover:bg-white/5 text-foreground hover:text-primary hover:border-primary/30 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Streak Record", value: `${currentUser.streak} days`, color: "text-orange-500" },
            { label: "Points Balance", value: currentUser.points.toLocaleString(), color: "text-primary" },
            { label: "Completion Rate", value: `${currentUser.completionRate}%`, color: "text-green-500" },
            { label: "Consistency score", value: `${currentUser.consistency}%`, color: "text-yellow-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#16171b]/60 border border-border/80 rounded-xl p-4 text-center">
              <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Account Metadata */}
        <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-4.5 flex justify-between items-center text-xs font-semibold">
          <span className="text-muted-foreground">Account Member Since</span>
          <span className="text-foreground font-bold">
            {new Date(currentUser.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        {/* Achievements Spotlight */}
        {achievements.length > 0 && (
          <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Earned Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {achievements.map((a) => {
                const Icon = ICON_MAP[a.icon] ?? Trophy;
                return (
                  <div
                    key={a.id}
                    className="flex flex-col items-center text-center p-4 bg-[#0d0d0f]/20 border border-border/60 hover:border-primary/10 rounded-xl gap-2 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: a.color + "22", borderColor: a.color + "44" }}
                    >
                      <Icon size={22} style={{ color: a.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-1 leading-snug">{a.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
