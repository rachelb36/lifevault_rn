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

export type { LifeVaultRecord } from "@/domain/records/record.model";

type RecordSectionProps = {
  category: RecordCategory;
  records: LifeVaultRecord[];
  onAdd: (recordType: RecordType) => void;
  onEdit: (record: LifeVaultRecord) => void;
  onOpen: (record: LifeVaultRecord) => void;
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export default function RecordSection({
  category,
  records,
  onAdd,
  onEdit,
  onOpen,
}: RecordSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const categoryRecordTypes = useMemo(() => getTypesForCategory(category), [category]);

  const categoryRecords = useMemo(() => {
    return records.filter((record) => getRecordMeta(record.recordType)?.category === category);
  }, [records, category]);

  const canAddType = (recordType: RecordType) => {
    if (!isSingletonType(recordType)) return true;
    return !categoryRecords.some((r) => r.recordType === recordType);
  };

  return (
    <View className="mb-3 rounded-2xl border border-border bg-card">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text className="text-base font-semibold text-foreground">{labelize(category)}</Text>
        {expanded ? (
          <ChevronDown size={18} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={18} className="text-muted-foreground" />
        )}
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4">
          {categoryRecordTypes.length > 0 && (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {categoryRecordTypes.map((recordType) => {
                const disabled = !canAddType(recordType);
                return (
                  <TouchableOpacity
                    key={recordType}
                    onPress={() => onAdd(recordType)}
                    disabled={disabled}
                    className={`flex-row items-center rounded-full px-3 py-1.5 ${
                      disabled ? "bg-muted" : "bg-primary/10"
                    }`}
                  >
                    <Plus size={12} className={disabled ? "text-muted-foreground" : "text-primary"} />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        disabled ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {getRecordMeta(recordType)?.label ?? labelize(recordType)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {categoryRecords.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No records yet.</Text>
          ) : (
            categoryRecords.map((record) => (
              <TouchableOpacity
                key={record.id}
                onPress={() => onOpen(record)}
                onLongPress={() => onEdit(record)}
                className="mb-2 rounded-xl border border-border bg-background px-3 py-2"
              >
                <Text className="text-sm font-medium text-foreground">
                  {record.title || getRecordMeta(record.recordType)?.label || "Record"}
                </Text>
                {record.updatedAt ? (
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    Updated {formatDateLabel(record.updatedAt, "Not set")}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}
