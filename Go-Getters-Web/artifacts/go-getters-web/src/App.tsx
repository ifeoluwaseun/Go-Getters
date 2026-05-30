import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pending from "./pages/Pending";
import Rejected from "./pages/Rejected";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Goals from "./pages/Goals";
import Evidence from "./pages/Evidence";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import Team from "./pages/Team";
import TeamMember from "./pages/TeamMember";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function AppContent() {
  const { currentUser, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    const publicRoutes = ["/login", "/register"];
    const statusRoutes = ["/pending", "/rejected"];

    if (!currentUser) {
      if (!publicRoutes.includes(location)) setLocation("/login");
      return;
    }

    if (currentUser.status === "pending" && location !== "/pending") {
      setLocation("/pending");
      return;
    }

    if (currentUser.status === "rejected" && location !== "/rejected") {
      setLocation("/rejected");
      return;
    }

    if (
      currentUser.status === "approved" &&
      (publicRoutes.includes(location) || statusRoutes.includes(location) || location === "/")
    ) {
      setLocation("/dashboard");
    }
  }, [currentUser, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse">GO-GETTERS</div>
      </div>
    );
  }

  return (
    <AppProvider userId={currentUser?.id}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/pending" component={Pending} />
        <Route path="/rejected" component={Rejected} />

        <Route>
          <Layout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/goals" component={Goals} />
              <Route path="/evidence" component={Evidence} />
              <Route path="/community" component={Community} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/team/:memberId" component={TeamMember} />
              <Route path="/team" component={Team} />
              <Route path="/admin" component={Admin} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </AppProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
