import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { deleteRecordForEntity, getRecordById, type StoredRecord } from "@/features/records/data/storage";
import { buildDisplayRows, buildDisplayTables } from "@/features/records/forms/formDefs";
import { Contact, getContactDisplayName, getContacts } from "@/features/contacts/data/storage";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import type { Attachment } from "@/shared/attachments/attachment.model";

export default function PetRecordDetailScreen() {
  const router = useRouter();
  const { petId, recordId } = useLocalSearchParams<{ petId?: string; recordId?: string }>();

  const pid = petId ? String(petId) : "";
  const rid = recordId ? String(recordId) : "";

  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [replaceSheetVisible, setReplaceSheetVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!pid || !rid) return;
        const [found, allContacts] = await Promise.all([getRecordById(pid, rid), getContacts()]);
        if (!cancelled) {
          setRecord(found);
          setContacts(allContacts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [pid, rid]);

  const label = useMemo(() => {
    if (!record) return "Record";
    return getRecordMeta(record.recordType)?.label ?? String(record.recordType);
  }, [record]);

  const contactById = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  const resolveMaybeContact = useCallback(
    (columnOrLabel: string, rawValue: string) => {
      const value = String(rawValue || "").trim();
      if (!value) return value;
      const looksLikeContactField = columnOrLabel.toLowerCase().includes("contact");
      if (!looksLikeContactField) return value;

      const found = contactById.get(value);
      if (!found) return `Unknown contact (${value})`;
      const display = getContactDisplayName(found) || "Unnamed contact";
      return found.phone ? `${display} • ${found.phone}` : display;
    },
    [contactById]
  );

  const displayRows = useMemo(() => {
    if (!record) return [];
    return buildDisplayRows(record.recordType, record.payload ?? record.data);
  }, [record]);

  const displayTables = useMemo(() => {
    if (!record) return [];
    return buildDisplayTables(record.recordType, record.payload ?? record.data);
  }, [record]);

  const handleDelete = () => {
    if (!record) return;
    Alert.alert("Delete record?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecordForEntity(pid, record.id);
          router.back();
        },
      },
    ]);
  };

  const handleOpenAttachment = useCallback(async (uri: string) => {
    if (!uri) return;
    const can = await Linking.canOpenURL(uri);
    if (!can) {
      Alert.alert("Cannot open file", "This document cannot be opened on this device.");
      return;
    }
    await Linking.openURL(uri);
  }, []);

  const handleReplacePicked = useCallback(
    (attachment: Attachment) => {
      if (!record) return;
      router.push({
        pathname: "/(vault)/pets/[petId]/records/[recordId]/edit",
        params: {
          petId: pid,
          recordId: record.id,
          initialAttachmentUri: attachment.uri,
          initialAttachmentName: attachment.fileName,
          initialAttachmentMime: attachment.mimeType,
          initialAttachmentSource: attachment.source,
          replaceAttachment: "true",
        },
      } as any);
      setReplaceSheetVisible(false);
    },
    [pid, record, router]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Record Detail</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      ) : !record ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground font-semibold">Record not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <Text className="text-2xl font-bold text-foreground">{record.title || label}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {label} {record.updatedAt ? `• Updated ${new Date(record.updatedAt).toLocaleString()}` : ""}
          </Text>

          <View className="mt-6 rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Data</Text>
            {displayRows.length === 0 && displayTables.length === 0 ? (
              <Text className="text-xs text-muted-foreground">No details saved yet.</Text>
            ) : (
              <View className="gap-3">
                {displayRows.map((row, idx) => (
                  <View key={`${row.label}-${idx}`}>
                    <Text className="text-xs font-medium text-muted-foreground">{row.label}</Text>
                    <Text className="mt-0.5 text-sm text-foreground">{resolveMaybeContact(row.label, row.value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {displayTables.map((table) => (
            <View key={table.label} className="mt-4 gap-2">
              <Text className="text-sm font-medium text-foreground">{table.label}</Text>
              {table.rows.length === 0 ? (
                <View className="rounded-xl border border-border bg-card px-4 py-3">
                  <Text className="text-xs text-muted-foreground">None added yet.</Text>
                </View>
              ) : (
                table.rows.map((row, rowIndex) => (
                  <View key={`${table.label}-row-${rowIndex}`} className="rounded-xl border border-border bg-card px-4 py-3 gap-2">
                    {row.map((cell, cellIndex) => {
                      const resolved = resolveMaybeContact(table.columns[cellIndex] || "", cell);
                      if (!resolved || resolved === "-") return null;
                      return (
                        <View key={`${table.label}-cell-${rowIndex}-${cellIndex}`}>
                          <Text className="text-xs font-medium text-muted-foreground">{table.columns[cellIndex]}</Text>
                          <Text className="text-sm text-foreground mt-0.5">{resolved}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          ))}

          <View className="mt-4 rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Attachments</Text>
            {(record.attachments || []).length === 0 ? (
              <Text className="text-xs text-muted-foreground">No attachments.</Text>
            ) : (
              <View className="gap-2">
                {record.attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    onPress={() => handleOpenAttachment(String(attachment.uri || ""))}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    activeOpacity={0.85}
                  >
                    <Text className="text-sm text-foreground">{attachment.fileName}</Text>
                    <Text className="text-xs text-primary mt-0.5">View uploaded document</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(vault)/pets/[petId]/records/[recordId]/edit",
                  params: { petId: pid, recordId: record.id },
                } as any)
              }
              className="flex-row items-center justify-center rounded-xl bg-primary py-4"
            >
              <Pencil size={16} className="text-primary-foreground" />
              <Text className="ml-2 font-semibold text-primary-foreground">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setReplaceSheetVisible(true)}
              className="flex-row items-center justify-center rounded-xl border border-border py-4"
            >
              <Text className="font-semibold text-foreground">Replace File</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} className="flex-row items-center justify-center rounded-xl border border-destructive/40 py-4">
              <Trash2 size={16} className="text-destructive" />
              <Text className="ml-2 font-semibold text-destructive">Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <AttachmentSourceSheet
        visible={replaceSheetVisible}
        onClose={() => setReplaceSheetVisible(false)}
        onPicked={handleReplacePicked}
        onManual={() => {
          if (!record) return;
          router.push({
            pathname: "/(vault)/pets/[petId]/records/[recordId]/edit",
            params: { petId: pid, recordId: record.id },
          } as any);
          setReplaceSheetVisible(false);
        }}
        title="Replace Attachment"
      />
    </SafeAreaView>
  );
}
