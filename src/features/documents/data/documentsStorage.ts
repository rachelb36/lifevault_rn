/**
 * CHANGELOG
 * - Introduced canonical documents_v1 storage for all uploaded/scanned files.
 * - Added migration from legacy record-embedded URIs into Document entries.
 * - Records now reference files by documentId (RecordAttachmentRef) rather than raw URI.
 * - Added share/view helpers and OCR persistence hooks.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import type {
  DocumentInput,
  DocumentV1,
} from "@/features/documents/domain/document.schema";
import { normalizeAndMigrateDocuments } from "@/features/documents/domain/document.migrate";
import type {
  DocumentPickerInput,
  DocumentOcrResult,
  VaultDocument,
} from "@/features/documents/domain/document.model";
import {
  normalizeAttachmentRefs,
  type RecordAttachmentRef,
  type RecordAttachmentRole,
} from "@/domain/documents/attachments";
export type { VaultDocument } from "@/features/documents/domain/document.model";

const DOCUMENTS_KEY = "documents_v1";
const RECORDS_PREFIX = "records_v1:";

let migrationPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function mkId(prefix: "doc" | "ocr"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type RuntimeOcrResult =
  | string
  | {
      text?: string;
      lines?: string[];
      blocks?: { lines?: { text?: string }[] }[];
    };

type RuntimeOcrModule = {
  extractFromImageAsync?: (uri: string) => Promise<RuntimeOcrResult>;
  extractTextAsync?: (uri: string) => Promise<RuntimeOcrResult>;
  detectTextAsync?: (uri: string) => Promise<RuntimeOcrResult>;
};

function getRuntimeOcrModule(): RuntimeOcrModule | null {
  const req = (globalThis as unknown as { require?: (moduleId: string) => unknown }).require;
  if (typeof req !== "function") return null;
  try {
    return req("expo-text-extractor") as RuntimeOcrModule;
  } catch {
    return null;
  }
}

function normalizeRuntimeOcrText(input: RuntimeOcrResult): { text: string; lines: string[] } {
  if (typeof input === "string") {
    const lines = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return { text: input, lines };
  }

  const text = String(input.text || "").trim();
  if (text.length > 0) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return { text, lines };
  }

  const lines =
    Array.isArray(input.lines) && input.lines.length > 0
      ? input.lines.map((line) => String(line || "").trim()).filter(Boolean)
      : (input.blocks || [])
          .flatMap((block) => block.lines || [])
          .map((line) => String(line.text || "").trim())
          .filter(Boolean);

  return { text: lines.join("\n"), lines };
}

function toInputSourceTag(source?: "camera" | "library" | "files"): string | undefined {
  if (!source) return undefined;
  if (source === "camera") return "camera";
  if (source === "library") return "library";
  if (source === "files") return "files";
  return undefined;
}

function normalizeDoc(input: DocumentV1): VaultDocument {
  return {
    id: input.id,
    uri: input.uri,
    mimeType: input.mimeType,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    sha256: input.sha256,
    createdAt: input.createdAt,
    title: input.title,
    tags: input.tags,
    note: input.note,
    linkedTo: input.linkedTo,
    ocr: input.ocr,
  };
}

async function readRawDocuments(): Promise<DocumentV1[]> {
  const raw = await AsyncStorage.getItem(DOCUMENTS_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  return normalizeAndMigrateDocuments(parsed);
}

async function writeDocuments(docs: DocumentV1[]): Promise<void> {
  await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

function toSchema(input: VaultDocument): DocumentV1 {
  return {
    schemaVersion: 1,
    id: input.id,
    uri: input.uri,
    mimeType: input.mimeType,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    sha256: input.sha256,
    createdAt: input.createdAt,
    title: input.title,
    tags: input.tags,
    note: input.note,
    linkedTo: input.linkedTo,
    ocr: input.ocr,
  };
}

function extractLegacyUriCandidates(data: Record<string, unknown>): {
  uri: string;
  role?: RecordAttachmentRole;
  label?: string;
}[] {
  const candidates: { key: string; role?: RecordAttachmentRole; label?: string }[] = [
    { key: "uri", role: "OTHER" },
    { key: "fileUri", role: "OTHER" },
    { key: "documentUri", role: "OTHER" },
    { key: "imageUri", role: "OTHER" },
    { key: "frontImageUri", role: "FRONT", label: "Front" },
    { key: "backImageUri", role: "BACK", label: "Back" },
  ];

  const matched = candidates
    .map((candidate) => {
      const value = String(data[candidate.key] || "").trim();
      if (!value) return null;
      return { uri: value, role: candidate.role, label: candidate.label };
    })
    .filter(Boolean);

  return matched as { uri: string; role?: RecordAttachmentRole; label?: string }[];
}

function removeLegacyUriFields(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  [
    "uri",
    "fileUri",
    "documentUri",
    "imageUri",
    "frontImageUri",
    "backImageUri",
  ].forEach((key) => {
    if (key in next) delete next[key];
  });
  return next;
}

async function ensureDocumentFromUri(
  docs: DocumentV1[],
  input: { uri: string; fileName?: string; mimeType?: string; title?: string; tags?: string[] },
): Promise<DocumentV1> {
  const existing = docs.find((d) => d.uri === input.uri);
  if (existing) return existing;

  const next: DocumentV1 = {
    schemaVersion: 1,
    id: mkId("doc"),
    uri: input.uri,
    mimeType: input.mimeType || "application/octet-stream",
    fileName: input.fileName,
    createdAt: nowIso(),
    title: input.title,
    tags: input.tags,
  };
  docs.unshift(next);
  return next;
}

async function migrateRecordAttachmentsToDocuments(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const recordKeys = allKeys.filter((key) => key.startsWith(RECORDS_PREFIX));
  if (recordKeys.length === 0) return;

  const docs = await readRawDocuments();

  for (const key of recordKeys) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;

    let changed = false;
    let parsed: unknown = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    if (!Array.isArray(parsed)) continue;

    const nextRecords = await Promise.all(
      parsed.map(async (item) => {
        if (!item || typeof item !== "object") return item;
        const record = { ...(item as Record<string, unknown>) };
        const existingRefs = normalizeAttachmentRefs(record.attachments);
        let refs: RecordAttachmentRef[] = [...existingRefs];

        const legacyAttachments = Array.isArray(record.attachments)
          ? (record.attachments as unknown[])
          : [];

        for (const attachment of legacyAttachments) {
          if (!attachment || typeof attachment !== "object") continue;
          const row = attachment as Record<string, unknown>;
          const hasDocumentId = Boolean(String(row.documentId || "").trim());
          if (hasDocumentId) continue;

          const uri = String(row.uri || "").trim();
          if (!uri) continue;

          const doc = await ensureDocumentFromUri(docs, {
            uri,
            fileName: String(row.fileName || "").trim() || undefined,
            mimeType: String(row.mimeType || "").trim() || undefined,
            title: String(record.title || "").trim() || undefined,
          });

          refs.push({
            documentId: doc.id,
            label: String(row.label || row.title || "").trim() || undefined,
            addedAt: String(row.createdAt || nowIso()),
          });
          changed = true;
        }

        const dataRaw =
          record.data && typeof record.data === "object"
            ? ({ ...(record.data as Record<string, unknown>) } as Record<string, unknown>)
            : {};

        const uriCandidates = extractLegacyUriCandidates(dataRaw);
        for (const candidate of uriCandidates) {
          const doc = await ensureDocumentFromUri(docs, {
            uri: candidate.uri,
            title: String(record.title || "").trim() || undefined,
          });

          if (!refs.some((ref) => ref.documentId === doc.id)) {
            refs.push({
              documentId: doc.id,
              role: candidate.role,
              label: candidate.label,
              addedAt: nowIso(),
            });
            changed = true;
          }
        }

        if (uriCandidates.length > 0) {
          record.data = removeLegacyUriFields(dataRaw);
          record.payload = removeLegacyUriFields(
            record.payload && typeof record.payload === "object"
              ? (record.payload as Record<string, unknown>)
              : dataRaw,
          );
          changed = true;
        }

        record.attachments = refs;
        return record;
      }),
    );

    if (changed) {
      await AsyncStorage.setItem(key, JSON.stringify(nextRecords));
    }
  }

  await writeDocuments(docs);
}

export async function ensureDocumentsStorageReady(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const docs = await readRawDocuments();
      await writeDocuments(docs);
      await migrateRecordAttachmentsToDocuments();
    })().catch(async () => {
      migrationPromise = null;
    });
  }

  if (migrationPromise) {
    await migrationPromise;
  }
}

export async function listDocuments(): Promise<VaultDocument[]> {
  await ensureDocumentsStorageReady();
  const docs = await readRawDocuments();
  return docs.map((doc) => normalizeDoc(doc));
}

export async function getDocument(id: string): Promise<VaultDocument | null> {
  await ensureDocumentsStorageReady();
  const docs = await readRawDocuments();
  const found = docs.find((doc) => doc.id === id);
  return found ? normalizeDoc(found) : null;
}

export async function upsertDocument(input: VaultDocument): Promise<VaultDocument> {
  await ensureDocumentsStorageReady();
  const docs = await readRawDocuments();
  const next = toSchema(input);
  const idx = docs.findIndex((doc) => doc.id === next.id);
  if (idx >= 0) docs[idx] = next;
  else docs.unshift(next);
  await writeDocuments(docs);
  return normalizeDoc(next);
}

export async function createDocument(input: DocumentInput): Promise<VaultDocument> {
  await ensureDocumentsStorageReady();

  const doc: VaultDocument = {
    id: input.id || mkId("doc"),
    uri: input.uri,
    mimeType: input.mimeType,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    sha256: input.sha256,
    createdAt: input.createdAt || nowIso(),
    title: input.title,
    tags: input.tags,
    note: input.note,
    linkedTo: input.linkedTo,
    ocr: input.ocr,
  };

  return upsertDocument(doc);
}

export async function deleteDocument(id: string): Promise<void> {
  await ensureDocumentsStorageReady();
  const docs = await readRawDocuments();
  const next = docs.filter((doc) => doc.id !== id);
  await writeDocuments(next);
}

export async function shareDocument(documentId: string): Promise<void> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing is not available on this device.");

  await Sharing.shareAsync(doc.uri, {
    dialogTitle: doc.title || doc.fileName || "Share Document",
    mimeType: doc.mimeType || "application/octet-stream",
    UTI: doc.mimeType === "application/pdf" ? "com.adobe.pdf" : undefined,
  });
}

export async function viewDocument(documentId: string): Promise<string> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  return doc.uri;
}

export async function openDocumentUri(
  uri: string,
  mimeType?: string,
): Promise<void> {
  const nextUri = String(uri || "").trim();
  if (!nextUri) throw new Error("Document URI is missing.");

  const isWeb = /^https?:\/\//i.test(nextUri);
  if (isWeb) {
    const canOpen = await Linking.canOpenURL(nextUri);
    if (!canOpen) throw new Error("This URL cannot be opened on this device.");
    await Linking.openURL(nextUri);
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("No local file viewer is available on this device.");
  }

  await Sharing.shareAsync(nextUri, {
    dialogTitle: "Open Document",
    mimeType: mimeType || "application/octet-stream",
    UTI: mimeType === "application/pdf" ? "com.adobe.pdf" : undefined,
  });
}

export async function openDocument(documentId: string): Promise<void> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  await openDocumentUri(doc.uri, doc.mimeType);
}

export async function createDocumentFromPickerResult(
  pickerResult: DocumentPickerInput,
  input?: { title?: string; tags?: string[] },
): Promise<VaultDocument> {
  const sourceTag = toInputSourceTag(pickerResult.source);
  const nextTags = [...(input?.tags || []), ...(sourceTag ? [sourceTag] : [])].filter(Boolean);

  return createDocument({
    uri: pickerResult.uri,
    mimeType: pickerResult.mimeType || "application/octet-stream",
    fileName: pickerResult.fileName,
    sizeBytes: pickerResult.sizeBytes,
    title: input?.title || pickerResult.fileName,
    tags: nextTags.length > 0 ? nextTags : undefined,
  });
}

export async function runOcr(documentId: string): Promise<VaultDocument> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");

  if (!doc.mimeType.startsWith("image/")) {
    const unsupported: DocumentOcrResult = {
      text: "",
      extractedAt: nowIso(),
      engine: "OTHER",
      status: "FAILED",
      error:
        doc.mimeType === "application/pdf"
          ? "OCR not available for PDFs yet."
          : "OCR only supports images.",
    };
    return upsertDocument({ ...doc, ocr: unsupported });
  }

  const module = getRuntimeOcrModule();
  const run =
    module?.extractFromImageAsync ||
    module?.extractTextAsync ||
    module?.detectTextAsync;

  if (!run) {
    const failed: DocumentOcrResult = {
      text: "",
      extractedAt: nowIso(),
      engine: "OTHER",
      status: "FAILED",
      error: "OCR engine is unavailable. Install expo-text-extractor to enable OCR.",
    };
    return upsertDocument({ ...doc, ocr: failed });
  }

  try {
    const raw = await run(doc.uri);
    const normalized = normalizeRuntimeOcrText(raw);
    const ready = normalized.lines.length > 0;

    const result: DocumentOcrResult = {
      text: normalized.text,
      lines: normalized.lines,
      extractedAt: nowIso(),
      engine: Platform.OS === "ios" ? "VISION" : Platform.OS === "android" ? "MLKIT" : "OTHER",
      status: ready ? "READY" : "UNREADABLE",
      error: ready ? undefined : "No readable text found.",
    };

    return upsertDocument({ ...doc, ocr: result });
  } catch (error) {
    const failed: DocumentOcrResult = {
      text: "",
      extractedAt: nowIso(),
      engine: Platform.OS === "ios" ? "VISION" : Platform.OS === "android" ? "MLKIT" : "OTHER",
      status: "FAILED",
      error: error instanceof Error ? error.message : "OCR failed",
    };
    return upsertDocument({ ...doc, ocr: failed });
  }
}

export async function clearOcr(documentId: string): Promise<VaultDocument> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  const { ocr: _ignored, ...rest } = doc;
  return upsertDocument(rest);
}

export type LinkedRecordRef = {
  entityId: string;
  recordId: string;
  recordType: string;
  title?: string;
};

export async function listLinkedRecordsForDocument(
  documentId: string,
): Promise<LinkedRecordRef[]> {
  await ensureDocumentsStorageReady();
  const allKeys = await AsyncStorage.getAllKeys();
  const recordKeys = allKeys.filter((key) => key.startsWith(RECORDS_PREFIX));
  const links: LinkedRecordRef[] = [];

  for (const key of recordKeys) {
    const entityId = key.replace(RECORDS_PREFIX, "");
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    let parsed: unknown = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;

    parsed.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      const refs = normalizeAttachmentRefs(row.attachments);
      if (!refs.some((ref) => ref.documentId === documentId)) return;
      const recordId = String(row.id || "").trim();
      const recordType = String(row.recordType || "").trim();
      if (!recordId || !recordType) return;
      links.push({
        entityId,
        recordId,
        recordType,
        title: String(row.title || "").trim() || undefined,
      });
    });
  }

  return links;
}
