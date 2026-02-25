import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled } from "./fieldUtils";

export default function ContactIdField({
  fieldKey,
  label,
  fieldValue,
  openContactPicker,
  resolveContactLabel,
}: FieldRendererProps) {
  const contactLabel = resolveContactLabel(fieldValue);

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      <TouchableOpacity
        onPress={() =>
          openContactPicker({
            scope: "top",
            fieldKey,
            title: label,
          })
        }
        className="bg-card border border-border rounded-xl px-4 py-3"
        activeOpacity={0.85}
      >
        <Text className={contactLabel ? "text-foreground" : "text-muted-foreground"}>
          {contactLabel || "Select contact"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
