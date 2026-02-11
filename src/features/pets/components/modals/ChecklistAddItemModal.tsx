import React from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { X } from "lucide-react-native";

export function ChecklistAddItemModal(props: {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const { visible, value, onChange, onClose, onAdd } = props;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6 border-t border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Add Checklist Item</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Item label"
              placeholderTextColor="rgb(168 162 158)"
              value={value}
              onChangeText={onChange}
            />
            <TouchableOpacity onPress={onAdd} className="bg-primary rounded-xl py-4 items-center">
              <Text className="text-primary-foreground font-semibold text-base">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}