import { RecordType } from "@/domain/records/recordTypes";
import type { FieldDef, ObjectListItemField, RecordData } from "./formTypes";
import {
  deepClone,
  getByPath,
  makeId,
  nowIso,
  setByPath,
  toBoolString,
  toString,
  toStringList,
} from "./formUtils";
import { CANONICAL_DEFAULTS } from "./formDefaults";
import { FORM_DEFS } from "./defs";

export function normalizeScalarValue(key: string, value: unknown): unknown {
  if (key === "parents.includeParents" || key === "privacyEnforced") {
    return toBoolString(value, "false") === "true";
  }

  if (key === "parents.parent1Name" || key === "parents.parent2Name") {
    const text = toString(value).trim();
    return text || null;
  }

  if (key === "expirationDate" && toString(value).trim() === "") {
    return null;
  }

  return toString(value);
}

export function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value))
    return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulValue(item),
    );
  }
  return false;
}

export function normalizeObjectItemField(
  itemField: ObjectListItemField,
  value: unknown,
): unknown {
  if (itemField.type === "toggle") {
    if (typeof value === "boolean") return value;
    return toBoolString(value, "false") === "true";
  }

  if (itemField.key === "rules") {
    return toStringList(value);
  }

  if (
    (itemField.key === "endDate" || itemField.key === "expirationDate") &&
    toString(value).trim() === ""
  ) {
    return null;
  }

  return toString(value);
}

export function normalizeObjectListValue(field: FieldDef, raw: unknown): unknown[] {
  if (!field.itemFields || field.itemFields.length === 0) return [];

  const coerceRows = (): Record<string, unknown>[] => {
    if (Array.isArray(raw)) {
      return raw.filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === "object",
      );
    }

    if (raw && typeof raw === "object") {
      return [raw as Record<string, unknown>];
    }

    return [];
  };

  return coerceRows()
    .map((row) => {
      const normalized: Record<string, unknown> = {
        id: toString(row.id) || makeId(field.key.toLowerCase()),
        createdAt: toString(row.createdAt) || nowIso(),
        updatedAt: nowIso(),
      };

      field.itemFields?.forEach((itemField) => {
        normalized[itemField.key] = normalizeObjectItemField(
          itemField,
          row[itemField.key],
        );
      });

      return normalized;
    })
    .filter((row) =>
      field.itemFields?.some((itemField) =>
        hasMeaningfulValue(row[itemField.key]),
      ),
    );
}

export function normalizeRecordDataForSave(
  recordType: RecordType,
  input: RecordData,
): Record<string, unknown> {
  const base = deepClone(CANONICAL_DEFAULTS[recordType] ?? {});
  if (!input || typeof input !== "object") return base;

  const fields = FORM_DEFS[recordType] ?? [];

  fields.forEach((field) => {
    const raw =
      (input as Record<string, unknown>)[field.key] ??
      getByPath(input, field.key);
    if (raw === undefined) return;

    if (field.type === "objectList") {
      setByPath(base, field.key, normalizeObjectListValue(field, raw));
      return;
    }

    if (field.type === "list") {
      setByPath(base, field.key, toStringList(raw));
      return;
    }

    setByPath(base, field.key, normalizeScalarValue(field.key, raw));
  });

  return base;
}

export function normalizeRecordDataForEdit(
  recordType: RecordType,
  input: RecordData,
): Record<string, unknown> {
  const canonical = normalizeRecordDataForSave(recordType, input ?? {});
  const result: Record<string, unknown> = { ...canonical };

  const fields = FORM_DEFS[recordType] ?? [];
  fields.forEach((field) => {
    const value = getByPath(canonical, field.key);

    if (field.type === "objectList" && Array.isArray(value)) {
      result[field.key] = value;
      return;
    }

    if (field.key.includes(".")) {
      result[field.key] = value ?? "";
    }
  });

  return result;
}
