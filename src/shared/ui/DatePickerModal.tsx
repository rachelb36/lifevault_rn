import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type DatePickerModalProps = {
  visible: boolean;
  value: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  mode?: "date";
};

export default function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  title = "Select date",
  mode = "date",
}: DatePickerModalProps) {
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  useEffect(() => {
    if (visible) setTempDate(value ?? new Date());
  }, [visible, value]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Overlay */}
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        {/* Card */}
        <View className="w-full max-w-[360px] bg-background rounded-3xl p-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4 text-center">
            {title}
          </Text>

          {/* Picker */}
          <View className="items-center">
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
              }}
              style={{ alignSelf: "center" }}
            />
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => onConfirm(tempDate)}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              <Text className="text-primary-foreground font-semibold">
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-foreground font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
