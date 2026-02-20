import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";
import { normalizeAndMigratePetList } from "@/features/pets/domain/pet.migrate";

export const PETS_KEY = "pets_v1";

async function readRawPets(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(PETS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallthrough
    }
  }

  const legacy = await SecureStore.getItemAsync(PETS_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      return [];
    }
  }

  return [];
}

function sanitizePet(input: PetProfileV1): PetProfileV1 {
  return {
    ...input,
    schemaVersion: 1,
    id: String(input.id),
    petName: String(input.petName || "").trim(),
    kind: String(input.kind || "").trim() || "Other",
    kindOtherText: input.kindOtherText?.trim() || undefined,
    breed: input.breed?.trim() || undefined,
    breedOtherText: input.breedOtherText?.trim() || undefined,
    avatar: input.avatar?.trim() || undefined,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listPets(): Promise<PetProfileV1[]> {
  const raw = await readRawPets();
  const migrated = normalizeAndMigratePetList(raw);
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(migrated));
  return migrated;
}

export async function getPetById(petId: string): Promise<PetProfileV1 | null> {
  const all = await listPets();
  return all.find((p) => p.id === petId) ?? null;
}

export async function upsertPet(pet: PetProfileV1): Promise<void> {
  const all = await listPets();
  const normalized = sanitizePet(pet);
  const idx = all.findIndex((p) => p.id === normalized.id);
  const next = [...all];

  if (idx >= 0) {
    normalized.createdAt = all[idx].createdAt || normalized.createdAt;
    next[idx] = normalized;
  } else {
    next.unshift(normalized);
  }

  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(next));
}

export async function deletePet(petId: string): Promise<void> {
  const all = await listPets();
  const next = all.filter((p) => p.id !== petId);
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(next));
}
