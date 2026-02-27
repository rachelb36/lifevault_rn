import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const STORAGE_SCHEMA_KEY = "storage_schema_version";
const STORAGE_SCHEMA_VERSION = "6";
const RECORDS_PREFIX = "records_v1:";

function shouldResetKey(key: string): boolean {
  return (
    key === "people_v1" ||
    key === "pets_v1" ||
    key === "households_v1" ||
    key === "contacts_v1" ||
    key === "documents_v1" ||
    key === "doc_links_index" ||
    key === "profiles_v2" ||
    key === "contacts_v1_migrated" ||
    key.startsWith(RECORDS_PREFIX)
  );
}

export async function ensureStorageSchemaVersion(): Promise<void> {
  const current = await AsyncStorage.getItem(STORAGE_SCHEMA_KEY);
  if (current === STORAGE_SCHEMA_VERSION) return;

  const allKeys = await AsyncStorage.getAllKeys();
  const keysToReset = allKeys.filter(shouldResetKey);

  if (keysToReset.length > 0) {
    await AsyncStorage.multiRemove(keysToReset);
  }

  // Reset onboarding/profile-prefill flags so first-run routing is consistent
  // with cleared storage.
  await Promise.allSettled([
    SecureStore.deleteItemAsync("hasOnboarded"),
    SecureStore.deleteItemAsync("primaryProfileCreated"),
    SecureStore.deleteItemAsync("userFirstName"),
    SecureStore.deleteItemAsync("userLastName"),
    SecureStore.deleteItemAsync("userPreferredName"),
    SecureStore.deleteItemAsync("userDob"),
    SecureStore.deleteItemAsync("userPhotoUri"),
    SecureStore.deleteItemAsync("skipOnboarding"),
  ]);

  await AsyncStorage.setItem(STORAGE_SCHEMA_KEY, STORAGE_SCHEMA_VERSION);
}
