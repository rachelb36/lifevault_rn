
import "../global.css";

import React from "react";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { apolloClient } from "@/lib/apollo";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
