// src/shared/utils/deleteLocalProfiles.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const PEOPLE_KEY = "dependents_v1";
export const PETS_KEY = "pets_v1";

/**
 * People are currently stored in SecureStore (per your add person screen).
 * Pets are currently stored in AsyncStorage (per your pet screens).
 */

export async function deletePersonLocal(personId: string) {
  const raw = await SecureStore.getItemAsync(PEOPLE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const next = Array.isArray(list) ? list.filter((p: any) => String(p.id) !== String(personId)) : [];
  await SecureStore.setItemAsync(PEOPLE_KEY, JSON.stringify(next));
}

export async function deletePetLocal(petId: string) {
  const raw = await AsyncStorage.getItem(PETS_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const next = Array.isArray(list) ? list.filter((p: any) => String(p.id) !== String(petId)) : [];
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(next));
}