"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Pending() {
  const { currentUser, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    } else if (!isLoading && currentUser && currentUser.status === "approved") {
      router.push("/dashboard");
    } else if (!isLoading && currentUser && currentUser.status === "rejected") {
      router.push("/rejected");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 font-sans selection:bg-[#00d8fe] selection:text-black">
      <div className="w-full max-w-md bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Application Pending</h2>
          <p className="text-xs text-muted-foreground leading-relaxed px-4">
            Your application is under review. You'll be notified once approved by an administrator.
          </p>
        </div>

        <div className="bg-background/40 rounded-xl p-4.5 text-left border border-border/60 text-xs space-y-2.5 font-medium">
          <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{currentUser.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{currentUser.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role:</span> <span className="text-foreground capitalize">{currentUser.role}</span></div>
          {currentUser.leaderName && <div className="flex justify-between"><span className="text-muted-foreground">Leader:</span> <span className="text-foreground">{currentUser.leaderName}</span></div>}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full h-11 border border-border/80 hover:bg-white/5 text-sm font-semibold rounded-lg transition-all cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
