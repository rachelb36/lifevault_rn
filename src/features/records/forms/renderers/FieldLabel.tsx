import React from "react";
import { Text, View } from "react-native";
import { CircleCheck } from "lucide-react-native";

export default function FieldLabel({ label, filled }: { label: string; filled: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {filled && <CircleCheck size={14} color="#22c55e" />}
    </View>
  );
}
