// app/index.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

const FORCE_ONBOARDING_TEMP = false;

/**
 * Root entry gate.
 * This screen should NOT contain your dashboard UI.
 * It decides whether to send the user to onboarding or the main app.
 *
 * Flags used (local-first):
 * - "hasOnboarded" OR "primaryProfileCreated"
 */
export default function EntryGate() {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [flag1, flag2] = await Promise.all([
          SecureStore.getItemAsync("hasOnboarded"),
          SecureStore.getItemAsync("primaryProfileCreated"),
        ]);

        const ok =
          flag1 === "true" ||
          flag1 === "1" ||
          flag2 === "true" ||
          flag2 === "1";

        if (alive) setHasOnboarded(FORCE_ONBOARDING_TEMP ? false : ok);
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return hasOnboarded ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}
