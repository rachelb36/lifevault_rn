import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { StoredRecord, deleteRecordForEntity, listRecordsForEntity, upsertRecordForEntity } from "@/features/records/data/storage";
import { defaultTitleForRecordType } from "@/features/records/forms/formDefs";
import RecordTypeFormRenderer from "@/features/records/forms/RecordTypeFormRenderer";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import type { Attachment } from "@/shared/attachments/attachment.model";
import SupportProfileAttachmentsSection from "@/shared/attachments/SupportProfileAttachmentsSection";

export default function EditPersonRecordScreen() {
  const router = useRouter();
  const {
    personId,
    recordId,
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
    replaceAttachment,
  } = useLocalSearchParams<{
    personId?: string;
    recordId?: string;
    initialAttachmentUri?: string;
    initialAttachmentName?: string;
    initialAttachmentMime?: string;
    initialAttachmentSource?: Attachment["source"];
    replaceAttachment?: string;
  }>();

  const pid = personId ? String(personId) : "";
  const rid = recordId ? String(recordId) : "";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const rtype = record?.recordType as RecordType | undefined;

  const meta = useMemo(() => {
    if (!rtype) return null;
    try {
      return getRecordMeta(rtype);
    } catch {
      return null;
    }
  }, [rtype]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!pid || !rid) return;

        const list = await listRecordsForEntity(pid);
        const found = list.find((r) => r.id === rid) ?? null;

        if (!found) {
          Alert.alert("Not found", "This record could not be loaded.");
          router.back();
          return;
        }

        if (!cancelled) {
          const seeded: Attachment[] = [];
          const seededUri = initialAttachmentUri ? String(initialAttachmentUri) : "";
          if (seededUri) {
            seeded.push({
              id: `att_${Date.now()}_${Math.random().toString(16).slice(2)}`,
              uri: seededUri,
              fileName: initialAttachmentName ? String(initialAttachmentName) : "attachment",
              mimeType: initialAttachmentMime ? String(initialAttachmentMime) : "application/octet-stream",
              source: (initialAttachmentSource as Attachment["source"]) || "files",
              createdAt: new Date().toISOString(),
            });
          }
          const shouldReplace = String(replaceAttachment || "").toLowerCase() === "true";

          setRecord(found);
          setPayload(found.payload ?? found.data ?? {});
          setAttachments(shouldReplace ? seeded : [...(found.attachments || []), ...seeded]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pid, rid, router, initialAttachmentUri, initialAttachmentName, initialAttachmentMime, initialAttachmentSource, replaceAttachment]);

  const handleSave = async () => {
    if (!record || !pid) return;

    const next = {
      id: record.id,
      recordType: record.recordType,
      title: defaultTitleForRecordType(record.recordType, payload),
      isPrivate: record.isPrivate,
      payload,
      attachments,
      updatedAt: new Date().toISOString(),
    };

    await upsertRecordForEntity(pid, next);

    Alert.alert("Saved", "Record updated.");
    router.back();
  };

  const handleDelete = async () => {
    if (!record || !pid) return;

    Alert.alert("Delete record?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecordForEntity(pid, record.id);
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
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record || !rtype) {
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={12}>
          <View className="px-6">
            <View className="flex-row items-center py-4">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                <ArrowLeft size={22} className="text-foreground" />
              </TouchableOpacity>

              <View className="ml-2 flex-1">
                <Text className="text-lg font-semibold text-foreground">Edit {meta?.label ?? "Record"}</Text>
              </View>

              <TouchableOpacity onPress={handleDelete} className="w-10 h-10 items-center justify-center" hitSlop={10}>
                <Trash2 size={20} className="text-destructive" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <RecordTypeFormRenderer recordType={rtype} value={payload} onChange={setPayload} />

            {rtype === RECORD_TYPES.PRIVATE_HEALTH_PROFILE && (
              <SupportProfileAttachmentsSection
                attachments={attachments}
                onChange={setAttachments}
              />
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
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
