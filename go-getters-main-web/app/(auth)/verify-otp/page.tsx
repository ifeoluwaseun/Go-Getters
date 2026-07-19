"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";

export default function VerifyOtp() {
  const { verifyAndCompleteRegister, resendOtp, currentUser, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [regData, setRegData] = useState<{
    name: string;
    role: UserRole;
    sponsorId?: string;
    sponsorName?: string;
    adminCode?: string;
  } | null>(null);

  // Restore pending registration from localStorage or current user session
  useEffect(() => {
    let loaded = false;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gogetters_pending_reg");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.email) {
            setEmail(parsed.email);
            setRegData(parsed.profileData);
            loaded = true;
          }
        } catch (e) {
          console.error("Failed to load saved pending registration:", e);
        }
      }
    }

    if (!loaded && currentUser && currentUser.status === "unconfirmed") {
      setEmail(currentUser.email);
      setRegData({
        name: currentUser.name || "New User",
        role: currentUser.role || "member",
        sponsorId: currentUser.sponsorId,
        sponsorName: currentUser.sponsorName,
      });
      loaded = true;
    }

    if (!loaded && !isLoading && (!currentUser || currentUser.status !== "unconfirmed")) {
      // No pending registration found, redirect to registration
      router.push("/register");
    }
  }, [currentUser, isLoading, router]);

  // Handle auto-redirection if user status gets updated to pending or approved
  useEffect(() => {
    if (currentUser && currentUser.status !== "unconfirmed") {
      if (currentUser.status === "pending") router.push("/pending");
      else if (currentUser.status === "rejected") router.push("/rejected");
      else if (currentUser.status === "approved") router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Cooldown timer for OTP Resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email) throw new Error("No pending registration email found. Please register again.");
      if (!regData) throw new Error("Registration details missing. Please register again.");
      
      const user = await verifyAndCompleteRegister(email, otpCode.trim(), regData);
      
      if (user.status === "pending") {
        router.push("/pending");
      } else if (user.status === "approved") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      if (!email) throw new Error("No email found for resending code");
      await resendOtp(email, "signup");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gogetters_pending_reg");
    }
    router.push("/register");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center font-sans">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse">GO-GETTERS</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 py-12 font-sans selection:bg-[#00d8fe] selection:text-black">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00d8fe] tracking-tight mb-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            GO-GETTERS
          </h1>
          <p className="text-muted-foreground text-sm font-medium">High-Performance Execution System</p>
        </div>

        <div className="bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Confirm Your Email</h2>
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit verification code sent via email to{" "}
              <span className="font-semibold text-primary">{email || "your address"}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                Verification Code
              </label>
              <input
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="w-full text-center tracking-[12px] text-2xl font-black font-mono h-14 border border-border bg-background/50 rounded-lg focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all text-foreground"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-400 text-center font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full h-12 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify & Complete Application"}
            </button>
          </form>

          <div className="flex justify-between items-center text-xs pt-2 font-medium">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className={`font-semibold transition-colors ${
                resendCooldown > 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:underline cursor-pointer"
              }`}
            >
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
            </button>

            <button
              type="button"
              onClick={handleEditDetails}
              className="text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
