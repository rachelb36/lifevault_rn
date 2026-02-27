import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizePetList(
  raw: unknown,
): PetProfileV1[] {
  const list = asArray<any>(raw);

  const pets = list
    .map((p): PetProfileV1 | null => {
      const id = asString(p?.id).trim();
      const petName = asString(p?.petName).trim();
      if (!id || !petName) {
        return null;
      }

      return {
        schemaVersion: 1,
        id,
        petName,
        kind: asString(p?.kind) || "Other",
        kindOtherText: asString(p?.kindOtherText) || undefined,
        breed: asString(p?.breed) || undefined,
        breedOtherText: asString(p?.breedOtherText) || undefined,
        avatarUri: asString(p?.avatarUri) || undefined,
        createdAt: asString(p?.createdAt) || nowIso(),
        updatedAt: asString(p?.updatedAt) || nowIso(),
      };
    })
    .filter(Boolean) as PetProfileV1[];

  return pets;
}
