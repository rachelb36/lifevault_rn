import * as SecureStore from "expo-secure-store";

const KEY = "dependents_v1";

export async function getDependents(): Promise<any[]> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDependents(list: any[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(list));
}

export async function findDependent(depId: string): Promise<any | null> {
  const list = await getDependents();
  return list.find((d: any) => d.id === depId) || null;
}

export async function updateDependent(depId: string, updater: (dep: any) => any): Promise<void> {
  const list = await getDependents();
  const next = list.map((d: any) => (d.id === depId ? updater(d) : d));
  await saveDependents(next);
}

export async function deleteDependent(depId: string): Promise<void> {
  const list = await getDependents();
  await saveDependents(list.filter((d: any) => d.id !== depId));
}
