"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const { login, currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle Auth Session State Change redirect
  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.status === "unconfirmed") router.push("/register");
      else if (currentUser.status === "pending") router.push("/pending");
      else if (currentUser.status === "rejected") router.push("/rejected");
      else if (currentUser.status === "approved") router.push("/dashboard");
    }
  }, [currentUser, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      // 1. Trigger Supabase native request to email reset OTP
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      setForgotStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to send recovery email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 2. Verify Supabase recovery OTP
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: recoveryCode.trim(),
        type: 'recovery',
      });
      if (error) throw error;
      setForgotStep(3);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired recovery code");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      
      // 3. Update password in auth session
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      // Sign out to clear the temporary recovery session
      await supabase.auth.signOut();
      
      setSuccessMessage("Password updated successfully! Please sign in with your new password.");
      setShowForgot(false);
      setForgotStep(1);
      setForgotEmail("");
      setRecoveryCode("");
      setNewPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 font-sans selection:bg-[#00d8fe] selection:text-black">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
          <div className="text-center">
            <h1 className="text-4xl font-black text-[#00d8fe] tracking-tight mb-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
            <p className="text-muted-foreground text-sm font-medium">Password Recovery System</p>
          </div>

          <div className="bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {forgotStep === 1 && "Reset Password"}
                {forgotStep === 2 && "Enter Recovery Code"}
                {forgotStep === 3 && "Choose New Password"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {forgotStep === 1 && "Enter your email address to receive a recovery code."}
                {forgotStep === 2 && `Enter the 6-digit recovery code we sent to ${forgotEmail}`}
                {forgotStep === 3 && "Ensure your password is at least 6 characters long."}
              </p>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                {error && <p className="text-xs text-red-400 text-center font-medium">{error}</p>}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? "Sending..." : "Send Recovery Code"}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyRecovery} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">Recovery Code</label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    className="w-full text-center tracking-[12px] text-2xl font-black font-mono h-14 border border-border bg-background/50 rounded-lg focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-400 text-center font-medium">{error}</p>}
                <button 
                  type="submit" 
                  disabled={loading || recoveryCode.length < 6}
                  className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify Recovery Code"}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                    placeholder="Min. 6 characters"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-400 text-center font-medium">{error}</p>}
                <button 
                  type="submit" 
                  disabled={loading || newPassword.length < 6}
                  className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? "Saving..." : "Update & Set Password"}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotStep(1);
                  setError("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] p-4 font-sans selection:bg-[#00d8fe] selection:text-black">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00d8fe] tracking-tight mb-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">GO-GETTERS</h1>
          <p className="text-muted-foreground text-sm font-medium">The high-performance command center.</p>
        </div>

        <div className="bg-[#16171b]/60 backdrop-blur-md p-8 rounded-2xl border border-border/80 shadow-2xl">
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3.5 rounded-lg text-xs text-center mb-6 font-medium">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotEmail(email);
                    }}
                    className="text-xs text-primary hover:underline transition-all font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 bg-background/50 border border-border/80 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center font-medium">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_20px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-semibold ml-1">Apply here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
