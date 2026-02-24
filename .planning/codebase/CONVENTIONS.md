# Coding Conventions

**Analysis Date:** 2026-02-24

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension. Example: `NameFields.tsx`, `RecordFormScreen.tsx`, `OptionPickerSheet.tsx`
- Data/Storage: camelCase with `.ts` extension. Example: `storage.ts`, `peopleStorage.ts`, `documentsStorage.ts`
- Domain models: snake_case for schemas, PascalCase for classes. Example: `person.schema.ts`, `person.model.ts`, `person.migrate.ts`
- Type files: `.ts` extension, e.g., `types.ts`, `attachment.model.ts`
- Selectors: `get*` naming convention. Example: `getRecordMeta.ts`, `getTypesForCategory.ts`, `isSingletonType.ts`

**Functions:**
- Async functions: camelCase. Example: `listRecordsForEntity()`, `getPersonById()`, `upsertContact()`
- Pure selector functions: PascalCase for React components, camelCase for helpers. Examples: `NameFields()`, `RecordDetailScreen()`, `normalizeContact()`
- Helper functions: camelCase with clear intent. Example: `splitLegacyName()`, `normalizeRecord()`, `normalizeRuntimeOcrText()`
- ID generators: `mkId()` pattern. Example: `mkId()` in `documentsStorage.ts`

**Variables:**
- Constants (uppercase): `PEOPLE_KEY`, `DOCUMENTS_KEY`, `RECORD_TYPES`
- State variables: camelCase. Example: `firstName`, `lastName`, `loading`, `replaceTargetDocumentId`
- Callbacks: `onX` pattern for event handlers. Example: `onFirstNameChange`, `onLastNameChange`, `onToggle`, `onDone`
- Private module state: `let` with camelCase. Example: `migrationPromise`, `OCR_MODULE`

**Types:**
- Component prop types: `[ComponentName]Props`. Example: `NameFieldsProps`, `Props`
- Model types: descriptive names like `PersonProfile`, `LifeVaultRecord`, `Contact`, `VaultDocument`
- Enum-like types: descriptive union types. Example: `ContactCategory = "Medical" | "Service Provider" | ...`
- Database/storage types: `[Entity]V1` suffix. Example: `PersonProfileV1`, `PetProfileV1`, `DocumentV1`

## Code Style

**Formatting:**
- ESLint with `eslint-config-expo/flat` configuration
- No Prettier configuration detected; ESLint handles most formatting
- TypeScript strict mode disabled (`"strict": false` in tsconfig.json)
- Line length: No explicit enforcement, but code generally follows ~100 character convention

**Linting:**
- Tool: ESLint 9.37.0 with Expo config
- Config file: `/eslint.config.js`
- Key: Expo rules applied automatically
- Run command: `npm run lint` (lints `app` and `src` directories)

**TypeScript Configuration:**
- Base: `expo/tsconfig.base`
- Strict mode: **Disabled** (`"strict": false`)
- This allows `any` types and loose typing in many places
- Path aliases enabled: `@/*` maps to `src/*`

## Import Organization

**Order:**
1. React and React Native imports
2. Third-party libraries (`expo-*`, `@react-navigation`, `lucide-react-native`)
3. Internal domain imports (`@/domain/*`)
4. Internal feature imports (`@/features/*`)
5. Internal shared imports (`@/shared/*`)
6. Type imports (using `import type`)

**Example from `RecordFormScreen.tsx`:**
```typescript
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import { linkDocumentToRecord, ... } from "@/domain/documents/attachments";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { type StoredRecord, deleteRecordForEntity, ... } from "@/features/records/data/storage";
import { createDocumentFromPickerResult, ... } from "@/features/documents/data/documentsStorage";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import type { Attachment } from "@/shared/attachments/attachment.model";
```

**Path Aliases:**
- `@/*` → `src/*` (primary alias for all source code)
- `tailwind.config` → `./tailwind.config.js` (Nativewind styling)

## Error Handling

**Patterns:**
- Silent failure with fallback: Used extensively in storage operations
  ```typescript
  try {
    return normalizePersonList(JSON.parse(raw));
  } catch {
    return [];  // Return empty array on any error
  }
  ```
- Guard clauses for null/undefined: `const x = value ?? null`
- Type coercion: Heavy use of `String()`, `Number()`, `Boolean()` for runtime safety
- Validation before use: Check types before casting
  ```typescript
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  ```

**Throw statements (rare):**
- Only used in critical operations: `documentsStorage.ts` throws for missing documents
  ```typescript
  if (!doc) throw new Error("Document not found");
  if (!canShare) throw new Error("Sharing is not available on this device.");
  ```
- Not used for recoverable errors; prefer returning null or empty arrays

**No console logging:** Codebase uses silent error handling, no debug logs detected

## Comments

**When to Comment:**
- JSDoc blocks for component/function intent
- Inline comments for complex logic or business rules
- Inline comments for backward compatibility notes
- Comments explaining non-obvious data transformations

**JSDoc/TSDoc:**
- Used for major functions and components
- Format: `/** * Description * * Additional details */`
- Example from `RecordFormScreen.tsx`:
  ```typescript
  /**
   * RecordFormScreen — Shared form component for adding and editing records.
   *
   * Unified flow:
   * - "Scan or Upload <RecordType>" action at top
   * - Structured fields always visible below
   * - Attached documents represented by documentId refs
   */
  ```

**Inline comments:**
- Single-line comments with `//` explaining intent
- Example: `// MULTI: always addable`, `// SINGLE: only addable if not already present`
- Example: `// Backward-compatible aliases while screens migrate terminology.`

## Function Design

**Size:** Functions are compact and focused
- Storage operations: 10-20 lines
- Normalization functions: 20-40 lines
- Component functions: 80-150 lines (complex ones like `RecordFormScreen` exceed this)

**Parameters:**
- Props objects destructured in component signatures
- Explicit type annotations for complex parameters
- Optional parameters with `?` and defaults in destructuring

**Return Values:**
- Explicit return types for async functions: `Promise<T | null>`, `Promise<T[]>`
- Silent failures return `null` or `[]`
- Wrapped types: `StoredRecord`, `VaultDocument`, `PersonProfileV1`

## Module Design

**Exports:**
- Named exports for utilities and types
- Default export for React components (PascalCase)
- Re-exports common from storage modules: `export { Contact } from "./storage"`

**Barrel Files:**
- Not consistently used
- Most imports are direct from specific files
- Example: `import { RecordType } from "@/domain/records/recordTypes"` (direct, not from index)

**Module Organization:**
- `data/` folder: Storage and persistence logic
- `domain/` folder: Models, types, schema definitions
- `forms/` folder: Form field definitions and rendering logic
- `ui/` folder: React components
- `utils/` folder: Helper functions
- `constants/` folder: Option lists and constants

## Data Structures

**Record/Object pattern:**
- Heavy use of `Record<string, unknown>` for flexible data
- Type narrowing with `typeof` checks before access
- Null coalescing: `value ?? defaultValue`

**Array handling:**
- Immutable operations: `[...array]` for updates
- Array methods: `map()`, `filter()`, `find()`, `findIndex()`, `slice()`
- Spread operator for combining: `[item, ...rest]`

**Normalization pattern:**
- Incoming raw data always normalized through `normalize*()` functions
- Ensures schema version consistency
- Examples: `normalizeContact()`, `normalizeRecord()`, `normalizePersonList()`

## String Handling

- Template literals for dynamic strings
- `String()` coercion for runtime safety
- `.trim()` extensively used to clean input
- Locale-aware comparison: `.localeCompare()` for sorting dates

## Common Patterns

**Storage Key Generation:**
- Pattern: `key_v1:${id}` or `storage_key_v1`
- Examples: `records_v1:${entityId}`, `contacts_v1`, `documents_v1`

**ID Generation:**
- Timestamp-based: `${Date.now()}`
- Combined with random: `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
- Example: `rec_${Date.now()}_${random}`, `doc_${Date.now()}_${random}`

**DateTime Handling:**
- All timestamps stored as ISO strings: `new Date().toISOString()`
- Helper: `nowIso()` function pattern
- Sorting: `localeCompare()` on ISO strings

**Nativewind Styling:**
- All UI components use Nativewind (Tailwind CSS for React Native)
- Classes applied via `className` prop
- Color tokens: `text-foreground`, `bg-card`, `border-border`, `text-destructive`
- Responsive/variant classes: `text-sm`, `font-semibold`, `rounded-xl`, `px-4`, `py-3`

---

*Convention analysis: 2026-02-24*
