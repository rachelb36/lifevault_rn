/**
 * RecordDetailScreen — Shared read-only detail view for a single record.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import {
  deleteRecordForEntity,
  getRecordById,
  upsertRecordForEntity,
  type StoredRecord,
} from "@/features/records/data/storage";
import { buildDisplayRows } from "@/features/records/forms/formDefs";
import {
  type Contact,
  getContactDisplayName,
  getContacts,
} from "@/features/contacts/data/storage";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import type { Attachment } from "@/shared/attachments/attachment.model";
import {
  createDocumentFromPickerResult,
  getDocument,
  openDocument,
  shareDocument,
  type VaultDocument,
} from "@/features/documents/data/documentsStorage";
import {
  linkDocumentToRecord,
  normalizeAttachmentRefs,
  unlinkDocumentFromRecord,
} from "@/domain/documents/attachments";

type Props = {
  entityId: string;
  entityType: "person" | "pet";
  recordId: string;
  editRoutePath: string;
  entityParamKey: string;
};

export default function RecordDetailScreen({
  entityId,
  entityType,
  recordId,
  editRoutePath,
  entityParamKey,
}: Props) {
  const router = useRouter();

  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [replaceSheetVisible, setReplaceSheetVisible] = useState(false);
  const [replaceTargetDocumentId, setReplaceTargetDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, VaultDocument>>({});

  const hydrateDocuments = useCallback(async (currentRecord: StoredRecord | null) => {
    if (!currentRecord) {
      setDocuments({});
      return;
    }
    const refs = normalizeAttachmentRefs(currentRecord.attachments);
    const ids = [...new Set(refs.map((ref) => ref.documentId).filter(Boolean))];
    const pairs = await Promise.all(
      ids.map(async (id) => [id, await getDocument(id)] as const),
    );
    const next: Record<string, VaultDocument> = {};
    pairs.forEach(([id, doc]) => {
      if (doc) next[id] = doc;
    });
    setDocuments(next);
  }, []);

  const loadRecord = useCallback(async () => {
    if (!entityId || !recordId) return;
    const [found, allContacts] = await Promise.all([
      getRecordById(entityId, recordId),
      getContacts(),
    ]);
    setRecord(found);
    setContacts(allContacts);
    await hydrateDocuments(found);
  }, [entityId, recordId, hydrateDocuments]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await loadRecord();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loadRecord]);

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
      if (!columnOrLabel.toLowerCase().includes("contact")) return value;
      const found = contactById.get(value);
      if (!found) return `Unknown contact (${value})`;
      const display = getContactDisplayName(found) || "Unnamed contact";
      return found.phone ? `${display} • ${found.phone}` : display;
    },
    [contactById],
  );

  const displayRows = useMemo(() => {
    if (!record) return [];
    const rows = buildDisplayRows(record.recordType, record.payload ?? record.data);
    if (rows.length > 0) return rows;

    const attachmentCount = normalizeAttachmentRefs(record.attachments).length;
    if (attachmentCount > 0) {
      return [{ label: "Attachments", value: `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}` }];
    }
    return [];
  }, [record]);

  const handleDelete = () => {
    if (!record) return;
    Alert.alert(
      "Delete record?",
      "This action cannot be undone. Are you sure you want to delete this record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRecordForEntity(entityId, record.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleViewDocument = useCallback(async (documentId: string) => {
    try {
      await openDocument(documentId);
    } catch {
      Alert.alert("Cannot open file", "This document cannot be opened on this device.");
      return;
    }
  }, []);

  const handleShareDocument = useCallback(async (documentId: string) => {
    try {
      await shareDocument(documentId);
    } catch (error) {
      Alert.alert("Share failed", error instanceof Error ? error.message : "Could not share document.");
    }
  }, []);

  const navigateToEdit = useCallback(
    (params?: Record<string, string>) => {
      if (!record) return;
      router.push({
        pathname: editRoutePath,
        params: {
          [entityParamKey]: entityId,
          recordId: record.id,
          ...params,
        },
      } as any);
    },
    [entityId, record, router, editRoutePath, entityParamKey],
  );

  const saveRecordWithRefs = useCallback(
    async (nextRefs: ReturnType<typeof normalizeAttachmentRefs>) => {
      if (!record) return;
      const updated: StoredRecord = {
        ...record,
        attachments: nextRefs,
        updatedAt: new Date().toISOString(),
      };
      await upsertRecordForEntity(entityId, updated);
      await loadRecord();
    },
    [entityId, record, loadRecord],
  );

  const handleAddPicked = useCallback(
    async (attachment: Attachment) => {
      if (!record) return;
      const doc = await createDocumentFromPickerResult(
        {
          uri: attachment.uri,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          source: attachment.source,
        },
        {
          title: record.title || label,
          tags: [String(record.recordType || "").toLowerCase(), entityType],
        },
      );

      const refs = linkDocumentToRecord({ attachments: normalizeAttachmentRefs(record.attachments) }, doc.id)
        .attachments || [];
      await saveRecordWithRefs(refs);
      setAddSheetVisible(false);
    },
    [record, label, entityType, saveRecordWithRefs],
  );

  const handleReplacePicked = useCallback(
    async (attachment: Attachment) => {
      if (!record || !replaceTargetDocumentId) return;

      const doc = await createDocumentFromPickerResult(
        {
          uri: attachment.uri,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          source: attachment.source,
        },
        {
          title: record.title || label,
          tags: [String(record.recordType || "").toLowerCase(), entityType],
        },
      );

      const removed = unlinkDocumentFromRecord(
        { attachments: normalizeAttachmentRefs(record.attachments) },
        replaceTargetDocumentId,
      ).attachments || [];
      const refs = linkDocumentToRecord({ attachments: removed }, doc.id).attachments || [];
      await saveRecordWithRefs(refs);
      setReplaceSheetVisible(false);
      setReplaceTargetDocumentId(null);
    },
    [record, replaceTargetDocumentId, label, entityType, saveRecordWithRefs],
  );

  const handleRemoveDocument = useCallback(
    async (documentId: string) => {
      if (!record) return;
      const refs = unlinkDocumentFromRecord(
        { attachments: normalizeAttachmentRefs(record.attachments) },
        documentId,
      ).attachments || [];
      await saveRecordWithRefs(refs);
    },
    [record, saveRecordWithRefs],
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
            {displayRows.length === 0 ? (
              <Text className="text-xs text-muted-foreground">No details saved yet.</Text>
            ) : (
              <View className="gap-3">
                {displayRows.map((row, idx) => (
                  <View key={`${row.label}-${idx}`}>
                    <Text className="text-xs font-medium text-muted-foreground">{row.label}</Text>
                    <Text className="mt-0.5 text-sm text-foreground">
                      {resolveMaybeContact(row.label, row.value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="mt-4 rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">Documents</Text>
              <TouchableOpacity
                onPress={() => setAddSheetVisible(true)}
                className="px-3 py-1 rounded-lg bg-muted"
                activeOpacity={0.85}
              >
                <Text className="text-xs font-medium text-foreground">Add Document</Text>
              </TouchableOpacity>
            </View>

            {normalizeAttachmentRefs(record.attachments).length === 0 ? (
              <Text className="text-xs text-muted-foreground">No documents.</Text>
            ) : (
              <View className="gap-2">
                {normalizeAttachmentRefs(record.attachments).map((ref) => {
                  const doc = documents[ref.documentId];
                  return (
                    <View
                      key={ref.documentId}
                      className="rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <Text className="text-sm text-foreground">
                        {doc?.title || doc?.fileName || ref.label || "Document"}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {doc?.mimeType || "file"}
                      </Text>

                      <View className="flex-row flex-wrap gap-2 mt-3">
                        <TouchableOpacity
                          onPress={() => handleViewDocument(ref.documentId)}
                          className="px-3 py-1.5 rounded-lg bg-muted"
                          activeOpacity={0.85}
                        >
                          <Text className="text-xs font-medium text-foreground">View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleShareDocument(ref.documentId)}
                          className="px-3 py-1.5 rounded-lg bg-muted"
                          activeOpacity={0.85}
                        >
                          <Text className="text-xs font-medium text-foreground">Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setReplaceTargetDocumentId(ref.documentId);
                            setReplaceSheetVisible(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-muted"
                          activeOpacity={0.85}
                        >
                          <Text className="text-xs font-medium text-foreground">Replace</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveDocument(ref.documentId)}
                          className="px-3 py-1.5 rounded-lg bg-destructive/10"
                          activeOpacity={0.85}
                        >
                          <Text className="text-xs font-medium text-destructive">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={() => navigateToEdit()}
              className="flex-row items-center justify-center rounded-xl bg-primary py-4"
              activeOpacity={0.85}
            >
              <Pencil size={16} className="text-primary-foreground" />
              <Text className="ml-2 font-semibold text-primary-foreground">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center rounded-xl border border-destructive/40 py-4"
              activeOpacity={0.85}
            >
              <Trash2 size={16} className="text-destructive" />
              <Text className="ml-2 font-semibold text-destructive">Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <AttachmentSourceSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onPicked={handleAddPicked}
        onManual={() => setAddSheetVisible(false)}
        title="Add Document"
      />
      <AttachmentSourceSheet
        visible={replaceSheetVisible}
        onClose={() => {
          setReplaceSheetVisible(false);
          setReplaceTargetDocumentId(null);
        }}
        onPicked={handleReplacePicked}
        onManual={() => {
          setReplaceSheetVisible(false);
          setReplaceTargetDocumentId(null);
        }}
        title="Replace Document"
      />
    </SafeAreaView>
  );
}
