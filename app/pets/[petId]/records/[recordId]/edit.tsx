import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function EditPetRecordScreen() {
  const { petId, recordId } = useLocalSearchParams<{ petId?: string; recordId?: string }>();

  if (!petId || !recordId) return null;

  return (
    <Redirect
      href={{
        pathname: "/people/[personId]/records/[recordId]/edit",
        params: { personId: String(petId), recordId: String(recordId) },
      }}
    />
  );
}
