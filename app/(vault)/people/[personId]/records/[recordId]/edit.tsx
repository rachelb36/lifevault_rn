/**
 * Edit Record Screen — /(vault)/people/[personId]/records/[recordId]/edit
 *
 * Thin wrapper around the shared RecordFormScreen in edit mode. Extracts
 * route params (personId, recordId) and delegates all form, save, and
 * delete logic to the shared component.
 *
 * Route: /(vault)/people/[personId]/records/[recordId]/edit
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";

export default function EditPersonRecordScreen() {
  const { personId, recordId } = useLocalSearchParams<{
    personId?: string;
    recordId?: string;
  }>();

  return (
    <RecordFormScreen
      mode="edit"
      entityId={personId ? String(personId) : ""}
      entityType="person"
      recordId={recordId ? String(recordId) : undefined}
      editRoutePath="/(vault)/people/[personId]/records/[recordId]/edit"
      entityParamKey="personId"
    />
  );
}
