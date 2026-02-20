const EMPTY_SUMMARY = "Not added";

export function buildExpirySummary(input: { country?: string | null; expirationDate?: string | null }): string {
  const country = String(input.country || "").trim();
  const expirationDate = String(input.expirationDate || "").trim();

  const parts: string[] = [];
  if (country) parts.push(country);

  if (expirationDate) {
    const d = new Date(expirationDate);
    if (!Number.isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      parts.push(`Expires ${mm}/${yyyy}`);
    }
  }

  return parts.length > 0 ? parts.join(" • ") : EMPTY_SUMMARY;
}

export function buildNamesSummary(names: string[], maxShown = 3): string {
  const cleaned = names.map((n) => String(n || "").trim()).filter(Boolean);
  if (cleaned.length === 0) return EMPTY_SUMMARY;

  const shown = cleaned.slice(0, maxShown);
  const remaining = cleaned.length - shown.length;
  return remaining > 0 ? `${shown.join(" • ")} +${remaining}` : shown.join(" • ");
}

export function notAddedSummary() {
  return EMPTY_SUMMARY;
}

