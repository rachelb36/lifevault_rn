import React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";
import { BookOpen, FileText, Home, Settings, Users } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavItem = {
  key: "home" | "household" | "contacts" | "documents" | "settings";
  label: string;
  href: string;
  Icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Dashboard", href: "/(tabs)", Icon: Home },
  { key: "household", label: "Household", href: "/(vault)/household", Icon: Users },
  { key: "contacts", label: "Directory", href: "/(vault)/contacts", Icon: BookOpen },
  { key: "documents", label: "Documents", href: "/(vault)/documents", Icon: FileText },
  { key: "settings", label: "Settings", href: "/(tabs)/settings", Icon: Settings },
];

function activeKeyFromSegments(segments: string[]): NavItem["key"] {
  const section = segments[1];
  if (section === "household" || section === "people" || section === "pets") return "household";
  if (section === "contacts") return "contacts";
  if (section === "documents") return "documents";
  if (section === "me") return "settings";
  return "household";
}

export default function VaultLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const activeKey = activeKeyFromSegments(segments);
  const activeColor = isDark ? "#14b8a6" : "#0d9488";
  const inactiveColor = isDark ? "#5a7268" : "#6b7280";

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      <View
        className="border-t border-border bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 10), paddingTop: 8, paddingHorizontal: 10 }}
      >
        <View className="flex-row items-center justify-between">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            const color = isActive ? activeColor : inactiveColor;
            const Icon = item.Icon;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.replace(item.href as any)}
                className="items-center justify-center px-2 py-1"
                activeOpacity={0.8}
              >
                <Icon size={20} color={color} />
                <Text style={{ color, fontSize: 11, marginTop: 2 }}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
