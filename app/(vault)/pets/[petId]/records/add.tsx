/**
 * Add Record Screen — /(vault)/pets/[petId]/records/add
 *
 * Thin wrapper around the shared RecordFormScreen. Extracts route params
 * (petId, recordType) and delegates all form logic to the shared component.
 *
 * Route: /(vault)/pets/[petId]/records/add
 */
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import { findProfile } from "@/features/profiles/data/storage";

export default function AddPetRecordScreen() {
  const { petId, recordType } = useLocalSearchParams<{
    petId?: string;
    recordType?: string;
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
      editRoutePath="/(vault)/pets/[petId]/records/[recordId]/edit"
      entityParamKey="petId"
      entityMeta={petKind ? { kind: petKind } : undefined}
    />
  );
}
