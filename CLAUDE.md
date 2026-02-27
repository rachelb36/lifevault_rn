# LifeVault React Native

## Stack
- **Expo 54** + React Native + React 19 + TypeScript 5.9 (strict: false)
- **expo-router** file-based routing with typed routes
- **NativeWind v4** (TailwindCSS for RN) — use `className` prop, not StyleSheet
- **AsyncStorage** (primary data) + **expo-secure-store** (sensitive data like auth tokens)
- **lucide-react-native** for icons
- **react-native-gifted-charts** for charts (LineChart for weight history)
- **Apollo GraphQL** wired but LOCAL_ONLY mode — no backend required
- Path alias: `@/*` -> `src/*`

## Verification
```bash
npx tsc --noEmit        # Must be zero errors after every change
npm test                 # 18 tests across 3 suites (pets, contacts, petsStorage)
```

## Project Structure

### Routes (`app/`)
- `(tabs)/` — Bottom tabs: Dashboard, Household, Directory, Documents, Settings
- `(vault)/` — Custom bottom nav + Stack for detail screens
  - `people/add.tsx`, `people/[personId]/index.tsx` — Person add/detail
  - `pets/add.tsx`, `pets/[petId]/index.tsx` — Pet add/detail
  - `*/records/add.tsx`, `*/records/[recordId]/` — Record add/view/edit
  - `contacts/add.tsx`, `documents/[documentId]/`
  - `me.tsx` — Primary user profile

### Source (`src/`)
- `domain/records/` — RecordTypes (50+), categories, registry, model
- `features/people/` — PersonProfile model, schema, migration, storage
- `features/pets/` — PetProfile model, schema, migration, storage, constants (70+ options)
- `features/profiles/` — Unified Profile = PersonProfile | PetProfile, storage facade
- `features/records/forms/` — Dynamic form system
- `features/contacts/` — Contact CRUD + phone import (expo-contacts)
- `features/documents/` — Document CRUD + OCR + inverted link index
- `shared/ui/` — Reusable components (DatePickerModal, TimePickerModal, RecordFormScreen, SectionRecordRows, etc.)
- `shared/utils/` — date.ts, summary.ts, recordData.ts, localStorage.ts
- `lib/` — apollo.ts, cn.ts, useColorScheme.tsx

## Architecture Patterns

### Profile = Header Data + Records
- **Header data** (PetProfile/PersonProfile): name, avatar, gender, DOB, dateType, adoptionDate — stored in AsyncStorage via petsStorage/peopleStorage
- **Record data** (LifeVaultRecord): per-entity records keyed by `records_v1:{entityId}` — dynamic form fields
- Profile detail pages show a **white card** (header data) + **category sections** (record rows)

### PetProfile Header Fields
```typescript
PetProfile = {
  id, profileType: "PET", petName, kind, kindOtherText?, breed?, breedOtherText?,
  gender?, dob?, dateType?, adoptionDate?, avatarUri?, createdAt, updatedAt
}
```
- `dateType` is `"dob"` (default) or `"adoptionDate"` — controls which date shows on the profile card
- Gender, DOB/adoption date are **header data**, NOT records (removed from PET_OVERVIEW)

### PersonProfile Header Fields
```typescript
PersonProfile = {
  id, profileType: "PERSON", firstName, lastName, preferredName?, relationship?,
  dob?, avatarUri?, isPrimary?, createdAt, updatedAt
}
```

### Storage Layer
- `petsStorage.ts`: `sanitizePet()` normalizes all fields before write — must include ALL header fields
- `profiles/data/storage.ts`: `petToProfile()` and `upsertProfile()` convert between schema and model — must map ALL fields
- Pattern: read raw -> normalize/migrate -> conditional write if changed

### Dynamic Form System
- `FieldDef[]` per record type -> `RecordTypeFormRenderer` -> field-specific renderers
- FieldTypes: text, multiline, document, select, date, list, toggle, objectList, description, timeList
- `forcePills?: boolean` on FieldDef — forces pill display for list fields regardless of option count
- `showWhen?: { key, equals }` — conditional field visibility
- Defs in `forms/defs/`: identification.ts, medical.ts, school.ts, preferences.ts, travel.ts, legal.ts, pet.ts
- Defaults in `formDefaults.ts` — must stay in sync with defs

### Avatar Upload Pattern
Both `pets/add.tsx` and `pets/[petId]/index.tsx` use the same `pickAvatar` pattern:
- Alert with "Choose from Library" / "Take Photo" / "Remove Photo" / "Cancel"
- Camera permission check with `canAskAgain` + `Linking.openSettings()` fallback
- On detail page: saves via `upsertProfile()` + `setPet()` for immediate local update

### Record Categories
- **People**: IDENTIFICATION, MEDICAL, PRIVATE_HEALTH, SCHOOL, PREFERENCES, TRAVEL, LEGAL, DOCUMENTS
- **Pets**: PET_BASICS, PET_MEDICAL, PET_DAILY_CARE, PET_BEHAVIOR_SAFETY, PET_CONTACTS, PET_DOCUMENTS
- PET_OVERVIEW exists in code but is **not in PET_CATEGORY_ORDER** (hidden from UI)

## Key Conventions
- All data is mock/local — no migration rules needed for legacy data
- NativeWind `className` for all styling
- Profile card: centered vertical layout (avatar, name, breed/kind, gender/date/age)
- Date picker: DatePickerModal component with `parseDate()` / `toIsoDateOnly()` helpers
- Unsaved changes detection: JSON.stringify snapshot comparison
- Save flow: validate -> upsert -> setSaveLabel("saved") -> setTimeout router.back()
- Touch targets: `TouchableOpacity` with `activeOpacity={0.85}`, `hitSlop={10}` on icon buttons

## Device
- iPhone 17 Pro Max, iOS
- `npx expo prebuild --clean && npx expo run:ios --device "Burgos iPhone"` for native rebuilds
- expo-contacts requires native rebuild (not available in Expo Go)

## What NOT To Do
- Don't add migration/legacy code — all data is mock
- Don't use StyleSheet.create — use NativeWind className
- Don't add features beyond what's requested
- Don't store gender/DOB/adoption as PET_OVERVIEW records — they are header data
- Don't make the pet profile card horizontal — it's centered vertical
