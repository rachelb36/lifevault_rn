/**
 * RecordFormScreen — Shared form component for adding and editing records.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { RecordType } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import {
  type StoredRecord,
  deleteRecordForEntity,
  listRecordsForEntity,
  upsertRecordForEntity,
} from "@/features/records/data/storage";
import {
  buildInitialData,
  defaultTitleForRecordType,
  getFieldsForRecordType,
} from "@/features/records/forms/formDefs";
import RecordTypeFormRenderer from "@/features/records/forms/RecordTypeFormRenderer";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";

type Props = {
  mode: "add" | "edit";
  entityId: string;
  entityType: "person" | "pet";
  recordId?: string;
  recordType?: string;
  editRoutePath: string;
  entityParamKey: string;
  entityMeta?: { kind?: string };
};

function mkId() {
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function RecordFormScreen({
  mode,
  entityId,
  entityType,
  recordId,
  recordType,
  editRoutePath,
  entityParamKey,
  entityMeta,
}: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const rtype: RecordType | undefined = isEdit
    ? (record?.recordType as RecordType | undefined)
    : ((recordType || "") as RecordType);

  const meta = useMemo(() => {
    if (!rtype) return null;
    try {
      return getRecordMeta(rtype);
    } catch {
      return null;
    }
  }, [rtype]);

  const screenTitle = isEdit ? `Edit ${meta?.label ?? "Record"}` : `Add ${meta?.label ?? "Record"}`;

  const currentSnapshot = useMemo(
    () => JSON.stringify({ payload }),
    [payload],
  );

  const hasUnsavedChanges = initialSnapshot.length > 0 && currentSnapshot !== initialSnapshot;

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        if (!entityId) return;

        if (isEdit) {
          if (!recordId) return;
          const list = await listRecordsForEntity(entityId);
          const found = list.find((r) => r.id === recordId) ?? null;

          if (!found) {
            Alert.alert("Not found", "This record could not be loaded.");
            router.back();
            return;
          }

          const nextPayload = found.payload ?? found.data ?? {};

          if (!cancelled) {
            setRecord(found);
            setPayload(nextPayload);
            setInitialSnapshot(JSON.stringify({ payload: nextPayload }));
          }
        } else {
          const rt = (recordType || "") as RecordType;
          if (!rt) return;

          if (isSingletonType(rt)) {
            const existing = (await listRecordsForEntity(entityId)).find((r) => r.recordType === rt);
            if (existing) {
              router.replace({
                pathname: editRoutePath,
                params: { [entityParamKey]: entityId, recordId: existing.id },
              } as any);
              return;
            }
          }

          const initialPayload = buildInitialData(rt);

          if (!cancelled) {
            setPayload(initialPayload);
            setInitialSnapshot(JSON.stringify({ payload: initialPayload }));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [
    entityId,
    isEdit,
    recordId,
    recordType,
    router,
    editRoutePath,
    entityParamKey,
  ]);

  const handleBack = () => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    Alert.alert("Discard changes?", "You have unsaved changes. Leave without saving?", [
      { text: "Stay", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const handleSave = async () => {
    if (!entityId || !rtype) {
      Alert.alert("Missing info", `${entityType} ID or record type is missing.`);
      return;
    }

    const requiredMissing = getFieldsForRecordType(rtype, payload)
      .filter((field) => field.required)
      .filter((field) => {
        const value = (payload as Record<string, unknown>)[field.key];
        if (value == null) return true;
        if (typeof value === "string") return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        return false;
      })
      .map((field) => `${typeof field.label === "string" ? field.label : field.key} is required.`);

    if (requiredMissing.length > 0) {
      setValidationErrors(requiredMissing);
      Alert.alert("Required", "Please complete required fields.");
      return;
    }

    setValidationErrors([]);

    const finalTitle = defaultTitleForRecordType(rtype, payload);

    if (isEdit && record) {
      await upsertRecordForEntity(entityId, {
        id: record.id,
        recordType: record.recordType,
        title: finalTitle,
        isPrivate: record.isPrivate,
        payload,
        updatedAt: new Date().toISOString(),
      });
      Alert.alert("Saved", "Record updated.");
    } else {
      await upsertRecordForEntity(entityId, {
        id: mkId(),
        recordType: rtype,
        title: finalTitle,
        payload,
      });
      Alert.alert("Saved", "Record added.");
    }

    setSaveLabel("saved");
    setInitialSnapshot(currentSnapshot);
    router.back();
  };

  const handleDelete = () => {
    if (!record || !entityId) return;

    Alert.alert("Delete record?", "This action cannot be undone. Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecordForEntity(entityId, record.id);
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
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">{screenTitle}</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isEdit && (!record || !rtype)) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center">
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
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
            <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center">
              <ArrowLeft size={22} className="text-foreground" />
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-foreground">{screenTitle}</Text>

            {isEdit ? (
              <TouchableOpacity onPress={handleDelete} className="w-10 h-10 items-center justify-center" hitSlop={10}>
                <Trash2 size={20} className="text-destructive" />
              </TouchableOpacity>
            ) : (
              <View className="w-10" />
            )}
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {rtype && (
              <View className="mt-4">
                <RecordTypeFormRenderer
                  recordType={rtype}
                  value={payload}
                  onChange={(next) => {
                    setPayload(next);
                    setSaveLabel("idle");
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  entityMeta={entityMeta}
                />
              </View>
            )}

            {validationErrors.length > 0 ? (
              <View className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                {validationErrors.map((error) => (
                  <Text key={error} className="text-xs text-destructive">
                    {error}
                  </Text>
                ))}
              </View>
            ) : null}

            <View className="mt-8 gap-3">
              <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-primary-foreground font-semibold">
                  {saveLabel === "saved" ? "Saved ✓" : isEdit ? "Save Changes" : "Save"}
                </Text>
              </TouchableOpacity>

              {isEdit && (
                <TouchableOpacity
                  onPress={handleDelete}
                  className="flex-row items-center justify-center rounded-xl border border-destructive/40 py-4"
                  activeOpacity={0.85}
                >
                  <Trash2 size={16} className="text-destructive" />
                  <Text className="ml-2 font-semibold text-destructive">Delete Record</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleBack} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
