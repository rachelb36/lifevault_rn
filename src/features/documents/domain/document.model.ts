export type DocumentLinkRef = {
  recordType: string;
  recordId: string;
};

export type DocumentOcrStatus = "READY" | "UNREADABLE" | "FAILED";
export type DocumentOcrEngine = "VISION" | "MLKIT" | "OTHER";

export type DocumentOcrResult = {
  text: string;
  lines?: string[];
  extractedAt: string;
  engine: DocumentOcrEngine;
  status: DocumentOcrStatus;
  error?: string;
};

export type VaultDocument = {
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

export type DocumentPickerInput = {
  uri: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  source?: "camera" | "library" | "files";
};
