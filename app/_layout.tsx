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
            <Stack.Screen name="add-user" />
            <Stack.Screen name="user-detail" />

            {/* Main app tabs */}
            <Stack.Screen name="(tabs)" />

            {/* Profile creation flow */}
            <Stack.Screen name="add-dependent" />
            <Stack.Screen name="add-pet" />
            <Stack.Screen name="add-contact" />
            <Stack.Screen name="profile-saved" />

            {/* Detail views */}
            <Stack.Screen name="dependent-detail" />
            <Stack.Screen name="pet-detail" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
