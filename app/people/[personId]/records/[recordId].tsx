import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getRecordMeta } from "@/lib/records/getRecordMeta";
import {
  deleteRecordForEntity,
  getRecordById,
  type StoredRecord,
} from "@/features/records/data/storage";
import { buildDisplayRows } from "@/features/records/forms/formDefs";

export default function PersonRecordDetailScreen() {
  const router = useRouter();
  const { personId, recordId } = useLocalSearchParams<{ personId?: string; recordId?: string }>();

  const pid = personId ? String(personId) : "";
  const rid = recordId ? String(recordId) : "";

  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!pid || !rid) return;
        const found = await getRecordById(pid, rid);
        if (!cancelled) setRecord(found);
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

  const displayRows = useMemo(() => {
    if (!record) return [];
    return buildDisplayRows(record.recordType, record.data);
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
          <Text className="text-muted-foreground">Loading…</Text>
        </View>
      ) : !record ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground font-semibold">Record not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <Text className="text-2xl font-bold text-foreground">
            {record.title || label}
          </Text>
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
                    <Text className="mt-0.5 text-sm text-foreground">{row.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/people/[personId]/records/[recordId]/edit",
                  params: { personId: pid, recordId: record.id },
                } as any)
              }
              className="flex-row items-center justify-center rounded-xl bg-primary py-4"
            >
              <Pencil size={16} className="text-primary-foreground" />
              <Text className="ml-2 font-semibold text-primary-foreground">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center rounded-xl border border-destructive/40 py-4"
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
