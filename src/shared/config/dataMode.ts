import * as SecureStore from "expo-secure-store";
import { ENV } from "./env";

const LOCAL_ONLY_KEY = "localOnlyMode";

let _cached: boolean | null = null;

/**
 * Returns whether the app is in local-only mode.
 *
 * When ENV.LOCAL_ONLY is true (.env forces local-only), that always wins —
 * any stale SecureStore value from a previous install is overwritten.
 * When ENV.LOCAL_ONLY is false, the SecureStore value (set via runtime
 * toggle in settings) takes precedence.
 */
export async function isLocalOnly(): Promise<boolean> {
  if (_cached !== null) return _cached;

  // .env LOCAL_ONLY=true is authoritative — override any stale SecureStore value
  if (ENV.LOCAL_ONLY) {
    _cached = true;
    await SecureStore.setItemAsync(LOCAL_ONLY_KEY, "true");
    return true;
  }

  const stored = await SecureStore.getItemAsync(LOCAL_ONLY_KEY);
  if (stored !== null) {
    _cached = stored === "true";
  } else {
    _cached = false;
    await SecureStore.setItemAsync(LOCAL_ONLY_KEY, "false");
  }

  return _cached;
}

/**
 * Synchronous access after init. Returns null if not yet resolved.
 */
export function isLocalOnlySync(): boolean | null {
  return _cached;
}

/**
 * Toggle local-only mode at runtime (e.g. from settings).
 */
export async function setLocalOnly(value: boolean): Promise<void> {
  _cached = value;
  await SecureStore.setItemAsync(LOCAL_ONLY_KEY, value ? "true" : "false");
}

/**
 * Returns true if the user has a stored access token (i.e. has authenticated).
 */
export async function hasAccessToken(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("accessToken");
  return !!token && token !== "local";
}
