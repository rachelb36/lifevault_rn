import type { LifeVaultRecord } from "@/domain/records/record.model";

/** Safely extract data payload from a record (handles both .data and .payload) */
export function getRecordData(record: LifeVaultRecord): Record<string, unknown> {
  return (record as any).data ?? (record as any).payload ?? {};
}
