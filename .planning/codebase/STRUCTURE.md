# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
lifevault_rn/
├── app/                        # Expo Router file-based routing
│   ├── _layout.tsx             # Root layout (providers, theme, Apollo)
│   ├── index.tsx               # Entry gate (auth/onboarding check)
│   ├── onboarding.tsx          # Onboarding flow
│   ├── profile-saved.tsx        # Post-save success screen
│   ├── dev-tools.tsx           # Development utilities
│   ├── (tabs)/                 # Tab-based navigation group
│   │   ├── _layout.tsx         # Tab shell (bottom tab bar)
│   │   ├── index.tsx           # Dashboard
│   │   ├── people.tsx          # Household list
│   │   ├── contacts.tsx        # Contacts directory
│   │   ├── documents.tsx       # Documents list
│   │   └── settings.tsx        # Settings
│   └── (vault)/                # Vault/detail screens group
│       ├── _layout.tsx         # Vault shell (custom bottom nav)
│       ├── me.tsx              # User profile settings
│       ├── household/          # Household overview
│       ├── people/             # Person CRUD
│       │   ├── index.tsx       # People list
│       │   ├── add.tsx         # Add person (primary flag option)
│       │   └── [personId]/     # Person detail routes
│       │       ├── index.tsx   # Person detail screen
│       │       └── records/    # Record CRUD under person
│       │           ├── add.tsx
│       │           └── [recordId]/
│       │               ├── index.tsx
│       │               └── edit.tsx
│       ├── pets/               # Pet CRUD (parallel structure to people)
│       │   ├── index.tsx
│       │   ├── add.tsx
│       │   └── [petId]/
│       │       ├── index.tsx
│       │       └── records/
│       │           ├── add.tsx
│       │           └── [recordId]/
│       │               ├── index.tsx
│       │               └── edit.tsx
│       ├── contacts/           # Contacts management
│       │   ├── index.tsx
│       │   └── add.tsx
│       └── documents/          # Document storage
│           ├── index.tsx
│           └── [documentId]/
│               └── index.tsx
│
├── src/
│   ├── domain/                 # Shared business models (foundational layer)
│   │   ├── records/            # Record type system
│   │   │   ├── recordTypes.ts  # enum RecordType
│   │   │   ├── recordCategories.ts
│   │   │   ├── recordTypeRegistry.ts
│   │   │   ├── record.model.ts # LifeVaultRecord type
│   │   │   └── selectors/      # Query helpers
│   │   │       ├── getRecordMeta.ts
│   │   │       ├── getTypesForCategory.ts
│   │   │       └── isSingletonType.ts
│   │   └── documents/          # Attachment definitions
│   │       └── attachments.ts  # RecordAttachmentRef type
│   │
│   ├── features/               # Feature modules (domain, data, UI)
│   │   ├── records/            # Record management
│   │   │   ├── domain/
│   │   │   ├── data/storage.ts # Record CRUD operations
│   │   │   ├── ui/
│   │   │   │   └── RecordSection.tsx # Category-grouped record rendering
│   │   │   └── forms/          # Record form definitions & renderer
│   │   │
│   │   ├── people/             # Person profiles
│   │   │   ├── domain/
│   │   │   │   ├── person.model.ts
│   │   │   │   ├── person.schema.ts
│   │   │   │   └── person.migrate.ts
│   │   │   ├── data/storage.ts # peopleStorage.ts
│   │   │   ├── constants/options.ts
│   │   │   └── ui/
│   │   │
│   │   ├── pets/               # Pet profiles (parallel to people)
│   │   │   ├── domain/
│   │   │   │   ├── pet.model.ts
│   │   │   │   ├── pet.schema.ts
│   │   │   │   ├── pet.migrate.ts
│   │   │   │   ├── preventatives.ts
│   │   │   │   └── types.ts
│   │   │   ├── data/petsStorage.ts
│   │   │   ├── constants/options.ts
│   │   │   └── ui/
│   │   │
│   │   ├── people/             # Person entity (separate from profiles)
│   │   │   ├── domain/person.model.ts
│   │   │   └── data/peopleStorage.ts
│   │   │
│   │   ├── profiles/           # Unified profile storage (people + pets + support profiles)
│   │   │   ├── domain/
│   │   │   │   ├── types.ts    # ProfileType union
│   │   │   │   └── profile.model.ts
│   │   │   ├── data/storage.ts # findProfile, upsertProfile
│   │   │   └── ui/SupportProfileAttachmentsSection.tsx
│   │   │
│   │   ├── documents/          # File storage
│   │   │   ├── domain/document.model.ts
│   │   │   ├── data/documentsStorage.ts
│   │   │   └── document.schema.ts, document.migrate.ts
│   │   │
│   │   ├── contacts/           # Emergency contacts
│   │   │   ├── domain/
│   │   │   └── data/storage.ts
│   │   │
│   │   ├── calendar/           # Calendar feature
│   │   │   └── [structure TBD]
│   │   │
│   │   └── profiles/           # Legacy profile storage
│   │       ├── domain/
│   │       └── data/storage.ts
│   │
│   ├── shared/                 # Shared utilities & infrastructure
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── RecordDetailScreen.tsx     # Detail view wrapper
│   │   │   ├── RecordFormScreen.tsx       # Form wrapper
│   │   │   ├── DatePickerModal.tsx
│   │   │   ├── TimePickerModal.tsx
│   │   │   ├── OptionPickerSheet.tsx      # Bottom sheet picker
│   │   │   ├── SwipeToDeleteRow.tsx
│   │   │   ├── KeyboardDismiss.tsx
│   │   │   ├── ProfileShareModal.tsx
│   │   │   ├── RowWithSummary.tsx
│   │   │   ├── SectionRecordRows.tsx
│   │   │   ├── HouseholdList.tsx
│   │   │   ├── NameFields.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   ├── attachments/        # File attachment handling
│   │   │   ├── attachment.model.ts
│   │   │   ├── AttachmentsBlock.tsx
│   │   │   └── AttachmentSourceSheet.tsx
│   │   │
│   │   ├── utils/              # Helper functions
│   │   │   ├── date.ts         # formatDateLabel
│   │   │   ├── datesOnly.ts
│   │   │   ├── localStorage.ts
│   │   │   ├── summary.ts      # buildExpirySummary, buildNamesSummary
│   │   │   ├── recordData.ts   # getRecordData
│   │   │   └── deleteLocalProfiles.ts
│   │   │
│   │   ├── constants/
│   │   │   └── options.ts
│   │   │
│   │   ├── theme/              # Theme configuration
│   │   │   └── ThemeProvider.tsx
│   │   │
│   │   ├── share/              # PDF export
│   │   │   └── profilePdf.ts
│   │   │
│   │   └── dev/
│   │       └── seedTestData.ts
│   │
│   ├── lib/                    # Library adapters
│   │   ├── apollo.ts           # Apollo GraphQL client config
│   │   ├── useColorScheme.tsx  # Color scheme hook
│   │   └── cn.ts              # Class name utility
│   │
│   ├── theme/                  # Design tokens
│   │   ├── colors.ts           # COLORS object (light/dark)
│   │   └── index.ts            # NAV_THEME export
│   │
│   └── components/             # [Appears empty]
│
├── components/                 # [Appears empty]
├── lib/                        # [Legacy, not used]
├── legacy/                     # [Old code archive]
├── assets/                     # Static images
│   └── images/
├── docs/                       # Documentation
├── scripts/                    # Build/automation scripts
├── android/                    # Native Android code
├── ios/                        # Native iOS code
├── dist/                       # Web build output
├── .planning/                  # Analysis documents
├── app.json                    # Expo config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── global.css                  # Global Nativewind styles
└── .env*                       # Configuration (NOT in git)
```

## Directory Purposes

**app/:**
- Purpose: Expo Router file-based routing structure
- Contains: Screen components, layout wrappers, route groups
- Key files: `_layout.tsx` files establish hierarchy; screens handle their own logic

**(tabs)/ group:**
- Purpose: Main app tab navigation
- Contains: Dashboard, Household list, Directory, Documents, Settings screens
- Always visible bottom tab bar

**(vault)/ group:**
- Purpose: Detail/CRUD screens for entities
- Contains: Person/pet profiles, record management, household overview, contacts, documents
- Custom bottom nav with dynamic active state based on current segment

**src/domain/:**
- Purpose: Shared business logic and type definitions
- Contains: RecordType enumeration, RecordCategory system, LifeVaultRecord model, attachment types
- Key abstraction: recordTypeRegistry connects types to their form definitions and metadata

**src/features/[feature]/:**
- Purpose: Encapsulated feature modules
- Structure: Each feature has `domain/` (models), `data/` (storage), `ui/` (components), `constants/`
- Key files in features:
  - `domain/[entity].model.ts` - TypeScript types
  - `domain/[entity].schema.ts` - Schema version for migrations
  - `domain/[entity].migrate.ts` - Data migration functions
  - `data/storage.ts` - AsyncStorage CRUD (list*, get*, upsert*, delete*)

**src/shared/:**
- Purpose: Reusable infrastructure
- Subfolders:
  - `ui/` - Base components not specific to any feature
  - `utils/` - Pure helper functions
  - `theme/` - Theme provider and token definitions
  - `attachments/` - File handling
  - `share/` - PDF export logic
  - `dev/` - Development utilities

**src/lib/:**
- Purpose: External library integration
- Contains: Apollo client configuration, hook for theme detection, classname utility

**src/theme/:**
- Purpose: Design system
- Contains: COLORS object (light/dark variants), NAV_THEME for React Navigation

## Key File Locations

**Entry Points:**
- `app/_layout.tsx` - App root (providers)
- `app/index.tsx` - Auth/onboarding gate
- `app/(tabs)/_layout.tsx` - Tab navigation shell
- `app/(vault)/_layout.tsx` - Vault navigation shell

**Configuration:**
- `app.json` - Expo manifest (project name, plugins, GraphQL URL)
- `tsconfig.json` - TypeScript paths (@ alias points to `src/`)
- `global.css` - Nativewind CSS variables
- `package.json` - Dependencies

**Core Business Models:**
- `src/domain/records/recordTypes.ts` - Enumeration of all record types
- `src/domain/records/recordCategories.ts` - Category groupings
- `src/domain/records/record.model.ts` - LifeVaultRecord container
- `src/domain/documents/attachments.ts` - Attachment reference type

**Profile Management:**
- `src/features/people/data/peopleStorage.ts` - Person CRUD
- `src/features/pets/data/petsStorage.ts` - Pet CRUD
- `src/features/profiles/data/storage.ts` - Unified profile repository

**Record Management:**
- `src/features/records/data/storage.ts` - Record CRUD (listRecordsForEntity, upsertRecord, deleteRecord)
- `src/features/records/forms/formDefs.ts` - Form schema and normalizers
- `src/features/records/ui/RecordSection.tsx` - Record category rendering

**Shared UI:**
- `src/shared/ui/RecordDetailScreen.tsx` - Read-only record display wrapper
- `src/shared/ui/RecordFormScreen.tsx` - Form submission wrapper
- `src/shared/ui/DatePickerModal.tsx` - Date input component
- `src/shared/attachments/AttachmentsBlock.tsx` - File display
- `src/shared/theme/ThemeProvider.tsx` - Theme wrapper

**GraphQL & Network:**
- `src/lib/apollo.ts` - Apollo client with auth header injection

## Naming Conventions

**Files:**
- Screen files match route: `app/(vault)/people/[personId]/index.tsx` for `/(vault)/people/:personId`
- Feature modules: kebab-case folder names (`src/features/pets/`, `src/features/documents/`)
- Type files: `[entity].model.ts`, `[entity].schema.ts`, `[entity].migrate.ts`
- Storage: `storage.ts` in feature's `data/` folder
- Components: PascalCase (`RecordSection.tsx`, `DatePickerModal.tsx`)
- Utilities: camelCase (`formatDateLabel.ts`, `buildExpirySummary.ts`)

**Directories:**
- Feature folders: lowercase, plural or singular per convention (people, pets, records, contacts)
- Grouped routes: parentheses `(tabs)`, `(vault)` indicate route grouping (not part of URL)
- Dynamic routes: square brackets `[personId]`, `[recordId]`

## Where to Add New Code

**New Feature (e.g., wills/legal documents):**
1. Create folder: `src/features/[feature]/`
2. Add structure:
   ```
   src/features/[feature]/
   ├── domain/
   │   ├── [entity].model.ts     # TypeScript types
   │   ├── [entity].schema.ts    # Zod schema
   │   └── [entity].migrate.ts   # Migration handler
   ├── data/
   │   └── storage.ts            # CRUD functions
   ├── ui/                        # Feature-specific components (optional)
   └── constants/options.ts       # Dropdown/enum options (optional)
   ```
3. Implement storage: `listItems()`, `getById()`, `upsert()`, `delete()`
4. Add routes under `app/(vault)/[feature]/` for listing/adding/editing

**New Record Type:**
1. Add to `src/domain/records/recordTypes.ts` enum: `LEGAL_WILL = "LEGAL_WILL"`
2. Create form schema in `src/features/records/forms/formDefs.ts`
3. Register in recordTypeRegistry with label, category, singleton flag
4. Form renderer automatically handles UI via RecordTypeFormRenderer

**New Shared Component:**
- Place in `src/shared/ui/` if reusable across features
- Example: `src/shared/ui/[ComponentName].tsx`
- Use NativeWind classes for styling: `className="px-4 py-2 rounded-lg bg-primary text-white"`

**Utility Functions:**
- Date/time helpers: `src/shared/utils/date.ts`
- Data extraction: `src/shared/utils/recordData.ts`
- Formatting: `src/shared/utils/summary.ts`

**New UI Screen:**
1. Create route file: `app/(vault)/[section]/index.tsx` or `app/(vault)/[section]/[id]/index.tsx`
2. Use screen wrapper from shared: `RecordDetailScreen` for display, `RecordFormScreen` for forms
3. Import data loading from feature's `data/storage.ts`
4. Use `useFocusEffect` to reload data when screen focuses

## Special Directories

**legacy/:**
- Purpose: Archive of old code before refactor
- Generated: No
- Committed: Yes (historical reference)
- Status: Not used; safe to ignore

**dist/:**
- Purpose: Web build output
- Generated: Yes (via `expo export:web`)
- Committed: No
- Status: Build artifact; exclude from git

**.planning/codebase/:**
- Purpose: Analysis documents (this file)
- Generated: Yes (by mapping tools)
- Committed: Yes
- Status: Reference documentation

**_archive_pre_fixes/:**
- Purpose: Pre-refactor archive
- Generated: No
- Committed: Yes
- Status: Old code; can be deleted

---

*Structure analysis: 2026-02-24*
