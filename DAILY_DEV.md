# LifeVault — Daily Dev Workflow

## Every Day: Run the App on Your Phone

### 1. Start the API server

```bash
cd ~/Applications/lifeVault/lifevault_api
npm run dev
```

Runs GraphQL server at `http://127.0.0.1:4000/graphql` via `tsx watch`.

### 2. Start Metro bundler

```bash
cd ~/Applications/lifeVault/lifevault_rn
npx expo start --dev-client
```

Then open the **Expo Dev Client** app on your phone and scan the QR code, or press `i` for iOS simulator.

> **Cache issues?** Add `--clear`:
> ```bash
> npx expo start --dev-client --clear
> ```

---

## When You Need a New Dev Build

A new build is required after **any native change** — adding/removing packages with native code, editing `app.json` plugins, or updating iOS/Android config.

Recent changes that require a rebuild:
- Added `expo-image-picker` plugin (camera/photo permissions)
- Disabled `reactCompiler` experiment

### Build and install on device (iOS)

```bash
eas build --profile development --platform ios
```

Then download the `.ipa` from the EAS dashboard and install it via Xcode Devices or TestFlight internal.

### Build locally (faster, requires Xcode)

```bash
eas build --profile development --platform ios --local
```

Outputs a `.ipa` you can drag onto a connected device in Finder.

### Android

```bash
eas build --profile development --platform android
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Unable to resolve module` | `npx expo start --dev-client --clear` |
| Camera/photo picker crashes on device | Rebuild dev client (expo-image-picker plugin was added) |
| OCR never populates fields | Ensure you're on a dev build (not Expo Go) — Vision framework requires native module |
| App name still shows "expo-nativewind" | Rebuild dev client |
| Apollo fails to connect | Make sure API server is running; check `EXPO_PUBLIC_GRAPHQL_URL` in `.env` |
| Metro hangs on startup | Kill existing Metro: `kill $(lsof -ti:8081)` then restart |

---

## Environment Variables

Create a `.env` file in `lifevault_rn/` if you need to override the API URL:

```
EXPO_PUBLIC_GRAPHQL_URL=http://YOUR_LOCAL_IP:4000/graphql
```

Use your machine's LAN IP (not `127.0.0.1`) when testing on a physical device over WiFi.
Find it with: `ipconfig getifaddr en0`

---

## Quick Reference

| Task | Command |
|------|---------|
| Start everything | `npm run dev` (api) + `npx expo start --dev-client` (rn) |
| Clear Metro cache | `npx expo start --dev-client --clear` |
| Check Expo login | `npx expo whoami` |
| New iOS dev build | `eas build --profile development --platform ios` |
| New Android dev build | `eas build --profile development --platform android` |
| Migrate DB | `npm run db:migrate` (in lifevault_api/) |
| TypeScript check | `npx tsc --noEmit` (in lifevault_rn/) |
