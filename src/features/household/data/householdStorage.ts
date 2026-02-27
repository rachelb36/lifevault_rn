import AsyncStorage from "@react-native-async-storage/async-storage";

import type { HouseholdProfileV1 } from "@/features/household/domain/household.schema";
import { normalizeHouseholdList } from "@/features/household/domain/household.normalize";

export const HOUSEHOLDS_KEY = "households_v1";

function sanitizeHousehold(input: HouseholdProfileV1): HouseholdProfileV1 {
  return {
    schemaVersion: 1,
    id: String(input.id),
    name: String(input.name || "").trim(),
    address: input.address?.trim() || undefined,
    memberIds: Array.isArray(input.memberIds)
      ? input.memberIds.map((m) => String(m).trim()).filter(Boolean)
      : [],
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listHouseholds(): Promise<HouseholdProfileV1[]> {
  const raw = await AsyncStorage.getItem(HOUSEHOLDS_KEY);
  if (!raw) return [];
  try {
    return normalizeHouseholdList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function getHousehold(householdId: string): Promise<HouseholdProfileV1 | null> {
  const all = await listHouseholds();
  return all.find((h) => h.id === householdId) ?? null;
}

export async function upsertHousehold(household: HouseholdProfileV1): Promise<void> {
  const all = await listHouseholds();
  const normalized = sanitizeHousehold(household);
  const idx = all.findIndex((h) => h.id === normalized.id);
  const next = [...all];

  if (idx >= 0) {
    normalized.createdAt = all[idx].createdAt || normalized.createdAt;
    next[idx] = normalized;
  } else {
    next.unshift(normalized);
  }

  await AsyncStorage.setItem(HOUSEHOLDS_KEY, JSON.stringify(next));
}

export async function deleteHousehold(householdId: string): Promise<void> {
  const all = await listHouseholds();
  const next = all.filter((h) => h.id !== householdId);
  await AsyncStorage.setItem(HOUSEHOLDS_KEY, JSON.stringify(next));
}
