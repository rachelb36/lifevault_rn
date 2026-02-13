// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { ThemeProvider } from "@/shared/ui/ThemeProvider";
import "../global.css";

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
          {/* Entry + onboarding */}
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />

          {/* Main app tabs */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile-saved" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
