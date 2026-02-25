import React from "react";
import { Text, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";

export default function DescriptionField({ label, content }: FieldRendererProps) {
  return (
    <View className="rounded-2xl bg-muted/40 border border-border px-4 py-4">
      <Text className="text-base text-muted-foreground leading-6">{content ?? label}</Text>
    </View>
  );
}
