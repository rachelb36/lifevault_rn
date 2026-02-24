# Roadmap — LifeVault

## Overview

**3 phases** | **13 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 1 | Dev Build Stability + OCR | App runs reliably on physical device with working OCR | DEVBUILD-01–03, OCR-01–04, IDENTITY-01–02 | 5 |
| 2 | Data Integrity Verification | Confirm core data operations are bulletproof | CORE-01–03 | 3 |
| 3 | Backend Integration | GraphQL API connects and auth flow works | DEVBUILD-03 (runtime verify) | 3 |

---

## Phase 1: Dev Build Stability + OCR

**Goal:** App runs reliably on a physical iOS device. OCR fires on identification records and auto-fills form fields.

**Requirements:** DEVBUILD-01, DEVBUILD-02, DEVBUILD-03, OCR-01, OCR-02, OCR-03, OCR-04, IDENTITY-01, IDENTITY-02

**Success Criteria:**
1. App installs from dev build `.ipa` and shows "LifeVault" on home screen
2. Camera and photo library pickers open without permission crash
3. Tapping a DRIVERS_LICENSE photo attachment triggers OCR and populates at least one field (name, DOB, or number)
4. OCR failure on a non-text image shows an error message, does not crash
5. `npx expo start --dev-client` starts Metro cleanly; DAILY_DEV.md is accurate

**Tasks:**
- [x] Fix OCR method name (`extractTextFromImage`)
- [x] Fix OCR `string[]` return type handling in `normalizeRuntimeOcrText`
- [x] Add `expo-image-picker` plugin to `app.json`
- [x] Disable `reactCompiler` experiment in `app.json`
- [x] Fix hardcoded Apollo IP → `process.env.EXPO_PUBLIC_GRAPHQL_URL`
- [x] Set app display name to "LifeVault"
- [x] Write DAILY_DEV.md
- [ ] Rebuild iOS dev client via EAS (`eas build --profile development --platform ios`)
- [ ] Install build on device and smoke test OCR flow

---

## Phase 2: Data Integrity Verification

**Goal:** Core CRUD, schema migrations, and attachment deduplication confirmed working under real use.

**Requirements:** CORE-01, CORE-02, CORE-03

**Success Criteria:**
1. Create a record, kill the app, reopen — record data is intact
2. Load the app with pre-migration data in AsyncStorage — migration runs without crash or data loss
3. Attaching the same photo twice on a record creates one document entry, not two

---

## Phase 3: Backend Integration

**Goal:** GraphQL API connection works on physical device over local network.

**Requirements:** DEVBUILD-03 (end-to-end runtime verification)

**Success Criteria:**
1. With API server running and `.env` set to LAN IP, Apollo queries succeed on physical device
2. Auth token flows from SecureStore → request header correctly
3. Network error (API down) degrades gracefully — app doesn't crash, shows offline state

---

## Phase Notes

- Phase 1 is mostly done via code fixes; final step is rebuilding the native dev client
- Phase 2 is verification-heavy — no code changes expected unless bugs are found
- Phase 3 requires `lifevault_api` to be running and testable on device

---
*Created: 2026-02-24*
