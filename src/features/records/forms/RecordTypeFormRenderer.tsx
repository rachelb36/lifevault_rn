import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { RecordType } from "@/domain/records/recordTypes";
import { getFieldsForRecordType } from "@/features/records/forms/formDefs";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { formatDateLabel, parseDate, toIsoDateOnly } from "@/shared/utils/date";

export default function RecordTypeFormRenderer({
  recordType,
  value,
  onChange,
}: {
  recordType: RecordType;
  value: any;
  onChange: (next: any) => void;
}) {
  const fields = getFieldsForRecordType(recordType);

  const setField = (key: string, nextValue: string) => {
    onChange({ ...(value ?? {}), [key]: nextValue });
  };

  const isListPatternField = (label: string) => label.toLowerCase().includes("one per line:");
  const isDateField = (key: string, label: string, placeholder?: string) => {
    const lower = `${key} ${label} ${placeholder ?? ""}`.toLowerCase();
    return lower.includes("yyyy-mm-dd") || lower.includes(" date") || lower.includes("dob");
  };
  const [datePickerState, setDatePickerState] = React.useState<{ visible: boolean; fieldKey: string | null; title: string; value: Date | null }>({
    visible: false,
    fieldKey: null,
    title: "Select date",
    value: null,
  });
  const listColumnsForLabel = (label: string) => {
    const match = label.match(/one per line:\s*([^)]+)/i);
    const raw = match?.[1] ?? "";
    const parts = raw
      .split(/\s[—-]\s/g)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : ["Item"];
  };

  const addStructuredLine = (key: string, parts: string[]) => {
    const line = parts.map((p) => p.trim()).join(" — ");
    if (!line.replaceAll(" — ", "").trim()) return;
    const current = String(value?.[key] ?? "");
    const next = current ? `${current}\n${line}` : line;
    setField(key, next);
  };

  const removeStructuredLine = (key: string, idx: number) => {
    const lines = String(value?.[key] ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    lines.splice(idx, 1);
    setField(key, lines.join("\n"));
  };

  const openDatePicker = (fieldKey: string, fieldLabel: string) => {
    setDatePickerState({
      visible: true,
      fieldKey,
      title: fieldLabel,
      value: parseDate(value?.[fieldKey] ?? null),
    });
  };

  const closeDatePicker = () => {
    setDatePickerState((prev) => ({ ...prev, visible: false, fieldKey: null }));
  };

  const confirmDatePicker = (date: Date) => {
    if (!datePickerState.fieldKey) return;
    setField(datePickerState.fieldKey, toIsoDateOnly(date));
    closeDatePicker();
  };

  if (fields.length === 0) {
    return (
      <View>
        <Text className="text-sm text-muted-foreground">No mapped form fields for {recordType}.</Text>
      </View>
    );
  }

  return (
    <>
      <View className="gap-4">
        {fields.map((f) => (
          <View key={f.key}>
            <Text className="text-sm font-medium text-foreground mb-2">{f.label}</Text>
            {f.type === "document" ? (
              <Text className="text-xs text-muted-foreground">
                Document upload is supported in add/edit record screens.
              </Text>
            ) : f.type === "multiline" && isListPatternField(f.label) ? (
              <StructuredRowBuilder
                columns={listColumnsForLabel(f.label)}
                currentValue={String(value?.[f.key] ?? "")}
                onAdd={(parts) => addStructuredLine(f.key, parts)}
                onRemove={(idx) => removeStructuredLine(f.key, idx)}
              />
            ) : isDateField(f.key, f.label, f.placeholder) ? (
              <TouchableOpacity
                onPress={() => openDatePicker(f.key, f.label)}
                className="bg-card border border-border rounded-xl px-4 py-3"
                activeOpacity={0.85}
              >
                <Text className={value?.[f.key] ? "text-foreground" : "text-muted-foreground"}>
                  {formatDateLabel(value?.[f.key], f.placeholder ?? "Select date")}
                </Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder={f.placeholder ?? ""}
                placeholderTextColor="rgb(148 163 184)"
                value={String(value?.[f.key] ?? "")}
                onChangeText={(t) => setField(f.key, t)}
                multiline={f.type === "multiline"}
                style={f.type === "multiline" ? { minHeight: 110, textAlignVertical: "top" as any } : undefined}
              />
            )}
          </View>
        ))}
      </View>

      <DatePickerModal
        visible={datePickerState.visible}
        value={datePickerState.value}
        onConfirm={confirmDatePicker}
        onCancel={closeDatePicker}
        title={datePickerState.title}
      />
    </>
  );
}

function StructuredRowBuilder({
  columns,
  currentValue,
  onAdd,
  onRemove,
}: {
  columns: string[];
  currentValue: string;
  onAdd: (parts: string[]) => void;
  onRemove: (idx: number) => void;
}) {
  const [parts, setParts] = React.useState<string[]>(() => Array(columns.length).fill(""));

  const lines = currentValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const setPart = (idx: number, next: string) => {
    setParts((prev) => {
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  };

  return (
    <View className="gap-2">
      {lines.map((line, idx) => (
        <View key={`row-${idx}`} className="flex-row items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <Text className="text-sm text-foreground flex-1">{line}</Text>
          <Text onPress={() => onRemove(idx)} className="ml-3 text-xs text-destructive font-medium">
            Remove
          </Text>
        </View>
      ))}

      {columns.map((col, idx) => (
        <TextInput
          key={`input-${idx}`}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder={col}
          placeholderTextColor="rgb(148 163 184)"
          value={parts[idx] ?? ""}
          onChangeText={(t) => setPart(idx, t)}
        />
      ))}

      <Text
        onPress={() => {
          onAdd(parts);
          setParts(Array(columns.length).fill(""));
        }}
        className="self-start rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
      >
        Add
      </Text>
    </View>
  );
}
