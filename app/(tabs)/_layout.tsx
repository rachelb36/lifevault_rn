// app/(tabs)/_layout.tsx
import "../../global.css";
import React from "react";
import { Tabs } from "expo-router";
import { BookOpen, FileText, Home, Settings, Users } from "lucide-react-native";
import { useColorScheme } from "nativewind";

/**
 * Tabs Layout (Main App Shell)
 * - Keeps the bottom tab bar consistent across the main app
 * - Light/Dark mode is handled by ThemeProvider + nativewind colorScheme
 * - Auth gate: if no accessToken, bounce back to "/" (EntryGate handles onboarding)
 *
 * Design goals:
 * - "Apple-ish" = calm, minimal, no loud colors
 * - Uses theme tokens rather than hardcoded teal hex values
 */
export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,

        // Apple-like: labels are small and not shouty
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },

        // Apple-like spacing (bigger tap targets)
        tabBarItemStyle: { paddingVertical: 6 },

        /**
         * IMPORTANT:
         * Avoid teal hex. Use neutral slate-ish colors.
         * If you later want to tune these, do it here (one place).
         */
        tabBarActiveTintColor: isDark ? "rgb(226 232 240)" : "rgb(51 65 85)", // slate-200 / slate-700
        tabBarInactiveTintColor: isDark ? "rgb(100 116 139)" : "rgb(100 116 139)", // slate-500

        // Background + border match your theme tokens vibe
        tabBarStyle: {
          backgroundColor: isDark ? "rgb(30 41 59)" : "rgb(255 255 255)", // slate-800 / white
          borderTopColor: isDark ? "rgb(51 65 85)" : "rgb(226 232 240)", // slate-700 / slate-200
          borderTopWidth: 1,
        },
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
          // shorter + Apple-y
          title: "Household",
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
