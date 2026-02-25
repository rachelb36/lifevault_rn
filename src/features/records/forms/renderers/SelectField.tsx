import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import { isFieldFilled, labelToSingular } from "./fieldUtils";

export default function SelectField({
  fieldKey,
  label,
  fieldValue,
  options: rawOptions,
  setField,
  openPickerSheet,
}: FieldRendererProps) {
  const options = (rawOptions ?? []).map((option) => String(option));
  const selected = String(fieldValue ?? "").trim();
  const usePills = options.length <= 6;

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />
      {usePills ? (
        <View className="flex-row flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
          {options.map((option) => {
            const isSelected = selected === option;
            return (
              <TouchableOpacity
                key={`${fieldKey}-${option}`}
                onPress={() => setField(fieldKey, option)}
                activeOpacity={0.85}
                className={`rounded-full border px-3 py-1.5 ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                }`}
              >
                <Text
                  className={
                    isSelected
                      ? "text-xs font-semibold text-primary-foreground"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => openPickerSheet(fieldKey, label, options, false)}
          activeOpacity={0.85}
          className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected || `Select ${labelToSingular(label).toLowerCase()}`}
          </Text>
          <Text className="text-muted-foreground text-lg">{"\u203A"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
