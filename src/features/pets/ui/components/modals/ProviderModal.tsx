import React from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { X } from "lucide-react-native";
import type { ServiceProvider } from "../../../domain/types";
import { CustomSelect } from "../CustomSelect";

export function ProviderModal(props: {
  visible: boolean;
  title: string;
  value: { name: string; type: ServiceProvider["type"]; phone: string; notes: string };
  onChange: (v: { name: string; type: ServiceProvider["type"]; phone: string; notes: string }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { visible, title, value, onChange, onClose, onSave } = props;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6 border-t border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Provider name"
              placeholderTextColor="rgb(168 162 158)"
              value={value.name}
              onChangeText={(t) => onChange({ ...value, name: t })}
            />

            <CustomSelect
              label="Type"
              value={value.type}
              options={["Walker", "Sitter", "Daycare", "Groomer", "Trainer", "Boarding", "Other"]}
              onSelect={(val) => onChange({ ...value, type: val as ServiceProvider["type"] })}
            />

            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Phone"
              placeholderTextColor="rgb(168 162 158)"
              value={value.phone}
              onChangeText={(t) => onChange({ ...value, phone: t })}
              keyboardType="phone-pad"
            />

            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Notes"
              placeholderTextColor="rgb(168 162 158)"
              value={value.notes}
              onChangeText={(t) => onChange({ ...value, notes: t })}
              multiline
            />

            <TouchableOpacity onPress={onSave} className="bg-primary rounded-xl py-4 items-center">
              <Text className="text-primary-foreground font-semibold text-base">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}