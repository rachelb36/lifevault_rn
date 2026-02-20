// src/shared/ui/TimePickerModal.tsx
import React, { useMemo, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateToHHmm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Convert "HH:mm" -> Date (today at that time)
 * If no value, default to 00:00 (12:00 AM) instead of "now"
 */
function hhmmToDate(hhmm?: string) {
  const d = new Date();
  d.setSeconds(0);
  d.setMilliseconds(0);

  if (!hhmm) {
    d.setHours(0);
    d.setMinutes(0);
    return d;
  }

  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);

  d.setHours(Number.isFinite(h) ? h : 0);
  d.setMinutes(Number.isFinite(m) ? m : 0);
  return d;
}

export default function TimePickerModal({
  visible,
  value, // "HH:mm"
  title = "Select time",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  value?: string;
  title?: string;
  onConfirm: (hhmm: string) => void;
  onCancel: () => void;
}) {
  const initial = useMemo(() => hhmmToDate(value), [value]);
  const [temp, setTemp] = useState<Date>(initial);

  // Sync temp when opening
  React.useEffect(() => {
    if (visible) setTemp(hhmmToDate(value));
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-card rounded-t-3xl border border-border p-4">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={onCancel} className="px-2 py-2" activeOpacity={0.85}>
              <Text className="text-primary font-semibold">Cancel</Text>
            </TouchableOpacity>

            <Text className="text-foreground font-semibold">{title}</Text>

            <TouchableOpacity
              onPress={() => onConfirm(dateToHHmm(temp))}
              className="px-2 py-2"
              activeOpacity={0.85}
            >
              <Text className="text-primary font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Center horizontally */}
          <View className="items-center py-2">
            <View style={{ width: Platform.OS === "ios" ? 320 : "100%" }}>
              <DateTimePicker
                value={temp}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selected) => {
                  if (selected) setTemp(selected);
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}