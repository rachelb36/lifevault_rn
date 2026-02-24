# Testing Patterns

**Analysis Date:** 2026-02-24

## Current Testing Status

**No tests detected in project codebase.**

The project has no test files in the source directory (`src/`). While some dev dependencies include testing utilities, no test configuration files (jest.config.js, vitest.config.js) are present in the project root.

## Test Framework Setup (Not Configured)

**Available Dependencies:**
- TypeScript 5.9.3 (type checking, static analysis)
- ESLint 9.37.0 with Expo config (linting only)

**Recommended Setup (if implementing tests):**
Based on Expo/React Native conventions, consider:
- `jest` with `@testing-library/react-native`
- Or `vitest` for faster iteration
- `@testing-library/jest-native` for assertions

## Project Characteristics for Testing

**What exists to test:**

### 1. Storage Layer
Files: `src/features/*/data/storage.ts`, `src/features/*/data/*Storage.ts`

**Key testable functions:**
- `listRecordsForEntity()` / `listRecordsForPerson()` - `src/features/records/data/storage.ts`
- `getRecordById()` - `src/features/records/data/storage.ts`
- `upsertRecordForEntity()` - `src/features/records/data/storage.ts`
- `deleteRecordForEntity()` - `src/features/records/data/storage.ts`
- `getContacts()` - `src/features/contacts/data/storage.ts`
- `upsertContact()` - `src/features/contacts/data/storage.ts`
- `deleteContact()` - `src/features/contacts/data/storage.ts`
- `listPeople()` - `src/features/people/data/peopleStorage.ts`
- `upsertPerson()` - `src/features/people/data/peopleStorage.ts`
- `deletePerson()` - `src/features/people/data/peopleStorage.ts`
- `getDocuments()` - `src/features/documents/data/documentsStorage.ts`
- `shareDocument()` - `src/features/documents/data/documentsStorage.ts`

**Testing approach:**
- Mock `AsyncStorage` from `@react-native-async-storage/async-storage`
- Test CRUD operations with fixtures
- Test normalization/migration logic
- Test error handling (JSON parsing failures, missing items)

### 2. Normalization Functions
Files: `src/features/*/data/storage.ts`, `src/domain/*/migrate.ts`

**Key testable functions:**
- `normalizeContact()` - `src/features/contacts/data/storage.ts` (lines 79-157)
- `normalizeRecord()` - `src/features/records/data/storage.ts` (lines 19-38)
- `normalizePersonList()` - imported in `src/features/people/data/peopleStorage.ts`
- `normalizeAndMigratePetList()` - imported in `src/features/pets/data/petsStorage.ts`

**Testing approach:**
- Test with valid new format
- Test with legacy format data
- Test with partial/malformed data
- Verify all required fields are set to defaults
- Test backward compatibility migrations

### 3. Selector Functions
Files: `src/domain/records/selectors/`, `src/shared/utils/`

**Key testable functions:**
- `getRecordMeta()` - `src/domain/records/selectors/getRecordMeta.ts`
- `getTypesForCategory()` - `src/domain/records/selectors/getTypesForCategory.ts`
- `isSingletonType()` - `src/domain/records/selectors/isSingletonType.ts`
- `getContactDisplayName()` - `src/features/contacts/data/storage.ts` (lines 60-62)

**Testing approach:**
- Pure function testing (no side effects)
- Various input types
- Edge cases (null, undefined, empty values)

### 4. UI Components (would require React Native Testing Library)
Files: `src/shared/ui/`, `src/features/*/ui/`

**Key testable components:**
- `NameFields.tsx` - Simple form component
- `OptionPickerSheet.tsx` - Modal with search and filtering
- `RecordDetailScreen.tsx` - Complex screen component
- `RecordFormScreen.tsx` - Large form component with file handling

**Testing approach:**
- Component snapshot tests
- User interaction (press, text input)
- Conditional rendering
- Props validation

### 5. Form Definition Engine
File: `src/features/records/forms/formDefs.ts` (very large, ~2000 lines)

**Key testable functions:**
- `getFieldsForRecordType()` - returns form fields for a record type
- `buildInitialData()` - creates default form state
- `normalizeRecordDataForSave()` - transforms form data for storage
- `normalizeRecordDataForEdit()` - transforms storage data for editing
- `buildDisplayRows()` - formats data for display

**Testing approach:**
- Test each record type's field definitions
- Test data transformation round-trip (save → storage → edit → display)
- Test conditional fields with `showWhen`
- Test object list items and nested structures

## Current Error Handling Patterns (Relevant to Testing)

**Silent failure with fallback:**
```typescript
// From src/features/people/data/peopleStorage.ts
try {
  return normalizePersonList(JSON.parse(raw));
} catch {
  return [];  // Catches JSON.parse errors, normalization errors
}
```

**Type validation before use:**
```typescript
// From src/features/contacts/data/storage.ts
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed)) return [];
```

**Null coalescing:**
```typescript
// From src/features/records/data/storage.ts
return list.find((r) => r.id === recordId) ?? null;
```

**Testing implications:**
- Test that invalid JSON returns empty array/null
- Test that non-matching types return defaults
- Test that missing fields are coalesced to defaults

## Missing Areas Without Tests

### High Risk (No Coverage)

**Data Persistence:**
- AsyncStorage mock interactions
- JSON serialization/deserialization with actual AsyncStorage
- Migration from v0/legacy formats
- Concurrent access patterns

**Complex Business Logic:**
- Record-to-contact linking in `RecordFormRenderer.tsx`
- Vaccination option injection based on pet kind
- Document file handling (share, open, OCR)
- Attachment reference normalization

**Integration:**
- Form submission flow (form → storage → navigation)
- Document upload and attachment linking
- Profile creation with multiple records
- Cross-entity references (contacts linking to people/pets)

### Medium Risk (Screen Component Logic)

**Navigation state:**
- `RecordFormScreen.tsx` - add vs edit mode, attachment handling
- `RecordDetailScreen.tsx` - delete confirmation, document operations

**User interactions:**
- Form validation and error display
- Modal dismissal and state cleanup
- Swipe-to-delete row actions
- Option picker search and filtering

### Low Risk (Pure Utilities)

- Date formatting and parsing (`formatDateLabel()`, `parseDate()`, `toIsoDateOnly()`)
- String case transformations (`splitLegacyName()`)
- ID generation (`mkId()`)
- Array operations (sorting, filtering)

## Recommended Test Structure (If Implemented)

**Directory layout:**
```
src/
├── features/
│   ├── records/
│   │   ├── data/
│   │   │   ├── storage.ts
│   │   │   └── storage.test.ts  ← Unit tests for CRUD
│   │   ├── forms/
│   │   │   ├── formDefs.ts
│   │   │   └── formDefs.test.ts  ← Unit tests for field definitions
│   │   └── ui/
│   │       └── RecordSection.test.tsx
│   └── ...
├── domain/
│   ├── records/
│   │   └── selectors/
│   │       └── getRecordMeta.test.ts
│   └── ...
├── __tests__/  ← Integration tests
│   ├── recordFlow.test.ts
│   └── contactsFlow.test.ts
```

**Test naming convention:**
- `[module].test.ts` for unit tests (co-located)
- `[feature].integration.test.ts` for feature tests
- `[component].test.tsx` for component tests

## Potential Test Fixtures/Data

**Person fixture:**
```typescript
const mockPerson = {
  id: "person_123",
  firstName: "John",
  lastName: "Doe",
  preferredName: "Johnny",
  relationship: "Self",
  dob: "1990-01-01",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
```

**Record fixture:**
```typescript
const mockRecord = {
  id: "rec_123",
  entityId: "person_123",
  recordType: "MEDICAL_PROFILE",
  title: "Current Health Status",
  isPrivate: false,
  data: { bloodType: "O+", height: 180 },
  attachments: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
```

**Contact fixture:**
```typescript
const mockContact = {
  id: "contact_123",
  firstName: "Dr.",
  lastName: "Smith",
  phone: "555-0123",
  email: "dr.smith@example.com",
  categories: ["Medical"],
  isFavorite: true,
};
```

---

*Testing analysis: 2026-02-24*

**Note:** This document describes the testing landscape as-is (no tests present) and provides guidance for future test implementation based on the codebase structure.
