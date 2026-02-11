import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

type Props = {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function AccordionSection({ title, icon, isExpanded, onToggle, children }: Props) {
  return (
    <View className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
      <TouchableOpacity onPress={onToggle} className="flex-row items-center justify-between p-4 bg-card/50">
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground" />
        )}
      </TouchableOpacity>

      {isExpanded && <View className="p-4 border-t border-border bg-card">{children}</View>}
    </View>
  );
}