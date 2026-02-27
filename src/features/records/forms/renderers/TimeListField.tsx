import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";
import TimePickerModal from "@/shared/ui/TimePickerModal";
import { isFieldFilled } from "./fieldUtils";

/** Format "HH:mm" (24h) into a readable 12-hour string like "7:00 AM". */
function formatTime(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  let h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

function normalizeTimeList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [];
}

export default function TimeListField({
  fieldKey,
  label,
  fieldValue,
  setField,
}: FieldRendererProps) {
  const times = normalizeTimeList(fieldValue);
  const [pickerVisible, setPickerVisible] = useState(false);

  const addTime = (hhmm: string) => {
    if (!times.includes(hhmm)) {
      const next = [...times, hhmm].sort();
      setField(fieldKey, next);
    }
    setPickerVisible(false);
  };

  const removeAt = (idx: number) => {
    const next = [...times];
    next.splice(idx, 1);
    setField(fieldKey, next);
  };

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />

      <View className="bg-card border border-border rounded-xl overflow-hidden">
        {times.map((t, idx) => (
          <View
            key={`${fieldKey}-time-${idx}`}
            className={idx === 0 ? "" : "border-t border-border"}
          >
            <SwipeToDeleteRow
              titleForConfirm={formatTime(t)}
              onDelete={() => removeAt(idx)}
            >
              <View className="px-4 py-3">
                <Text className="text-[17px] text-foreground">
                  {formatTime(t)}
                </Text>
              </View>
            </SwipeToDeleteRow>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.85}
          className={
            times.length > 0
              ? "border-t border-border px-4 py-3"
              : "px-4 py-3"
          }
        >
          <Text className="text-[17px] text-primary font-medium">+ Add Time</Text>
        </TouchableOpacity>
      </View>

      <TimePickerModal
        visible={pickerVisible}
        title={`Add ${label}`}
        onConfirm={addTime}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}
