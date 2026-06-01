"use client";

import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { AppProvider } from "./AppContext";

function AppStateWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return (
    <AppProvider userId={currentUser?.id}>
      {children}
    </AppProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppStateWrapper>
        {children}
      </AppStateWrapper>
    </AuthProvider>
  );
}
