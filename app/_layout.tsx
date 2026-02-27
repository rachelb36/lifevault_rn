
import "../global.css";

import React from "react";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { apolloClient } from "@/lib/apollo";
import { useColorScheme } from "@/lib/useColorScheme";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "rgb(15 23 42)" : "rgb(248 250 252)";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }} />
        </ThemeProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
