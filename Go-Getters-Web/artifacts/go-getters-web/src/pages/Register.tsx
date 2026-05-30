import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/context/types";

export default function Register() {
  const { register, leaders } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [leaderId, setLeaderId] = useState<string>("none");
  const [sponsorId, setSponsorId] = useState<string>("none");
  const [adminCode, setAdminCode] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const lId = leaderId !== "none" ? leaderId : undefined;
      const lName = lId ? leaders.find(l => l.id === lId)?.name : undefined;
      const sId = sponsorId !== "none" ? sponsorId : undefined;
      const sName = sId ? leaders.find(l => l.id === sId)?.name : undefined;
      await register(name, email, password, role, lId, lName, sId, sName, adminCode || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
          <p className="text-muted-foreground">Join the elite network.</p>
        </div>

        <div className="bg-card p-8 rounded-xl border border-border shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <h3 className="font-semibold mb-3">Team Connections</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Leader</label>
                  <Select value={leaderId} onValueChange={setLeaderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a leader" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select...</SelectItem>
                      {leaders.map(l => (
                        <SelectItem key={`l-${l.id}`} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Your Sponsor (Optional)</label>
                  <Select value={sponsorId} onValueChange={setSponsorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {leaders.map(l => (
                        <SelectItem key={`s-${l.id}`} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowAdmin(!showAdmin)}
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
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
