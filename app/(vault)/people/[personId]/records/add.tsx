/**
 * Add Record Screen — /(vault)/people/[personId]/records/add
 *
 * Thin wrapper around the shared RecordFormScreen. Extracts route params
 * (personId, recordType) and delegates all form logic to the shared component.
 *
 * Route: /(vault)/people/[personId]/records/add
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";

export default function AddPersonRecordScreen() {
  const { personId, recordType } = useLocalSearchParams<{
    personId?: string;
    recordType?: string;
  }>();

  return (
    <RecordFormScreen
      mode="add"
      entityId={personId ? String(personId) : ""}
      entityType="person"
      recordType={recordType ? String(recordType) : undefined}
      editRoutePath="/(vault)/people/[personId]/records/[recordId]/edit"
      entityParamKey="personId"
    />
  );
}
