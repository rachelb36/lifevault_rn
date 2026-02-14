// src/shared/ui/FieldError.tsx
import React from "react";
import { Text } from "react-native";

export default function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text className="mt-1 text-xs text-destructive">{message}</Text>;
}