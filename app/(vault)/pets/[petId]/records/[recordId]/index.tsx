/**
 * Record Detail Screen — /(vault)/pets/[petId]/records/[recordId]
 *
 * Thin wrapper around the shared RecordDetailScreen. Extracts route params
 * (petId, recordId) and delegates all display, attachment, and delete
 * logic to the shared component.
 *
 * Route: /(vault)/pets/[petId]/records/[recordId]
 */
import React from "react";
import { useLocalSearchParams } from "expo-router";

import RecordDetailScreen from "@/shared/ui/RecordDetailScreen";

export default function PetRecordDetailScreen() {
  const { petId, recordId } = useLocalSearchParams<{
    petId?: string;
    recordId?: string;
  }>();

  return (
    <RecordDetailScreen
      entityId={petId ? String(petId) : ""}
      entityType="pet"
      recordId={recordId ? String(recordId) : ""}
      editRoutePath="/(vault)/pets/[petId]/records/[recordId]/edit"
      entityParamKey="petId"
    />
  );
}
