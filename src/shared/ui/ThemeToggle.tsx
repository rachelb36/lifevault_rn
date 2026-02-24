// src/shared/ui/ThemeToggle.tsx
import React from "react";
import { useColorScheme } from "@/lib/useColorScheme";
import { TouchableOpacity } from "react-native";
import { Sun, Moon } from "lucide-react-native";

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Simple + always visible:
  const iconColor = isDark ? "#F8FAFC" : "#1E293B";

  return (
    <TouchableOpacity
      onPress={() => setColorScheme(isDark ? "light" : "dark")}
      hitSlop={10}
    >
      {isDark ? <Sun size={22} color={iconColor} /> : <Moon size={22} color={iconColor} />}
    </TouchableOpacity>
  );
}