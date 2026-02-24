import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  clearOcr,
  deleteDocument,
  getDocument,
  listLinkedRecordsForDocument,
  openDocument,
  runOcr,
  shareDocument,
  type LinkedRecordRef,
  type VaultDocument,
} from "@/features/documents/data/documentsStorage";
import { getRecordById, upsertRecordForEntity } from "@/features/records/data/storage";

function parseDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function extractSimpleFieldsFromOcr(text: string): Record<string, unknown> {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const out: Record<string, unknown> = {};

  const passportLine = lines.find((line) => line.toLowerCase().includes("passport"));
  if (passportLine) out.title = "Passport (OCR)";

  const dl = lines.find((line) => /dl|driver|license/i.test(line));
  if (dl) out.title = "Driver's License (OCR)";

  const numberLine = lines.find((line) => /\b[0-9A-Z]{6,}\b/.test(line.replace(/\s/g, "")));
  if (numberLine) out.ocrDocumentNumber = numberLine;

  const dateLike = lines.find((line) => /\d{2}[/-]\d{2}[/-]\d{2,4}/.test(line));
  if (dateLike) out.ocrDetectedDate = dateLike;

  out.ocrRawText = text;
  out.ocrUnverified = true;
  return out;
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const did = Array.isArray(documentId) ? documentId[0] : documentId;

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<VaultDocument | null>(null);
  const [links, setLinks] = useState<LinkedRecordRef[]>([]);

  const refresh = useCallback(async () => {
    if (!did) return;
    setLoading(true);
    try {
      const [nextDoc, nextLinks] = await Promise.all([
        getDocument(did),
        listLinkedRecordsForDocument(did),
      ]);
      setDoc(nextDoc);
      setLinks(nextLinks);
    } finally {
      setLoading(false);
    }
  }, [did]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canRunOcr = useMemo(() => {
    return Boolean(doc?.mimeType?.startsWith("image/") || doc?.mimeType === "application/pdf");
  }, [doc?.mimeType]);

  const openDoc = async () => {
    if (!doc) return;
    try {
      await openDocument(doc.id);
    } catch (error) {
      Alert.alert(
        "Cannot open file",
        error instanceof Error ? error.message : "This document cannot be opened on this device.",
      );
    }
  };

  const applyOcrToFirstLinkedRecord = async () => {
    if (!doc?.ocr?.text || links.length === 0) {
      Alert.alert("Unavailable", "No OCR text or linked record found.");
      return;
    }

    const target = links[0];
    const record = await getRecordById(target.entityId, target.recordId);
    if (!record) {
      Alert.alert("Not found", "Linked record could not be loaded.");
      return;
    }

    const patch = extractSimpleFieldsFromOcr(doc.ocr.text);
    const payload = {
      ...(record.payload || record.data || {}),
      ...patch,
    };

    await upsertRecordForEntity(target.entityId, {
      ...record,
      payload,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Applied", "OCR data applied to linked record as unverified fields.");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 border-b border-border flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-muted-foreground">Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Document</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      ) : !doc ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">Document not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Text className="text-2xl font-bold text-foreground">{doc.title || doc.fileName || "Untitled Document"}</Text>
          <Text className="text-sm text-muted-foreground mt-1">{doc.mimeType}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Created {parseDate(doc.createdAt)}</Text>

          <View className="mt-4 gap-2">
            <TouchableOpacity onPress={openDoc} className="bg-primary rounded-xl py-3 items-center" activeOpacity={0.85}>
              <Text className="text-primary-foreground font-semibold">View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                try {
                  await shareDocument(doc.id);
                } catch (error) {
                  Alert.alert("Share failed", error instanceof Error ? error.message : "Could not share");
                }
              }}
              className="border border-border rounded-xl py-3 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-foreground font-semibold">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                Alert.alert("Delete document?", "This removes the document from the central hub.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await deleteDocument(doc.id);
                      router.back();
                    },
                  },
                ]);
              }}
              className="border border-destructive/40 rounded-xl py-3 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-destructive font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">OCR</Text>
            {doc.ocr?.status ? (
              <>
                <Text className="text-xs text-muted-foreground">Status: {doc.ocr.status}</Text>
                {doc.ocr.error ? <Text className="text-xs text-destructive mt-1">{doc.ocr.error}</Text> : null}
                {doc.ocr.text ? (
                  <Text className="text-xs text-foreground mt-2">{doc.ocr.text.slice(0, 1200)}</Text>
                ) : null}
              </>
            ) : (
              <Text className="text-xs text-muted-foreground">No OCR result yet.</Text>
            )}

            <View className="flex-row flex-wrap gap-2 mt-3">
              <TouchableOpacity
                disabled={!canRunOcr}
                onPress={async () => {
                  await runOcr(doc.id);
                  await refresh();
                }}
                className={`px-3 py-1.5 rounded-lg ${canRunOcr ? "bg-muted" : "bg-muted/40"}`}
                activeOpacity={0.85}
              >
                <Text className="text-xs text-foreground font-medium">Run OCR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await clearOcr(doc.id);
                  await refresh();
                }}
                className="px-3 py-1.5 rounded-lg bg-muted"
                activeOpacity={0.85}
              >
                <Text className="text-xs text-foreground font-medium">Clear OCR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyOcrToFirstLinkedRecord}
                className="px-3 py-1.5 rounded-lg bg-muted"
                activeOpacity={0.85}
              >
                <Text className="text-xs text-foreground font-medium">Apply extracted details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-6 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Linked records</Text>
            {links.length === 0 ? (
              <Text className="text-xs text-muted-foreground">No linked records.</Text>
            ) : (
              <View className="gap-2">
                {links.map((link) => (
                  <TouchableOpacity
                    key={`${link.entityId}-${link.recordId}`}
                    onPress={() => {
                      const isPet = link.recordType.startsWith("PET_");
                      router.push({
                        pathname: isPet
                          ? "/(vault)/pets/[petId]/records/[recordId]"
                          : "/(vault)/people/[personId]/records/[recordId]",
                        params: isPet
                          ? { petId: link.entityId, recordId: link.recordId }
                          : { personId: link.entityId, recordId: link.recordId },
                      } as any);
                    }}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    activeOpacity={0.85}
                  >
                    <Text className="text-sm text-foreground">{link.title || link.recordType}</Text>
                    <Text className="text-xs text-muted-foreground">{link.recordType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
