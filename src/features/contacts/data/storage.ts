// lib/storage/contacts.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ContactCategory =
  | "Medical"
  | "Service Provider"
  | "Emergency"
  | "Family"
  | "School"
  | "Work"
  | "Insurance"
  | "Legal"
  | "Other";

export type ContactRelationship =
  | "Mother"
  | "Father"
  | "Parent"
  | "Grandchild"
  | "Aunt"
  | "Uncle"
  | "Sibling"
  | "Brother"
  | "Sister"
  | "Other";

export type LinkedProfile = {
  id: string;
  name: string;
  type: "user" | "dependent";
  role?: string;
};

export type Contact = {
  id: string;
  name: string;
  photo?: string;
  phone: string;
  email?: string;
  categories: ContactCategory[];
  relationship?: ContactRelationship;
  linkedProfiles?: LinkedProfile[];
  isFavorite: boolean;
};

const KEY = "contacts_v1";

export async function getContacts(): Promise<Contact[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Contact[]) : [];
  } catch {
    return [];
  }
}

export async function saveContacts(next: Contact[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function upsertContact(input: Omit<Contact, "id"> & { id?: string }) {
  const all = await getContacts();

  if (input.id) {
    const idx = all.findIndex((c) => c.id === input.id);
    if (idx >= 0) {
      const updated: Contact = { ...all[idx], ...input };
      const next = [...all];
      next[idx] = updated;
      await saveContacts(next);
      return updated;
    }
  }

  const created: Contact = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...input,
  };
  await saveContacts([created, ...all]);
  return created;
}

export async function deleteContact(id: string) {
  const all = await getContacts();
  const next = all.filter((c) => c.id !== id);
  await saveContacts(next);
}
