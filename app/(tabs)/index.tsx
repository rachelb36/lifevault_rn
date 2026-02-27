// app/(tabs)/index.tsx
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  PawPrint,
  Users,
  FileText,
  Share2,
  ChevronRight,
} from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { useUserName } from "@/shared/hooks/useUserName";

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
};

type RowLink = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { displayName } = useUserName();

  // If any of these routes don't exist in your app, just change the path strings:
  // - Add Person: "/(vault)/people/add"
  // - Add Pet: "/(vault)/pets/add"
  // - Household: "/(vault)/household"
  // - Documents: "/(vault)/documents"
  // - Share: you can route to a share screen, or trigger a share action
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: "add-person",
        title: "Add Person",
        subtitle: "Create a new profile",
        icon: <Plus size={18} color={isDark ? "#E5E7EB" : "#111827"} />,
        onPress: () => router.push("/people/add" as any),
      },
      {
        id: "add-pet",
        title: "Add Pet",
        subtitle: "Add pet details & records",
        icon: <PawPrint size={18} color={isDark ? "#E5E7EB" : "#111827"} />,
        onPress: () => router.push("/pets/add" as any),
      },
    ],
    [router, isDark]
  );

  const links: RowLink[] = useMemo(
    () => [
      {
        id: "household",
        title: "Household",
        subtitle: "People + pets overview",
        icon: <Users size={18} color={isDark ? "#E5E7EB" : "#111827"} />,
        onPress: () => router.push("/(vault)/household" as any),
      },
      {
        id: "documents",
        title: "Documents",
        subtitle: "IDs, medical, insurance, files",
        icon: <FileText size={18} color={isDark ? "#E5E7EB" : "#111827"} />,
        onPress: () => router.push("/(vault)/documents" as any),
      },
      {
        id: "share",
        title: "Share Document",
        subtitle: "Export or send a PDF",
        icon: <Share2 size={18} color={isDark ? "#E5E7EB" : "#111827"} />,
        onPress: () => {
          // If you have a share screen, route there:
          // router.push("/(vault)/share" as any);

          // Otherwise route to documents as a placeholder:
          router.push("/(vault)/documents" as any);
        },
      },
    ],
    [router, isDark]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">
            Hello, {displayName || "Welcome"}
          </Text>
          <Text className="text-sm text-muted-foreground mt-2">
            Your vault at a glance.
          </Text>
        </View>

        {/* Quick Actions (clearly separated) */}
        <View className="px-6 mt-5">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 tracking-wider">
            QUICK ACTIONS
          </Text>

          <View className="flex-row gap-3">
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={a.onPress}
                activeOpacity={0.85}
                className="flex-1 bg-card border border-border rounded-2xl p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                    {a.icon}
                  </View>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </View>

                <Text className="text-base font-semibold text-foreground mt-3">
                  {a.title}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  {a.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Links list */}
        <View className="px-6 mt-8">
          <View className="bg-card border border-border rounded-2xl overflow-hidden">
            {links.map((row, idx) => (
              <TouchableOpacity
                key={row.id}
                onPress={row.onPress}
                activeOpacity={0.8}
                className={`px-4 py-4 flex-row items-center ${
                  idx !== links.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                  {row.icon}
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-foreground">
                    {row.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {row.subtitle}
                  </Text>
                </View>

                <ChevronRight size={18} className="text-muted-foreground" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
