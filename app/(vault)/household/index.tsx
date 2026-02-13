import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import { HouseholdList } from "@/shared/ui/HouseholdList";

export default function HouseholdIndexScreen() {
  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Household</Text>
          <ThemeToggle />
        </View>

        <View className="px-6 pb-6 flex-1">
          <HouseholdList />
        </View>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
