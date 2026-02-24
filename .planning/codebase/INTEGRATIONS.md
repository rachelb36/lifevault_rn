# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**GraphQL Backend:**
- GraphQL API - Primary data backend for application
  - SDK/Client: @apollo/client 3.14.0
  - Endpoint: Configured in `app.json` as EXPO_PUBLIC_GRAPHQL_URL
  - Development endpoint: http://127.0.0.1:4000/graphql (localhost)
  - Hardcoded endpoint: http://192.168.4.23:4000/graphql (in `src/lib/apollo.ts`)
  - Auth: Bearer token via authorization header (retrieved from secure store)

## Data Storage

**Databases:**
- None configured - Application uses local client-side storage only

**Local Storage:**
- AsyncStorage (React Native) - Primary storage via `@react-native-async-storage/async-storage`
  - Used for non-sensitive data persistence (pets, people, documents, records, contacts)
  - Key-value JSON storage accessible at runtime
  - Location: Implementation in multiple storage files:
    - `src/features/pets/data/petsStorage.ts`
    - `src/features/people/data/peopleStorage.ts`
    - `src/features/documents/data/documentsStorage.ts`
    - `src/features/records/data/storage.ts`
    - `src/features/contacts/data/storage.ts`
  - Storage keys: PETS_KEY, PEOPLE_KEY, DOCUMENTS_KEY, etc. (prefixed with _v1 for versioning)

**Secure Storage:**
- Expo Secure Store (expo-secure-store) - Encrypted storage for sensitive data
  - Used for: Authentication tokens (accessToken), legacy migration data
  - Platform implementation: iOS Keychain, Android Keystore
  - Location: Token retrieval in `src/lib/apollo.ts` (SecureStore.getItemAsync("accessToken"))
  - Migration: Data can migrate from secure store to AsyncStorage during first read

**File Storage:**
- Local filesystem only via:
  - expo-document-picker - User selects files from device
  - expo-image-picker - User selects images from gallery/camera
  - Asset storage: Icons, images, fonts stored locally in `assets/` directory
  - No cloud file storage configured

**Caching:**
- Apollo InMemoryCache - GraphQL query caching in ApolloClient configuration
  - Location: `src/lib/apollo.ts`
  - No persistent cache layer (RAM only)

## Authentication & Identity

**Auth Provider:**
- Custom/Backend-managed authentication
  - Implementation: Bearer token in Authorization header
  - Token storage: expo-secure-store (secure encrypted storage)
  - Token field: "accessToken"
  - Location: Authentication link setup in `src/lib/apollo.ts`
  - Token injection: Automatic via Apollo's setContext link middleware

**Authorization:**
- Header-based: Bearer token in GraphQL requests
- No OAuth integration detected
- No external identity provider (Google, Apple, etc.)

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, LogRocket, or similar integration

**Logs:**
- Console logging only
- No centralized logging service
- No analytics integration

## CI/CD & Deployment

**Hosting:**
- Expo Managed Service (EAS) - Expo Application Services for building and publishing
  - Configuration: `eas.json`
  - CLI requirement: Expo CLI >= 18.0.4
  - Build environments:
    - development: Internal distribution with development client
    - preview: Internal distribution
    - production: Auto-incremented app versions

**Build Configuration:**
- iOS:
  - Bundle identifier: com.rachelburgos.exponativewind
  - Supports tablets
  - ITSAppUsesNonExemptEncryption: false (no encryption enabled)

- Android:
  - Package: com.rachelburgos.exponativewind
  - Edge-to-edge UI enabled
  - Predictive back gesture disabled
  - Adaptive icon with foreground, background, and monochrome images

**CI Pipeline:**
- EAS Build - Native builds via Expo
  - No GitHub Actions or other CI/CD detected
  - Manual triggering via eas build command

**Deployment Target:**
- iOS App Store (via EAS submit)
- Google Play Store (via EAS submit)
- Internal distribution builds for testing

**Project Configuration:**
- Expo project ID: afc88b5a-4429-4aad-85d5-7df6ead972ad
- Owner: rachelburgos

## Environment Configuration

**Required env vars:**
- EXPO_PUBLIC_GRAPHQL_URL - GraphQL endpoint URL (public, visible in code)
- Access token - Stored securely, not in .env

**Configuration Sources:**
1. `app.json` - Expo configuration with public variables under `extra` section
2. Runtime secure storage - Tokens retrieved via expo-secure-store
3. Hardcoded values in code - Apollo endpoint currently hardcoded in `src/lib/apollo.ts` (192.168.4.23:4000/graphql)

**Secrets location:**
- Not in version control (follow .gitignore)
- Stored in expo-secure-store at runtime (encrypted on device)
- No .env file in repository

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints implemented

**Outgoing:**
- None detected - No outgoing webhook calls

## Image & Media Handling

**Image Picker:**
- expo-image-picker 17.0.10 - User-initiated image/video selection from gallery or camera

**Document Picker:**
- expo-document-picker 14.0.8 - User-initiated file selection

**Sharing:**
- expo-sharing 14.0.8 - Share files/content to other apps

**Print Support:**
- expo-print 15.0.8 - Print documents capability

**SVG Support:**
- react-native-svg 15.12.1 - SVG rendering
- react-native-svg-transformer 1.5.3 - SVG import transformation

## Third-Party UI Libraries

**Icons:**
- lucide-react-native 0.510.0 - Icon library
- rn-icon-mapper 0.0.1 - Icon mapping utility

**Charts:**
- react-native-gifted-charts 1.4.64 - Chart visualization

**Accessibility Primitives:**
- react-aria 3.44.0 - Accessible UI component hooks
- react-stately 3.42.0 - State management for components

---

*Integration audit: 2026-02-24*
