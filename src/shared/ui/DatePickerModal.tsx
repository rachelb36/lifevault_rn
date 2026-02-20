import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from "nativewind";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (visible) setTempDate(value ?? new Date());
  }, [visible, value]);

  const overlayBg = isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.55)";
  const cardBg = isDark ? "#111827" : "#FFFFFF"; // solid, opaque
  const border = isDark ? "#374151" : "#E5E7EB";
  const titleColor = isDark ? "#F9FAFB" : "#111827";
  const bodyText = isDark ? "#E5E7EB" : "#111827";
  const cancelBorder = isDark ? "#4B5563" : "#D1D5DB";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* Overlay (tap outside to close) */}
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: overlayBg,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Card (prevent closing when tapping inside) */}
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: cardBg,
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: titleColor,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {title}
          </Text>

          {/* Picker */}
          <View style={{ alignItems: "center" }}>
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
              }}
              style={{ alignSelf: "center" }}
              themeVariant={isDark ? "dark" : "light"} // helps iOS spinner theme
            />
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => onConfirm(tempDate)}
              activeOpacity={0.9}
              style={{
                flex: 1,
                backgroundColor: isDark ? "#2563EB" : "#2563EB",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.9}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: cancelBorder,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: bodyText, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}