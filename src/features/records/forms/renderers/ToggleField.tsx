import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled, toBoolean } from "./fieldUtils";

export default function ToggleField({
  fieldKey,
  label,
  fieldValue,
  setField,
}: FieldRendererProps) {
  const selected = toBoolean(fieldValue);

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      <View className="flex-row gap-2 rounded-xl border border-border bg-card p-3">
        <TouchableOpacity
          onPress={() => setField(fieldKey, true)}
          className={`rounded-full border px-3 py-1.5 ${
            selected ? "bg-primary border-primary" : "bg-background border-border"
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={
              selected
                ? "text-xs font-semibold text-primary-foreground"
                : "text-xs text-muted-foreground"
            }
          >
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setField(fieldKey, false)}
          className={`rounded-full border px-3 py-1.5 ${
            !selected ? "bg-primary border-primary" : "bg-background border-border"
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={
              !selected
                ? "text-xs font-semibold text-primary-foreground"
                : "text-xs text-muted-foreground"
            }
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
