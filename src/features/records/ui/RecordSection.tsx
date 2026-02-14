// src/features/records/ui/RecordSection.tsx
import React, { useMemo, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronRight, Plus } from "lucide-react-native";

import { RecordCategory } from "@/domain/records/recordCategories";
import { RecordType } from "@/domain/records/recordTypes";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { getTypesForCategory } from "@/domain/records/selectors/getTypesForCategory";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { formatDateLabel } from "@/shared/utils/date";

type Props = {
  category: RecordCategory;
  records: LifeVaultRecord[];
  onAdd: (recordType: RecordType) => void;
  onEdit: (record: LifeVaultRecord) => void;
  onOpen: (record: LifeVaultRecord) => void;
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export default function RecordSection({ category, records, onAdd, onEdit, onOpen }: Props) {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <View className="mb-3 rounded-2xl border border-border bg-card">
      {/* Section header (tap to expand/collapse) */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-4 py-4"
        hitSlop={8}
      >
        <Text className="text-base font-semibold text-foreground">
          {labelize(category)}
        </Text>

        {expanded ? (
          <ChevronDown size={18} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={18} className="text-muted-foreground" />
        )}
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View className="px-4 pb-4">
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
        </View>
      )}
    </View>
  );
}