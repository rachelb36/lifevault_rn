import type { PersonProfileV1 } from "@/features/people/domain/person.schema";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizePersonList(raw: unknown): PersonProfileV1[] {
  const list = asArray<any>(raw);

  return list
    .map((p): PersonProfileV1 | null => {
      const id = asString(p?.id).trim();
      const firstName = asString(p?.firstName).trim();
      if (!id || !firstName) return null;

      return {
        schemaVersion: 1,
        id,
        firstName,
        lastName: asString(p?.lastName).trim(),
        preferredName: asString(p?.preferredName).trim() || undefined,
        relationship: asString(p?.relationship).trim() || "Other",
        dob: asString(p?.dob) || undefined,
        avatarUri: asString(p?.avatarUri) || undefined,
        isPrimary: Boolean(p?.isPrimary),
        createdAt: asString(p?.createdAt) || nowIso(),
        updatedAt: asString(p?.updatedAt) || nowIso(),
      } as PersonProfileV1;
    })
    .filter(Boolean) as PersonProfileV1[];
}
