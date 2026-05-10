import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">GO-GETTERS</h1>
          <p className="text-muted-foreground">The command center for driven teams.</p>
        </div>

        <div className="bg-card p-8 rounded-xl border border-border shadow-xl">
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
                  placeholder="admin@gogetters.app"
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Password</label>
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

            <Button type="submit" className="w-full font-bold" size="lg" data-testid="button-submit">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Apply here</Link>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground/60 space-y-1">
          <p>Demo Accounts (any password):</p>
          <p>admin@gogetters.app | leader@gogetters.app | member@gogetters.app</p>
        </div>
      </div>
    </div>
  );
}
