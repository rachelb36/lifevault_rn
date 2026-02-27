import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "@/shared/config/env";
import { PEOPLE_KEY } from "@/features/people/data/peopleStorage";
import { PETS_KEY } from "@/features/pets/data/petsStorage";

const LOCAL_ONLY_KEY = "localOnlyMode";
const LOCAL_AUTH_KEY = "localAuth";
const LOCAL_USER_KEY = "localUser";

type LocalUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  hasOnboarded?: boolean;
};

type LocalAuth = {
  email: string;
  password: string;
};

export async function getLocalOnlyMode(): Promise<boolean> {
  // .env LOCAL_ONLY=true is authoritative — override any stale SecureStore value
  if (ENV.LOCAL_ONLY) {
    await SecureStore.setItemAsync(LOCAL_ONLY_KEY, "true");
    return true;
  }

  const stored = await SecureStore.getItemAsync(LOCAL_ONLY_KEY);
  if (stored === null) {
    await SecureStore.setItemAsync(LOCAL_ONLY_KEY, "false");
    return false;
  }
  return stored === "true";
}

export async function setLocalOnlyMode(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_ONLY_KEY, value ? "true" : "false");
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const raw = await SecureStore.getItemAsync(LOCAL_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export async function setLocalUser(user: LocalUser): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_USER_KEY, JSON.stringify(user));
}

export async function getLocalAuth(): Promise<LocalAuth | null> {
  const raw = await SecureStore.getItemAsync(LOCAL_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalAuth;
  } catch {
    return null;
  }
}

export async function setLocalAuth(auth: LocalAuth): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_AUTH_KEY, JSON.stringify(auth));
}

export async function seedLocalData(): Promise<void> {
  const user: LocalUser = {
    id: `local-${Date.now()}`,
    email: "demo@lifevault.app",
    firstName: "Alex",
    lastName: "Morgan",
    preferredName: "Alex",
    hasOnboarded: true,
  };

  await setLocalUser(user);
  await setLocalAuth({ email: user.email, password: "demo1234" });
  await SecureStore.setItemAsync("accessToken", "local");
  await SecureStore.setItemAsync("userProfileCreated", "true");
  await SecureStore.setItemAsync("primaryProfileCreated", "true");

  const nowIso = new Date().toISOString();
  const people = [
    {
      schemaVersion: 1,
      id: `dep-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      firstName: "Jamie",
      lastName: "Morgan",
      preferredName: "Jamie",
      relationship: "Child",
      dob: "2014-06-20",
      isPrimary: false,
    },
  ];

  const pets = [
    {
      schemaVersion: 1,
      id: `pet-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      petName: "Max",
      kind: "Dog",
      dob: "2019-03-12",
      breed: "Labrador",
    },
  ];

  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
}
