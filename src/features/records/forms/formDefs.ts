/**
 * Barrel re-export: all public symbols from the form definition modules.
 *
 * Consumers should continue to import from this file.
 * Internally the code has been split into:
 *   formTypes, formUtils, formDefaults, defs/, formNormalize, formDisplay
 */

// --- Types ---
export type {
  FieldType,
  ShowWhen,
  LabelFn,
  ObjectListItemField,
  FieldDef,
  RecordData,
} from "./formTypes";

// --- Utilities ---
export {
  resolveLabel,
  getByPath,
  setByPath,
  toString,
  toStringList,
  toBoolString,
  nowIso,
  makeId,
  deepClone,
} from "./formUtils";

// --- Defaults ---
export { CANONICAL_DEFAULTS } from "./formDefaults";

// --- Form definitions ---
export { FORM_DEFS } from "./defs";

// --- Normalization ---
export {
  normalizeScalarValue,
  hasMeaningfulValue,
  normalizeObjectItemField,
  normalizeObjectListValue,
  normalizeRecordDataForSave,
  normalizeRecordDataForEdit,
} from "./formNormalize";

// --- Display ---
export {
  getFieldsForRecordType,
  buildInitialData,
  defaultTitleForRecordType,
  buildDisplayRows,
  buildDisplayTables,
} from "./formDisplay";

export type {
  DisplayTable,
  DisplayKV,
  DisplayCardTable,
} from "./formDisplay";
