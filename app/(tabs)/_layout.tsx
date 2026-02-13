// app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { BookOpen, FileText, Home, Settings, Users } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import * as SecureStore from "expo-secure-store";

export default function TabsLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token && !cancelled) {
          router.replace("/");
        }
      } catch {
        if (!cancelled) {
          router.replace("/");
        }
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: isDark ? "#14b8a6" : "#0d9488",
        tabBarInactiveTintColor: isDark ? "#5a7268" : "#6b7280",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "Household Members",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Directory",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
