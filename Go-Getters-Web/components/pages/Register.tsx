import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/context/types";
import { createClient } from "@/lib/supabase/client";

export default function Register() {
  const { register } = useAuth();
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

      await register(name, email, password, role, undefined, undefined, finalSponsorId, finalSponsorName, adminCode || undefined);
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
