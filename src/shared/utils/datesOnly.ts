// src/shared/utils/datesOnly.ts

export function isoDateOnlyToDate(iso: string): Date {
  // Interpret YYYY-MM-DD as local midnight
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0); // 9am local default
}

export function addDaysDateOnly(isoDateOnly: string, days: number): string {
  const dt = isoDateOnlyToDate(isoDateOnly);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}