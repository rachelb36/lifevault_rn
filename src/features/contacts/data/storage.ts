// src/features/contacts/data/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isLocalOnly } from "@/shared/config/dataMode";
import { apolloClient } from "@/lib/apollo";
import {
  fetchContacts as fetchContactsFromServer,
  serverCreateContact,
  serverUpdateContact,
  serverDeleteContact,
  serverLinkContactToEntity,
  serverUnlinkContactFromEntity,
} from "@/lib/graphql/contacts";

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

/**
 * Link targets inside your vault
 * person: primary user OR dependent person
 * pet: pet profiles
 */
export type LinkedProfile = {
  id: string;
  name: string;
  type: "person" | "pet";
  role?: string;
};

export type Contact = {
  id: string;

  firstName: string;
  lastName: string;
  organization?: string;

  photo?: string;
  phone: string;
  email?: string;

  categories: ContactCategory[];
  relationship?: ContactRelationship;
  linkedProfiles?: LinkedProfile[];

  isFavorite: boolean;
};

const KEY = "contacts_v1";

/** Display helper so UI doesn't have to rebuild name logic everywhere */
export function getContactDisplayName(c: Pick<Contact, "firstName" | "lastName">) {
  return `${c.firstName || ""} ${c.lastName || ""}`.trim();
}

/** Normalize stored object into Contact */
function normalizeContact(raw: any): Contact | null {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ? String(raw.id) : "";
  if (!id) return null;

  const firstName = String(raw.firstName || "").trim();
  const lastName = String(raw.lastName || "").trim();
  if (!firstName && !lastName) return null;
  const organization = String(raw.organization || "").trim();

  // categories must be array (default to Other)
  const categories: ContactCategory[] = Array.isArray(raw.categories)
    ? (raw.categories
        .map((x: any) => String(x))
        .filter(Boolean) as ContactCategory[])
    : [];

  const finalCategories: ContactCategory[] =
    categories.length > 0 ? categories : ["Other"];

  const linkedProfiles: LinkedProfile[] | undefined = Array.isArray(raw.linkedProfiles)
    ? (raw.linkedProfiles
        .map((p: any) => {
          if (!p || typeof p !== "object") return null;
          const pid = p.id ? String(p.id) : "";
          const pname = p.name ? String(p.name) : "";
          const ptype: "person" | "pet" = p.type === "pet" ? "pet" : "person";
          if (!pid || !pname) return null;
          return {
            id: pid,
            name: pname,
            type: ptype,
            role: p.role ? String(p.role) : undefined,
          };
        })
        .filter(Boolean) as LinkedProfile[])
    : undefined;

  const isFavorite = typeof raw.isFavorite === "boolean" ? raw.isFavorite : false;

  const phone = String(raw.phone || "");
  const email = raw.email ? String(raw.email) : undefined;
  const photo = raw.photo ? String(raw.photo) : undefined;

  return {
    id,
    firstName,
    lastName,
    organization: organization || undefined,
    photo,
    phone,
    email,
    categories: finalCategories,
    relationship: raw.relationship ? (String(raw.relationship) as ContactRelationship) : undefined,
    linkedProfiles: linkedProfiles && linkedProfiles.length ? linkedProfiles : undefined,
    isFavorite,
  };
}

// ─── Reads ──────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  if (!(await isLocalOnly())) {
    return fetchContactsFromServer(apolloClient);
  }

  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeContact(item))
      .filter((item): item is Contact => Boolean(item));
  } catch {
    return [];
  }
}

// ─── Writes ─────────────────────────────────────────

export async function saveContacts(next: Contact[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function upsertContact(input: Omit<Contact, "id"> & { id?: string }) {
  if (!(await isLocalOnly())) {
    // Ensure we never save empty categories
    const normalized = {
      ...input,
      categories: input.categories?.length ? input.categories : (["Other"] as ContactCategory[]),
    };

    if (normalized.id) {
      // Update existing server contact
      return serverUpdateContact(apolloClient, {
        ...normalized,
        id: normalized.id,
        isFavorite: normalized.isFavorite ?? false,
      } as Contact);
    }
    // Create new server contact
    return serverCreateContact(apolloClient, normalized);
  }

  // ── Local-only path ──
  const all = await getContacts();

  // Ensure we never save empty categories
  const normalizedInput: Omit<Contact, "id"> & { id?: string } = {
    ...input,
    categories: input.categories?.length ? input.categories : ["Other"],
  };

  if (normalizedInput.id) {
    const idx = all.findIndex((c) => c.id === normalizedInput.id);
    if (idx >= 0) {
      const updated: Contact = { ...all[idx], ...normalizedInput };
      const next = [...all];
      next[idx] = updated;
      await saveContacts(next);
      return updated;
    }
  }

  const created: Contact = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...normalizedInput,
  };

  await saveContacts([created, ...all]);
  return created;
}

export async function deleteContact(id: string) {
  if (!(await isLocalOnly())) {
    await serverDeleteContact(apolloClient, id);
    return;
  }

  const all = await getContacts();
  const next = all.filter((c) => c.id !== id);
  await saveContacts(next);
}

// ─── Entity Linking ─────────────────────────────────

export async function linkContactToEntity(contactId: string, entityId: string) {
  if (!(await isLocalOnly())) {
    await serverLinkContactToEntity(apolloClient, contactId, entityId);
    return;
  }
  // Local mode: no-op (linkedProfiles managed separately in local UI)
}

export async function unlinkContactFromEntity(contactId: string, entityId: string) {
  if (!(await isLocalOnly())) {
    await serverUnlinkContactFromEntity(apolloClient, contactId, entityId);
    return;
  }
  // Local mode: no-op
}
