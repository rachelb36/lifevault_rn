# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript 5.9.3 - Entire codebase including app, features, and shared utilities
- JavaScript - Configuration files (babel, metro, tailwind)

**Secondary:**
- CSS/Tailwind - Styling via NativeWind and TailwindCSS
- GraphQL - Query language for Apollo Client

## Runtime

**Environment:**
- React Native 0.81.5 - Mobile application runtime
- Expo ~54.0.33 - Development platform and managed service for React Native

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Expo Router ~6.0.23 - File-based routing for React Native
- React 19.1.0 - UI library and component framework
- React Native 0.81.5 - Cross-platform mobile framework
- React Router 7.13.0 - Web routing (fallback for web platform)

**UI & Styling:**
- NativeWind 4.2.1 - Tailwind CSS for React Native
- TailwindCSS 3.4.0 - Utility-first CSS framework
- React Native Paper 5.15.0 - Material Design UI components
- Lucide React Native 0.510.0 - Icon library

**Navigation & State:**
- @react-navigation/native 7.1.8 - Navigation library
- @react-navigation/bottom-tabs 7.4.0 - Tab navigation
- @react-navigation/elements 2.6.5 - Navigation elements

**Data & Client:**
- @apollo/client 3.14.0 - GraphQL client with caching
- GraphQL 16.12.0 - GraphQL implementation
- RxJS 7.8.2 - Reactive programming library

**Animation & UX:**
- @legendapp/motion 2.5.3 - Animation library
- React Native Reanimated ~4.1.1 - Animation library
- React Native Gesture Handler 2.28.0 - Gesture handling
- React Native Screens 4.16.0 - Navigation screens

**Utilities:**
- date-fns 4.1.0 - Date formatting and manipulation
- class-variance-authority 0.7.1 - Component variant utility
- clsx 2.1.1 - Conditional class names
- tailwind-merge 3.5.0 - Merge Tailwind classes
- tailwind-variants 0.1.20 - Variant utilities for Tailwind

**Testing:**
- No test framework configured (Jest not in dependencies)

**Build/Dev:**
- @expo/metro-runtime 6.1.2 - Metro bundler runtime
- Babel 7+ with preset-expo - JavaScript transpiler
- babel-plugin-module-resolver 5.0.2 - Module path resolution
- React Native SVG Transformer 1.5.3 - SVG transformation

## Key Dependencies

**Critical:**
- @apollo/client 3.14.0 - GraphQL data fetching and state management, primary data layer
- @react-native-async-storage/async-storage 2.2.0 - Local data persistence for offline support
- expo-router 6.0.23 - Navigation and routing, core to app structure

**Infrastructure:**
- expo-secure-store 15.0.8 - Secure credential storage (tokens, sensitive data)
- @react-native-async-storage/async-storage 2.2.0 - General key-value storage
- @expo/metro-runtime 6.1.2 - React Native bundling

**Platform-Specific:**
- expo-document-picker 14.0.8 - File picking on device
- expo-image-picker 17.0.10 - Image/media selection
- expo-print 15.0.8 - Printing capabilities
- expo-sharing 14.0.8 - Share functionality
- expo-web-browser 15.0.10 - Web browser integration
- react-native-webview 13.15.0 - WebView component

**UI Components:**
- @shopify/flash-list 2.0.2 - Performant list rendering
- @rn-primitives/checkbox 1.2.0 - Checkbox primitive
- @rn-primitives/hooks 1.3.0 - Primitive hooks
- react-aria 3.44.0 - Accessible component hooks
- react-stately 3.42.0 - Stateful component hooks

**Accessibility & Styling:**
- @expo/html-elements 0.12.5 - HTML element support
- expo-linear-gradient 15.0.8 - Gradient support
- react-native-linear-gradient 2.8.3 - Linear gradients
- react-native-svg 15.12.1 - SVG rendering
- react-native-web 0.21.1 - Web platform support
- nativewind 4.2.1 - Tailwind for React Native

**Forms & Date Picking:**
- @react-native-community/datetimepicker 8.4.4 - Date/time picker
- react-native-gifted-charts 1.4.64 - Chart visualization

**Charts & Visualization:**
- react-native-gifted-charts 1.4.64 - Chart library

## Configuration

**Environment:**
- Variables configured in `app.json` under `extra` section
- EXPO_PUBLIC_GRAPHQL_URL: Local development endpoint (http://127.0.0.1:4000/graphql)
- Public variables prefixed with EXPO_PUBLIC_ are accessible in code
- Sensitive tokens stored via expo-secure-store at runtime

**Build:**
- `babel.config.js` - Babel configuration with module resolver and nativewind
- `metro.config.js` - Metro bundler configuration with NativeWind integration
- `tailwind.config.js` - TailwindCSS theme configuration with custom colors
- `tsconfig.json` - TypeScript configuration with path aliases (@/*, tailwind.config)
- `eslint.config.js` - ESLint configuration extending expo rules
- `app.json` - Expo app configuration with plugins and experiments

**Expo Plugins:**
- expo-router - File-based routing
- expo-splash-screen - Splash screen management
- expo-font - Custom font loading
- expo-web-browser - Web browser support

**Experiments Enabled:**
- typedRoutes - Type-safe routing
- reactCompiler - React Compiler optimization

## Platform Requirements

**Development:**
- Node.js (npm required)
- TypeScript 5.9.3
- Expo CLI 18.0.4+
- iOS development (Xcode for iOS builds)
- Android development (Android SDK for Android builds)

**Production:**
- iOS 13+ for Apple App Store (bundle identifier: com.rachelburgos.exponativewind)
- Android 5.0+ for Google Play (package: com.rachelburgos.exponativewind)
- Expo EAS (Expo Application Services) for building and publishing
- GraphQL API server accessible at configured endpoint (hardcoded to 192.168.4.23:4000 in apollo.ts)

---

*Stack analysis: 2026-02-24*
