/**
 * RecordFormScreen — Shared form component for adding and editing records.
 *
 * Unified flow:
 * - "Scan or Upload <RecordType>" action at top
 * - Structured fields always visible below
 * - Attached documents represented by documentId refs
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import {
  linkDocumentToRecord,
  normalizeAttachmentRefs,
  unlinkDocumentFromRecord,
  type RecordAttachmentRef,
} from "@/domain/documents/attachments";
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
import {
  createDocumentFromPickerResult,
  getDocument,
  openDocument,
  runOcr,
  shareDocument,
  type VaultDocument,
} from "@/features/documents/data/documentsStorage";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import type { Attachment } from "@/shared/attachments/attachment.model";

type Props = {
  mode: "add" | "edit";
  entityId: string;
  entityType: "person" | "pet";
  recordId?: string;
  recordType?: string;
  initialAttachmentUri?: string;
  initialAttachmentName?: string;
  initialAttachmentMime?: string;
  initialAttachmentSource?: Attachment["source"];
  replaceAttachment?: string;
  editRoutePath: string;
  entityParamKey: string;
  entityMeta?: { kind?: string };
};

function mkId() {
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function supportsRecordDocuments(recordType?: RecordType): boolean {
  if (!recordType) return false;
  return new Set<RecordType>([
    RECORD_TYPES.DRIVERS_LICENSE,
    RECORD_TYPES.PASSPORT,
    RECORD_TYPES.PASSPORT_CARD,
    RECORD_TYPES.BIRTH_CERTIFICATE,
    RECORD_TYPES.SOCIAL_SECURITY_CARD,
    RECORD_TYPES.MEDICAL_INSURANCE,
    RECORD_TYPES.LEGAL_PROPERTY_DOCUMENT,
    RECORD_TYPES.OTHER_DOCUMENT,
    RECORD_TYPES.EDUCATION_RECORD,
    RECORD_TYPES.PET_DOCUMENT,
    RECORD_TYPES.PET_INSURANCE,
  ]).has(recordType);
}

function findLineValue(text: string, labels: string[]): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    const match = labels.find((label) => lower.includes(label.toLowerCase()));
    if (!match) continue;

    const idx = line.toLowerCase().indexOf(match.toLowerCase());
    const tail = line.slice(idx + match.length).replace(/^[:\-.\s]+/, "").trim();
    if (tail) return tail;
  }
  return "";
}

function applyOcrPrefill(
  recordType: RecordType | undefined,
  currentPayload: Record<string, unknown>,
  ocrText: string,
): { nextPayload: Record<string, unknown>; filledCount: number } {
  if (!recordType || !ocrText.trim()) {
    return { nextPayload: currentPayload, filledCount: 0 };
  }

  const next = { ...currentPayload };
  let filled = 0;
  const setIfEmpty = (key: string, value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const existing = String((next as Record<string, unknown>)[key] || "").trim();
    if (existing) return;
    (next as Record<string, unknown>)[key] = normalized;
    filled += 1;
  };

  if (recordType === RECORD_TYPES.MEDICAL_INSURANCE) {
    setIfEmpty("insurerName", findLineValue(ocrText, ["insurer", "insurance company", "carrier"]));
    setIfEmpty("memberName", findLineValue(ocrText, ["member name", "subscriber", "insured"]));
    setIfEmpty("memberId", findLineValue(ocrText, ["member id", "id number", "subscriber id"]));
    setIfEmpty("groupNumber", findLineValue(ocrText, ["group", "group number"]));
    setIfEmpty("planName", findLineValue(ocrText, ["plan", "plan name"]));
    setIfEmpty("customerServicePhone", findLineValue(ocrText, ["customer service", "service phone", "phone"]));
    return { nextPayload: next, filledCount: filled };
  }

  if (recordType === RECORD_TYPES.DRIVERS_LICENSE) {
    setIfEmpty("fullName", findLineValue(ocrText, ["name"]));
    setIfEmpty("dlNumber", findLineValue(ocrText, ["dl", "license", "lic #", "license no"]));
    setIfEmpty("dateOfBirth", findLineValue(ocrText, ["dob", "birth"]));
    setIfEmpty("expirationDate", findLineValue(ocrText, ["exp", "expires", "expiration"]));
    return { nextPayload: next, filledCount: filled };
  }

  if (recordType === RECORD_TYPES.PASSPORT || recordType === RECORD_TYPES.PASSPORT_CARD) {
    setIfEmpty("fullName", findLineValue(ocrText, ["name", "surname"]));
    setIfEmpty("passportNumber", findLineValue(ocrText, ["passport no", "passport number"]));
    setIfEmpty("passportCardNumber", findLineValue(ocrText, ["passport card number"]));
    setIfEmpty("dateOfBirth", findLineValue(ocrText, ["dob", "birth"]));
    setIfEmpty("expirationDate", findLineValue(ocrText, ["exp", "expiration", "expires"]));
    return { nextPayload: next, filledCount: filled };
  }

  return { nextPayload: next, filledCount: 0 };
}

async function createDocumentFromInitialParams(input: {
  uri?: string;
  fileName?: string;
  mimeType?: string;
  source?: Attachment["source"];
  title?: string;
  tags?: string[];
}): Promise<VaultDocument | null> {
  if (!input.uri) return null;
  return createDocumentFromPickerResult(
    {
      uri: input.uri,
      fileName: input.fileName,
      mimeType: input.mimeType,
      source: input.source,
    },
    { title: input.title, tags: input.tags },
  );
}

export default function RecordFormScreen({
  mode,
  entityId,
  entityType,
  recordId,
  recordType,
  initialAttachmentUri,
  initialAttachmentName,
  initialAttachmentMime,
  initialAttachmentSource,
  replaceAttachment,
  editRoutePath,
  entityParamKey,
  entityMeta,
}: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [attachmentRefs, setAttachmentRefs] = useState<RecordAttachmentRef[]>([]);
  const [documents, setDocuments] = useState<Record<string, VaultDocument>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [replaceSheetVisible, setReplaceSheetVisible] = useState(false);
  const [replaceTargetDocumentId, setReplaceTargetDocumentId] = useState<string | null>(null);

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
  const canAttachDocument = supportsRecordDocuments(rtype);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ payload, attachments: attachmentRefs }),
    [payload, attachmentRefs],
  );

  const hasUnsavedChanges = initialSnapshot.length > 0 && currentSnapshot !== initialSnapshot;

  const hydrateDocuments = useCallback(async (refs: RecordAttachmentRef[]) => {
    const ids = [...new Set(refs.map((ref) => ref.documentId).filter(Boolean))];
    if (ids.length === 0) {
      setDocuments({});
      return;
    }

    const pairs = await Promise.all(
      ids.map(async (id) => [id, await getDocument(id)] as const),
    );

    const next: Record<string, VaultDocument> = {};
    pairs.forEach(([id, doc]) => {
      if (doc) next[id] = doc;
    });
    setDocuments(next);
  }, []);

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

          const shouldReplace = String(replaceAttachment || "").toLowerCase() === "true";
          const seedDoc = await createDocumentFromInitialParams({
            uri: initialAttachmentUri,
            fileName: initialAttachmentName,
            mimeType: initialAttachmentMime,
            source: initialAttachmentSource,
            title: found.title || getRecordMeta(found.recordType)?.label,
            tags: [String(found.recordType || "").toLowerCase()],
          });

          const nextPayload = found.payload ?? found.data ?? {};
          let nextRefs = normalizeAttachmentRefs(found.attachments);
          if (seedDoc) {
            if (shouldReplace) nextRefs = [];
            nextRefs = linkDocumentToRecord({ attachments: nextRefs }, seedDoc.id).attachments || [];
          }

          if (!cancelled) {
            setRecord(found);
            setPayload(nextPayload);
            setAttachmentRefs(nextRefs);
            await hydrateDocuments(nextRefs);
            setInitialSnapshot(JSON.stringify({ payload: nextPayload, attachments: nextRefs }));
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
          const seedDoc = await createDocumentFromInitialParams({
            uri: initialAttachmentUri,
            fileName: initialAttachmentName,
            mimeType: initialAttachmentMime,
            source: initialAttachmentSource,
            title: getRecordMeta(rt)?.label,
            tags: [String(rt || "").toLowerCase()],
          });

          const nextRefs = seedDoc
            ? linkDocumentToRecord({ attachments: [] as RecordAttachmentRef[] }, seedDoc.id).attachments || []
            : [];

          if (!cancelled) {
            setPayload(initialPayload);
            setAttachmentRefs(nextRefs);
            await hydrateDocuments(nextRefs);
            setInitialSnapshot(JSON.stringify({ payload: initialPayload, attachments: nextRefs }));
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
    initialAttachmentUri,
    initialAttachmentName,
    initialAttachmentMime,
    initialAttachmentSource,
    replaceAttachment,
    hydrateDocuments,
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

  const handleDocumentPicked = useCallback(
    async (attachment: Attachment, options?: { replaceDocumentId?: string | null }) => {
      const doc = await createDocumentFromPickerResult(
        {
          uri: attachment.uri,
          mimeType: attachment.mimeType,
          fileName: attachment.fileName,
          source: attachment.source,
        },
        {
          title: meta?.label,
          tags: [String(rtype || "").toLowerCase(), entityType],
        },
      );

      setDocuments((prev) => ({ ...prev, [doc.id]: doc }));
      setAttachmentRefs((prev) => {
        let next = prev;
        if (options?.replaceDocumentId) {
          next = unlinkDocumentFromRecord({ attachments: next }, options.replaceDocumentId).attachments || [];
        }
        next = linkDocumentToRecord({ attachments: next }, doc.id).attachments || [];
        return next;
      });

      setSaveLabel("idle");
      if (validationErrors.length > 0) setValidationErrors([]);

      try {
        const ocrDoc = await runOcr(doc.id);
        if (ocrDoc.ocr?.status === "READY" && ocrDoc.ocr.text) {
          const { nextPayload, filledCount } = applyOcrPrefill(rtype, payload, ocrDoc.ocr.text);
          if (filledCount > 0) {
            setPayload(nextPayload);
            Alert.alert(
              "Document attached",
              `OCR extracted ${filledCount} field${filledCount === 1 ? "" : "s"}. Please review before saving.`,
            );
          } else {
            Alert.alert("Document attached", "OCR ran, but no matching fields were found to prefill.");
          }
          return;
        }

        if (ocrDoc.ocr?.status === "UNREADABLE") {
          Alert.alert("Document attached", "OCR ran but could not read text from this image.");
          return;
        }

        Alert.alert(
          "Document attached",
          ocrDoc.ocr?.error || "OCR is unavailable for this file type.",
        );
      } catch (error) {
        Alert.alert(
          "Document attached",
          error instanceof Error ? error.message : "OCR failed. You can still fill the form manually.",
        );
      }
    },
    [meta?.label, rtype, entityType, validationErrors.length, payload],
  );

  const handleViewDocument = useCallback(async (documentId: string) => {
    try {
      await openDocument(documentId);
    } catch (error) {
      Alert.alert(
        "Cannot open file",
        error instanceof Error ? error.message : "This document cannot be opened on this device.",
      );
    }
  }, []);

  const handleShareDocument = useCallback(async (documentId: string) => {
    try {
      await shareDocument(documentId);
    } catch (error) {
      Alert.alert("Share failed", error instanceof Error ? error.message : "Could not share document.");
    }
  }, []);

  const handleRemoveDocument = (documentId: string) => {
    setAttachmentRefs((prev) => unlinkDocumentFromRecord({ attachments: prev }, documentId).attachments || []);
    setSaveLabel("idle");
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
        attachments: attachmentRefs,
        updatedAt: new Date().toISOString(),
      });
      Alert.alert("Saved", "Record updated.");
    } else {
      await upsertRecordForEntity(entityId, {
        id: mkId(),
        recordType: rtype,
        title: finalTitle,
        payload,
        attachments: attachmentRefs,
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
            {canAttachDocument && (
              <View className="mt-4">
                <TouchableOpacity
                  onPress={() => setUploadSheetVisible(true)}
                  className="rounded-xl bg-primary py-3 px-4 items-center"
                  activeOpacity={0.85}
                >
                  <Text className="text-primary-foreground font-semibold">
                    {`Scan or Upload ${meta?.label ?? "Document"}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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

            {canAttachDocument ? (
              <View className="mt-4 rounded-xl border border-border bg-card p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-foreground">Attached Document{attachmentRefs.length === 1 ? "" : "s"}</Text>
                  <TouchableOpacity
                    onPress={() => setUploadSheetVisible(true)}
                    className="px-3 py-1 rounded-lg bg-muted"
                    activeOpacity={0.85}
                  >
                    <Text className="text-xs text-foreground font-medium">Add Document</Text>
                  </TouchableOpacity>
                </View>

                {attachmentRefs.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No document attached yet.</Text>
                ) : (
                  <View className="gap-2">
                    {attachmentRefs.map((ref) => {
                      const doc = documents[ref.documentId];
                      const label = doc?.title || doc?.fileName || ref.label || "Document";
                      return (
                        <View key={ref.documentId} className="rounded-lg border border-border bg-background px-3 py-3">
                          <Text className="text-sm font-medium text-foreground">{label}</Text>
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
            ) : null}

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

          <AttachmentSourceSheet
            visible={uploadSheetVisible}
            onClose={() => setUploadSheetVisible(false)}
            onPicked={async (attachment) => {
              await handleDocumentPicked(attachment);
              setUploadSheetVisible(false);
            }}
            onManual={() => {
              setUploadSheetVisible(false);
            }}
            title={`Scan or Upload ${meta?.label ?? "Document"}`}
          />

          <AttachmentSourceSheet
            visible={replaceSheetVisible}
            onClose={() => {
              setReplaceSheetVisible(false);
              setReplaceTargetDocumentId(null);
            }}
            onPicked={async (attachment) => {
              await handleDocumentPicked(attachment, {
                replaceDocumentId: replaceTargetDocumentId,
              });
              setReplaceSheetVisible(false);
              setReplaceTargetDocumentId(null);
            }}
            onManual={() => {
              setReplaceSheetVisible(false);
              setReplaceTargetDocumentId(null);
            }}
            title="Replace Document"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
