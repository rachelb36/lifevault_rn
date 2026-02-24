# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Layered feature-based architecture with expo-router file-based routing.

**Key Characteristics:**
- Feature-scoped folders containing domain, data, and UI layers
- Separated domain (business logic) from infrastructure (storage/API)
- File-based routing via expo-router with grouped routes (tabs/vault)
- Local-first data storage (AsyncStorage for profiles/records, SecureStore for auth tokens)
- GraphQL client (Apollo) for backend integration with auth token in request headers

## Layers

**Presentation (UI):**
- Purpose: React Native screens and components for user interaction
- Location: `app/(tabs)/` and `app/(vault)/` for page structure; `src/shared/ui/` for reusable components
- Contains: Screen components, modal overlays, bottom sheets, list renderers
- Depends on: Features layer (data/domain), shared utilities, theme provider
- Used by: Expo router for rendering screens

**Features:**
- Purpose: Domain-specific business logic, data access, and domain models
- Location: `src/features/[featureName]/` (pets, people, documents, records, contacts, profiles, calendar)
- Contains: Subdirectories for `domain/` (types, models, validation), `data/` (storage operations), `ui/` (feature-specific components), `constants/`, `forms/`
- Depends on: Shared layer, domain records, documents
- Used by: Screens and other features

**Domain (Cross-cutting Models):**
- Purpose: Shared business entity definitions and selectors used across features
- Location: `src/domain/` (records/, documents/)
- Contains: Type definitions (RecordType, RecordCategory), model types, selector functions
- Depends on: None (foundational)
- Used by: Features layer, presentation layer

**Shared (Utilities & Infrastructure):**
- Purpose: Reusable utilities, UI components, theme configuration, storage abstractions
- Location: `src/shared/`
- Contains:
  - `ui/` - Base UI components (DatePickerModal, OptionPickerSheet, SwipeToDeleteRow, etc.)
  - `utils/` - Helpers (date formatting, localStorage, summary generation, record data extraction)
  - `attachments/` - File attachment models and UI
  - `theme/` - Theme provider and color configuration
  - `constants/` - Shared options
  - `dev/` - Dev tools and test data generation
  - `share/` - PDF export functionality
- Depends on: Libraries only
- Used by: All other layers

**Library Adapters:**
- Purpose: Configuration and integration with external libraries
- Location: `src/lib/`
- Contains: Apollo GraphQL client setup (`apollo.ts`), color scheme hook (`useColorScheme.tsx`), classname utilities (`cn.ts`)
- Depends on: External packages
- Used by: App shell and features

**Root Shell:**
- Purpose: Application entry point and routing structure
- Location: `app/_layout.tsx` - Global wrapper; `app/(tabs)/_layout.tsx` - Tab navigation; `app/(vault)/_layout.tsx` - Vault navigation
- Contains: Provider setup (ApolloProvider, ThemeProvider), route grouping, navigation configuration
- Depends on: All layers below
- Used by: Expo router to render the app

## Data Flow

**Profile Loading Flow:**

1. Entry screen (`app/index.tsx`) checks onboarding flags in SecureStore
2. If not onboarded, navigate to `/onboarding`
3. If onboarded, load people profiles from local storage via `listPeople()`
4. Redirect to `/(tabs)` (main dashboard) or create first person
5. From person detail screen, load records via `listRecordsForPerson(personId)`
6. Filter records by category and render RecordSection components

**Record Mutation Flow:**

1. User navigates to add/edit record screen (`/(vault)/people/[personId]/records/add`)
2. RecordFormScreen renders type-specific form via RecordTypeFormRenderer
3. Form data normalized via `normalizeRecordDataForEdit()` before display
4. On submit, normalize via `normalizeRecordDataForSave()` and persist to AsyncStorage
5. Key: `records_v1:{entityId}` stored as JSON array
6. Screen dismisses, useFocusEffect triggers reload in parent detail screen

**Attachment Flow:**

1. RecordSection detects identification record type (DRIVERS_LICENSE, BIRTH_CERTIFICATE, etc.)
2. Taps open AttachmentSourceSheet (camera/gallery/document picker)
3. Selected attachment stored as RecordAttachmentRef in record.attachments array
4. Persisted to AsyncStorage alongside record data
5. Retrieved via AttachmentsBlock component for display in detail screen

**State Management:**

- Local component state for UI transitions (expanded sections, selected items, modals)
- AsyncStorage for persistent user data (records, profiles, contacts)
- SecureStore for sensitive data (auth tokens, onboarding flags)
- Apollo InMemoryCache for GraphQL queries (not heavily used currently)
- React hooks (useFocusEffect) to trigger data reloads when screens focus

## Key Abstractions

**LifeVaultRecord:**
- Purpose: Universal container for all user data (medical info, identification, preferences, etc.)
- Files: `src/domain/records/record.model.ts`
- Fields: id, entityId, recordType, data, attachments, timestamps
- Pattern: Generic `data: Record<string, unknown>` field holds type-specific payloads; forms normalize data shape on load/save

**RecordType and RecordCategory:**
- Purpose: Enumeration and classification of all supported record types
- Files: `src/domain/records/recordTypes.ts`, `src/domain/records/recordCategories.ts`
- Pattern: RecordType defines individual types (PASSPORT, DRIVERS_LICENSE, MEDICAL_ALLERGIES, etc.); RecordCategory groups types (TRAVEL, IDENTIFICATION, MEDICAL, etc.)
- Selectors in `src/domain/records/selectors/` provide utilities like `getTypesForCategory()`, `isSingletonType()`

**Profile Types:**
- Purpose: Identity models for people and pets; metadata and avatar storage
- Files: `src/features/people/domain/person.model.ts`, `src/features/pets/domain/pet.model.ts`
- Pattern: Lightweight; actual data lives in records. Profiles store: name, relationship, avatar URI, DOB, gender, contact info
- Schema versioning via `.schema.ts` and migration via `.migrate.ts` files

**Storage Adapters:**
- Purpose: Abstract AsyncStorage/SecureStore operations for each entity type
- Files: `src/features/[feature]/data/storage.ts` (pets, people, contacts, records, documents, profiles)
- Pattern: CRUD functions (list*, get*, upsert*, delete*); normalize incoming data; handle schema migrations on read

**Selectors and Helpers:**
- Purpose: Pure functions for extracting or transforming data for UI
- Examples: `getRecordMeta()` returns label/icon for a RecordType; `formatDateLabel()` formats dates for display; `buildExpirySummary()` generates smart summaries
- Files: `src/domain/records/selectors/`, `src/shared/utils/`

## Entry Points

**Root Entry (`app/_layout.tsx`):**
- Location: `app/_layout.tsx`
- Triggers: App startup
- Responsibilities: Wraps entire app with GestureHandlerRootView, ApolloProvider, ThemeProvider, and Stack router

**Auth Gate (`app/index.tsx`):**
- Location: `app/index.tsx`
- Triggers: User navigates to `/`
- Responsibilities: Checks SecureStore for onboarding flag; redirects to `/onboarding` or `/(tabs)` or requests primary profile creation

**Tab Shell (`app/(tabs)/_layout.tsx`):**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: User completes onboarding and enters main app
- Responsibilities: Renders bottom tab bar with Dashboard, Household, Directory, Documents, Settings tabs; maintains navigation state

**Vault Shell (`app/(vault)/_layout.tsx`):**
- Location: `app/(vault)/_layout.tsx`
- Triggers: User opens detail screens (person, pet, household, contacts, documents)
- Responsibilities: Renders bottom nav with dynamically highlighted active tab; uses useSegments to determine active section

**Feature Screens:**
- `app/(vault)/people/[personId]/index.tsx` - Person detail; loads profile and records
- `app/(vault)/people/[personId]/records/add.tsx` - Add record form
- `app/(vault)/people/[personId]/records/[recordId]/index.tsx` - Record detail/view
- `app/(vault)/people/[personId]/records/[recordId]/edit.tsx` - Edit record form

## Error Handling

**Strategy:** Try-catch blocks in async data loading; fallback to empty state or null coalescing.

**Patterns:**
- Storage reads wrap JSON.parse in try-catch; fallback to empty array `[]`
- Profile lookups return `null` if not found; components check `if (!profile)` before rendering
- Apollo client configured with InMemoryCache; network errors bubbled to component level
- No centralized error boundary; individual screens handle loading/error states

## Cross-Cutting Concerns

**Logging:** No centralized logging framework detected; use `console.log` for debugging in development mode.

**Validation:**
- Form field validation via RecordTypeFormRenderer (checks required fields)
- Zod or similar validation likely in form definitions (`src/features/records/forms/formDefs.ts`)
- Storage normalization sanitizes inputs on read (e.g., `sanitizePet()` trims strings, defaults missing fields)

**Authentication:**
- Token stored in SecureStore under `"accessToken"` key
- Apollo authLink intercepts requests and adds `Authorization: Bearer {token}` header
- No auto-refresh mechanism visible; token assumed manually set on login

**Theme:**
- useColorScheme hook provides `colorScheme: "light" | "dark"`
- NAV_THEME object maps light/dark colors for React Navigation
- NativeWind CSS classes used for most styling (e.g., `className="bg-background text-foreground"`)
- Theme colors from `src/theme/colors.ts`

---

*Architecture analysis: 2026-02-24*
