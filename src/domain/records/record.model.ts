import type { RecordType } from "./recordTypes";
import type { RecordAttachmentRef } from "@/domain/documents/attachments";

export type LifeVaultRecord = {
  id: string;
  entityId: string;            // personId or petId
  recordType: RecordType;
  title?: string | null;
  isPrivate?: boolean;

  data: Record<string, unknown>;

  attachments: RecordAttachmentRef[]; // document references

  createdAt: string;
  updatedAt: string;
};
