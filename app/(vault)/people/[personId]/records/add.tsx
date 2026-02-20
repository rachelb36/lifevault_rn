import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { listRecordsForEntity, upsertRecordForEntity } from "@/features/records/data/storage";
import { buildInitialData, defaultTitleForRecordType } from "@/features/records/forms/formDefs";
import RecordTypeFormRenderer from "@/features/records/forms/RecordTypeFormRenderer";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import type { Attachment } from "@/shared/attachments/attachment.model";
import SupportProfileAttachmentsSection from "@/shared/attachments/SupportProfileAttachmentsSection";

function mkId() {
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function AddPersonRecordScreen() {
  const router = useRouter();
  const {
    personId,
    recordType,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
  } = useLocalSearchParams<{
    personId?: string;
    recordType?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
  }>();

  const pid = personId ? String(personId) : "";
  const rtype = (recordType ? String(recordType) : "") as RecordType;

  const meta = useMemo(() => {
    try {
      return getRecordMeta(rtype);
    } catch {
      return null;
    }
  }, [rtype]);

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<Attachment[]>(() => {
    const uri = initialAttachmentUri ? String(initialAttachmentUri) : "";
    if (!uri) return [];
    return [
      {
        id: `att_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        uri,
        fileName: initialAttachmentName ? String(initialAttachmentName) : "attachment",
        mimeType: initialAttachmentMime ? String(initialAttachmentMime) : "application/octet-stream",
        source: (initialAttachmentSource as Attachment["source"]) || "files",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        if (!pid || !rtype) return;

        if (isSingletonType(rtype)) {
          const existing = (await listRecordsForEntity(pid)).find((r) => r.recordType === rtype);
          if (existing) {
            router.replace({
              pathname: "/(vault)/people/[personId]/records/[recordId]/edit",
              params: { personId: pid, recordId: existing.id },
            } as any);
            return;
          }
        }

        if (!cancelled) {
          setPayload(buildInitialData(rtype));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [pid, rtype, router]);

  const handleSave = async () => {
    if (!pid || !rtype) {
      Alert.alert("Missing info", "personId or recordType is missing.");
      return;
    }

    const finalTitle = defaultTitleForRecordType(rtype, payload);

    const record = {
      id: mkId(),
      recordType: rtype,
      title: finalTitle,
      payload,
      attachments,
    };

    await upsertRecordForEntity(pid, record);

    Alert.alert("Saved", "Record added.");
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Add Record</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={12}>
          <View className="px-6">
            <View className="flex-row items-center py-4">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                <ArrowLeft size={22} className="text-foreground" />
              </TouchableOpacity>

              <View className="ml-2 flex-1">
                {/* ✅ clean header, no “Type:” metadata */}
                <Text className="text-lg font-semibold text-foreground">Add {meta?.label ?? "Record"}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <RecordTypeFormRenderer recordType={rtype} value={payload} onChange={setPayload} />

            {rtype === RECORD_TYPES.PRIVATE_HEALTH_PROFILE && (
              <SupportProfileAttachmentsSection
                attachments={attachments}
                onChange={setAttachments}
              />
            )}

            <View className="mt-8 gap-3">
              <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-primary-foreground font-semibold">Save</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
