import React, { PropsWithChildren } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";

import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/theme";

export function ThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? "light" : "dark"}`}
        style={isDarkColorScheme ? "light" : "dark"}
      />
      <NavThemeProvider value={NAV_THEME[colorScheme]}>
        {children}
      </NavThemeProvider>
    </>
  );
}
