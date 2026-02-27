import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import { HouseholdList } from "@/shared/ui/HouseholdList";

export default function HouseholdIndexScreen() {
  const router = useRouter();
  const handleBack = () => {
    if ((router as any).canGoBack?.()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center" activeOpacity={0.85}>
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Household</Text>
          <View className="w-10 items-end">
            <ThemeToggle />
          </View>
        </View>

        <View className="px-6 pb-6 flex-1">
          <HouseholdList />
        </View>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
