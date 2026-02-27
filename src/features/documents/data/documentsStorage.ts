/**
 * Canonical documents_v1 storage for uploaded/scanned files.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import type {
  DocumentInput,
  DocumentV1,
} from "@/features/documents/domain/document.schema";
import { normalizeDocuments } from "@/features/documents/domain/document.normalize";
import type {
  DocumentPickerInput,
  DocumentOcrResult,
  VaultDocument,
} from "@/features/documents/domain/document.model";
import {
  normalizeAttachmentRefs,
} from "@/domain/documents/attachments";
import { isLocalOnly } from "@/shared/config/dataMode";
import { apolloClient } from "@/lib/apollo";
import {
  fetchDocuments,
  fetchFileDownloadUrl,
  serverUpdateFileMeta,
  serverDetachFile,
  type ServerDocument,
} from "@/lib/graphql/documents";
export type { VaultDocument } from "@/features/documents/domain/document.model";

const DOCUMENTS_KEY = "documents_v1";
const RECORDS_PREFIX = "records_v1:";
const DOC_LINKS_INDEX_KEY = "doc_links_index";

export type LinkedRecordRef = {
  entityId: string;
  recordId: string;
  recordType: string;
  title?: string;
};

type DocLinksIndex = Record<string, LinkedRecordRef[]>;

let initPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function mkId(prefix: "doc" | "ocr"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type RuntimeOcrResult =
  | string
  | string[]
  | {
      text?: string;
      lines?: string[];
      blocks?: { lines?: { text?: string }[] }[];
    };

type RuntimeOcrModule = {
  extractTextFromImage?: (uri: string) => Promise<RuntimeOcrResult>;
};

let OCR_MODULE: RuntimeOcrModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OCR_MODULE = require("expo-text-extractor") as RuntimeOcrModule;
} catch {
  OCR_MODULE = null;
}

function normalizeRuntimeOcrText(input: RuntimeOcrResult): { text: string; lines: string[] } {
  if (typeof input === "string") {
    const lines = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return { text: input, lines };
  }

  // expo-text-extractor returns string[]
  if (Array.isArray(input)) {
    const lines = input.map((s) => String(s || "").trim()).filter(Boolean);
    return { text: lines.join("\n"), lines };
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

function serverDocToLocal(s: ServerDocument): VaultDocument {
  return {
    id: s.id,
    uri: s.storagePath,
    mimeType: s.mimeType,
    fileName: s.fileName ?? undefined,
    sizeBytes: s.byteSize,
    createdAt: s.createdAt,
    title: s.title ?? undefined,
    tags: s.tags.length > 0 ? s.tags : undefined,
    note: s.note ?? undefined,
  };
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
  return normalizeDocuments(parsed);
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

export async function ensureDocumentsStorageReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const docs = await readRawDocuments();
      await writeDocuments(docs);

      // Build document-links index if it doesn't exist yet
      const existingIndex = await AsyncStorage.getItem(DOC_LINKS_INDEX_KEY);
      if (!existingIndex) {
        await rebuildDocLinksIndex();
      }
    })().catch(async () => {
      initPromise = null;
    });
  }

  if (initPromise) {
    await initPromise;
  }
}

export async function listDocuments(opts?: { entityId?: string; recordId?: string }): Promise<VaultDocument[]> {
  if (!(await isLocalOnly())) {
    const serverDocs = await fetchDocuments(apolloClient, opts);
    return serverDocs.map(serverDocToLocal);
  }
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
  // Local-only path
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

  // Verify local file still exists (cached URIs can expire)
  try {
    const info = await FileSystem.getInfoAsync(nextUri);
    if (!info.exists) {
      throw new Error("The file is no longer available. It may have been removed from the cache.");
    }
  } catch (e: any) {
    if (e?.message?.includes("no longer available")) throw e;
    // getInfoAsync may fail on some URI schemes — proceed anyway
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("No local file viewer is available on this device.");
  }

  await Sharing.shareAsync(nextUri, {
    dialogTitle: "View Document",
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

  const run = OCR_MODULE?.extractTextFromImage;

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
    if (__DEV__) {
      console.log("[OCR] raw result:", JSON.stringify(raw, null, 2));
    }
    const normalized = normalizeRuntimeOcrText(raw);
    if (__DEV__) {
      console.log("[OCR] normalized:", normalized.lines.length, "lines:", normalized.lines);
    }
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

// ── Server-mode helpers ─────────────────────────────────────────────

export async function updateDocumentMeta(
  documentId: string,
  meta: { title?: string; tags?: string[]; note?: string; fileName?: string },
): Promise<VaultDocument> {
  if (!(await isLocalOnly())) {
    const updated = await serverUpdateFileMeta(apolloClient, {
      fileId: documentId,
      title: meta.title,
      tags: meta.tags,
      note: meta.note,
      fileName: meta.fileName,
    });
    return serverDocToLocal(updated);
  }
  // Local-only: read-modify-write
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  return upsertDocument({
    ...doc,
    title: meta.title ?? doc.title,
    tags: meta.tags ?? doc.tags,
    note: meta.note ?? doc.note,
    fileName: meta.fileName ?? doc.fileName,
  });
}

export async function detachDocument(documentId: string): Promise<VaultDocument> {
  if (!(await isLocalOnly())) {
    const updated = await serverDetachFile(apolloClient, documentId);
    return serverDocToLocal(updated);
  }
  // Local-only: detach means remove linkedTo
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  const { linkedTo: _removed, ...rest } = doc;
  return upsertDocument(rest);
}

export async function getDownloadUrl(documentId: string): Promise<string> {
  if (!(await isLocalOnly())) {
    return fetchFileDownloadUrl(apolloClient, documentId);
  }
  // Local-only: return the local file URI
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("Document not found");
  return doc.uri;
}

// ── Document-links inverted index ──────────────────────────────────

async function readDocLinksIndex(): Promise<DocLinksIndex> {
  const raw = await AsyncStorage.getItem(DOC_LINKS_INDEX_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeDocLinksIndex(index: DocLinksIndex): Promise<void> {
  await AsyncStorage.setItem(DOC_LINKS_INDEX_KEY, JSON.stringify(index));
}

/** Rebuild the full index by scanning all record keys. */
export async function rebuildDocLinksIndex(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const recordKeys = allKeys.filter((key) => key.startsWith(RECORDS_PREFIX));
  const index: DocLinksIndex = {};

  for (const key of recordKeys) {
    const entityId = key.replace(RECORDS_PREFIX, "");
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    let parsed: unknown[];
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const refs = normalizeAttachmentRefs(row.attachments);
      const recordId = String(row.id || "").trim();
      const recordType = String(row.recordType || "").trim();
      if (!recordId || !recordType) continue;

      for (const ref of refs) {
        if (!index[ref.documentId]) index[ref.documentId] = [];
        index[ref.documentId].push({ entityId, recordId, recordType, title: String(row.title || "").trim() || undefined });
      }
    }
  }

  await writeDocLinksIndex(index);
}

/** Update the index for a single entity after record save/delete. */
export async function updateDocLinksIndexForEntity(
  entityId: string,
  records: { id: string; recordType: string; title?: string | null; attachments?: unknown }[],
): Promise<void> {
  const index = await readDocLinksIndex();

  // Remove all existing refs for this entity
  for (const docId of Object.keys(index)) {
    index[docId] = (index[docId] || []).filter((ref) => ref.entityId !== entityId);
    if (index[docId].length === 0) delete index[docId];
  }

  // Re-add refs from current records
  for (const record of records) {
    const refs = normalizeAttachmentRefs(record.attachments);
    for (const ref of refs) {
      if (!index[ref.documentId]) index[ref.documentId] = [];
      index[ref.documentId].push({
        entityId,
        recordId: record.id,
        recordType: record.recordType,
        title: (record.title || "").trim() || undefined,
      });
    }
  }

  await writeDocLinksIndex(index);
}

/** O(1) lookup using the inverted index. */
export async function listLinkedRecordsForDocument(
  documentId: string,
): Promise<LinkedRecordRef[]> {
  await ensureDocumentsStorageReady();
  const index = await readDocLinksIndex();
  return index[documentId] || [];
}
