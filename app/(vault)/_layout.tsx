// app/(vault)/_layout.tsx
import React, { useMemo } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Home, Users, BookOpen, FileText, Settings } from "lucide-react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";

type NavItemKey = "home" | "household" | "contacts" | "documents" | "settings";

type NavItem = {
  key: NavItemKey;
  label: string;
  href: string;
  Icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Dashboard", href: "/(tabs)", Icon: Home },
  { key: "household", label: "Household", href: "/(vault)/household", Icon: Users },
  { key: "contacts", label: "Directory", href: "/(vault)/contacts", Icon: BookOpen },
  { key: "documents", label: "Documents", href: "/(vault)/documents", Icon: FileText },
  { key: "settings", label: "Settings", href: "/(vault)/me", Icon: Settings },
];

function activeKeyFromSegments(segments: string[]): NavItemKey {
  // segments typically look like: ["(vault)", "people", "add"]
  const section = segments?.[1];

  if (!section) return "home";

  if (section === "household" || section === "people" || section === "pets") return "household";
  if (section === "contacts") return "contacts";
  if (section === "documents") return "documents";
  if (section === "me") return "settings";

  return "home";
}

export default function VaultLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // NativeWind's hook gives "light" | "dark"
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // React Native Paper theme (fixes Paper Modal translucency + enables dark/light theming)
  const paperTheme = useMemo(() => (isDark ? MD3DarkTheme : MD3LightTheme), [isDark]);

  // Neutral, Apple-ish tab colors
  const activeColor = isDark ? "#E5E7EB" : "#111827";
  const inactiveColor = isDark ? "#9CA3AF" : "#6B7280";

  const activeKey = useMemo(
    () => activeKeyFromSegments(segments as unknown as string[]),
    [segments]
  );

  return (
    <PaperProvider theme={paperTheme}>
      <View className="flex-1 bg-background">
        {/* Keep this layout “headless” — screens control their own headers */}
        <Stack screenOptions={{ headerShown: false }} />

        {/* Bottom nav */}
        <View
          className="border-t border-border bg-background"
          style={{
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          <View className="flex-row px-3 pt-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey;
              const Icon = item.Icon;

              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    router.replace(item.href as any);
                  }}
                  activeOpacity={0.85}
                  className="flex-1 items-center justify-center py-2"
                >
                  <Icon size={22} color={isActive ? activeColor : inactiveColor} />
                  <Text
                    style={{ color: isActive ? activeColor : inactiveColor }}
                    className="text-[11px] mt-1 font-medium"
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </PaperProvider>
  );
}