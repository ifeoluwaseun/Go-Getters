import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/context/types";
import { createClient } from "@/lib/supabase/client";

export default function Register() {
  const { register, verifyAndCompleteRegister, resendOtp } = useAuth();
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('users').select('id, name').eq('status', 'approved');
        if (data) setExistingUsers(data);
      } catch (err) {
        console.error("Failed to load approved users for registration suggestions:", err);
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

  // Restore pending registration on mount
  useEffect(() => {
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
  }, []);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
            <p className="text-muted-foreground">High-Performance Execution System</p>
          </div>

          <div className="bg-card p-8 rounded-xl border border-border shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Confirm Your Email</h2>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit confirmation code we sent to{" "}
                <span className="font-semibold text-primary">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-center text-muted-foreground">Verification Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  className="text-center tracking-[12px] text-2xl font-bold font-mono h-14 border border-border bg-muted/30 focus-visible:ring-primary focus-visible:border-primary"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full font-bold h-12" disabled={loading || otpCode.length < 6}>
                {loading ? "Verifying..." : "Verify & Complete Application"}
              </Button>
            </form>

            <div className="flex justify-between items-center text-sm pt-2">
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
          <p className="text-muted-foreground">Join the elite network.</p>
        </div>

        <div className="bg-card p-8 rounded-xl border border-border shadow-xl">
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Applying As</label>
                <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Team Member</SelectItem>
                    <SelectItem value="leader">Team Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Your Sponsor (Optional)</label>
                  <Input
                    value={sponsorName}
                    onChange={e => {
                      setSponsorName(e.target.value);
                      setSponsorId(undefined);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Type to search or enter manually..."
                    className="w-full"
                  />
                  {showSuggestions && sponsorName.trim() && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
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
                              className="w-full text-left px-4 py-2 hover:bg-accent/50 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg font-medium"
                            >
                              {u.name}
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground italic">No matches found, will use manual text.</div>
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
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  I am the organization owner
                </button>

                {showAdmin && (
                  <div className="mt-3 animate-in fade-in zoom-in duration-200">
                    <label className="block text-sm font-medium mb-1 text-primary">Admin Code</label>
                    <Input
                      type="password"
                      value={adminCode}
                      onChange={e => setAdminCode(e.target.value)}
                      placeholder="Enter setup code"
                      className="border-primary/50 focus-visible:ring-primary"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full font-bold mt-4" size="lg" disabled={loading}>
                {loading ? "Submitting..." : "Apply Now"}
              </Button>
            </fieldset>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

