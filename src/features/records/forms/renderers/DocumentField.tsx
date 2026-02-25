import React from "react";
import { Text, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled } from "./fieldUtils";

export default function DocumentField({ label, fieldValue }: FieldRendererProps) {
  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      <View className="bg-card border border-border rounded-xl px-4 py-3">
        <Text className="text-sm text-foreground">
          Use the Attachments section below to add files for this record.
        </Text>
      </View>
    </View>
  );
}
