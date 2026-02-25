import React from "react";
import { TextInput, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled, isNumericField } from "./fieldUtils";

export default function TextInputField({
  fieldKey,
  label,
  placeholder,
  fieldValue,
  type,
  setField,
}: FieldRendererProps) {
  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      <TextInput
        className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        placeholder={placeholder ?? ""}
        placeholderTextColor="rgb(162 162 168)"
        value={String(fieldValue ?? "")}
        onChangeText={(t) => setField(fieldKey, t)}
        multiline={type === "multiline"}
        style={
          type === "multiline"
            ? { minHeight: 110, textAlignVertical: "top" as any }
            : undefined
        }
        keyboardType={
          type !== "multiline" && isNumericField(fieldKey) ? "numeric" : "default"
        }
        returnKeyType={type === "multiline" ? "default" : "done"}
        blurOnSubmit={type !== "multiline"}
      />
    </View>
  );
}
