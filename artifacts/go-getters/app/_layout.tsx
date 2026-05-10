import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="pending-approval" options={{ headerShown: false }} />
      <Stack.Screen name="goals" options={{ title: "Weekly Goals", headerShadowVisible: false }} />
      <Stack.Screen name="evidence" options={{ title: "Evidence", headerShadowVisible: false }} />
      <Stack.Screen name="achievers" options={{ title: "Achievers", headerShadowVisible: false }} />
      <Stack.Screen name="meetings" options={{ title: "Meetings", headerShadowVisible: false }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications", headerShadowVisible: false }} />
      <Stack.Screen name="admin" options={{ title: "Admin Dashboard", headerShadowVisible: false }} />
      <Stack.Screen name="team" options={{ title: "My Team", headerShadowVisible: false }} />
      <Stack.Screen name="team-member" options={{ title: "Member Profile", headerShadowVisible: false }} />
      <Stack.Screen name="team-report" options={{ title: "Weekly Report", headerShadowVisible: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
