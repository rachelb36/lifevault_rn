import { vars } from "nativewind";

// Greyish Blue (Slate) Theme - Calm, Professional, iOS-native feel

export const lightTheme = vars({
  '--radius': '12',
  
  // Backgrounds - Very light grey-blue
  '--background': '248 250 252', // Slate 50
  '--foreground': '30 41 59',    // Slate 800 - Dark slate text
  
  // Cards - Clean white or light slate
  '--card': '255 255 255',       // Pure white cards
  '--card-foreground': '30 41 59',
  
  // Primary - Steel Blue (Greyish Blue)
  '--primary': '71 85 105',      // Slate 600 - Muted blue-grey
  '--primary-foreground': '255 255 255',
  
  // Secondary - Lighter slate
  '--secondary': '241 245 249',  // Slate 100
  '--secondary-foreground': '51 65 85',
  
  // Muted - Subtle backgrounds
  '--muted': '241 245 249',      // Slate 100
  '--muted-foreground': '100 116 139', // Slate 500
  
  // Accent - Slightly lighter blue
  '--accent': '226 232 240',     // Slate 200
  '--accent-foreground': '30 41 59',
  
  // Destructive - Muted red
  '--destructive': '220 38 38',
  '--destructive-foreground': '255 255 255',
  
  // Borders & Inputs - Cool grey
  '--border': '226 232 240',     // Slate 200
  '--input': '241 245 249',      // Slate 100
  '--ring': '71 85 105',         // Slate 600
  
  // Chart colors (optional, for future data viz)
  '--chart-1': '71 85 105',
  '--chart-2': '148 163 184',
  '--chart-3': '203 213 225',
  '--chart-4': '51 65 81',
  '--chart-5': '100 116 139',
});

export const darkTheme = vars({
  '--radius': '12',
  
  // Backgrounds - Deep slate blue
  '--background': '15 23 42',   // Slate 900
  '--foreground': '248 250 252', // Slate 50
  
  // Cards - Darker slate
  '--card': '30 41 59',          // Slate 800
  '--card-foreground': '248 250 252',
  
  // Primary - Light steel blue for visibility
  '--primary': '148 163 184',    // Slate 400
  '--primary-foreground': '15 23 42', // Dark text on light primary
  
  // Secondary - Medium slate
  '--secondary': '51 65 85',     // Slate 700
  '--secondary-foreground': '248 250 252',
  
  // Muted - Dark slate
  '--muted': '51 65 85',         // Slate 700
  '--muted-foreground': '148 163 184', // Slate 400
  
  // Accent - Lighter slate
  '--accent': '71 85 105',       // Slate 600
  '--accent-foreground': '248 250 252',
  
  // Destructive - Brighter red for dark mode
  '--destructive': '248 113 113',
  '--destructive-foreground': '15 23 42',
  
  // Borders & Inputs - Subtle dark slate
  '--border': '51 65 85',        // Slate 700
  '--input': '30 41 59',         // Slate 800
  '--ring': '148 163 184',       // Slate 400
  
  // Chart colors for dark mode
  '--chart-1': '148 163 184',
  '--chart-2': '203 213 225',
  '--chart-3': '100 116 139',
  '--chart-4': '226 232 240',
  '--chart-5': '51 65 81',
});