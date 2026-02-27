import type { HouseholdProfileV1 } from "@/features/household/domain/household.schema";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizeHouseholdList(raw: unknown): HouseholdProfileV1[] {
  const list = asArray<any>(raw);

  return list
    .map((h): HouseholdProfileV1 | null => {
      const id = asString(h?.id).trim();
      const name = asString(h?.name).trim();
      if (!id || !name) return null;

      return {
        schemaVersion: 1,
        id,
        name,
        address: asString(h?.address).trim() || undefined,
        memberIds: asArray<string>(h?.memberIds).map((m) => String(m).trim()).filter(Boolean),
        createdAt: asString(h?.createdAt) || nowIso(),
        updatedAt: asString(h?.updatedAt) || nowIso(),
      };
    })
    .filter(Boolean) as HouseholdProfileV1[];
}
