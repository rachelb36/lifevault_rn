/**
 * Edit Record Screen — /(vault)/pets/[petId]/records/[recordId]/edit
 *
 * Thin wrapper around the shared RecordFormScreen in edit mode. Extracts
 * route params (petId, recordId, attachment fields) and delegates all
 * form, save, and delete logic to the shared component.
 *
 * Route: /(vault)/pets/[petId]/records/[recordId]/edit
 */
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import type { Attachment } from "@/shared/attachments/attachment.model";
import { findProfile } from "@/features/profiles/data/storage";

export default function EditPetRecordScreen() {
  const {
    petId,
    recordId,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
    replaceAttachment,
  } = useLocalSearchParams<{
    petId?: string;
    recordId?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
    replaceAttachment?: string;
  }>();

  const [petKind, setPetKind] = useState<string | undefined>();

  useEffect(() => {
    if (!petId) return;
    findProfile(String(petId)).then((p) => {
      if (p?.profileType === "PET") setPetKind(p.kind);
    });
  }, [petId]);

  return (
    <RecordFormScreen
      mode="edit"
      entityId={petId ? String(petId) : ""}
      entityType="pet"
      recordId={recordId ? String(recordId) : undefined}
      initialAttachmentUri={initialAttachmentUri ? String(initialAttachmentUri) : undefined}
      initialAttachmentName={initialAttachmentName ? String(initialAttachmentName) : undefined}
      initialAttachmentMime={initialAttachmentMime ? String(initialAttachmentMime) : undefined}
      initialAttachmentSource={initialAttachmentSource as Attachment["source"] | undefined}
      replaceAttachment={replaceAttachment ? String(replaceAttachment) : undefined}
      editRoutePath="/(vault)/pets/[petId]/records/[recordId]/edit"
      entityParamKey="petId"
      entityMeta={petKind ? { kind: petKind } : undefined}
    />
  );
}
