/**
 * Edit Record Screen — /(vault)/people/[personId]/records/[recordId]/edit
 *
 * Thin wrapper around the shared RecordFormScreen in edit mode. Extracts
 * route params (personId, recordId, attachment fields) and delegates all
 * form, save, and delete logic to the shared component.
 *
 * Route: /(vault)/people/[personId]/records/[recordId]/edit
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import type { Attachment } from "@/shared/attachments/attachment.model";

export default function EditPersonRecordScreen() {
  const {
    personId,
    recordId,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
    replaceAttachment,
  } = useLocalSearchParams<{
    personId?: string;
    recordId?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
    replaceAttachment?: string;
  }>();

  return (
    <RecordFormScreen
      mode="edit"
      entityId={personId ? String(personId) : ""}
      entityType="person"
      recordId={recordId ? String(recordId) : undefined}
      initialAttachmentUri={initialAttachmentUri ? String(initialAttachmentUri) : undefined}
      initialAttachmentName={initialAttachmentName ? String(initialAttachmentName) : undefined}
      initialAttachmentMime={initialAttachmentMime ? String(initialAttachmentMime) : undefined}
      initialAttachmentSource={initialAttachmentSource as Attachment["source"] | undefined}
      replaceAttachment={replaceAttachment ? String(replaceAttachment) : undefined}
      editRoutePath="/(vault)/people/[personId]/records/[recordId]/edit"
      entityParamKey="personId"
    />
  );
}
