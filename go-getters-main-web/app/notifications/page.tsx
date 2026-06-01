"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { AppNotification } from "@/types";
import { Bell, Trophy, AlertTriangle, Megaphone, Flame, CheckCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

const TYPE_CONFIG: Record<AppNotification["type"], { icon: React.ElementType; color: string; bg: string }> = {
  achievement: { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  reminder: { icon: Bell, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  announcement: { icon: Megaphone, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  streak: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
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

export default function Notifications() {
  const { notifications, markNotificationRead, markAllRead, unreadCount, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

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

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Alerts Inbox
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
            <Bell size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-bold">No notifications</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Alerts regarding streaks, goal completions, and admin approvals will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markNotificationRead(n.id)}
                  className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    !n.isRead 
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10 shadow-[0_0_15px_rgba(0,216,254,0.05)]" 
                      : "border-border/60 opacity-60 hover:opacity-100 hover:border-primary/10 bg-[#16171b]/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="font-bold leading-snug text-sm md:text-base text-foreground">{n.title}</div>
                      {!n.isRead && (
                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{n.body}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold flex-shrink-0 pt-0.5 font-mono">
                    {timeAgo(n.createdAt)}
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
