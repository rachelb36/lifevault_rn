import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";

export function isSingletonType(type: RecordType) {
  return getRecordMeta(type).cardinality === "SINGLE";
}
