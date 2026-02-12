// app/profile-saved.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";

export default function ProfileSavedScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const profileId = Array.isArray(id) ? id[0] : id;
  const profileType = Array.isArray(type) ? type[0] : type;

  const handleComplete = () => {
    if (!profileId) {
      router.replace("/(tabs)");
      return;
    }

    if (profileType === "user") {
      router.replace(`/user-detail?id=${profileId}&mode=complete`);
      return;
    }

    if (profileType === "pet") {
      // pet-detail doesn’t care about mode right now, but passing it doesn’t hurt
      router.replace(`/pet-detail?id=${profileId}&mode=complete`);
      return;
    }

    // default: dependent
    router.replace(`/dependent-detail?id=${profileId}&mode=complete`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <CheckCircle size={32} className="text-primary" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Profile saved</Text>
          <Text className="text-muted-foreground text-center mt-2">
            You can complete the profile now or come back later.
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