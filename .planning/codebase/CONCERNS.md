# Codebase Concerns

**Analysis Date:** 2026-02-24

## Tech Debt

**OCR Method Name Mismatch:**
- Issue: `expo-text-extractor` API method name is incorrect. Code checks for `extractFromImageAsync` but the actual library method may be `extractTextFromImage` or `extractTextAsync`. The return type handling also doesn't account for possible array returns from the normalizer.
- Files: `src/features/documents/data/documentsStorage.ts` (lines 50-54, 466-468)
- Impact: OCR functionality will fail silently, returning FAILED status instead of extracting text from documents. Users will not be able to use document scanning/OCR features.
- Fix approach: Verify correct method name in expo-text-extractor package documentation and update the method references. Update `normalizeRuntimeOcrText()` (line 64-91) to properly handle array return types if the library returns `string[]`.

**Hardcoded Apollo GraphQL URL:**
- Issue: Apollo client configured with hardcoded local IP address `http://192.168.4.23:4000/graphql` instead of using environment variables.
- Files: `src/lib/apollo.ts` (line 6)
- Impact: Development builds will fail to connect to GraphQL when run on different networks or by different developers. Prevents production builds without manual code changes.
- Fix approach: Move URL to `app.json` extra config or environment variables. Use `Constants.expoConfig?.extra?.GRAPHQL_URL` at runtime with fallback for development.

**App Configuration Still References "expo-nativewind":**
- Issue: `app.json` contains old project identifiers: name is "expo-nativewind" and slug is "expo-nativewind". Should be "LifeVault" or equivalent.
- Files: `app.json` (lines 3-4, 8, 12, 26)
- Impact: Bundle identifiers, scheme, and package names reference old template name. May cause confusion in app stores and device installations. iOS bundle ID is `com.rachelburgos.exponativewind` (not a critical issue since it matches scheme).
- Fix approach: Rebrand app.json with correct project name: change name to "LifeVault", slug to "lifevault", update bundle identifier to `com.rachelburgos.lifevault`, and scheme to "lifevault".

**Missing expo-image-picker Plugin Configuration:**
- Issue: `app.json` plugins array does not include `expo-image-picker` configuration, even though the library is installed in dependencies.
- Files: `app.json` (lines 33-49)
- Impact: iOS and Android builds from Expo will not have proper camera/photo library permissions configured. Development builds will fail when attempting to use image picker features without manual configuration.
- Fix approach: Add `expo-image-picker` to plugins with appropriate permission configuration for iOS (camera, photoLibrary) and Android (READ_EXTERNAL_STORAGE, CAMERA).

**React Compiler Experiment Enabled:**
- Issue: `experiments.reactCompiler: true` is enabled in `app.json`.
- Files: `app.json` (line 52)
- Impact: React Compiler is an experimental feature in React 19. Enabling it may cause rendering issues, performance degradation, or subtle bugs with state management that are difficult to debug. Expo support for this feature is not fully stable.
- Fix approach: Set `reactCompiler: false` until the feature reaches stable status or if rendering issues occur, disable it immediately and test thoroughly.

## Performance Bottlenecks

**listPets() Writes on Every Read:**
- Issue: `listPets()` performs a migration scan and writes back to AsyncStorage on every call, even when no migration occurred.
- Files: `src/features/pets/data/petsStorage.ts` (lines 48-53)
- Impact: Every UI render that calls `listPets()` triggers a disk write. With multiple components rendering lists of pets, this creates unnecessary I/O overhead and can slow down app responsiveness.
- Improvement path: Add a flag to track whether migration has already completed. Only write if `changed === true`. Consider caching the migrated list in memory with invalidation on explicit upsert/delete operations.

**getContacts() Runs Migration Scan on Every Call:**
- Issue: `getContacts()` detects and writes back legacy data format on every call, even when storage is already normalized.
- Files: `src/features/contacts/data/storage.ts` (lines 159-207)
- Impact: Unnecessary AsyncStorage reads and writes on every fetch, causing performance degradation when contacts list is large or accessed frequently.
- Improvement path: Add a migration completion marker in AsyncStorage (e.g., `contacts_migrated: true`). Skip migration logic if marker exists. Clear marker only on explicit save operations.

**listLinkedRecordsForDocument() Scans All AsyncStorage Keys - O(n*m) Complexity:**
- Issue: Function calls `AsyncStorage.getAllKeys()` then iterates all record storage keys (RECORDS_PREFIX), then for each key fetches and parses the full record array to find matching documents.
- Files: `src/features/documents/data/documentsStorage.ts` (lines 522-560)
- Impact: When called during document list rendering (line 42 in `app/(vault)/documents/index.tsx`), this causes O(n*m) performance where n=number of record keys and m=average records per key. With many records, this becomes a significant bottleneck blocking the UI thread.
- Improvement path: Maintain an inverted index in AsyncStorage (e.g., `document_index: {documentId: [entityId, recordId, recordType]}`) updated when records are modified. Query this index instead of scanning all records.

## Security Considerations

**No Environment Configuration System:**
- Issue: No `.env` file or environment configuration system. Sensitive URLs and configuration hardcoded in source files.
- Files: `src/lib/apollo.ts` (hardcoded IP), `app.json` extra config (hardcoded GraphQL URL in EXPO_PUBLIC_GRAPHQL_URL)
- Current mitigation: Access tokens stored in `expo-secure-store`, but other sensitive data is visible in code
- Recommendations:
  - Create proper environment management: `.env.development`, `.env.production` with eas.json or similar
  - Use `expo-constants` to load environment variables at runtime
  - Never hardcode IPs or URLs that change between environments

**Mock Documents Shown to Real Users:**
- Issue: Documents screen may display test/mock data to real users in production. The `toScreenDocument()` function and document filtering logic don't appear to have safety checks preventing test fixtures from appearing in the UI.
- Files: `app/(vault)/documents/index.tsx` (lines 41-54, 96-111)
- Current mitigation: None detected
- Recommendations: Add explicit filtering to exclude any documents with test/mock markers. Implement environment-based test data separation so mock data only appears in dev builds.

## Fragile Areas

**Large Form Definition File:**
- Issue: `src/features/records/forms/formDefs.ts` is 1,570 lines - an extremely large single file containing all record type form definitions.
- Files: `src/features/records/forms/formDefs.ts`
- Why fragile: Changes to any record type require modifying this massive file, risking unintended side effects. Difficult to navigate, review, and test. High cognitive load when adding new record types.
- Safe modification: Split by record type into separate files or use a factory pattern. Consider extracting form definitions to JSON with a schema validator.
- Test coverage: No test files exist for form definitions (no *.test.* or *.spec.* files found in codebase).

**Monolithic RecordTypeFormRenderer Component:**
- Issue: `src/features/records/forms/RecordTypeFormRenderer.tsx` is 999 lines with complex conditional rendering for all record types.
- Files: `src/features/records/forms/RecordTypeFormRenderer.tsx`
- Why fragile: Single component handles rendering logic for 20+ record types. Changes to one type can affect others. Difficult to test individual record type rendering paths.
- Safe modification: Extract record-type-specific rendering into separate components or use a strategy pattern with type-specific renderers.
- Test coverage: No tests exist.

**RecordFormScreen at 757 Lines:**
- Issue: `src/shared/ui/RecordFormScreen.tsx` contains both form logic and UI rendering for all record types.
- Files: `src/shared/ui/RecordFormScreen.tsx`
- Why fragile: Mixes concerns of form state management, validation, submission, and UI rendering. Hard to isolate bugs and test individual concerns.
- Safe modification: Separate form orchestration from UI rendering. Extract field-level logic into custom hooks.
- Test coverage: No tests exist.

**Inconsistent Storage Migration Patterns:**
- Issue: Each storage module (pets, people, contacts, documents) implements migration differently with varying safeguards.
- Files: `src/features/pets/data/petsStorage.ts`, `src/features/people/data/peopleStorage.ts`, `src/features/contacts/data/storage.ts`, `src/features/documents/data/documentsStorage.ts`
- Why fragile: Future storage changes risk missing key steps if developers follow inconsistent patterns. Migration bugs silently corrupt data without proper error handling.
- Safe modification: Create a shared storage migration utility with consistent error handling, rollback, and logging.
- Test coverage: No tests for migration paths.

## Missing Critical Features

**No Testing Framework Configured:**
- Issue: No testing framework installed (jest, vitest, mocha, etc.) despite `lint` script configured.
- Impact: Blocks unit testing of business logic, storage migrations, and form validation. Zero test coverage.
- Recommendation: Install and configure Jest or Vitest. Create tests for storage layers and critical business logic before adding more features.

**Storage Key Inconsistencies Not Fully Resolved:**
- Issue: Documents screen may still reference old storage key `documents_tab_v1` pattern instead of the new `documents_v1` system. The documents/index.tsx file shows full implementation but no grep match for old key suggests migration may be partial.
- Files: `app/(vault)/documents/index.tsx`, `src/features/documents/data/documentsStorage.ts`
- Impact: If old key still exists in user storage, documents could be split across two storage locations during transition period.
- Recommendation: Verify complete migration off old key. Add explicit cleanup during `ensureDocumentsStorageReady()` to purge `documents_tab_v1` key after migration.

## Scaling Limits

**AsyncStorage Performance with Large Datasets:**
- Current capacity: AsyncStorage default is ~6-10MB on iOS, similar on Android
- Limit: With OCR results embedded in documents and all records stored as JSON arrays in AsyncStorage, the 6-10MB limit can be reached with:
  - ~100 large documents with OCR results (10KB each)
  - ~1000 records across all types
- Scaling path: Implement proper SQLite database (using `expo-sqlite`). Keep only small metadata in AsyncStorage for fast access. Store full records in SQLite with proper indexing.

**Form Definitions Size:**
- Current capacity: formDefs.ts is 1,570 lines, loaded on every app start
- Limit: Could slow app startup with many more record types. Currently limited by developer cognitive load rather than technical limits.
- Scaling path: Move form definitions to async-loaded JSON with lazy initialization per record type.

## Dependencies at Risk

**React 19 Compiler Experiment Stability:**
- Risk: React Compiler (enabled in app.json) is experimental. Breaking changes possible.
- Impact: Rendering bugs, state management issues, performance regressions
- Migration plan: Disable immediately if issues occur. Switch to proven stable React version if compiler causes problems.

**expo-text-extractor Compatibility:**
- Risk: Small third-party library with unclear documentation. API may change between versions.
- Impact: OCR functionality currently broken (wrong method name). Future version updates could introduce further issues.
- Migration plan: If library becomes unmaintained, switch to alternative OCR library (e.g., vision-camera-ocr or implement native module).

## Test Coverage Gaps

**Storage Layer Untested:**
- What's not tested:
  - AsyncStorage migration logic (documents, pets, people, contacts)
  - Data normalization and sanitization
  - Concurrent read/write safety
  - Edge cases: corrupted JSON, missing keys, format changes
- Files: `src/features/*/data/*.ts`
- Risk: Silent data corruption or loss when storage format changes. Users could lose data during app updates.
- Priority: High - storage is the most critical path in the app.

**Form Validation Untested:**
- What's not tested:
  - Form field validation rules
  - Required field enforcement
  - Date range validation
  - Attachment handling
- Files: `src/features/records/forms/*.ts`, `src/shared/ui/RecordFormScreen.tsx`
- Risk: Invalid data could be saved to storage. UI could crash on edge cases.
- Priority: High - forms are primary user interaction point.

**Record Type Rendering Untested:**
- What's not tested:
  - All 20+ record type form renderings
  - Conditional field display
  - Field dependencies
  - Edit vs. create paths
- Files: `src/features/records/forms/RecordTypeFormRenderer.tsx`
- Risk: Regression in any record type could go unnoticed until user encounters it.
- Priority: Medium - high blast radius but lower frequency changes.

**Document Features Untested:**
- What's not tested:
  - OCR extraction and text normalization
  - Document-to-record linking
  - File sharing functionality
  - Document URI validation
- Files: `src/features/documents/data/documentsStorage.ts`, `app/(vault)/documents/index.tsx`
- Risk: OCR currently broken due to API mismatch. Document linking expensive due to O(n*m) scan. Sharing could fail silently.
- Priority: Medium - OCR is high-value feature.

---

*Concerns audit: 2026-02-24*
