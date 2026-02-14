// app/_layout.tsx
import "react-native-gesture-handler";
import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const GRAPHQL_URL =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

const authLink = setContext(async (_, { headers }) => {
  const token =
    (await SecureStore.getItemAsync("token")) ||
    (await SecureStore.getItemAsync("accessToken")) ||
    "";

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={apolloClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
