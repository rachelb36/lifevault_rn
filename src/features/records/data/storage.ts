// src/features/records/data/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordType } from "@/domain/records/recordTypes";
import { LifeVaultRecord } from "@/domain/records/record.model";
import { normalizeRecordDataForEdit, normalizeRecordDataForSave } from "@/features/records/forms/formDefs";

export type StoredRecord = LifeVaultRecord & {
  payload?: Record<string, unknown>;
};

const keyForEntity = (entityId: string) => `records_v1:${entityId}`;

function nowIso() {
  return new Date().toISOString();
}

function normalizeRecord(r: any, entityId: string): StoredRecord {
  const recordType = r?.recordType as RecordType;
  const rawData =
    typeof r?.data === "object" && r.data ? r.data : typeof r?.payload === "object" && r.payload ? r.payload : {};
  const data = normalizeRecordDataForSave(recordType, rawData);
  const payload = normalizeRecordDataForEdit(recordType, data);

  return {
    id: String(r?.id || `rec_${Date.now()}`),
    entityId: String(r?.entityId || entityId),
    recordType,
    title: r?.title ?? null,
    isPrivate: Boolean(r?.isPrivate),
    data,
    payload,
    attachments: Array.isArray(r?.attachments) ? r.attachments : [],
    createdAt: String(r?.createdAt || r?.updatedAt || nowIso()),
    updatedAt: String(r?.updatedAt || nowIso()),
  };
}

export async function listRecordsForEntity(entityId: string): Promise<StoredRecord[]> {
  const raw = await AsyncStorage.getItem(keyForEntity(entityId));
  const parsed = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(parsed) ? parsed : [];

  return list
    .map((r: any) => normalizeRecord(r, entityId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getRecordById(entityId: string, recordId: string): Promise<StoredRecord | null> {
  const list = await listRecordsForEntity(entityId);
  return list.find((r) => r.id === recordId) ?? null;
}

export async function upsertRecordForEntity(
  entityId: string,
  record: Partial<StoredRecord> & Pick<StoredRecord, "id" | "recordType"> & { updatedAt?: string | null; createdAt?: string | null }
): Promise<StoredRecord> {
  const list = await listRecordsForEntity(entityId);
  const existing = list.find((r) => r.id === record.id);
  const rawInput =
    typeof record.data === "object" && record.data
      ? record.data
      : typeof record.payload === "object" && record.payload
      ? record.payload
      : {};
  const data = normalizeRecordDataForSave(record.recordType, rawInput);
  const payload = normalizeRecordDataForEdit(record.recordType, data);

  const normalized: StoredRecord = {
    ...record,
    entityId,
    data,
    payload,
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    createdAt: existing?.createdAt || record.createdAt || nowIso(),
    updatedAt: record.updatedAt || nowIso(),
  };

  const idx = list.findIndex((r) => r.id === normalized.id);
  const next = idx >= 0 ? [...list.slice(0, idx), normalized, ...list.slice(idx + 1)] : [normalized, ...list];

  await AsyncStorage.setItem(keyForEntity(entityId), JSON.stringify(next));
  return normalized;
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
