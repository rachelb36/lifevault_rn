import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";

import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import {
  StoredRecord,
  deleteRecordForEntity,
  listRecordsForEntity,
  upsertRecordForEntity,
} from "@/features/records/data/storage";
import { getFieldsForRecordType } from "@/features/records/forms/formDefs";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { formatDateLabel, parseDate, toIsoDateOnly } from "@/shared/utils/date";

export default function EditPetRecordScreen() {
  const router = useRouter();
  const { petId, recordId } = useLocalSearchParams<{ petId?: string; recordId?: string }>();

  const petEntityId = petId ? String(petId) : "";
  const rid = recordId ? String(recordId) : "";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<any>({});
  const [listFieldDrafts, setListFieldDrafts] = useState<Record<string, string[]>>({});
  const [datePickerState, setDatePickerState] = useState<{ visible: boolean; fieldKey: string | null; title: string; value: Date | null }>({
    visible: false,
    fieldKey: null,
    title: "Select date",
    value: null,
  });

  const rtype = record?.recordType as RecordType | undefined;

  const meta = useMemo(() => {
    if (!rtype) return null;
    try {
      return getRecordMeta(rtype);
    } catch {
      return null;
    }
  }, [rtype]);

  const fields = rtype ? getFieldsForRecordType(rtype) : [];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!petEntityId || !rid) return;

        const list = await listRecordsForEntity(petEntityId);
        const found = list.find((r) => r.id === rid) ?? null;

        if (!found) {
          Alert.alert("Not found", "This record could not be loaded.");
          router.back();
          return;
        }

        if (!cancelled) {
          setRecord(found);
          setTitle(found.title ?? "");
          setData(found.data ?? {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [petEntityId, rid, router]);

  const setField = (key: string, value: string) => {
    setData((prev: any) => ({ ...(prev ?? {}), [key]: value }));
  };

  const isListPatternField = (label: string) => label.toLowerCase().includes("one per line:");
  const isDateField = (key: string, label: string, placeholder?: string) => {
    const lower = `${key} ${label} ${placeholder ?? ""}`.toLowerCase();
    return lower.includes("yyyy-mm-dd") || lower.includes(" date") || lower.includes("dob");
  };

  const listColumnsForLabel = (label: string) => {
    const match = label.match(/one per line:\s*([^)]+)/i);
    const raw = match?.[1] ?? "";
    const parts = raw
      .split(/\s[—-]\s/g)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : ["Item"];
  };

  const getDraftValues = (fieldKey: string, columnCount: number) => {
    const existing = listFieldDrafts[fieldKey] ?? [];
    if (existing.length >= columnCount) return existing;
    return [...existing, ...Array(columnCount - existing.length).fill("")];
  };

  const setDraftValue = (fieldKey: string, index: number, value: string, columnCount: number) => {
    const base = getDraftValues(fieldKey, columnCount);
    const next = [...base];
    next[index] = value;
    setListFieldDrafts((prev) => ({ ...prev, [fieldKey]: next }));
  };

  const addStructuredLine = (fieldKey: string, columns: string[]) => {
    const parts = getDraftValues(fieldKey, columns.length).map((v) => v.trim());
    if (parts.every((p) => !p)) return;
    const line = parts.join(" — ");
    const current = String(data?.[fieldKey] ?? "");
    const next = current ? `${current}\n${line}` : line;
    setField(fieldKey, next);
    setListFieldDrafts((prev) => ({ ...prev, [fieldKey]: Array(columns.length).fill("") }));
  };

  const removeStructuredLine = (fieldKey: string, lineIndex: number) => {
    const lines = String(data?.[fieldKey] ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    lines.splice(lineIndex, 1);
    setField(fieldKey, lines.join("\n"));
  };

  const pickDocument = async (fieldKey: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) return;

      setData((prev: any) => {
        return {
          ...(prev ?? {}),
          [fieldKey]: {
            uri: file.uri,
            name: file.name ?? "document",
            mimeType: file.mimeType ?? "application/octet-stream",
            size: file.size ?? null,
          },
        };
      });
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not select document.");
    }
  };

  const openDatePicker = (fieldKey: string, fieldLabel: string) => {
    setDatePickerState({
      visible: true,
      fieldKey,
      title: fieldLabel,
      value: parseDate(data?.[fieldKey] ?? null),
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

  const handleSave = async () => {
    if (!record || !petEntityId) return;

    const next: StoredRecord = {
      ...record,
      title: (title || "").trim() || record.title || meta?.label || String(record.recordType),
      data,
      updatedAt: new Date().toISOString(),
    };

    await upsertRecordForEntity(petEntityId, next);

    Alert.alert("Saved", "Record updated.");
    router.back();
  };

  const handleDelete = async () => {
    if (!record || !petEntityId) return;

    Alert.alert("Delete record?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecordForEntity(petEntityId, record.id);
          Alert.alert("Deleted", "Record removed.");
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Edit Record</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Edit Record</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={12}
        >
          <View className="px-6">
            <View className="flex-row items-center py-4">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                <ArrowLeft size={22} className="text-foreground" />
              </TouchableOpacity>

              <View className="ml-2 flex-1">
                <Text className="text-lg font-semibold text-foreground">Edit {meta?.label ?? "Record"}</Text>
                <Text className="text-xs text-muted-foreground">Type: {String(record.recordType)}</Text>
              </View>

              <TouchableOpacity onPress={handleDelete} className="w-10 h-10 items-center justify-center" hitSlop={10}>
                <Trash2 size={20} className="text-destructive" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Title</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Optional"
                placeholderTextColor="rgb(148 163 184)"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {fields.length > 0 ? (
              <View className="gap-4">
                {fields.map((f) => (
                  <View key={f.key}>
                    <Text className="text-sm font-medium text-foreground mb-2">{f.label}</Text>
                    {f.type === "document" ? (
                      <View>
                        <TouchableOpacity
                          onPress={() => pickDocument(f.key)}
                          className="bg-card border border-border rounded-xl px-4 py-3"
                          activeOpacity={0.85}
                        >
                          <Text className="text-foreground font-medium">
                            {data?.[f.key]?.uri ? "Replace Document" : "Upload Document"}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-1">
                            PDF, image, or file from device
                          </Text>
                        </TouchableOpacity>
                        {data?.[f.key]?.uri ? (
                          <View className="mt-2 rounded-lg border border-border bg-card px-3 py-2">
                            <Text className="text-sm text-foreground">
                              {String(data?.[f.key]?.name ?? "Selected file")}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-0.5">
                              Saved to this profile record
                            </Text>
                            <TouchableOpacity
                              onPress={() => setData((prev: any) => ({ ...(prev ?? {}), [f.key]: null }))}
                              className="mt-2 self-start"
                            >
                              <Text className="text-xs text-destructive font-medium">Remove document</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <>
                        {f.type === "multiline" && isListPatternField(f.label) ? (
                          <View className="gap-2">
                            {String(data?.[f.key] ?? "")
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line, idx) => (
                                <View key={`${f.key}-line-${idx}`} className="flex-row items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                                  <Text className="text-sm text-foreground flex-1">{line}</Text>
                                  <TouchableOpacity onPress={() => removeStructuredLine(f.key, idx)} className="ml-3">
                                    <Text className="text-xs text-destructive font-medium">Remove</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}

                            <View className="gap-2">
                              {listColumnsForLabel(f.label).map((col, colIdx) => (
                                <TextInput
                                  key={`${f.key}-input-${colIdx}`}
                                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                                  placeholder={col}
                                  placeholderTextColor="rgb(148 163 184)"
                                  value={getDraftValues(f.key, listColumnsForLabel(f.label).length)[colIdx] ?? ""}
                                  onChangeText={(t) => setDraftValue(f.key, colIdx, t, listColumnsForLabel(f.label).length)}
                                />
                              ))}
                              <TouchableOpacity
                                onPress={() => addStructuredLine(f.key, listColumnsForLabel(f.label))}
                                className="self-start rounded-lg bg-primary/10 px-3 py-2"
                                activeOpacity={0.85}
                              >
                                <Text className="text-xs font-semibold text-primary">Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : isDateField(f.key, f.label, f.placeholder) ? (
                          <TouchableOpacity
                            onPress={() => openDatePicker(f.key, f.label)}
                            className="bg-card border border-border rounded-xl px-4 py-3"
                            activeOpacity={0.85}
                          >
                            <Text className={data?.[f.key] ? "text-foreground" : "text-muted-foreground"}>
                              {formatDateLabel(data?.[f.key], f.placeholder ?? "Select date")}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TextInput
                            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                            placeholder={f.placeholder ?? ""}
                            placeholderTextColor="rgb(148 163 184)"
                            value={String(data?.[f.key] ?? "")}
                            onChangeText={(t) => setField(f.key, t)}
                            multiline={f.type === "multiline"}
                            style={f.type === "multiline" ? { minHeight: 110, textAlignVertical: "top" as any } : undefined}
                          />
                        )}
                      </>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text className="text-sm text-muted-foreground">No custom fields configured for this record type.</Text>
              </View>
            )}

            <View className="mt-8 gap-3">
              <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-primary-foreground font-semibold">Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <DatePickerModal
          visible={datePickerState.visible}
          value={datePickerState.value}
          onConfirm={confirmDatePicker}
          onCancel={closeDatePicker}
          title={datePickerState.title}
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
