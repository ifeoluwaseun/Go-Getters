"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Rejected() {
  const { currentUser, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    } else if (!isLoading && currentUser && currentUser.status === "approved") {
      router.push("/dashboard");
    } else if (!isLoading && currentUser && currentUser.status === "pending") {
      router.push("/pending");
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
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Application Declined</h2>
          <p className="text-xs text-muted-foreground leading-relaxed px-4">
            Unfortunately, your application to join Go-Getters has been declined by our leadership team.
          </p>
        </div>

        {currentUser.rejectionReason && (
          <div className="bg-destructive/5 rounded-xl p-4.5 text-left border border-destructive/20 text-xs font-medium">
            <h4 className="font-bold text-destructive mb-1 text-[11px] uppercase tracking-wider">Reason for Declining:</h4>
            <p className="text-muted-foreground leading-relaxed">{currentUser.rejectionReason}</p>
          </div>
        )}

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
