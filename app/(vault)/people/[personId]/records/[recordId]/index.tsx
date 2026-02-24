/**
 * Record Detail Screen — /(vault)/people/[personId]/records/[recordId]
 *
 * Thin wrapper around the shared RecordDetailScreen. Extracts route params
 * (personId, recordId) and delegates all display, attachment, and delete
 * logic to the shared component.
 *
 * Route: /(vault)/people/[personId]/records/[recordId]
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordDetailScreen from "@/shared/ui/RecordDetailScreen";

export default function PersonRecordDetailScreen() {
  const { personId, recordId } = useLocalSearchParams<{
    personId?: string;
    recordId?: string;
  }>();

  return (
    <RecordDetailScreen
      entityId={personId ? String(personId) : ""}
      entityType="person"
      recordId={recordId ? String(recordId) : ""}
      editRoutePath="/(vault)/people/[personId]/records/[recordId]/edit"
      entityParamKey="personId"
    />
  );
}
