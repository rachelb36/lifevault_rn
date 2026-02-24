/**
 * Add Record Screen — /(vault)/people/[personId]/records/add
 *
 * Thin wrapper around the shared RecordFormScreen. Extracts route params
 * (personId, recordType, initial attachment fields) and delegates all form
 * logic to the shared component.
 *
 * Route: /(vault)/people/[personId]/records/add
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import type { Attachment } from "@/shared/attachments/attachment.model";

export default function AddPersonRecordScreen() {
  const {
    personId,
    recordType,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
  } = useLocalSearchParams<{
    personId?: string;
    recordType?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
  }>();

  return (
    <RecordFormScreen
      mode="add"
      entityId={personId ? String(personId) : ""}
      entityType="person"
      recordType={recordType ? String(recordType) : undefined}
      initialAttachmentUri={initialAttachmentUri ? String(initialAttachmentUri) : undefined}
      initialAttachmentName={initialAttachmentName ? String(initialAttachmentName) : undefined}
      initialAttachmentMime={initialAttachmentMime ? String(initialAttachmentMime) : undefined}
      initialAttachmentSource={initialAttachmentSource as Attachment["source"] | undefined}
      editRoutePath="/(vault)/people/[personId]/records/[recordId]/edit"
      entityParamKey="personId"
    />
  );
}
