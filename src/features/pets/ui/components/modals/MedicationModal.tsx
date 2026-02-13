import React from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { Calendar, X } from "lucide-react-native";
import { formatDateLabel } from "@/shared/utils/date";
import type { Dateish } from "../../../domain/pet.model";

export function MedicationModal(props: {
  visible: boolean;
  title: string;
  value: { name: string; dosage: string; frequency: string; startDate: Date | null; endDate: Date | null; notes: string };
  onChange: (v: { name: string; dosage: string; frequency: string; startDate: Date | null; endDate: Date | null; notes: string }) => void;
  onClose: () => void;
  onSave: () => void;
  openDatePicker: (title: string, currentValue: Dateish, onConfirm: (d: Date) => void) => void;
}) {
  const { visible, title, value, onChange, onClose, onSave, openDatePicker } = props;

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
              placeholder="Medication name"
              placeholderTextColor="rgb(168 162 158)"
              value={value.name}
              onChangeText={(t) => onChange({ ...value, name: t })}
            />
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Dosage"
              placeholderTextColor="rgb(168 162 158)"
              value={value.dosage}
              onChangeText={(t) => onChange({ ...value, dosage: t })}
            />
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Frequency"
              placeholderTextColor="rgb(168 162 158)"
              value={value.frequency}
              onChangeText={(t) => onChange({ ...value, frequency: t })}
            />

            <TouchableOpacity
              onPress={() => openDatePicker("Start date", value.startDate, (d) => onChange({ ...value, startDate: d }))}
              className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              activeOpacity={0.85}
            >
              <Text className={value.startDate ? "text-foreground" : "text-muted-foreground"}>
                {formatDateLabel(value.startDate, "Select start date")}
              </Text>
              <Calendar size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openDatePicker("End date", value.endDate, (d) => onChange({ ...value, endDate: d }))}
              className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              activeOpacity={0.85}
            >
              <Text className={value.endDate ? "text-foreground" : "text-muted-foreground"}>
                {formatDateLabel(value.endDate, "Select end date (optional)")}
              </Text>
              <Calendar size={18} className="text-muted-foreground" />
            </TouchableOpacity>

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