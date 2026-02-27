// src/features/records/data/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordType } from "@/domain/records/recordTypes";
import { LifeVaultRecord } from "@/domain/records/record.model";
import { normalizeAttachmentRefs } from "@/domain/documents/attachments";
import { normalizeRecordDataForEdit, normalizeRecordDataForSave } from "@/features/records/forms/formDefs";
import { ensureDocumentsStorageReady, updateDocLinksIndexForEntity } from "@/features/documents/data/documentsStorage";
import { isLocalOnly } from "@/shared/config/dataMode";
import { apolloClient } from "@/lib/apollo";
import {
  fetchRecordsForEntity as fetchRecordsFromServer,
  serverUpsertRecord,
  serverDeleteRecord,
  type ServerRecord,
} from "@/lib/graphql/records";

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
    attachments: normalizeAttachmentRefs(r?.attachments),
    createdAt: String(r?.createdAt || r?.updatedAt || nowIso()),
    updatedAt: String(r?.updatedAt || nowIso()),
  };
}

/** Map a ServerRecord into the local StoredRecord shape via the normalization pipeline. */
function serverRecordToStored(sr: ServerRecord): StoredRecord {
  return normalizeRecord(
    {
      id: sr.id,
      entityId: sr.entityId,
      recordType: sr.recordType,
      payload: sr.payload,
      isPrivate: sr.privacy === "SENSITIVE",
      createdAt: sr.createdAt,
      updatedAt: sr.updatedAt,
    },
    sr.entityId ?? "",
  );
}

// ─── Reads ──────────────────────────────────────────

export async function listRecordsForEntity(entityId: string): Promise<StoredRecord[]> {
  if (!(await isLocalOnly())) {
    const serverRecords = await fetchRecordsFromServer(apolloClient, entityId);
    return serverRecords
      .map(serverRecordToStored)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  await ensureDocumentsStorageReady();
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

// ─── Writes ─────────────────────────────────────────

export async function upsertRecordForEntity(
  entityId: string,
  record: Partial<StoredRecord> & Pick<StoredRecord, "id" | "recordType"> & { updatedAt?: string | null; createdAt?: string | null }
): Promise<StoredRecord> {
  if (!(await isLocalOnly())) {
    const rawInput =
      typeof record.data === "object" && record.data
        ? record.data
        : typeof record.payload === "object" && record.payload
        ? record.payload
        : {};
    const data = normalizeRecordDataForSave(record.recordType, rawInput);

    const sr = await serverUpsertRecord(apolloClient, {
      recordId: record.id,
      entityId,
      recordType: record.recordType,
      payload: data,
      isPrivate: record.isPrivate,
    });
    return serverRecordToStored(sr);
  }

  // ── Local-only path ──
  await ensureDocumentsStorageReady();
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
    attachments: normalizeAttachmentRefs(record.attachments),
    createdAt: existing?.createdAt || record.createdAt || nowIso(),
    updatedAt: record.updatedAt || nowIso(),
  };

  const idx = list.findIndex((r) => r.id === normalized.id);
  const next = idx >= 0 ? [...list.slice(0, idx), normalized, ...list.slice(idx + 1)] : [normalized, ...list];

  await AsyncStorage.setItem(keyForEntity(entityId), JSON.stringify(next));
  await updateDocLinksIndexForEntity(entityId, next);
  return normalized;
}

export async function deleteRecordForEntity(entityId: string, recordId: string): Promise<void> {
  if (!(await isLocalOnly())) {
    await serverDeleteRecord(apolloClient, recordId);
    return;
  }

  const list = await listRecordsForEntity(entityId);
  const next = list.filter((r) => r.id !== recordId);
  await AsyncStorage.setItem(keyForEntity(entityId), JSON.stringify(next));
  await updateDocLinksIndexForEntity(entityId, next);
}

// Aliases kept for person-routed screens.
export const listRecordsForPerson = listRecordsForEntity;
export const upsertRecordForPerson = upsertRecordForEntity;
export const deleteRecordForPerson = deleteRecordForEntity;
