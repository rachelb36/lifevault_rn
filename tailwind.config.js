const { hairlineWidth, platformSelect } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./utils/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./*.{js,jsx,ts,tsx,mdx}",
  ],
  presets: [require("nativewind/preset")],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring|chart-1|chart-2|chart-3|chart-4|chart-5|sidebar|sidebar-foreground|sidebar-primary|sidebar-primary-foreground|sidebar-accent|sidebar-accent-foreground|sidebar-border|sidebar-ring)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        border: withOpacity("border"),
        input: withOpacity("input"),
        ring: withOpacity("ring"),
        background: withOpacity("background"),
        foreground: withOpacity("foreground"),
        primary: {
          DEFAULT: withOpacity("primary"),
          foreground: withOpacity("primary-foreground"),
        },
        secondary: {
          DEFAULT: withOpacity("secondary"),
          foreground: withOpacity("secondary-foreground"),
        },
        destructive: {
          DEFAULT: withOpacity("destructive"),
          foreground: withOpacity("destructive-foreground"),
        },
        muted: {
          DEFAULT: withOpacity("muted"),
          foreground: withOpacity("muted-foreground"),
        },
        accent: {
          DEFAULT: withOpacity("accent"),
          foreground: withOpacity("accent-foreground"),
        },
        popover: {
          DEFAULT: withOpacity("popover"),
          foreground: withOpacity("popover-foreground"),
        },
        card: {
          DEFAULT: withOpacity("card"),
          foreground: withOpacity("card-foreground"),
        },
        chart: {
          1: withOpacity("chart-1"),
          2: withOpacity("chart-2"),
          3: withOpacity("chart-3"),
          4: withOpacity("chart-4"),
          5: withOpacity("chart-5"),
        },
        sidebar: {
          DEFAULT: withOpacity("sidebar"),
          foreground: withOpacity("sidebar-foreground"),
          primary: withOpacity("sidebar-primary"),
          "primary-foreground": withOpacity("sidebar-primary-foreground"),
          accent: withOpacity("sidebar-accent"),
          "accent-foreground": withOpacity("sidebar-accent-foreground"),
          border: withOpacity("sidebar-border"),
          ring: withOpacity("sidebar-ring"),
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return platformSelect({
        ios: `rgb(var(--${variableName}) / ${opacityValue})`,
        android: `rgb(var(--android-${variableName}) / ${opacityValue})`,
      });
    }
    return platformSelect({
      ios: `rgb(var(--${variableName}))`,
      android: `rgb(var(--android-${variableName}))`,
    });
  };
}
