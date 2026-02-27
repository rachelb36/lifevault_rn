import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PersonProfileV1 } from "@/features/people/domain/person.schema";
import { normalizePersonList } from "@/features/people/domain/person.normalize";

export const PEOPLE_KEY = "people_v1";

function sanitizePerson(input: PersonProfileV1): PersonProfileV1 {
  return {
    schemaVersion: 1,
    id: String(input.id),
    firstName: String(input.firstName || "").trim(),
    lastName: String(input.lastName || "").trim(),
    preferredName: input.preferredName?.trim() || undefined,
    relationship: input.relationship || "Other",
    dob: input.dob || undefined,
    avatarUri: input.avatarUri?.trim() || undefined,
    isPrimary: input.isPrimary || undefined,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as PersonProfileV1;
}

export async function listPeople(): Promise<PersonProfileV1[]> {
  const raw = await AsyncStorage.getItem(PEOPLE_KEY);
  if (!raw) return [];
  try {
    return normalizePersonList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function getPersonById(personId: string): Promise<PersonProfileV1 | null> {
  const all = await listPeople();
  return all.find((p) => p.id === personId) ?? null;
}

export async function upsertPerson(person: PersonProfileV1): Promise<void> {
  const all = await listPeople();
  const normalized = sanitizePerson(person);
  const idx = all.findIndex((p) => p.id === normalized.id);
  const next = [...all];

  if (idx >= 0) {
    normalized.createdAt = all[idx].createdAt || normalized.createdAt;
    next[idx] = normalized;
  } else {
    next.unshift(normalized);
  }

  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(next));
}

export async function deletePerson(personId: string): Promise<void> {
  const all = await listPeople();
  const next = all.filter((p) => p.id !== personId);
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(next));
}
