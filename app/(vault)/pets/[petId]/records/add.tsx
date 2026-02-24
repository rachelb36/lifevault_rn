/**
 * Add Record Screen — /(vault)/pets/[petId]/records/add
 *
 * Thin wrapper around the shared RecordFormScreen. Extracts route params
 * (petId, recordType, initial attachment fields) and delegates all form
 * logic to the shared component.
 *
 * Route: /(vault)/pets/[petId]/records/add
 */
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import type { Attachment } from "@/shared/attachments/attachment.model";
import { findProfile } from "@/features/profiles/data/storage";

export default function AddPetRecordScreen() {
  const {
    petId,
    recordType,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
  } = useLocalSearchParams<{
    petId?: string;
    recordType?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
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
      mode="add"
      entityId={petId ? String(petId) : ""}
      entityType="pet"
      recordType={recordType ? String(recordType) : undefined}
      initialAttachmentUri={initialAttachmentUri ? String(initialAttachmentUri) : undefined}
      initialAttachmentName={initialAttachmentName ? String(initialAttachmentName) : undefined}
      initialAttachmentMime={initialAttachmentMime ? String(initialAttachmentMime) : undefined}
      initialAttachmentSource={initialAttachmentSource as Attachment["source"] | undefined}
      editRoutePath="/(vault)/pets/[petId]/records/[recordId]/edit"
      entityParamKey="petId"
      entityMeta={petKind ? { kind: petKind } : undefined}
    />
  );
}
