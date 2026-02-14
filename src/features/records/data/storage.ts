// src/features/records/data/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordType } from "@/domain/records/recordTypes";
import { LifeVaultRecord } from "@/domain/records/record.model";

export type StoredRecord = LifeVaultRecord & {
  data: Record<string, unknown>;
};

const keyForEntity = (entityId: string) => `records_v1:${entityId}`;

export async function listRecordsForEntity(entityId: string): Promise<StoredRecord[]> {
  const raw = await AsyncStorage.getItem(keyForEntity(entityId));
  const parsed = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(parsed) ? parsed : [];

  return list.map((r: any) => ({
    id: String(r.id),
    recordType: r.recordType as RecordType,
    title: r.title ?? null,
    updatedAt: r.updatedAt ?? null,
    data: typeof r.data === "object" && r.data ? r.data : {},
  }));
}

export async function getRecordById(entityId: string, recordId: string): Promise<StoredRecord | null> {
  const list = await listRecordsForEntity(entityId);
  return list.find((r) => r.id === recordId) ?? null;
}

export async function upsertRecordForEntity(
  entityId: string,
  record: Omit<StoredRecord, "updatedAt"> & { updatedAt?: string | null }
): Promise<StoredRecord> {
  const list = await listRecordsForEntity(entityId);
  const nowIso = new Date().toISOString();

  const next: StoredRecord = {
    ...record,
    updatedAt: record.updatedAt ?? nowIso,
  };

  const idx = list.findIndex((r) => r.id === next.id);
  const updated = idx >= 0 ? [...list.slice(0, idx), next, ...list.slice(idx + 1)] : [next, ...list];

  await AsyncStorage.setItem(keyForEntity(entityId), JSON.stringify(updated));
  return next;
}

export async function deleteRecordForEntity(entityId: string, recordId: string): Promise<void> {
  const list = await listRecordsForEntity(entityId);
  const next = list.filter((r) => r.id !== recordId);
  await AsyncStorage.setItem(keyForEntity(entityId), JSON.stringify(next));
}

// Backward-compatible aliases while screens migrate terminology.
export const listRecordsForPerson = listRecordsForEntity;
export const upsertRecordForPerson = upsertRecordForEntity;
export const deleteRecordForPerson = deleteRecordForEntity;