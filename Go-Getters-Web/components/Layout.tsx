import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { 
  LayoutDashboard, CheckSquare, Target, Camera, 
  MessageSquare, Trophy, Users, Shield, Bell, User as UserIcon, Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { unreadCount } = useApp();
  const [location] = useLocation();

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

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-black text-primary tracking-tight">GO-GETTERS</h1>
      </div>
      
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-card-foreground leading-none">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-purple-500' : currentUser.role === 'leader' ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
              <span className="capitalize">{currentUser.role}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center mt-4">
          <div className="bg-background rounded-md p-2">
            <div className="text-xs text-muted-foreground font-semibold">Streak</div>
            <div className="font-bold text-orange-500">{currentUser.streak}🔥</div>
          </div>
          <div className="bg-background rounded-md p-2">
            <div className="text-xs text-muted-foreground font-semibold">Points</div>
            <div className="font-bold text-primary">{currentUser.points}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.filter(i => i.visible).map((item) => {
          const active = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground'
              }`}>
                <item.icon size={18} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link href="/notifications">
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-md font-medium transition-colors cursor-pointer ${
            location === '/notifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground'
          }`}>
            <div className="flex items-center gap-3">
              <Bell size={18} />
              Notifications
            </div>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </Link>
        <Link href="/profile">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors cursor-pointer ${
            location === '/profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground'
          }`}>
            <UserIcon size={18} />
            Profile
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="text-xl font-black text-primary tracking-tight">GO-GETTERS</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-border bg-card">
              <SidebarContent />
            </SheetContent>
          </Sheet>
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
