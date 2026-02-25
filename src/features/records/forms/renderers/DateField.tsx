import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled } from "./fieldUtils";
import { formatDateLabel } from "@/shared/utils/date";

export default function DateField({
  fieldKey,
  label,
  placeholder,
  fieldValue,
  openDatePicker,
}: FieldRendererProps) {
  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      <TouchableOpacity
        onPress={() => openDatePicker(fieldKey, label)}
        className="bg-card border border-border rounded-xl px-4 py-3"
        activeOpacity={0.85}
      >
        <Text className={fieldValue ? "text-foreground" : "text-muted-foreground"}>
          {formatDateLabel(fieldValue as string | Date | null | undefined, placeholder ?? "Select date")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
