# LifeVault

## What This Is

LifeVault is a local-first mobile app (iOS/Android) that acts as a personal and family document vault. Users store structured records — medical, identification, travel, financial, household, pets — for each family member and pet, with photo attachments, OCR auto-fill, and PDF export.

## Core Value

Every important document and record for your family, accessible on your phone without cloud accounts or subscriptions.

## Requirements

### Validated

- ✓ Local-first record storage per person/pet (AsyncStorage, schema-versioned with migrations) — existing
- ✓ People profiles with name, DOB, relationship, avatar, contact info — existing
- ✓ Pet profiles with name, species, DOB, vet info — existing
- ✓ Structured records across 8+ categories (medical, ID, travel, financial, household, pets, contacts, calendar) — existing
- ✓ Camera/gallery/file attachment flow (AttachmentSourceSheet → document vault) — existing
- ✓ Document vault with deduplication by URI — existing
- ✓ PDF export and sharing — existing
- ✓ Dark/light theme via NativeWind — existing
- ✓ Onboarding flow (first-run profile creation) — existing
- ✓ Tab navigation (Dashboard, Household, Directory, Documents, Settings) — existing
- ✓ GraphQL client with auth token header injection — existing

### Active

- [ ] OCR end-to-end working: photo → text extraction → form field auto-fill
- [ ] Dev build stable on physical device (camera/photo permissions, no Expo Go)
- [ ] Apollo connects to local API without hardcoded IP
- [ ] App identity (display name "LifeVault" everywhere)
- [ ] Daily dev workflow documented

### Out of Scope

- Cloud sync — local-first is the design; no cloud in v1
- Multi-user / shared vaults — single user per device
- Web / desktop — mobile only
- AI field extraction beyond OCR — keep it simple for v1

## Context

- **Stack**: React Native 0.81.5 + Expo 54 + expo-router 6, TypeScript 5.9, NativeWind 4.2, Apollo Client 3.14
- **Dev build**: Switched from Expo Go to expo-dev-client — requires EAS builds for native modules (OCR, camera)
- **OCR module**: `expo-text-extractor` v1.0.0 — uses Apple Vision (iOS) / ML Kit (Android), returns `string[]`
- **Known bugs fixed**: OCR method name mismatch, string[] return type, missing image-picker plugin, hardcoded Apollo IP, reactCompiler experiment disabled
- **Backend**: `lifevault_api` (Prisma + GraphQL, `npm run dev` starts it on port 4000)
- **EAS project ID**: `afc88b5a-4429-4aad-85d5-7df6ead972ad`

## Constraints

- **Native builds required**: expo-text-extractor and camera require development build (not Expo Go)
- **Local-first**: All user data stays on device; no backend dependency for core functionality
- **Bundle ID**: `com.rachelburgos.exponativewind` — tied to EAS, changing requires reconfiguration
- **iOS only for OCR**: Vision framework required; Android support via ML Kit when ready

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first with AsyncStorage | No account required, works offline, privacy by default | ✓ Good |
| expo-text-extractor for OCR | Lightweight native module, uses OS-provided Vision/ML Kit | ✓ Good |
| expo-dev-client instead of Expo Go | Required for expo-text-extractor and camera native modules | ✓ Good |
| reactCompiler disabled | Caused sluggishness and unexpected render behavior | ✓ Good — removed |
| EXPO_PUBLIC_GRAPHQL_URL env var | Allows per-machine API URL without code changes | — Pending |

---
*Last updated: 2026-02-24 after initial GSD setup*
