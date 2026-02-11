import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Calendar, X } from "lucide-react-native";
import { formatDateLabel } from "@/shared/utils/date";
import type { Dateish, ServiceDocument } from "../../../domain/types";
import { CustomSelect } from "../CustomSelect";

export function ServiceDocumentModal(props: {
  visible: boolean;
  value: { type: ServiceDocument["type"]; expiryDate: Date | null };
  onChange: (v: { type: ServiceDocument["type"]; expiryDate: Date | null }) => void;
  onClose: () => void;
  onSave: () => void;
  openDatePicker: (title: string, currentValue: Dateish, onConfirm: (d: Date) => void) => void;
}) {
  const { visible, value, onChange, onClose, onSave, openDatePicker } = props;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6 border-t border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Add Service Document</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            <CustomSelect
              label="Type"
              value={value.type}
              options={["ESA Letter", "Service Animal Certification", "Other"]}
              onSelect={(val) => onChange({ ...value, type: val as ServiceDocument["type"] })}
            />

            <TouchableOpacity
              onPress={() => openDatePicker("Expiry date", value.expiryDate, (d) => onChange({ ...value, expiryDate: d }))}
              className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              activeOpacity={0.85}
            >
              <Text className={value.expiryDate ? "text-foreground" : "text-muted-foreground"}>
                {formatDateLabel(value.expiryDate, "Select expiry date")}
              </Text>
              <Calendar size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onSave} className="bg-primary rounded-xl py-4 items-center">
              <Text className="text-primary-foreground font-semibold text-base">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}