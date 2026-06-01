import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const { login } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
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
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      setForgotStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send recovery email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: recoveryCode.trim(),
        type: 'recovery',
      });
      if (error) throw error;
      setForgotStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired recovery code");
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
      const supabase = createClient();
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
            <p className="text-muted-foreground">Password Recovery System</p>
          </div>

          <div className="bg-card p-8 rounded-xl border border-border shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {forgotStep === 1 && "Reset Password"}
                {forgotStep === 2 && "Enter Recovery Code"}
                {forgotStep === 3 && "Choose New Password"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {forgotStep === 1 && "Enter your email address to receive a recovery code."}
                {forgotStep === 2 && `Enter the 6-digit recovery code we sent to ${forgotEmail}`}
                {forgotStep === 3 && "Ensure your password is at least 6 characters long."}
              </p>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                  {loading ? "Sending..." : "Send Recovery Code"}
                </Button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyRecovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-center text-muted-foreground">Recovery Code</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    className="text-center tracking-[12px] text-2xl font-bold font-mono h-14 border border-border bg-muted/30 focus-visible:ring-primary focus-visible:border-primary"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <Button type="submit" className="w-full font-bold h-12" disabled={loading || recoveryCode.length < 6}>
                  {loading ? "Verifying..." : "Verify Recovery Code"}
                </Button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 6 characters"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <Button type="submit" className="w-full font-bold h-12" disabled={loading || newPassword.length < 6}>
                  {loading ? "Saving..." : "Update & Set Password"}
                </Button>
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
                className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
          <p className="text-muted-foreground">The command center for driven teams.</p>
        </div>

        <div className="bg-card p-8 rounded-xl border border-border shadow-xl">
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm text-center mb-6">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="name@example.com"
                  data-testid="input-email"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-card-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotEmail(email);
                    }}
                    className="text-xs text-primary hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full font-bold" size="lg" data-testid="button-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Apply here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

