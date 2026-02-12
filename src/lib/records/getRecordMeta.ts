import { RecordType } from "@/domain/records/recordTypes";
import { RECORD_META_BY_TYPE } from "@/domain/records/recordTypeRegistry";

export function getRecordMeta(type: RecordType) {
  return RECORD_META_BY_TYPE[type];
}
