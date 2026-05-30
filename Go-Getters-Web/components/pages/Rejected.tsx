import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Rejected() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Application Declined</h2>
          <p className="text-muted-foreground">
            Unfortunately, your application to join has been declined.
          </p>
        </div>

        {currentUser.rejectionReason && (
          <div className="bg-destructive/5 rounded-lg p-4 text-left border border-destructive/20 text-sm">
            <h4 className="font-semibold text-destructive mb-1">Reason:</h4>
            <p className="text-muted-foreground">{currentUser.rejectionReason}</p>
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
