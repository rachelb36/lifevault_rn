import type { DocumentV1 } from "@/features/documents/domain/document.schema";

function nowIso() {
  return new Date().toISOString();
}

function normalizeOne(raw: unknown): DocumentV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const uri = String(item.uri || "").trim();
  if (!uri) return null;

  const id = String(item.id || `doc_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  const mimeType = String(item.mimeType || "application/octet-stream");
  const tags = Array.isArray(item.tags)
    ? item.tags.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

  return {
    schemaVersion: 1,
    id,
    uri,
    mimeType,
    fileName: String(item.fileName || "").trim() || undefined,
    sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : undefined,
    sha256: String(item.sha256 || "").trim() || undefined,
    createdAt: String(item.createdAt || nowIso()),
    title: String(item.title || "").trim() || undefined,
    tags: tags.length > 0 ? tags : undefined,
    note: String(item.note || "").trim() || undefined,
    linkedTo: Array.isArray(item.linkedTo)
      ? item.linkedTo
          .map((link) => {
            if (!link || typeof link !== "object") return null;
            const l = link as Record<string, unknown>;
            const recordType = String(l.recordType || "").trim();
            const recordId = String(l.recordId || "").trim();
            if (!recordType || !recordId) return null;
            return { recordType, recordId };
          })
          .filter((x): x is { recordType: string; recordId: string } => Boolean(x))
      : undefined,
    ocr:
      item.ocr && typeof item.ocr === "object"
        ? {
            text: String((item.ocr as Record<string, unknown>).text || ""),
            lines: Array.isArray((item.ocr as Record<string, unknown>).lines)
              ? ((item.ocr as Record<string, unknown>).lines as unknown[])
                  .map((x) => String(x || ""))
                  .filter(Boolean)
              : undefined,
            extractedAt: String((item.ocr as Record<string, unknown>).extractedAt || nowIso()),
            engine: (["VISION", "MLKIT", "OTHER"] as const).includes(
              String((item.ocr as Record<string, unknown>).engine || "OTHER") as
                | "VISION"
                | "MLKIT"
                | "OTHER",
            )
              ? (String((item.ocr as Record<string, unknown>).engine || "OTHER") as
                  | "VISION"
                  | "MLKIT"
                  | "OTHER")
              : "OTHER",
            status: (["READY", "UNREADABLE", "FAILED"] as const).includes(
              String((item.ocr as Record<string, unknown>).status || "FAILED") as
                | "READY"
                | "UNREADABLE"
                | "FAILED",
            )
              ? (String((item.ocr as Record<string, unknown>).status || "FAILED") as
                  | "READY"
                  | "UNREADABLE"
                  | "FAILED")
              : "FAILED",
            error: String((item.ocr as Record<string, unknown>).error || "").trim() || undefined,
          }
        : undefined,
  };
}

export function normalizeAndMigrateDocuments(raw: unknown): DocumentV1[] {
  const input = Array.isArray(raw) ? raw : [];
  const mapped = input.map((item) => normalizeOne(item)).filter((x): x is DocumentV1 => Boolean(x));

  const seen = new Set<string>();
  const deduped: DocumentV1[] = [];
  for (const doc of mapped) {
    const key = `${doc.sha256 || ""}|${doc.uri}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  return deduped.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
