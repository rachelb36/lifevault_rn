import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { formatDateLabel } from "@/shared/utils/date";
import type { FieldDef, ObjectListItemField, RecordData } from "./formTypes";
import { resolveLabel, getByPath, deepClone, toString } from "./formUtils";
import { toBoolString } from "./formUtils";
import { CANONICAL_DEFAULTS } from "./formDefaults";
import { FORM_DEFS } from "./defs";

function normalizeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function isDateLikeField(field: FieldDef | ObjectListItemField): boolean {
  if (field.type === "date") return true;
  const text =
    `${field.key} ${resolveLabel(field.label)} ${field.placeholder ?? ""}`.toLowerCase();
  return (
    text.includes("yyyy-mm-dd") ||
    text.includes(" date") ||
    text.includes("dob")
  );
}

function stringifyFieldValue(
  field: FieldDef | ObjectListItemField,
  value: unknown,
): string {
  if (value == null) return "";

  if (field.type === "toggle") {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return toBoolString(value, "false") === "true" ? "Yes" : "No";
  }

  if (field.type === "objectList") {
    if (!Array.isArray(value) || value.length === 0) return "";
    return `${value.length} ${value.length === 1 ? "item" : "items"}`;
  }

  if (typeof value === "string") {
    if (isDateLikeField(field)) {
      return formatDateLabel(value, "");
    }
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object")
      return `${value.length} items`;
    return value
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const maybeFile = value as { name?: unknown; uri?: unknown };
    const fileName = normalizeString(maybeFile.name);
    if (fileName) return fileName;

    const uri = normalizeString(maybeFile.uri);
    if (uri) return uri;

    return "[object]";
  }

  return "";
}

export function getFieldsForRecordType(
  recordType: RecordType,
  data?: RecordData,
): FieldDef[] {
  const fields = FORM_DEFS[recordType] ?? [];
  if (!data) return fields;

  return fields.filter((field) => {
    if (!field.showWhen) return true;
    const actual = normalizeString(getByPath(data, field.showWhen.key));
    return actual === field.showWhen.equals;
  });
}

export function buildInitialData(
  recordType: RecordType,
): Record<string, unknown> {
  return deepClone(CANONICAL_DEFAULTS[recordType] ?? {});
}

export function defaultTitleForRecordType(
  recordType: RecordType,
  data?: RecordData,
): string {
  const metaLabel =
    getRecordMeta(recordType)?.label ?? recordType.replaceAll("_", " ");
  if (!data || typeof data !== "object") return metaLabel;

  const titleCandidates = [
    "title",
    "fullName",
    "childFullName",
    "memberName",
    "schoolName",
    "label",
    "documentType",
    "insuranceType",
    "petName",
    "address.line1",
  ];

  for (const key of titleCandidates) {
    const value = normalizeString(getByPath(data, key));
    if (value) return `${metaLabel}: ${value}`;
  }

  return metaLabel;
}

export function buildDisplayRows(
  recordType: RecordType,
  data?: RecordData,
): { label: string; value: string }[] {
  if (!data || typeof data !== "object") return [];

  const fields = getFieldsForRecordType(recordType, data);
  if (fields.length > 0) {
    const rows: { label: string; value: string }[] = [];

    fields.forEach((field) => {
      const fieldValue = getByPath(data, field.key);

      if (field.type === "objectList") {
        return;
      }

      const valueText = stringifyFieldValue(field, fieldValue);
      if (valueText.length > 0) {
        rows.push({
          label: resolveLabel(field.label, data as Record<string, unknown>),
          value: valueText,
        });
      }
    });

    return rows;
  }

  return Object.entries(data)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase()),
      value: stringifyFieldValue({ key, label: key }, value),
    }))
    .filter((row) => row.value.length > 0);
}

export type DisplayTable = {
  label: string;
  columns: string[];
  rows: string[][];
};

export type DisplayKV = { label: string; value: string };

export type DisplayCardTable = {
  label: string; // section title (e.g., "Prescriptions")
  items: {
    id: string; // stable row id
    title?: string; // optional short title for the card
    rows: DisplayKV[]; // stacked rows (no gridlines)
  }[];
};

/**
 * Mobile-friendly "tables":
 * - objectList becomes a list of cards
 * - each card contains stacked label/value rows
 */
export function buildDisplayTables(
  recordType: RecordType,
  data?: RecordData,
): DisplayCardTable[] {
  if (!data || typeof data !== "object") return [];

  const fields = getFieldsForRecordType(recordType, data);
  if (fields.length === 0) return [];

  return fields
    .filter((field) => field.type === "objectList" && field.itemFields?.length)
    .map((field) => {
      const rawItems = getByPath(data, field.key);
      const items = Array.isArray(rawItems) ? rawItems : [];
      const itemFields = field.itemFields ?? [];

      const cardItems = items
        .map((item, idx) => {
          if (!item || typeof item !== "object") return null;

          const obj = item as Record<string, unknown>;

          const rows: DisplayKV[] = itemFields
            .map((itemField) => {
              // If your objectList supports showWhen on itemFields (you have it typed),
              // respect it here:
              if (itemField.showWhen) {
                const actual = normalizeString(obj[itemField.showWhen.key]);
                if (actual !== itemField.showWhen.equals) return null;
              }

              const label = resolveLabel(itemField.label, obj);
              const valueText = stringifyFieldValue(
                itemField,
                obj[itemField.key],
              );

              if (!valueText || valueText.trim().length === 0) return null;
              return { label, value: valueText };
            })
            .filter((r): r is DisplayKV => !!r);

          if (rows.length === 0) return null;

          // try to pick a short "title" for the card (nice in a list)
          const titleCandidateKeys = [
            "label",
            "title",
            "name",
            "providerName",
            "vaccineName",
            "medicationName",
          ];
          const title =
            titleCandidateKeys
              .map((k) => normalizeString(obj[k]))
              .find((v) => v.length > 0) || undefined;

          const id = normalizeString(obj.id) || `${field.key}_${idx}`;

          return { id, title, rows };
        })
        .filter((x): x is NonNullable<typeof x> => !!x);

      if (cardItems.length === 0) return null;

      return {
        label: resolveLabel(field.label, data as Record<string, unknown>),
        items: cardItems,
      };
    })
    .filter((t): t is NonNullable<typeof t> => !!t);
}
