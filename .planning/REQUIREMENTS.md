# Requirements — LifeVault v1

## v1 Requirements

### Dev Build Stability (DEVBUILD)

- [ ] **DEVBUILD-01**: App starts on physical iOS device without crashing due to missing camera or photo library permissions
- [ ] **DEVBUILD-02**: Metro bundler starts cleanly with `npx expo start --dev-client` without stale cache issues
- [ ] **DEVBUILD-03**: Apollo client resolves API URL from `EXPO_PUBLIC_GRAPHQL_URL` env var without hardcoded IP

### OCR / Text Extraction (OCR)

- [ ] **OCR-01**: User can tap a photo attachment on an identification record (DRIVERS_LICENSE, PASSPORT, MEDICAL_INSURANCE) and trigger OCR
- [ ] **OCR-02**: OCR result auto-populates relevant form fields (name, DOB, expiry date, document number) when text is recognized
- [ ] **OCR-03**: OCR failure (unreadable image, unsupported format) shows a clear error message and does not crash the record form
- [ ] **OCR-04**: OCR status persists with the document (READY / UNREADABLE / FAILED) so re-scan is not forced on every view

### App Identity (IDENTITY)

- [ ] **IDENTITY-01**: App displays "LifeVault" as its name on the device home screen and in the app switcher
- [ ] **IDENTITY-02**: Daily dev workflow is documented so the app can be started reliably on any day

### Core Data (CORE)

- [ ] **CORE-01**: Record CRUD (create, read, update, delete) persists reliably and survives app restart
- [ ] **CORE-02**: Schema migration runs automatically on first read of older data formats without data loss
- [ ] **CORE-03**: Document vault stores attachments by document ID reference; no duplicate files for the same URI

## v2 Requirements (Deferred)

- Cloud backup / sync
- Household sharing between devices
- Android OCR (ML Kit) parity testing
- Biometric lock (Face ID / Touch ID)
- Push reminders for expiring documents (passport, license)
- Record templates / quick-add shortcuts

## Out of Scope

- Cloud sync — local-first design; no backend required for core use
- Multi-user shared vaults — single user per device
- Web/desktop — mobile only
- AI-powered field extraction beyond OCR — not in v1
- Changing bundle identifier / EAS slug — tied to existing EAS project config

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DEVBUILD-01 | Phase 1 | ✓ Fixed (expo-image-picker plugin added to app.json) |
| DEVBUILD-02 | Phase 1 | — Pending (rebuild required) |
| DEVBUILD-03 | Phase 1 | ✓ Fixed (apollo.ts uses env var) |
| OCR-01 | Phase 1 | ✓ Fixed (method name corrected) |
| OCR-02 | Phase 1 | ✓ Fixed (string[] return type handled) |
| OCR-03 | Phase 1 | — Needs smoke test |
| OCR-04 | Phase 1 | ✓ Existing (DocumentOcrResult.status field) |
| IDENTITY-01 | Phase 1 | ✓ Fixed (app.json name → "LifeVault") |
| IDENTITY-02 | Phase 1 | ✓ Fixed (DAILY_DEV.md written) |
| CORE-01 | Phase 2 | — Existing, verify |
| CORE-02 | Phase 2 | — Existing, verify |
| CORE-03 | Phase 2 | — Existing, verify |
