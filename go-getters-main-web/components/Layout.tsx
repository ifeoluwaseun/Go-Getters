"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { 
  LayoutDashboard, CheckSquare, Target, Camera, 
  MessageSquare, Trophy, Users, Shield, Bell, User as UserIcon, Menu, X, LogOut
} from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not logged in or pending/rejected, the page handles redirecting, 
  // but if we don't have a profile yet, render children directly.
  if (!currentUser || currentUser.status !== 'approved') {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { href: "/tasks", label: "Tasks", icon: CheckSquare, visible: true },
    { href: "/goals", label: "Goals", icon: Target, visible: true },
    { href: "/evidence", label: "Evidence", icon: Camera, visible: true },
    { href: "/community", label: "Community", icon: MessageSquare, visible: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, visible: true },
    { href: "/team", label: "Team", icon: Users, visible: currentUser.role !== 'member' },
    { href: "/admin", label: "Admin", icon: Shield, visible: currentUser.role === 'admin' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card border-r border-border backdrop-blur-md">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-black text-primary tracking-tight bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/30 to-cyan-400/30 border border-primary/30 flex items-center justify-center text-primary font-black shadow-[0_0_15px_rgba(0,216,254,0.1)]">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-card-foreground leading-none truncate">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-purple-500' : currentUser.role === 'leader' ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
              <span className="capitalize text-[10px]">{currentUser.role}</span>
            </div>
          </div>
        </div>
        
        {/* Streak & Points display */}
        <div className="grid grid-cols-2 gap-2 text-center mt-4">
          <div className="bg-background/50 border border-border/50 rounded-lg p-2 hover:border-primary/20 transition-all">
            <div className="text-[10px] text-muted-foreground font-semibold">Streak</div>
            <div className="font-bold text-sm text-orange-500">{currentUser.streak} 🔥</div>
          </div>
          <div className="bg-background/50 border border-border/50 rounded-lg p-2 hover:border-primary/20 transition-all">
            <div className="text-[10px] text-muted-foreground font-semibold">Points</div>
            <div className="font-bold text-sm text-primary">{currentUser.points}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.filter(i => i.visible).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                active 
                  ? 'bg-gradient-to-r from-primary to-cyan-500 text-black font-semibold shadow-[0_0_20px_rgba(0,216,254,0.3)]' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}>
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link href="/notifications" onClick={() => setMobileMenuOpen(false)}>
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            pathname === '/notifications' 
              ? 'bg-primary text-black font-semibold shadow-[0_0_20px_rgba(0,216,254,0.3)]' 
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}>
            <div className="flex items-center gap-3">
              <Bell size={18} />
              <span className="text-sm">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </Link>
        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            pathname === '/profile' 
              ? 'bg-primary text-black font-semibold shadow-[0_0_20px_rgba(0,216,254,0.3)]' 
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}>
            <UserIcon size={18} />
            <span className="text-sm">Profile</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer text-left"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full z-10 animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-xl font-black text-primary tracking-tight bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
          >
            <Menu size={20} />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
