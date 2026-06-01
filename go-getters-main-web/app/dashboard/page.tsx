"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Trophy, Calendar, Bell, ArrowUpRight } from "lucide-react";
import Layout from "@/components/Layout";
import { SupportCallModal } from "@/components/SupportCallModal";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { tasks, goals, meetings, notifications, teamMembers, completeTask } = useApp();
  const [showSupport, setShowSupport] = useState(false);
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

  useEffect(() => {
    if (currentUser) {
      try {
        const joinedDate = new Date(currentUser.joinedAt);
        const now = new Date();
        const diffTime = now.getTime() - joinedDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (
          !isNaN(diffDays) &&
          diffDays > 3 &&
          (currentUser.completionRate < 50 || currentUser.consistency < 50) &&
          (currentUser.completionRate > 0 || currentUser.consistency > 0)
        ) {
          setShowSupport(true);
        }
      } catch (err) {
        if (
          (currentUser.completionRate < 50 || currentUser.consistency < 50) &&
          (currentUser.completionRate > 0 || currentUser.consistency > 0)
        ) {
          setShowSupport(true);
        }
      }
    }
  }, [currentUser]);

  if (authLoading || !currentUser || currentUser.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const completedTasksCount = todayTasks.filter(t => t.status === 'completed').length;
  const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 3);
  const nextMeeting = meetings[0];

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Here is your execution digest for today.</p>
          </div>
          <Link href="/tasks">
            <button className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5">
              Launch Tasks <ArrowUpRight size={14} />
            </button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-5 hover:border-orange-500/30 transition-all group">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-orange-500 transition-colors">Streak</div>
            <div className="text-2xl md:text-3xl font-black mt-1 text-orange-500 font-mono">{currentUser.streak} days 🔥</div>
          </div>
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-5 hover:border-primary/30 transition-all group">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Total Points</div>
            <div className="text-2xl md:text-3xl font-black mt-1 text-primary font-mono">{currentUser.points}</div>
          </div>
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-5 hover:border-green-500/30 transition-all group">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-green-500 transition-colors">Completion Rate</div>
            <div className="text-2xl md:text-3xl font-black mt-1 text-green-500 font-mono">{currentUser.completionRate}%</div>
          </div>
          <div className="bg-[#16171b]/60 border border-border/80 rounded-xl p-5 hover:border-yellow-500/30 transition-all group">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-yellow-500 transition-colors">Consistency</div>
            <div className="text-2xl md:text-3xl font-black mt-1 text-yellow-500 font-mono">{currentUser.consistency}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Tasks */}
            <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Today's Checklist</h3>
                <Link href="/tasks" className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5">
                  View full list <ChevronRight size={14} />
                </Link>
              </div>

              {/* Progress bar */}
              <div className="bg-[#0d0d0f]/60 p-4 rounded-xl border border-border/60">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-muted-foreground">Today's Progress ({completedTasksCount}/{todayTasks.length})</span>
                  <span className="text-primary font-mono">{Math.round((completedTasksCount / Math.max(todayTasks.length, 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,216,254,0.4)]"
                    style={{ width: `${(completedTasksCount / Math.max(todayTasks.length, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Today's Tasks Checklist */}
              <div className="space-y-3.5">
                {todayTasks.length > 0 ? (
                  todayTasks.slice(0, 4).map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3.5 p-4 rounded-xl border border-border/50 bg-[#0d0d0f]/20 hover:border-primary/20 hover:bg-[#0d0d0f]/40 transition-all group"
                    >
                      <button 
                        onClick={() => task.status !== 'completed' && completeTask(task.id)}
                        disabled={task.status === 'completed'}
                        className="flex-shrink-0 cursor-pointer text-muted-foreground hover:text-primary transition-all disabled:cursor-default"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="text-green-500 fill-green-500/10" size={20} />
                        ) : (
                          <Circle className="group-hover:text-primary transition-colors text-muted-foreground/60" size={20} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium flex gap-2.5 mt-1 items-center">
                          <span className="px-2 py-0.5 rounded-md bg-[#00d8fe]/10 text-primary uppercase tracking-wider text-[9px] font-black">{task.category}</span>
                          {task.dueTime && <span className="flex items-center gap-1"><Calendar size={11} /> {task.dueTime}</span>}
                          {task.priority === 'high' && <span className="text-red-400 font-bold uppercase text-[9px] tracking-wider">High</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-[#0d0d0f]/20 border border-dashed border-border/60 rounded-xl">
                    <p className="text-xs text-muted-foreground font-semibold">No tasks scheduled for today.</p>
                    <Link href="/tasks">
                      <button className="mt-3 h-8 px-3.5 bg-white/5 hover:bg-white/10 text-foreground font-bold text-xs rounded-lg transition-all cursor-pointer">
                        Add standard task
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Active Goals Preview */}
            <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Active Goals</h3>
              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: goal.color || '#00d8fe' }}></span>
                          {goal.title}
                        </div>
                        <div className="font-black text-primary font-mono">{goal.progress}%</div>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,216,254,0.3)]"
                          style={{ 
                            width: `${goal.progress}%`,
                            backgroundColor: goal.color || '#00d8fe' 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-[#0d0d0f]/20 border border-dashed border-border/60 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold">No goals set for this week.</p>
                  <Link href="/goals">
                    <button className="mt-3 h-8 px-3.5 bg-white/5 hover:bg-white/10 text-foreground font-bold text-xs rounded-lg transition-all cursor-pointer">
                      Create first goal
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Meeting Card */}
            {nextMeeting && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 bg-primary/10 rounded-bl-xl text-primary font-black uppercase text-[8px] tracking-widest">
                  Live Accountability
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Upcoming Accountability Meeting</div>
                <h3 className="font-black text-lg text-foreground truncate mb-1">{nextMeeting.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4 font-medium">
                  <Calendar size={12} /> Starts at {new Date(nextMeeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <a 
                  href={nextMeeting.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block w-full text-center bg-primary text-black font-black uppercase text-xs tracking-wider py-3 rounded-xl hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] transition-all cursor-pointer"
                >
                  Join Accountability Zoom
                </a>
              </div>
            )}

            {/* Recent Notifications */}
            <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-foreground">Recent Alerts</h3>
                <Link href="/notifications">
                  <span className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-0.5">
                    Inbox <ChevronRight size={14} />
                  </span>
                </Link>
              </div>

              <div className="space-y-3">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map(n => (
                    <div key={n.id} className="text-xs p-3.5 bg-[#0d0d0f]/20 rounded-xl border border-border/60 hover:border-primary/10 transition-all">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Bell size={12} className="text-primary flex-shrink-0" />
                        {n.title}
                      </div>
                      <div className="text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.body}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground font-semibold">
                    All caught up! No unread alerts.
                  </div>
                )}
              </div>
            </div>

            {/* Team Summary for Leaders/Admins */}
            {(currentUser.role === 'leader' || currentUser.role === 'admin') && (
              <div className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/80 p-6 space-y-4">
                <h3 className="text-md font-bold text-foreground">Team compliance</h3>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-2 border-b border-border/40 text-xs font-semibold">
                    <span className="text-muted-foreground">Active Members</span>
                    <span className="text-foreground text-sm font-black">{teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs font-semibold">
                    <span className="text-muted-foreground">Avg Task Completion</span>
                    <span className="text-green-500 text-sm font-black font-mono">
                      {Math.round(teamMembers.reduce((acc, m) => acc + m.completionRate, 0) / Math.max(teamMembers.length, 1))}%
                    </span>
                  </div>
                </div>

                <Link href="/team" className="block text-center text-xs text-primary hover:underline font-semibold mt-4">
                  Open Team Command Suite
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <SupportCallModal open={showSupport} onOpenChange={setShowSupport} />
    </Layout>
  );
}
