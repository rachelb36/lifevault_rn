# LifeVault RN — Code Flow Visualization

---

## 1. App Bootstrap & Entry

```
expo-router/entry
    │
    ▼
┌─────────────────────────────────────────────────┐
│  app/_layout.tsx  (Root Layout)                 │
│                                                 │
│  <GestureHandlerRootView>                       │
│    <ApolloProvider client={apolloClient}>        │
│      <ThemeProvider>  (light/dark + StatusBar)   │
│        <Stack screenOptions={headerShown:false}> │
│          {routes}                                │
│        </Stack>                                  │
│      </ThemeProvider>                            │
│    </ApolloProvider>                             │
│  </GestureHandlerRootView>                      │
└────────────────────┬────────────────────────────┘
                     ▼
           ┌─────────────────┐
           │  app/index.tsx  │  Entry Gate
           │  SecureStore:   │
           │  hasOnboarded?  │
           └───────┬─────────┘
                   │
         ┌────No───┴───Yes────┐
         ▼                    ▼
   /onboarding          /(tabs) Main App
   Create primary       ━━━━━━━━━━━━━━━
   profile → save       │ Tab Navigator │
   flags → redirect     └──────┬───────┘
                               │
        ┌──────┬───────┬───────┼────────┐
        ▼      ▼       ▼       ▼        ▼
     Dashboard Household Directory Documents Settings
     (index)   (household) (contacts) (documents) (settings)
```

---

## 2. Navigation Hierarchy

```
/(tabs)/                          ← Bottom tab bar (5 tabs)
│
├── index.tsx                     ← Dashboard
├── household.tsx                 ← People & Pets list
├── contacts.tsx                  ← Contacts directory
├── documents.tsx                 ← Documents
└── settings.tsx                  ← Settings + ThemeToggle

/(vault)/                         ← Feature screens (no tab bar)
│
├── people/[personId]/
│   ├── index.tsx                 ← Person detail (records by category)
│   └── records/
│       ├── add.tsx               ← Create record
│       └── [recordId]/
│           ├── index.tsx         ← View record
│           └── edit.tsx          ← Edit record
│
├── pets/[petId]/
│   ├── index.tsx                 ← Pet detail
│   └── records/
│       ├── add.tsx               ← Create record
│       └── [recordId]/
│           ├── index.tsx         ← View record
│           └── edit.tsx          ← Edit record
│
└── contacts/
    ├── index.tsx                 ← Contact list
    └── add.tsx                   ← Add contact
```

---

## 3. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│                                                             │
│   AsyncStorage (public)         SecureStore (sensitive)     │
│   ├─ dependents_v1              ├─ accessToken              │
│   ├─ pets_v1                    ├─ hasOnboarded             │
│   ├─ records_v1:{entityId}      ├─ primaryProfileCreated    │
│   ├─ contacts_v1                └─ localAuth / localUser    │
│   └─ profiles_v2                                            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│   STORAGE FUNCTIONS      │   │   APOLLO CLIENT              │
│                          │   │   (future backend)           │
│ records/data/storage.ts  │   │                              │
│   • upsertRecordForEntity│   │   src/lib/apollo.ts          │
│   • listRecordsForEntity │   │   → GraphQL endpoint         │
│   • deleteRecord         │   │   → Bearer token from        │
│                          │   │     SecureStore               │
│ profiles/data/storage.ts │   └──────────────────────────────┘
│   • savePerson/Pet       │
│   • findProfile          │
│   • listDependents       │
│                          │
│ contacts/data/storage.ts │
│   • saveContact          │
│   • getContacts          │
└──────────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    SCREEN COMPONENTS                          │
│                                                              │
│  useFocusEffect → load() → Promise.all([                    │
│    findProfile(id),                                          │
│    listRecordsForEntity(id),                                 │
│    getContacts()                                             │
│  ]) → setState(profile, records, contacts)                   │
│                        │                                     │
│                        ▼                                     │
│               Render UI (RecordSection, RowWithSummary)      │
│                        │                                     │
│                   User taps → Navigate to detail/edit        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Record Creation Flow

```
User taps "Add Record"
        │
        ▼
┌────────────────────────────┐
│  records/add.tsx           │
│  Route params: entityId,   │
│  recordType                │
└───────────┬────────────────┘
            ▼
   buildInitialData(recordType)
   from CANONICAL_DEFAULTS
            │
            ▼
┌────────────────────────────────────────────┐
│  RecordTypeFormRenderer                     │
│                                            │
│  FORM_DEFS[recordType] → FieldDef[]        │
│                                            │
│  For each field:                           │
│    text/multiline → TextInput              │
│    date          → DatePickerModal         │
│    select (≤6)   → Pills                  │
│    select (>6)   → OptionPickerSheet       │
│    toggle        → Yes/No buttons          │
│    list          → inline add/remove       │
│    objectList    → expandable rows +       │
│                    SwipeToDelete            │
│    document      → info/helper text        │
│                                            │
│  Conditional: showWhen({ key, equals })    │
└───────────────────┬────────────────────────┘
                    │  User taps Save
                    ▼
    normalizeRecordDataForSave(type, data)
                    │
                    ▼
    upsertRecordForEntity(entityId, record)
                    │
                    ▼
    AsyncStorage → records_v1:{entityId}
                    │
                    ▼
    Navigate back → useFocusEffect → refresh
```

---

## 5. Domain Model Relationships

```
┌──────────────┐       ┌──────────────────┐
│ PersonProfile │       │   PetProfile     │
│  id           │       │   id             │
│  firstName    │       │   petName        │
│  lastName     │       │   kind (Dog/Cat) │
│  relationship │       │   breed          │
│  isPrimary?   │       │   avatarUri      │
└──────┬───────┘       └───────┬──────────┘
       │  1:many               │  1:many
       ▼                       ▼
┌──────────────────────────────────────────┐
│           LifeVaultRecord                │
│  id, entityId, recordType                │
│  title, isPrivate                        │
│  data: Record<string, unknown>           │
│  attachments: Attachment[]               │
│  createdAt, updatedAt                    │
└──────────────────┬───────────────────────┘
                   │ typed by
                   ▼
┌──────────────────────────────────────────┐
│    RecordType (50+ types)                │
│    grouped by RecordCategory (12)        │
│                                          │
│  IDENTIFICATION: Passport, SSN, ...      │
│  MEDICAL: MedicalProfile, Allergies, ... │
│  PET_MEDICAL: PetVaccinations, ...       │
│  FINANCIAL: BankAccount, Insurance, ...  │
│  LEGAL: Will, PowerOfAttorney, ...       │
│  EDUCATION: Transcript, Diploma, ...     │
│  ...                                     │
└──────────────────────────────────────────┘
       │
       │ each type has
       ▼
┌──────────────────────────────────────────┐
│  RecordTypeMeta                          │
│  { label, iconKey, cardinality,          │
│    category, sort, isPrivate?, premium?} │
│                                          │
│  FORM_DEFS → FieldDef[] (form fields)   │
│  CANONICAL_DEFAULTS (initial values)     │
└──────────────────────────────────────────┘

┌──────────────┐
│   Contact    │──── linkedProfiles[] ───→ Person/Pet
│  categories  │
│  isFavorite  │
└──────────────┘
```

---

## 6. Provider Hierarchy

```
<GestureHandlerRootView>
  │  (enables swipe, pan, long-press)
  ▼
  <ApolloProvider client={apolloClient}>
    │  (provides GraphQL queries/mutations)
    ▼
    <ThemeProvider>
      │  (provides light/dark mode via nativewind)
      ▼
      <Stack screenOptions={{ headerShown: false }}>
        │  (Expo Router stack navigation)
        ▼
        {routes}
      </Stack>
    </ThemeProvider>
  </ApolloProvider>
</GestureHandlerRootView>
```

---

## 7. Key Architecture Summary

| Layer | Technology | Location |
|-------|-----------|----------|
| Routing | Expo Router (file-based) | `app/` |
| UI Styling | NativeWind + Tailwind CSS | className props |
| State | Local `useState` + `useFocusEffect` | Per-screen |
| Persistence | AsyncStorage + SecureStore | `src/features/*/data/` |
| API (future) | Apollo Client + GraphQL | `src/lib/apollo.ts` |
| Domain Models | TypeScript types + registry | `src/domain/records/` |
| Form System | Dynamic FieldDef rendering | `src/features/records/forms/` |
| Theme | nativewind `useColorScheme` | `src/shared/theme/` |
| Icons | lucide-react-native | Via Icon component |

---

## 8. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.0 | Core framework |
| react-native | 0.81.5 | Mobile runtime |
| expo | ~54.0.33 | Platform toolchain |
| expo-router | ~6.0.23 | File-based routing |
| nativewind | 4.2.1 | Tailwind for RN |
| @apollo/client | 3.14.0 | GraphQL client |
| @react-native-async-storage | 2.2.0 | Local persistence |
| expo-secure-store | 15.0.8 | Encrypted storage |
| lucide-react-native | 0.510.0 | Icon library |
| date-fns | 4.1.0 | Date utilities |
| react-native-gesture-handler | 2.28.0 | Gesture system |

---

*Generated on 2026-02-22 — LifeVault React Native Architecture*
