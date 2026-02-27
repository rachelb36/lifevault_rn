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
  type StoredRecord,
} from "@/features/records/data/storage";
import { buildDisplayRows } from "@/features/records/forms/formDefs";
import {
  type Contact,
  getContactDisplayName,
  getContacts,
} from "@/features/contacts/data/storage";

type Props = {
  entityId: string;
  recordId: string;
  editRoutePath: string;
  entityParamKey: string;
};

export default function RecordDetailScreen({
  entityId,
  recordId,
  editRoutePath,
  entityParamKey,
}: Props) {
  const router = useRouter();

  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadRecord = useCallback(async () => {
    if (!entityId || !recordId) return;
    const [found, allContacts] = await Promise.all([
      getRecordById(entityId, recordId),
      getContacts(),
    ]);
    setRecord(found);
    setContacts(allContacts);
  }, [entityId, recordId]);

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
    return rows;
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
    </SafeAreaView>
  );
}
