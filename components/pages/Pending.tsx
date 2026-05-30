import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Pending() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Application Pending</h2>
          <p className="text-muted-foreground">
            Your application is under review. You'll be notified once approved by an administrator.
          </p>
        </div>

        <div className="bg-background rounded-lg p-4 text-left border border-border text-sm space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{currentUser.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{currentUser.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role:</span> <span className="font-medium capitalize">{currentUser.role}</span></div>
          {currentUser.leaderName && <div className="flex justify-between"><span className="text-muted-foreground">Leader:</span> <span className="font-medium">{currentUser.leaderName}</span></div>}
        </div>

        <Button variant="outline" className="w-full mt-4" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
