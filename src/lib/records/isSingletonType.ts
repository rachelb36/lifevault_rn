import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/lib/records/getRecordMeta";

export function isSingletonType(type: RecordType) {
  return getRecordMeta(type).cardinality === "SINGLE";
}
