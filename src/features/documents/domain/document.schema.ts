import type { VaultDocument, DocumentOcrResult, DocumentLinkRef } from "@/features/documents/domain/document.model";

export type DocumentV1 = {
  schemaVersion: 1;
  id: string;
  uri: string;
  mimeType: string;
  fileName?: string;
  sizeBytes?: number;
  sha256?: string;
  createdAt: string;
  title?: string;
  tags?: string[];
  note?: string;
  linkedTo?: DocumentLinkRef[];
  ocr?: DocumentOcrResult;
};

export type DocumentInput = Omit<DocumentV1, "schemaVersion" | "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export function toDocumentModel(input: DocumentV1): VaultDocument {
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
