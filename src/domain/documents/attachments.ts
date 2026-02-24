export type RecordAttachmentRole = "FRONT" | "BACK" | "CARD" | "PAGE" | "OTHER";

export type RecordAttachmentRef = {
  documentId: string;
  role?: RecordAttachmentRole;
  label?: string;
  addedAt: string;
};

export type AttachmentLinkInput = {
  role?: RecordAttachmentRole;
  label?: string;
};

export function normalizeAttachmentRefs(input: unknown): RecordAttachmentRef[] {
  if (!Array.isArray(input)) return [];

  const normalized = input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const documentId = String(raw.documentId || "").trim();
      if (!documentId) return null;

      const roleRaw = String(raw.role || "").trim().toUpperCase();
      const role =
        roleRaw === "FRONT" ||
        roleRaw === "BACK" ||
        roleRaw === "CARD" ||
        roleRaw === "PAGE" ||
        roleRaw === "OTHER"
          ? (roleRaw as RecordAttachmentRole)
          : undefined;

      return {
        documentId,
        role,
        label: String(raw.label || "").trim() || undefined,
        addedAt: String(raw.addedAt || new Date().toISOString()),
      } satisfies RecordAttachmentRef;
    })
    .filter(Boolean);

  return normalized as RecordAttachmentRef[];
}

export function linkDocumentToRecord<T extends { attachments?: RecordAttachmentRef[] }>(
  record: T,
  documentId: string,
  input?: AttachmentLinkInput,
): T {
  const nextId = String(documentId || "").trim();
  if (!nextId) return record;

  const current = normalizeAttachmentRefs(record.attachments);
  const exists = current.some((ref) => ref.documentId === nextId);
  if (exists) return { ...record, attachments: current };

  const ref: RecordAttachmentRef = {
    documentId: nextId,
    role: input?.role,
    label: input?.label?.trim() || undefined,
    addedAt: new Date().toISOString(),
  };

  return {
    ...record,
    attachments: [...current, ref],
  };
}

export function unlinkDocumentFromRecord<T extends { attachments?: RecordAttachmentRef[] }>(
  record: T,
  documentId: string,
): T {
  const nextId = String(documentId || "").trim();
  if (!nextId) return record;

  const current = normalizeAttachmentRefs(record.attachments);
  return {
    ...record,
    attachments: current.filter((ref) => ref.documentId !== nextId),
  };
}
