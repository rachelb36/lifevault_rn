// lib/storage/profiles.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProfileType = "person" | "pet";

export type PetKind =
  | "Dogs"
  | "Cats"
  | "Birds"
  | "Fish"
  | "Reptile"
  | "Small Animal"
  | "Other";

export type Relationship =
  | "Self"
  | "Spouse"
  | "Child"
  | "Parent"
  | "Grandparent"
  | "Relative"
  | "Caregiver"
  | "Pet"
  | "Other";

export type Profile = {
  id: string;
  type: ProfileType;

  // Person fields
  firstName: string;
  lastName?: string;
  preferredName?: string;
  relationship: Relationship;

  // Pet fields
  kind?: PetKind;

  // Shared
  avatarUri?: string; // optional local image uri later
  createdAt: string;
  updatedAt: string;
};

const KEY = "lifevault:profiles:v1";

function nowISO() {
  return new Date().toISOString();
}

function makeId() {
  // good enough for local ids
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getProfiles(): Promise<Profile[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Profile[];
  } catch {
    return [];
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const all = await getProfiles();
  return all.find((p) => p.id === id) ?? null;
}

export async function saveProfiles(next: Profile[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function upsertProfile(input: Omit<Profile, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const all = await getProfiles();
  const ts = nowISO();

  if (input.id) {
    const idx = all.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      const updated: Profile = {
        ...all[idx],
        ...input,
        updatedAt: ts,
      };
      const next = [...all];
      next[idx] = updated;
      await saveProfiles(next);
      return updated;
    }
  }

  const created: Profile = {
    id: makeId(),
    createdAt: ts,
    updatedAt: ts,
    ...input,
  } as Profile;

  await saveProfiles([created, ...all]);
  return created;
}

export async function deleteProfile(id: string) {
  const all = await getProfiles();
  const next = all.filter((p) => p.id !== id);
  await saveProfiles(next);
}
