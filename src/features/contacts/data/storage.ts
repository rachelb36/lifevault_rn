// src/features/contacts/data/storage.ts
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

/** Display helper so UI doesn’t have to rebuild name logic everywhere */
export function getContactDisplayName(c: Pick<Contact, "firstName" | "lastName">) {
  return `${c.firstName || ""} ${c.lastName || ""}`.trim();
}

/** Best-effort legacy name splitter */
function splitLegacyName(full: string): { firstName: string; lastName: string } {
  const cleaned = String(full || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };

  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1)[0],
  };
}

/** Normalize any stored object (legacy or current) into Contact v2 */
function normalizeContact(raw: any): Contact | null {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ? String(raw.id) : "";
  if (!id) return null;

  // New shape
  const hasNewNameFields =
    typeof raw.firstName === "string" || typeof raw.lastName === "string";

  // Legacy shape
  const legacyName = typeof raw.name === "string" ? raw.name : "";
  const legacyCompany = typeof raw.company === "string" ? raw.company : "";

  const { firstName: legacyFirst, lastName: legacyLast } = splitLegacyName(legacyName);

  const firstName = (hasNewNameFields ? String(raw.firstName || "") : legacyFirst).trim();
  const lastName = (hasNewNameFields ? String(raw.lastName || "") : legacyLast).trim();

  // organization can come from:
  // - new field: organization
  // - old experiments: company
  // - old experiments: clinic
  const organization =
    (typeof raw.organization === "string" ? raw.organization : "") ||
    legacyCompany ||
    (typeof raw.clinic === "string" ? raw.clinic : "");

  // categories must be array (default to Other)
  const categories: ContactCategory[] = Array.isArray(raw.categories)
    ? (raw.categories
        .map((x: any) => String(x))
        .filter(Boolean) as ContactCategory[])
    : [];

  const finalCategories: ContactCategory[] =
    categories.length > 0 ? categories : ["Other"];

  // linkedProfiles should stay array if present
  const linkedProfiles: LinkedProfile[] | undefined = Array.isArray(raw.linkedProfiles)
    ? (raw.linkedProfiles
        .map((p: any) => {
          if (!p || typeof p !== "object") return null;
          const pid = p.id ? String(p.id) : "";
          const pname = p.name ? String(p.name) : "";
          const ptype: "person" | "pet" = p.type === "pet" ? "pet" : "person"; // default everything else to person
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

  // isFavorite default false
  const isFavorite = typeof raw.isFavorite === "boolean" ? raw.isFavorite : false;

  // phone required in your UI, but storage migration should keep what exists
  const phone = raw.phone ? String(raw.phone) : "";
  const email = raw.email ? String(raw.email) : undefined;
  const photo = raw.photo ? String(raw.photo) : undefined;

  return {
    id,
    firstName,
    lastName,
    organization: organization.trim() ? organization.trim() : undefined,
    photo,
    phone,
    email,
    categories: finalCategories,
    relationship: raw.relationship ? (String(raw.relationship) as ContactRelationship) : undefined,
    linkedProfiles: linkedProfiles && linkedProfiles.length ? linkedProfiles : undefined,
    isFavorite,
  };
}

export async function getContacts(): Promise<Contact[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized: Contact[] = [];
    let changed = false;

    for (const item of parsed) {
      const c = normalizeContact(item);
      if (!c) {
        // If there's junk/invalid data in storage, drop it and rewrite
        changed = true;
        continue;
      }

      normalized.push(c);

      // Detect whether this item was legacy or malformed
      const hasLegacyFields =
        typeof item?.name === "string" ||
        typeof item?.company === "string" ||
        typeof item?.clinic === "string";

      const missingRequiredNewFields =
        typeof item?.firstName !== "string" ||
        typeof item?.lastName !== "string";

      const hadEmptyCategories =
        !Array.isArray(item?.categories) || item.categories.length === 0;

      if (hasLegacyFields || missingRequiredNewFields || hadEmptyCategories) {
        changed = true;
      }
    }

    // Auto-write back migrated format so everything becomes v2 going forward
    if (changed) {
      await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return [];
  }
}

export async function saveContacts(next: Contact[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function upsertContact(input: Omit<Contact, "id"> & { id?: string }) {
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
  const all = await getContacts();
  const next = all.filter((c) => c.id !== id);
  await saveContacts(next);
}