// app/profile-saved.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

export default function ProfileSavedScreen() {
  const router = useRouter();
  const { type, id, primary } = useLocalSearchParams();

  const profileId = Array.isArray(id) ? id[0] : id;
  const profileType = Array.isArray(type) ? type[0] : type;
  const primaryFlag = Array.isArray(primary) ? primary[0] : primary;

  // Treat primary=1 / true as “this completes onboarding”
  const isPrimaryOnboarding = useMemo(
    () => primaryFlag === "1" || primaryFlag === "true",
    [primaryFlag]
  );

  // Prevent double-writing if React renders twice in dev
  const wroteFlags = useRef(false);

  useEffect(() => {
    if (!isPrimaryOnboarding) return;
    if (wroteFlags.current) return;
    wroteFlags.current = true;

    (async () => {
      // These are the flags your EntryGate checks
      await Promise.allSettled([
        SecureStore.setItemAsync("hasOnboarded", "true"),
        SecureStore.setItemAsync("primaryProfileCreated", "true"),
      ]);
    })();
  }, [isPrimaryOnboarding]);

  const handleComplete = () => {
    if (!profileId) {
      router.replace("/(tabs)");
      return;
    }

    // NOTE: you currently treat "user" as /(vault)/me,
    // but your create flow for primary is in people/add.tsx,
    // so type likely stays "dependent". That's fine.
    if (profileType === "user") {
      router.replace(`/(vault)/me?id=${profileId}&mode=complete`);
      return;
    }

    if (profileType === "pet") {
      router.replace(`/(vault)/pets/${profileId}?mode=complete`);
      return;
    }

    // default: dependent/person
    router.replace(`/(vault)/people/${profileId}?mode=complete`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <CheckCircle size={32} className="text-primary" />
          </View>

          <Text className="text-2xl font-bold text-foreground">
            {isPrimaryOnboarding ? "You’re all set" : "Profile saved"}
          </Text>

          <Text className="text-muted-foreground text-center mt-2">
            {isPrimaryOnboarding
              ? "Your LifeVault is ready. You can finish details now or later."
              : "You can complete the profile now or come back later."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleComplete}
          className="bg-primary rounded-xl py-4 items-center mb-3"
          activeOpacity={0.85}
        >
          <Text className="text-primary-foreground font-semibold">Complete profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="border border-border rounded-xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-foreground font-semibold">Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}