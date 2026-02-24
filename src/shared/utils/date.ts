export const toIsoDateOnly = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms) : null;
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const formatDateLabel = (value?: string | Date | null, fallback = "Select date"): string => {
  const d = parseDate(value);
  if (!d) return fallback;
  const mon = MONTH_NAMES[d.getMonth()];
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mon} ${dd}, ${yyyy}`;
};
