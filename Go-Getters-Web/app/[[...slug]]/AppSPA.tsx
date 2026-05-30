"use client";

import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Login from "@/components/pages/Login";
import Register from "@/components/pages/Register";
import Pending from "@/components/pages/Pending";
import Rejected from "@/components/pages/Rejected";
import Dashboard from "@/components/pages/Dashboard";
import Tasks from "@/components/pages/Tasks";
import Goals from "@/components/pages/Goals";
import Evidence from "@/components/pages/Evidence";
import Community from "@/components/pages/Community";
import Leaderboard from "@/components/pages/Leaderboard";
import Team from "@/components/pages/Team";
import TeamMember from "@/components/pages/TeamMember";
import Admin from "@/components/pages/Admin";
import Notifications from "@/components/pages/Notifications";
import Profile from "@/components/pages/Profile";
import NotFound from "@/components/pages/not-found";

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
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
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

export default function AppSPA() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter>
            <AppContent />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
