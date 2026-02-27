import type { LabelFn } from "./formTypes";

export function resolveLabel(
  label: string | LabelFn,
  values: Record<string, unknown> = {},
): string {
  return typeof label === "function" ? label(values) : label;
}

export function getByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const direct = (obj as Record<string, unknown>)[path];
  if (direct !== undefined) return direct;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
}

export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return obj;
}

export function toString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => toString(v).trim()).filter(Boolean);
  }

  const raw = toString(value).trim();
  if (!raw) return [];

  if (raw.includes("\n")) {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function toBoolString(value: unknown, fallback = "false"): string {
  const text = toString(value).trim().toLowerCase();
  if (["true", "yes", "1"].includes(text)) return "true";
  if (["false", "no", "0"].includes(text)) return "false";
  return fallback;
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
