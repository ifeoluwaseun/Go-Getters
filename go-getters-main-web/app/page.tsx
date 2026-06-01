"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.status === "pending") {
      router.replace("/pending");
      return;
    }

    if (currentUser.status === "rejected") {
      router.replace("/rejected");
      return;
    }

    if (currentUser.status === "approved") {
      router.replace("/dashboard");
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
      <div className="text-[#00d8fe] text-3xl font-black tracking-widest animate-pulse font-sans">
        GO-GETTERS
      </div>
    </div>
  );
}
