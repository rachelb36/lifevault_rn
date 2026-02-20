import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

type Props = {
  title: string;
  summary: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
};

export default function RowWithSummary({ title, summary, onPress, testID, disabled }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between px-3 py-3 rounded-xl border border-border bg-background ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm font-medium text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1} ellipsizeMode="tail">
          {summary}
        </Text>
      </View>
      <ChevronRight size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

