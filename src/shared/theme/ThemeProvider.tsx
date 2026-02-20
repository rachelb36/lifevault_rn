// src/shared/theme/ThemeProvider.tsx
import React, { PropsWithChildren, useMemo } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { darkTheme, lightTheme } from "@/shared/theme/theme";

export function ThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const paperTheme = useMemo(() => (isDark ? MD3DarkTheme : MD3LightTheme), [isDark]);
  const vars = isDark ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <View style={vars as any} className="flex-1 bg-background">
        {children}
      </View>
    </PaperProvider>
  );
}