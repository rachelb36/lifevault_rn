/**
 * Shared utility functions used by multiple field renderers.
 * Extracted from RecordTypeFormRenderer to avoid duplication.
 */

export function labelToSingular(label: string): string {
  const clean = label.replace(/\s*\(.*?\)\s*/g, "").trim();
  const lower = clean.toLowerCase();
  if (lower.endsWith("ies")) return clean.slice(0, -3) + "y"; // Hobbies -> Hobby
  if (lower.endsWith("s")) return clean.slice(0, -1); // Likes -> Like
  return clean;
}

export function buildSheetCopy(fieldLabel: string) {
  const singular = labelToSingular(fieldLabel);
  return {
    title: `Add ${singular}`,
    placeholder: `Enter a ${singular.toLowerCase()}`,
    addRowText: `+ Add ${singular}`,
  };
}

export function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

/** Heuristic: detect field keys that should use a numeric keypad */
export function isNumericField(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("weight") ||
    lower.includes("height") ||
    lower.includes("age") ||
    lower.includes("dose") ||
    lower.includes("amount") ||
    lower.includes("quantity") ||
    lower.includes("zip") ||
    lower.includes("postalcode") ||
    lower.includes("phone") ||
    lower.includes("portion") ||
    lower === "ssn" ||
    lower === "year"
  );
}

/** Check whether a field value counts as "filled" for the green checkmark */
export function isFieldFilled(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "boolean") return true;
  if (typeof val === "number") return true;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return false;
}

/** Heuristic: detect field keys that should use the contact picker */
export function isContactIdField(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.endsWith("contactid") ||
    (lower.includes("contact") && lower.endsWith("id")) ||
    lower === "contactid"
  );
}

/** Heuristic: detect field keys that should use the date picker */
export function isDateField(key: string, label: string, placeholder?: string): boolean {
  const lower = `${key} ${label} ${placeholder ?? ""}`.toLowerCase();
  return lower.includes("yyyy-mm-dd") || lower.includes(" date") || lower.includes("dob");
}

/** Build a summary string for an object list item (first 3 non-empty fields) */
export function getItemSummary(
  item: Record<string, unknown>,
  itemFields: { key: string }[],
): string {
  const parts: string[] = [];
  for (const f of itemFields) {
    if (parts.length >= 3) break;
    const v = String(item[f.key] ?? "").trim();
    if (v) parts.push(v);
  }
  return parts.length > 0 ? parts.join(" \u00B7 ") : "New entry";
}
