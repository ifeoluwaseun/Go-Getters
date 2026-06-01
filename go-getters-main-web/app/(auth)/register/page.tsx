"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const { register, verifyAndCompleteRegister, resendOtp, currentUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorId, setSponsorId] = useState<string | undefined>(undefined);
  const [existingUsers, setExistingUsers] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [regData, setRegData] = useState<{
    name: string;
    role: UserRole;
    sponsorId?: string;
    sponsorName?: string;
    adminCode?: string;
  } | null>(null);

  // Load existing approved users for sponsor suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from('users').select('id, name').eq('status', 'approved');
        if (data) setExistingUsers(data);
      } catch (err) {
        console.error("Failed to load approved users for suggestions:", err);
      }
    };
    fetchUsers();
  }, []);

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

  // Restore pending registration on mount or if unconfirmed session exists
  useEffect(() => {
    if (currentUser && currentUser.status === "unconfirmed") {
      setEmail(currentUser.email);
      setRegData({
        name: currentUser.name || "New User",
        role: currentUser.role || "member",
        sponsorId: currentUser.sponsorId,
        sponsorName: currentUser.sponsorName,
      });
      setShowOtp(true);
      return;
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gogetters_pending_reg');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRegData(parsed.profileData);
          setEmail(parsed.email);
          setShowOtp(true);
        } catch (e) {
          console.error("Failed to load saved pending registration:", e);
        }
      }
    }
  }, [currentUser]);

  // Redirect if logged in and approved/pending
  useEffect(() => {
    if (currentUser && currentUser.status !== "unconfirmed") {
      if (currentUser.status === "pending") router.push("/pending");
      else if (currentUser.status === "rejected") router.push("/rejected");
      else if (currentUser.status === "approved") router.push("/dashboard");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let finalSponsorId = sponsorId;
      let finalSponsorName = sponsorName.trim() || undefined;

      if (finalSponsorName) {
        const exactMatch = existingUsers.find(
          u => u.name.trim().toLowerCase() === finalSponsorName!.toLowerCase()
        );
        if (exactMatch) {
          finalSponsorId = exactMatch.id;
          finalSponsorName = exactMatch.name;
        }
      } else {
        finalSponsorId = undefined;
      }

      const user = await register(name, email, password, role, undefined, undefined, finalSponsorId, finalSponsorName, adminCode || undefined);
      
      if (user.status === 'unconfirmed') {
        setRegData({
          name,
          role,
          sponsorId: finalSponsorId,
          sponsorName: finalSponsorName,
          adminCode: adminCode || undefined,
        });
        setShowOtp(true);
        setResendCooldown(30);
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!regData) throw new Error("Registration data not found. Please register again.");
      await verifyAndCompleteRegister(email, otpCode.trim(), regData);
      router.push("/");
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
      await resendOtp(email, 'signup');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setShowOtp(false);
    setError("");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gogetters_pending_reg');
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 py-12 font-sans selection:bg-[#00d8fe] selection:text-black">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
            <p className="text-muted-foreground text-sm font-medium">High-Performance Execution System</p>
          </div>

          <div className="bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Confirm Your Email</h2>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit confirmation code we sent to{" "}
                <span className="font-semibold text-primary">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">Verification Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  className="w-full text-center tracking-[12px] text-2xl font-black font-mono h-14 border border-border bg-background/50 rounded-lg focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center font-medium">{error}</p>
              )}

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
                  resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
                }`}
              >
                {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
              </button>

              <button
                type="button"
                onClick={handleEditDetails}
                className="text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 py-12 font-sans selection:bg-[#00d8fe] selection:text-black">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00d8fe] tracking-tight mb-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
          <p className="text-muted-foreground text-sm font-medium">Join the elite network.</p>
        </div>

        <div className="bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Applying As</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
              >
                <option value="member" className="bg-[#16171b]">Team Member</option>
                <option value="leader" className="bg-[#16171b]">Team Leader</option>
              </select>
            </div>

            <div className="pt-2 border-t border-border/40">
              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Your Sponsor (Optional)</label>
                <input
                  value={sponsorName}
                  onChange={e => {
                    setSponsorName(e.target.value);
                    setSponsorId(undefined);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type to search or enter manually..."
                  className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                />
                {showSuggestions && sponsorName.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-[#16171b] border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {existingUsers.filter(u => u.name.toLowerCase().includes(sponsorName.toLowerCase())).length > 0 ? (
                      existingUsers
                        .filter(u => u.name.toLowerCase().includes(sponsorName.toLowerCase()))
                        .map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSponsorName(u.name);
                              setSponsorId(u.id);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg font-medium"
                          >
                            {u.name}
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-2 text-xs text-muted-foreground italic">No matches found, will use manual text.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  const nextShow = !showAdmin;
                  setShowAdmin(nextShow);
                  setRole(nextShow ? "admin" : "member");
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                I am the organization owner
              </button>

              {showAdmin && (
                <div className="mt-3 animate-in fade-in zoom-in duration-200">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-1">Admin Code</label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    placeholder="Enter setup code"
                    className="w-full h-11 bg-background/50 border border-primary/50 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center font-medium">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Submitting..." : "Apply Now"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-semibold ml-1">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
