import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function AddPetRecordScreen() {
  const { petId, recordType } = useLocalSearchParams<{ petId?: string; recordType?: string }>();

  if (!petId) return null;

  return (
    <Redirect
      href={{
        pathname: "/people/[personId]/records/add",
        params: { personId: String(petId), recordType },
      }}
    />
  );
}
