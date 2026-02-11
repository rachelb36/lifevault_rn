import React from "react";
import { View, Text, Pressable } from "react-native";
import { Plus, Minus } from "lucide-react-native";
import { Module, ModuleType } from "@/lib/types/profile";

type Props = {
  modules: Module[];
  expanded: Set<ModuleType>;
  onToggleExpanded: (id: ModuleType) => void;
  renderContent: (id: ModuleType) => React.ReactNode;
};

export default function ModuleAccordion({
  modules,
  expanded,
  onToggleExpanded,
  renderContent,
}: Props) {
  return (
    <View className="gap-3">
      {modules.map((module) => {
        const isOpen = expanded.has(module.id);
        const Icon = module.icon;
        return (
          <View key={module.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <Pressable
              onPress={() => onToggleExpanded(module.id)}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10">
                  <Icon size={20} className="text-primary" />
                </View>
                <Text className="text-base font-semibold text-foreground">{module.name}</Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                {isOpen ? (
                  <Minus size={16} className="text-muted-foreground" />
                ) : (
                  <Plus size={16} className="text-muted-foreground" />
                )}
              </View>
            </Pressable>
            {isOpen && <View className="px-4 pb-4">{renderContent(module.id)}</View>}
          </View>
        );
      })}
    </View>
  );
}
