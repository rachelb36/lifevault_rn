// src/features/pets/data/petsStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";
import { normalizeAndMigratePetList } from "@/features/pets/domain/pet.migrate";

export const PETS_KEY = "pets_v1";

// helper: tolerate old SecureStore legacy copies
async function readRawPets(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(PETS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fallthrough */ }
  }

  const legacy = await SecureStore.getItemAsync(PETS_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      // if we can parse legacy, write it forward to AsyncStorage once
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      return [];
    }
  }

  return [];
}

export async function listPets(): Promise<PetProfileV1[]> {
  const raw = await readRawPets();
  const migrated = normalizeAndMigratePetList(raw);
  // Keep storage “healed” (optional but recommended)
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(migrated));
  return migrated;
}

export async function getPetById(petId: string): Promise<PetProfileV1 | null> {
  const all = await listPets();
  return all.find((p) => p.id === petId) ?? null;
}

export async function upsertPet(pet: PetProfileV1): Promise<void> {
  const all = await listPets();
  const idx = all.findIndex((p) => p.id === pet.id);
  const next = [...all];

  if (idx >= 0) next[idx] = pet;
  else next.unshift(pet);

  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(next));
}

export async function deletePet(petId: string): Promise<void> {
  const all = await listPets();
  const next = all.filter((p) => p.id !== petId);
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(next));
}