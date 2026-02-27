# Expo Development Build Cheat Sheet

## Scope

Use this workflow when testing a custom native app (Expo development build), not Expo Go.

## One-Time Setup

```bash
cd /Users/rachelburgos/Applications/lifeVault/lifevault_rn
npm install
```

Install a development build on each platform:

```bash
# iOS simulator/device (local native build)
npx expo run:ios

# Android emulator/device (local native build)
npx expo run:android
```

Optional: if using tunnel mode and prompted:

```bash
npm install -g @expo/ngrok
```

## Daily Start Commands

Start Metro for a development build:

```bash
npx expo start --dev-client
```

Common variants:

```bash
# Clean Metro cache
npx expo start --dev-client -c

# Force LAN mode (same network)
npx expo start --dev-client --lan

# Force Tunnel mode (works across networks)
npx expo start --dev-client --tunnel

# Tunnel + clean cache
npx expo start --dev-client --tunnel -c
```

## Device Connection Workflow

1. Open your installed development build app on device/emulator.
2. Start Metro with `--dev-client`.
3. Scan the QR using phone camera or dev client scanner.
4. Confirm the URL uses your app scheme (`exponativewind://...` in this project).
5. App opens the JS bundle from Metro.

## Native Change Rules

No native rebuild needed:

- JS/TS logic
- Styles/layout
- Most Expo API usage already in current build

Rebuild development build required:

- `app.json` native config changes (`scheme`, `ios.bundleIdentifier`, `android.package`, permissions/plugins that affect native)
- Added/removed native modules
- Changes under `ios/` or `android/`
- SDK/react-native upgrade affecting native binaries

Rebuild commands:

```bash
npx expo run:ios
npx expo run:android
```

## Helpful Runtime Controls

```bash
# Open iOS simulator
npx expo start --dev-client --ios

# Open Android emulator
npx expo start --dev-client --android

# Open web (separate from dev client workflow)
npx expo start --web
```

## Common Problems and Fixes

`"No usable data found"` when scanning QR:

1. Start with `npx expo start --dev-client --tunnel -c`.
2. Ensure you scan with camera/dev client scanner, not Expo Go scanner.
3. Ensure dev build app is installed and matches current native config.
4. If scheme or package/bundle id changed, reinstall dev build.

Can’t connect on LAN:

1. Device and computer must be on same Wi-Fi.
2. Try `--tunnel`.
3. Disable VPN/firewall temporarily and retry.

Build launches but app crashes immediately:

1. Rebuild native app: `npx expo run:ios` or `npx expo run:android`.
2. Clear Metro cache: `npx expo start --dev-client -c`.
3. Check terminal/device logs for native module mismatch.

## Fast Reset Sequence

When things are weird, run this from project root:

```bash
rm -rf .expo
npx expo start --dev-client --tunnel -c
```

cd /Users/rachelburgos/Applications/lifeVault/lifevault_rn
npx expo start --dev-client --lan -c

If still broken:

```bash
npx expo run:ios
# or
npx expo run:android
```

## EAS Development Build (Alternative to local run)

Build on EAS servers:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

Then install that build on device and connect to Metro with:

```bash
npx expo start --dev-client
```

Worked for 6m 33s
This points to a scanner path issue, not your app code.

Use this exact flow (no QR first):

Start Metro in LAN mode:

cd /Users/rachelburgos/Applications/lifeVault/lifevault_rn
npx expo start --dev-client --lan -c

In that terminal, press s until it says it is serving for development build (not Expo Go).

On your phone, open your installed LifeVault dev build app directly.

In the dev build launcher, choose Enter URL manually (or similar).

Paste the exp://... (or exponativewind://...) URL shown in terminal.

If manual URL works, your QR scanner is the problem.
For dev builds, prefer scanning inside the dev client app, not Expo Go scanner and not iOS Control Center QR scanner.

If it still fails, send me these 2 exact lines from terminal after start:

Metro waiting on ...
Using ... / Scan the QR code ...
With those, I can pinpoint the mismatch immediately.
