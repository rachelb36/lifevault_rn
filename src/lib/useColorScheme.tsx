import { useCallback, useEffect } from "react";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/theme/colors";

const THEME_KEY = "user-color-scheme";

function useColorScheme() {
  const { colorScheme, setColorScheme: nwSetColorScheme } =
    useNativewindColorScheme();

  // Restore persisted theme on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") {
        nwSetColorScheme(saved);
      }
    })();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setColorScheme = useCallback(
    (scheme: "light" | "dark" | "system") => {
      nwSetColorScheme(scheme);
      if (scheme === "system") {
        AsyncStorage.removeItem(THEME_KEY);
      } else {
        AsyncStorage.setItem(THEME_KEY, scheme);
      }
    },
    [nwSetColorScheme],
  );

  function toggleColorScheme() {
    return setColorScheme(colorScheme === "light" ? "dark" : "light");
  }

  return {
    colorScheme: colorScheme ?? "light",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? "light"],
  };
}

export { useColorScheme };
