import type { RecordType } from "./recordTypes";

export type Attachment = {
  id: string;
  uri: string;
  mimeType: string;
  fileName: string;
  source?: "camera" | "library" | "files";
  createdAt: string;
  tags?: string[];
};

export type LifeVaultRecord = {
  id: string;
  entityId: string;            // personId or petId
  recordType: RecordType;
  title?: string | null;
  isPrivate?: boolean;

  data: Record<string, unknown>;

  attachments: Attachment[];   // ✅ universal

  createdAt: string;
  updatedAt: string;
};