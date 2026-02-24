/**
 * SectionRecordRows — category accordion with record rows.
 *
 * Interaction pattern:
 * Profile -> Category -> Record Detail -> Edit
 */
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";

import { RecordCategory } from "@/domain/records/recordCategories";
import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { getTypesForCategory } from "@/domain/records/selectors/getTypesForCategory";
import { formatDateLabel } from "@/shared/utils/date";
import { getRecordData } from "@/shared/utils/recordData";
import RowWithSummary from "@/shared/ui/RowWithSummary";
import { notAddedSummary } from "@/shared/utils/summary";

function buildRecordSummary(recordType: RecordType, record: LifeVaultRecord): string {
  const data = getRecordData(record);

  if (recordType === RECORD_TYPES.DRIVERS_LICENSE) {
    const name = String(data.fullName || "").trim();
    const dl = String(data.dlNumber || "").trim();
    return [name, dl].filter(Boolean).join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.PASSPORT || recordType === RECORD_TYPES.PASSPORT_CARD) {
    const country = String((data as any).issuingCountry || (data as any).nationality || "").trim();
    const exp = String((data as any).expirationDate || "").trim();
    const parts: string[] = [];
    if (country) parts.push(country);
    if (exp) parts.push(`Exp ${formatDateLabel(exp, exp)}`);
    return parts.join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.BIRTH_CERTIFICATE) {
    const name = String(data.childFullName || "").trim();
    const dob = String(data.dateOfBirth || "").trim();
    return [name, dob ? `DOB ${formatDateLabel(dob, dob)}` : ""].filter(Boolean).join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.SOCIAL_SECURITY_CARD) {
    const name = String(data.fullName || "").trim();
    const ssn = String(data.ssn || "").replace(/\D/g, "");
    if (name && ssn.length >= 4) return `${name} • ****${ssn.slice(-4)}`;
    if (name) return name;
    if (ssn.length >= 4) return `****${ssn.slice(-4)}`;
    return "Added";
  }

  if (recordType === RECORD_TYPES.MEDICAL_PROFILE) {
    const blood = String(data.bloodType || "").trim();
    const allergies = Array.isArray((data as any).allergies) ? (data as any).allergies.length : 0;
    const parts: string[] = [];
    if (blood) parts.push(`Blood ${blood}`);
    if (allergies > 0) parts.push(`${allergies} allergies`);
    return parts.join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.PRESCRIPTIONS) {
    const list = Array.isArray((data as any).prescriptions) ? (data as any).prescriptions : [];
    if (list.length === 0) return "Added";
    const names = list.map((x: any) => String(x.medicationName || "").trim()).filter(Boolean).slice(0, 3);
    const extra = list.length - names.length;
    if (names.length === 0) return `${list.length} prescriptions`;
    return extra > 0 ? `${names.join(", ")} +${extra}` : names.join(", ");
  }

  if (recordType === RECORD_TYPES.VACCINATIONS) {
    const list = Array.isArray((data as any).vaccinations) ? (data as any).vaccinations : [];
    return list.length > 0 ? `${list.length} vaccinations` : "Added";
  }

  if (recordType === RECORD_TYPES.LOYALTY_ACCOUNTS) {
    const accounts = Array.isArray((data as any).accounts) ? (data as any).accounts : [];
    const names = accounts.map((a: any) => String(a.providerName || a.programType || "").trim()).filter(Boolean).slice(0, 3);
    const extra = accounts.length - names.length;
    if (names.length === 0) return accounts.length ? `${accounts.length} accounts` : "Added";
    return extra > 0 ? `${names.join(" • ")} +${extra}` : names.join(" • ");
  }

  if (recordType === RECORD_TYPES.TRAVEL_IDS) {
    const ids = Array.isArray((data as any).travelIds) ? (data as any).travelIds : [];
    const labels = ids.map((a: any) => String(a.type || "").trim()).filter(Boolean).slice(0, 3);
    const extra = ids.length - labels.length;
    if (labels.length === 0) return ids.length ? `${ids.length} IDs` : "Added";
    return extra > 0 ? `${labels.join(" • ")} +${extra}` : labels.join(" • ");
  }

  if (recordType === RECORD_TYPES.PET_BASICS) {
    const weight = String((data as any).currentWeightValue || "").trim();
    const unit = String((data as any).currentWeightUnit || "").trim();
    const neutered = String((data as any).isNeutered || "").trim();
    const parts: string[] = [];
    if (weight) parts.push(`${weight} ${unit}`.trim());
    if (neutered && neutered !== "Unknown") parts.push(neutered);
    return parts.join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.PET_VACCINATIONS) {
    const name = String((data as any).vaccineName || "").trim();
    const date = String((data as any).dateAdministered || "").trim();
    return [name, date ? formatDateLabel(date, date) : ""].filter(Boolean).join(" • ") || "Added";
  }

  if (recordType === RECORD_TYPES.PET_INSURANCE) {
    const provider = String((data as any).providerName || "").trim();
    const policy = String((data as any).policyNumber || "").trim();
    return [provider, policy ? `#${policy}` : ""].filter(Boolean).join(" • ") || "Added";
  }

  if (record.title) return record.title;
  if (record.updatedAt) return `Updated ${formatDateLabel(record.updatedAt, "—")}`;
  return "Added";
}

const CATEGORY_LABELS: Partial<Record<string, string>> = {
  IDENTIFICATION: "Identification",
  MEDICAL: "Medical",
  PRIVATE_HEALTH: "Support Profile",
  SCHOOL: "School",
  PREFERENCES: "Preferences",
  SIZES: "Sizes",
  TRAVEL: "Travel",
  LEGAL: "Legal",
  DOCUMENTS: "Documents",
  PET_OVERVIEW: "Overview",
  PET_BASICS: "Basics",
  PET_MEDICAL: "Medical",
  PET_DAILY_CARE: "Daily Care",
  PET_BEHAVIOR_SAFETY: "Behavior & Safety",
  PET_CONTACTS: "Contacts",
  PET_DOCUMENTS: "Documents",
};

type Props = {
  category: RecordCategory;
  records: LifeVaultRecord[];
  onAddRecordType: (recordType: RecordType) => void;
  onOpenRecord: (record: LifeVaultRecord) => void;
};

export default function SectionRecordRows({
  category,
  records,
  onAddRecordType,
  onOpenRecord,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const recordTypes = useMemo(() => getTypesForCategory(category), [category]);

  const categoryRecords = useMemo(
    () => records.filter((r) => getRecordMeta(r.recordType)?.category === category),
    [records, category],
  );

  const sectionTitle = CATEGORY_LABELS[category] ?? category.replaceAll("_", " ");

  const filledCount = useMemo(() => {
    return recordTypes.filter((rt) => categoryRecords.some((r) => r.recordType === rt)).length;
  }, [categoryRecords, recordTypes]);

  if (recordTypes.length === 0) return null;

  return (
    <View className="mb-3 rounded-2xl border border-border bg-card">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-4 py-4"
        hitSlop={8}
      >
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-foreground">{sectionTitle}</Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {filledCount}/{recordTypes.length} added
          </Text>
        </View>
        {expanded ? (
          <ChevronDown size={18} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={18} className="text-muted-foreground" />
        )}
      </Pressable>

      {expanded ? (
        <View className="px-4 pb-4 gap-2">
          {recordTypes.map((rt) => {
            const meta = getRecordMeta(rt);
            const label = meta?.label ?? rt.replaceAll("_", " ");

            const existing = categoryRecords
              .filter((r) => r.recordType === rt)
              .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

            const latest = existing[0];

            if (latest) {
              return (
                <RowWithSummary
                  key={rt}
                  title={label}
                  summary={buildRecordSummary(rt, latest)}
                  onPress={() => onOpenRecord(latest)}
                />
              );
            }

            return (
              <RowWithSummary
                key={rt}
                title={label}
                summary={notAddedSummary()}
                onPress={() => onAddRecordType(rt)}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
