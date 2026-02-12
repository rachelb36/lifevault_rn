import { RecordCategory } from "@/domain/records/recordCategories";
import { TYPES_BY_CATEGORY } from "@/domain/records/recordTypeRegistry";

export function getTypesForCategory(category: RecordCategory) {
  return TYPES_BY_CATEGORY[category] ?? [];
}
