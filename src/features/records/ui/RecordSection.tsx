// src/features/records/ui/RecordSection.tsx
import React, { useMemo, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronRight, Plus } from "lucide-react-native";

import { RecordCategory } from "@/domain/records/recordCategories";
import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { getTypesForCategory } from "@/domain/records/selectors/getTypesForCategory";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { formatDateLabel } from "@/shared/utils/date";
import RowWithSummary from "@/shared/ui/RowWithSummary";
import { buildExpirySummary, buildNamesSummary, notAddedSummary } from "@/shared/utils/summary";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import type { Attachment } from "@/shared/attachments/attachment.model";
export type { LifeVaultRecord } from "@/domain/records/record.model";

type Props = {
  category: RecordCategory;
  records: LifeVaultRecord[];
  onAdd: (recordType: RecordType, initialAttachment?: Attachment) => void;
  onEdit: (record: LifeVaultRecord) => void;
  onOpen: (
    record: LifeVaultRecord,
    initialAttachment?: Attachment,
    replaceExistingAttachment?: boolean
  ) => void;
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

const CATEGORY_DISPLAY_LABELS: Partial<Record<string, string>> = {
  PRIVATE_HEALTH: "Support Profile",
};

function getRecordData(record: LifeVaultRecord): Record<string, unknown> {
  return (record as any).data ?? (record as any).payload ?? {};
}

function getIdentificationSummary(recordType: RecordType, record: LifeVaultRecord | undefined): string {
  if (!record) return notAddedSummary();
  const data = getRecordData(record) as Record<string, unknown>;
  const fullName = String(data.fullName || data.childFullName || "").trim();

  if (recordType === RECORD_TYPES.DRIVERS_LICENSE) {
    const dlNumber = String(data.dlNumber || "").trim();
    if (fullName && dlNumber) return `${fullName} • ${dlNumber}`;
    if (fullName) return fullName;
    if (dlNumber) return dlNumber;
  }

  if (recordType === RECORD_TYPES.BIRTH_CERTIFICATE) {
    const dob = String(data.dateOfBirth || "").trim();
    if (fullName && dob) return `${fullName} • DOB ${formatDateLabel(dob, dob)}`;
    if (fullName) return fullName;
    if (dob) return `DOB ${formatDateLabel(dob, dob)}`;
  }

  if (recordType === RECORD_TYPES.SOCIAL_SECURITY_CARD) {
    const ssnRaw = String(data.ssn || "").replace(/\D/g, "");
    if (fullName && ssnRaw.length >= 4) return `${fullName} • ****${ssnRaw.slice(-4)}`;
    if (fullName) return fullName;
    if (ssnRaw.length >= 4) return `****${ssnRaw.slice(-4)}`;
  }

  const hasAttachment = (record.attachments || []).length > 0;
  if (fullName && hasAttachment) return `${fullName} • Document attached`;
  if (fullName) return fullName;
  if (hasAttachment) return "Document attached";

  return notAddedSummary();
}

export default function RecordSection({ category, records, onAdd, onEdit, onOpen }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [identSheetVisible, setIdentSheetVisible] = useState(false);
  const [selectedIdentType, setSelectedIdentType] = useState<RecordType | null>(null);

  const categoryRecordTypes = useMemo(() => getTypesForCategory(category), [category]);

  const categoryRecords = useMemo(() => {
    return records.filter((record) => getRecordMeta(record.recordType)?.category === category);
  }, [records, category]);

  const canAddType = (recordType: RecordType) => {
    // MULTI: always addable
    if (!isSingletonType(recordType)) return true;
    // SINGLE: only addable if not already present
    return !categoryRecords.some((r) => r.recordType === recordType);
  };

  const isTravelCategory = category === "TRAVEL";
  const isIdentificationCategory = category === "IDENTIFICATION";
  const isDirectSingletonCategory = (category === "PREFERENCES" || category === "SIZES") && categoryRecordTypes.length === 1;

  const travelTypes: RecordType[] = [
    RECORD_TYPES.PASSPORT,
    RECORD_TYPES.PASSPORT_CARD,
    RECORD_TYPES.LOYALTY_ACCOUNTS,
    RECORD_TYPES.TRAVEL_IDS,
  ].filter((type) => categoryRecordTypes.includes(type));

  const getLatestForType = (recordType: RecordType) =>
    categoryRecords
      .filter((r) => r.recordType === recordType)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];

  const getSummaryForType = (recordType: RecordType) => {
    const matching = categoryRecords.filter((r) => r.recordType === recordType);
    if (matching.length === 0) return notAddedSummary();

    const latest = matching
      .slice()
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];
    const data = getRecordData(latest);

    if (recordType === RECORD_TYPES.PASSPORT) {
      return buildExpirySummary({
        country: String((data as any).issuingCountry || (data as any).nationality || ""),
        expirationDate: String((data as any).expirationDate || ""),
      });
    }

    if (recordType === RECORD_TYPES.PASSPORT_CARD) {
      return buildExpirySummary({
        country: String((data as any).issuingCountry || ""),
        expirationDate: String((data as any).expirationDate || ""),
      });
    }

    if (recordType === RECORD_TYPES.LOYALTY_ACCOUNTS) {
      const names = matching.flatMap((record) => {
        const payload = getRecordData(record) as any;
        const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
        return accounts.map((a: any) => String(a.providerName || a.programType || "").trim()).filter(Boolean);
      });
      return buildNamesSummary(names, 3);
    }

    if (recordType === RECORD_TYPES.TRAVEL_IDS) {
      const names = matching.flatMap((record) => {
        const payload = getRecordData(record) as any;
        const ids = Array.isArray(payload.travelIds) ? payload.travelIds : [];
        return ids.map((i: any) => String(i.type || "").trim()).filter(Boolean);
      });
      return buildNamesSummary(names, 3);
    }

    return notAddedSummary();
  };

  const openType = (recordType: RecordType) => {
    const existing = getLatestForType(recordType);
    if (existing) {
      onOpen(existing);
      return;
    }
    onAdd(recordType);
  };

  const openIdentificationSheet = (recordType: RecordType) => {
    setSelectedIdentType(recordType);
    setIdentSheetVisible(true);
  };

  const onIdentificationPicked = (attachment: Attachment) => {
    if (!selectedIdentType) return;
    const existing = getLatestForType(selectedIdentType);
    if (existing) {
      onOpen(existing, attachment, true);
    } else {
      onAdd(selectedIdentType, attachment);
    }
    setIdentSheetVisible(false);
    setSelectedIdentType(null);
  };

  const onIdentificationManual = () => {
    if (!selectedIdentType) return;
    const existing = getLatestForType(selectedIdentType);
    if (existing) {
      onOpen(existing);
    } else {
      onAdd(selectedIdentType);
    }
    setIdentSheetVisible(false);
    setSelectedIdentType(null);
  };

  const handleSectionHeaderPress = () => {
    if (isDirectSingletonCategory) {
      const singletonType = categoryRecordTypes[0];
      const existing = getLatestForType(singletonType);
      if (existing) onOpen(existing);
      else onAdd(singletonType);
      return;
    }
    setExpanded((v) => !v);
  };

  return (
    <View className="mb-3 rounded-2xl border border-border bg-card">
      {/* Section header (tap to expand/collapse) */}
      <Pressable
        onPress={handleSectionHeaderPress}
        className="flex-row items-center justify-between px-4 py-4"
        hitSlop={8}
      >
        <Text className="text-base font-semibold text-foreground">
          {CATEGORY_DISPLAY_LABELS[category] ?? labelize(category)}
        </Text>

        {!isDirectSingletonCategory && expanded ? (
          <ChevronDown size={18} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={18} className="text-muted-foreground" />
        )}
      </Pressable>

      {/* Expanded content */}
      {!isDirectSingletonCategory && expanded && (
        <View className="px-4 pb-4">
          {isTravelCategory ? (
            <View className="gap-2">
              {travelTypes.map((recordType) => {
                const title = getRecordMeta(recordType)?.label ?? labelize(recordType);
                return (
                  <RowWithSummary
                    key={recordType}
                    title={title}
                    summary={getSummaryForType(recordType)}
                    onPress={() => openType(recordType)}
                  />
                );
              })}
            </View>
          ) : isIdentificationCategory ? (
            <View className="gap-2">
              {categoryRecordTypes.map((recordType) => {
                const title = getRecordMeta(recordType)?.label ?? labelize(recordType);
                const latest = getLatestForType(recordType);
                const summary = getIdentificationSummary(recordType, latest);
                return (
                  <RowWithSummary
                    key={recordType}
                    title={title}
                    summary={summary}
                    onPress={() => {
                      if (latest) {
                        onOpen(latest);
                        return;
                      }
                      openIdentificationSheet(recordType);
                    }}
                  />
                );
              })}
            </View>
          ) : (
            <>
          {/* Add “pills” */}
          {categoryRecordTypes.length > 0 && (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {categoryRecordTypes.map((recordType) => {
                const disabled = !canAddType(recordType);
                const label = getRecordMeta(recordType)?.label ?? labelize(recordType);

                return (
                  <TouchableOpacity
                    key={recordType}
                    onPress={() => onAdd(recordType)}
                    disabled={disabled}
                    activeOpacity={0.85}
                    className={`flex-row items-center rounded-full px-3 py-2 ${
                      disabled ? "bg-muted" : "bg-primary/10"
                    }`}
                  >
                    <Plus
                      size={12}
                      className={disabled ? "text-muted-foreground" : "text-primary"}
                    />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        disabled ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Records list
              Per your request: when empty, do NOT show “No records yet.”
              Just show pills above (expanded-only) and otherwise nothing here. */}
          {categoryRecords.length > 0 && (
            <View>
              {categoryRecords.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  onPress={() => onOpen(record)}
                  onLongPress={() => onEdit(record)}
                  activeOpacity={0.85}
                  className="mb-2 rounded-xl border border-border bg-background px-3 py-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {record.title || getRecordMeta(record.recordType)?.label || "Record"}
                  </Text>

                  {/* Keep “updated at” small + subtle */}
                  {record.updatedAt ? (
                    <Text className="mt-1 text-[11px] text-muted-foreground">
                      Updated {formatDateLabel(record.updatedAt, "—")}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
            </>
          )}
        </View>
      )}
      <AttachmentSourceSheet
        visible={identSheetVisible}
        onClose={() => {
          setIdentSheetVisible(false);
          setSelectedIdentType(null);
        }}
        onPicked={onIdentificationPicked}
        onManual={onIdentificationManual}
        title={selectedIdentType ? `${getRecordMeta(selectedIdentType)?.label ?? "Record"} Attachment` : "Add Attachment"}
      />
    </View>
  );
}
