// app/index.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { ensureStorageSchemaVersion } from "@/shared/utils/storageSchema";
import { isLocalOnly, hasAccessToken } from "@/shared/config/dataMode";
import { listPeopleProfiles } from "@/features/profiles/data/storage";

/**
 * Root entry gate.
 *
 * Server mode (LOCAL_ONLY=false):
 *   no valid token  → /login
 *   token + !onboarded → /onboarding
 *   token + onboarded + no people profiles → primary setup
 *   token + onboarded + people profiles → /(tabs)
 *
 * LOCAL_ONLY mode:
 *   !onboarded → /onboarding
 *   onboarded + no people profiles → primary setup
 *   onboarded + people profiles → /(tabs)
 */
export default function EntryGate() {
  const [ready, setReady] = useState(false);
  const [redirectHref, setRedirectHref] = useState<string>("/onboarding");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await ensureStorageSchemaVersion();

        const localOnly = await isLocalOnly();

        // Server mode: require a real access token
        if (!localOnly) {
          const hasToken = await hasAccessToken();
          if (!hasToken) {
            if (alive) setRedirectHref("/login");
            return;
          }
        }

        const [flag1, flag2] = await Promise.all([
          SecureStore.getItemAsync("hasOnboarded"),
          SecureStore.getItemAsync("primaryProfileCreated"),
        ]);

        const onboarded =
          flag1 === "true" ||
          flag1 === "1" ||
          flag2 === "true" ||
          flag2 === "1";

        if (!alive) return;

        if (!onboarded) {
          setRedirectHref("/onboarding");
          return;
        }

        // ✅ This is now server-aware (branches internally on isLocalOnly)
        const people = await listPeopleProfiles();

        if (people.length === 0) {
          setRedirectHref("/(vault)/people/add?primary=true");
          return;
        }

        setRedirectHref("/(tabs)");
      } catch {
        // If anything goes sideways, default to onboarding instead of crashing.
        if (alive) setRedirectHref("/onboarding");
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

  return <Redirect href={redirectHref as any} />;
}
