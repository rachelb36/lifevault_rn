import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { seedTestData, resetSeedData } from "@/shared/dev/seedTestData";

export default function DevToolsScreen() {
  if (!__DEV__) return null;

  return (
    <SafeAreaView className="flex-1 bg-background px-6 py-6">
      <Text className="text-2xl font-bold text-foreground mb-2">Dev Tools</Text>
      <Text className="text-sm text-muted-foreground mb-6">
        Seed realistic fake data for UI testing. Reset removes it.
      </Text>

      <Pressable
        onPress={async () => {
          await seedTestData();
          Alert.alert("Seeded", "Test profiles + records created.");
        }}
        className="bg-primary rounded-2xl py-4 items-center mb-3"
      >
        <Text className="text-primary-foreground font-semibold">Seed Test Data</Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          await resetSeedData();
          Alert.alert("Reset", "Seed data removed.");
        }}
        className="border border-border rounded-2xl py-4 items-center"
      >
        <Text className="text-foreground font-semibold">Reset / Delete Seed Data</Text>
      </Pressable>
    </SafeAreaView>
  );
}