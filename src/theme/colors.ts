import { Platform } from "react-native";

// Slate palette — iOS color set
const IOS_SYSTEM_COLORS = {
  white: "rgb(255, 255, 255)",
  black: "rgb(0, 0, 0)",
  light: {
    grey6: "rgb(248, 250, 252)", // Slate 50
    grey5: "rgb(241, 245, 249)", // Slate 100
    grey4: "rgb(226, 232, 240)", // Slate 200
    grey3: "rgb(203, 213, 225)", // Slate 300
    grey2: "rgb(148, 163, 184)", // Slate 400
    grey: "rgb(100, 116, 139)", // Slate 500
    background: "rgb(248, 250, 252)",
    foreground: "rgb(30, 41, 59)",
    root: "rgb(255, 255, 255)",
    card: "rgb(255, 255, 255)",
    cardForeground: "rgb(30, 41, 59)",
    popover: "rgb(241, 245, 249)",
    popoverForeground: "rgb(30, 41, 59)",
    destructive: "rgb(220, 38, 38)",
    primary: "rgb(71, 85, 105)",
    primaryForeground: "rgb(255, 255, 255)",
    secondary: "rgb(241, 245, 249)",
    secondaryForeground: "rgb(51, 65, 85)",
    muted: "rgb(241, 245, 249)",
    mutedForeground: "rgb(100, 116, 139)",
    accent: "rgb(226, 232, 240)",
    accentForeground: "rgb(30, 41, 59)",
    border: "rgb(226, 232, 240)",
    input: "rgb(241, 245, 249)",
    ring: "rgb(71, 85, 105)",
  },
  dark: {
    grey6: "rgb(15, 23, 42)", // Slate 900
    grey5: "rgb(30, 41, 59)", // Slate 800
    grey4: "rgb(51, 65, 85)", // Slate 700
    grey3: "rgb(71, 85, 105)", // Slate 600
    grey2: "rgb(100, 116, 139)", // Slate 500
    grey: "rgb(148, 163, 184)", // Slate 400
    background: "rgb(15, 23, 42)",
    foreground: "rgb(248, 250, 252)",
    root: "rgb(15, 23, 42)",
    card: "rgb(30, 41, 59)",
    cardForeground: "rgb(248, 250, 252)",
    popover: "rgb(51, 65, 85)",
    popoverForeground: "rgb(248, 250, 252)",
    destructive: "rgb(248, 113, 113)",
    primary: "rgb(148, 163, 184)",
    primaryForeground: "rgb(15, 23, 42)",
    secondary: "rgb(51, 65, 85)",
    secondaryForeground: "rgb(248, 250, 252)",
    muted: "rgb(51, 65, 85)",
    mutedForeground: "rgb(148, 163, 184)",
    accent: "rgb(71, 85, 105)",
    accentForeground: "rgb(248, 250, 252)",
    border: "rgb(51, 65, 85)",
    input: "rgb(30, 41, 59)",
    ring: "rgb(148, 163, 184)",
  },
} as const;

// Slate palette — Android color set (same values for now)
const ANDROID_COLORS = {
  white: "rgb(255, 255, 255)",
  black: "rgb(0, 0, 0)",
  light: {
    grey6: "rgb(248, 250, 252)",
    grey5: "rgb(241, 245, 249)",
    grey4: "rgb(226, 232, 240)",
    grey3: "rgb(203, 213, 225)",
    grey2: "rgb(148, 163, 184)",
    grey: "rgb(100, 116, 139)",
    background: "rgb(248, 250, 252)",
    foreground: "rgb(30, 41, 59)",
    root: "rgb(255, 255, 255)",
    card: "rgb(255, 255, 255)",
    cardForeground: "rgb(30, 41, 59)",
    popover: "rgb(241, 245, 249)",
    popoverForeground: "rgb(30, 41, 59)",
    destructive: "rgb(220, 38, 38)",
    primary: "rgb(71, 85, 105)",
    primaryForeground: "rgb(255, 255, 255)",
    secondary: "rgb(241, 245, 249)",
    secondaryForeground: "rgb(51, 65, 85)",
    muted: "rgb(241, 245, 249)",
    mutedForeground: "rgb(100, 116, 139)",
    accent: "rgb(226, 232, 240)",
    accentForeground: "rgb(30, 41, 59)",
    border: "rgb(226, 232, 240)",
    input: "rgb(241, 245, 249)",
    ring: "rgb(71, 85, 105)",
  },
  dark: {
    grey6: "rgb(15, 23, 42)",
    grey5: "rgb(30, 41, 59)",
    grey4: "rgb(51, 65, 85)",
    grey3: "rgb(71, 85, 105)",
    grey2: "rgb(100, 116, 139)",
    grey: "rgb(148, 163, 184)",
    background: "rgb(15, 23, 42)",
    foreground: "rgb(248, 250, 252)",
    root: "rgb(15, 23, 42)",
    card: "rgb(30, 41, 59)",
    cardForeground: "rgb(248, 250, 252)",
    popover: "rgb(51, 65, 85)",
    popoverForeground: "rgb(248, 250, 252)",
    destructive: "rgb(248, 113, 113)",
    primary: "rgb(148, 163, 184)",
    primaryForeground: "rgb(15, 23, 42)",
    secondary: "rgb(51, 65, 85)",
    secondaryForeground: "rgb(248, 250, 252)",
    muted: "rgb(51, 65, 85)",
    mutedForeground: "rgb(148, 163, 184)",
    accent: "rgb(71, 85, 105)",
    accentForeground: "rgb(248, 250, 252)",
    border: "rgb(51, 65, 85)",
    input: "rgb(30, 41, 59)",
    ring: "rgb(148, 163, 184)",
  },
} as const;

const COLORS = Platform.OS === "ios" ? IOS_SYSTEM_COLORS : ANDROID_COLORS;

export { COLORS };
