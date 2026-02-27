import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";
import { normalizePetList } from "@/features/pets/domain/pet.normalize";

export const PETS_KEY = "pets_v1";

async function readRawPets(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(PETS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function sanitizePet(input: PetProfileV1): PetProfileV1 {
  return {
    schemaVersion: 1,
    id: String(input.id),
    petName: String(input.petName || "").trim(),
    kind: String(input.kind || "").trim() || "Other",
    kindOtherText: input.kindOtherText?.trim() || undefined,
    breed: input.breed?.trim() || undefined,
    breedOtherText: input.breedOtherText?.trim() || undefined,
    dob: input.dob?.trim() || undefined,
    dateType: input.dateType?.trim() || undefined,
    adoptionDate: input.adoptionDate?.trim() || undefined,
    gender: input.gender?.trim() || undefined,
    avatarUri: input.avatarUri?.trim() || undefined,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listPets(): Promise<PetProfileV1[]> {
  const raw = await readRawPets();
  return normalizePetList(raw);
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
