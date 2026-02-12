import { RecordType } from "./recordTypes";

export type LifeVaultRecord = {
  id: string;
  recordType: RecordType;
  title?: string | null;
  updatedAt?: string | null;
};