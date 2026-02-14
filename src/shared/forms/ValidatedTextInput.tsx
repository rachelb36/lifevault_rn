import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type Props = {
  label?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
  inputClassName?: string;
} & TextInputProps;

export default function ValidatedTextInput({
  label,
  required,
  error,
  helperText,
  containerClassName,
  inputClassName,
  ...props
}: Props) {
  const hasError = !!error;

  return (
    <View className={containerClassName ?? ""}>
      {!!label && (
        <Text className="text-sm font-medium text-foreground mb-2">
          {label}
          {required ? <Text className="text-destructive"> *</Text> : null}
        </Text>
      )}

      <TextInput
        {...props}
        className={[
          "bg-card border rounded-xl px-4 py-3 text-base text-foreground",
          hasError ? "border-destructive" : "border-border",
          inputClassName ?? "",
        ].join(" ")}
        placeholderTextColor="rgb(148 163 184)" // muted-ish
      />

      {!!helperText && !hasError && (
        <Text className="mt-2 text-xs text-muted-foreground">{helperText}</Text>
      )}

      {hasError && <Text className="mt-2 text-xs text-destructive">{error}</Text>}
    </View>
  );
}