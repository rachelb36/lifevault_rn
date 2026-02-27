/**
 * Edit Record Screen — /(vault)/pets/[petId]/records/[recordId]/edit
 *
 * Thin wrapper around the shared RecordFormScreen in edit mode. Extracts
 * route params (petId, recordId) and delegates all form, save, and
 * delete logic to the shared component.
 *
 * Route: /(vault)/pets/[petId]/records/[recordId]/edit
 */
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import RecordFormScreen from "@/shared/ui/RecordFormScreen";
import { findProfile } from "@/features/profiles/data/storage";

export default function EditPetRecordScreen() {
  const { petId, recordId } = useLocalSearchParams<{
    petId?: string;
    recordId?: string;
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
      editRoutePath="/(vault)/pets/[petId]/records/[recordId]/edit"
      entityParamKey="petId"
      entityMeta={petKind ? { kind: petKind } : undefined}
    />
  );
}
