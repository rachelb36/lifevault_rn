import React from "react";
import {
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RecordType } from "@/domain/records/recordTypes";
import {
  getFieldsForRecordType,
  resolveLabel,
  type ObjectListItemField,
} from "@/features/records/forms/formDefs";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import OptionPickerSheet from "@/shared/ui/OptionPickerSheet";
import { parseDate, toIsoDateOnly } from "@/shared/utils/date";
import {
  Contact,
  getContactDisplayName,
  getContacts,
} from "@/features/contacts/data/storage";
import {
  DOG_VACCINATION_OPTIONS,
  CAT_VACCINATION_OPTIONS,
} from "@/features/pets/constants/options";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { getFieldRenderer } from "./renderers/fieldRendererMap";
import {
  isContactIdField,
  isDateField,
  safeStringArray,
} from "./renderers/fieldUtils";
import type { FieldRendererProps } from "./renderers/FieldRendererProps";

type AnyRecord = Record<string, any> | null | undefined;

export default function RecordTypeFormRenderer({
  recordType,
  value,
  onChange,
  entityMeta,
}: {
  recordType: RecordType;
  value: AnyRecord;
  onChange: (next: any) => void;
  entityMeta?: { kind?: string };
}) {
  const router = useRouter();
  const rawFields = getFieldsForRecordType(recordType, value);

  // Dynamically inject vaccination options based on pet kind
  const fields = React.useMemo(() => {
    if (recordType !== "PET_VACCINATIONS" || !entityMeta?.kind)
      return rawFields;
    const kind = entityMeta.kind.toLowerCase();
    const vaccineOptions =
      kind === "dog"
        ? DOG_VACCINATION_OPTIONS
        : kind === "cat"
          ? CAT_VACCINATION_OPTIONS
          : undefined;
    if (!vaccineOptions) return rawFields;
    return rawFields.map((f) =>
      f.key === "vaccineName"
        ? { ...f, type: "select" as const, options: vaccineOptions }
        : f,
    );
  }, [rawFields, recordType, entityMeta?.kind]);

  // ---- State ----

  const setField = (key: string, nextValue: any) => {
    onChange({ ...(value ?? {}), [key]: nextValue });
  };

  const [datePickerState, setDatePickerState] = React.useState<{
    visible: boolean;
    fieldKey: string | null;
    title: string;
    value: Date | null;
    listFieldKey?: string;
    rowIndex?: number;
    itemKey?: string;
  }>({
    visible: false,
    fieldKey: null,
    title: "Select date",
    value: null,
  });

  const [inlineAdd, setInlineAdd] = React.useState<{
    fieldKey: string | null;
    fieldLabel: string;
    draft: string;
  }>({
    fieldKey: null,
    fieldLabel: "",
    draft: "",
  });

  const [pickerSheet, setPickerSheet] = React.useState<{
    visible: boolean;
    fieldKey: string;
    label: string;
    options: string[];
    multiSelect: boolean;
  }>({
    visible: false,
    fieldKey: "",
    label: "",
    options: [],
    multiSelect: true,
  });

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = React.useState("");
  const [contactMode, setContactMode] = React.useState<"actions" | "directory">(
    "actions",
  );
  const [contactPicker, setContactPicker] = React.useState<{
    visible: boolean;
    scope: "top" | "row";
    fieldKey: string;
    rowIndex?: number;
    itemKey?: string;
    title: string;
  }>({
    visible: false,
    scope: "top",
    fieldKey: "",
    title: "Select contact",
  });

  const [expandedItem, setExpandedItem] = React.useState<{
    fieldKey: string;
    index: number;
  } | null>(null);

  // ---- Contact loading ----

  const loadContacts = React.useCallback(async () => {
    const list = await getContacts();
    setContacts(list);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [loadContacts]),
  );

  // ---- Date picker ----

  const openDatePicker = (
    fieldKey: string,
    fieldLabel: string,
    listContext?: {
      listFieldKey: string;
      rowIndex: number;
      itemKey: string;
      currentValue: unknown;
    },
  ) => {
    setDatePickerState({
      visible: true,
      fieldKey,
      title: fieldLabel,
      value: listContext
        ? parseDate(listContext.currentValue as string)
        : parseDate((value as any)?.[fieldKey] ?? null),
      listFieldKey: listContext?.listFieldKey,
      rowIndex: listContext?.rowIndex,
      itemKey: listContext?.itemKey,
    });
  };

  const closeDatePicker = () => {
    setDatePickerState((prev) => ({ ...prev, visible: false, fieldKey: null }));
  };

  const confirmDatePicker = (date: Date) => {
    if (
      datePickerState.listFieldKey != null &&
      datePickerState.rowIndex != null &&
      datePickerState.itemKey
    ) {
      updateObjectListItem(
        datePickerState.listFieldKey,
        datePickerState.rowIndex,
        datePickerState.itemKey,
        toIsoDateOnly(date),
      );
      closeDatePicker();
      return;
    }
    if (!datePickerState.fieldKey) return;
    setField(datePickerState.fieldKey, toIsoDateOnly(date));
    closeDatePicker();
  };

  // ---- Inline add (list fields) ----

  const openInlineAdd = (fieldKey: string, fieldLabel: string) => {
    setInlineAdd({ fieldKey, fieldLabel, draft: "" });
  };

  const closeInlineAdd = () => {
    setInlineAdd({ fieldKey: null, fieldLabel: "", draft: "" });
    Keyboard.dismiss();
  };

  const commitInlineAdd = () => {
    if (!inlineAdd.fieldKey) return;
    const key = inlineAdd.fieldKey;
    const current = safeStringArray((value as any)?.[key]);
    const normalized = inlineAdd.draft.trim();
    if (!normalized) return;
    const norm = (s: string) => s.trim().toLowerCase();
    if (current.some((x) => norm(x) === norm(normalized))) {
      closeInlineAdd();
      return;
    }
    setField(key, [...current, normalized]);
    closeInlineAdd();
  };

  // ---- Picker sheet ----

  const openPickerSheet = (
    fieldKey: string,
    label: string,
    options: string[],
    multiSelect: boolean,
  ) => {
    setPickerSheet({ visible: true, fieldKey, label, options, multiSelect });
  };

  const closePickerSheet = () => {
    setPickerSheet((prev) => ({ ...prev, visible: false }));
  };

  const sheetSelected = pickerSheet.multiSelect
    ? safeStringArray((value as any)?.[pickerSheet.fieldKey])
    : [String((value as any)?.[pickerSheet.fieldKey] ?? "").trim()].filter(
        Boolean,
      );

  const sheetOnToggle = (option: string) => {
    const key = pickerSheet.fieldKey;
    if (pickerSheet.multiSelect) {
      const current = safeStringArray((value as any)?.[key]);
      const normalized = option.trim();
      const exists = current.some(
        (item) => item.toLowerCase() === normalized.toLowerCase(),
      );
      setField(
        key,
        exists
          ? current.filter(
              (item) => item.toLowerCase() !== normalized.toLowerCase(),
            )
          : [...current, normalized],
      );
    } else {
      const current = String((value as any)?.[key] ?? "").trim();
      setField(
        key,
        current.toLowerCase() === option.toLowerCase() ? "" : option,
      );
    }
  };

  // ---- Object list helpers ----

  const getObjectListItems = (fieldKey: string): Record<string, unknown>[] => {
    const raw = (value as any)?.[fieldKey];
    if (!Array.isArray(raw)) return [];
    return raw.filter((row: unknown) => !!row && typeof row === "object");
  };

  const setObjectListItems = (
    fieldKey: string,
    nextItems: Record<string, unknown>[],
  ) => {
    setField(fieldKey, nextItems);
  };

  const addObjectListItem = (
    fieldKey: string,
    itemFields: ObjectListItemField[],
  ) => {
    const items = getObjectListItems(fieldKey);
    const nextItem: Record<string, unknown> = {};
    itemFields.forEach((itemField) => {
      if (itemField.type === "toggle") {
        nextItem[itemField.key] = itemField.key === "isActive";
        return;
      }
      nextItem[itemField.key] = "";
    });
    setObjectListItems(fieldKey, [...items, nextItem]);
  };

  const updateObjectListItem = (
    fieldKey: string,
    index: number,
    itemKey: string,
    nextValue: unknown,
  ) => {
    const items = getObjectListItems(fieldKey);
    const next = [...items];
    next[index] = { ...(next[index] ?? {}), [itemKey]: nextValue };
    setObjectListItems(fieldKey, next);
  };

  const removeObjectListItem = (fieldKey: string, index: number) => {
    const items = getObjectListItems(fieldKey);
    const next = [...items];
    next.splice(index, 1);
    setObjectListItems(fieldKey, next);
    if (expandedItem?.fieldKey === fieldKey) {
      if (expandedItem.index === index) setExpandedItem(null);
      else if (expandedItem.index > index)
        setExpandedItem({ ...expandedItem, index: expandedItem.index - 1 });
    }
  };

  const isItemEmpty = (item: Record<string, unknown>): boolean =>
    Object.values(item).every((v) => v == null || String(v).trim() === "");

  const collapseItem = () => {
    if (!expandedItem) return;
    const items = getObjectListItems(expandedItem.fieldKey);
    const item = items[expandedItem.index];
    if (item && isItemEmpty(item)) {
      removeObjectListItem(expandedItem.fieldKey, expandedItem.index);
    }
    setExpandedItem(null);
  };

  const expandItem = (fieldKey: string, index: number) => {
    collapseItem();
    setExpandedItem({ fieldKey, index });
  };

  // ---- Contact helpers ----

  const contactById = React.useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  const resolveContactLabel = (idValue: unknown) => {
    const id = String(idValue ?? "").trim();
    if (!id) return "";
    const found = contactById.get(id);
    if (!found) return id;
    return `${getContactDisplayName(found)}${found.phone ? ` \u2022 ${found.phone}` : ""}`;
  };

  const openContactPicker = async (target: {
    scope: "top" | "row";
    fieldKey: string;
    rowIndex?: number;
    itemKey?: string;
    title: string;
  }) => {
    await loadContacts();
    setContactSearch("");
    setContactMode("actions");
    setContactPicker({ ...target, visible: true });
  };

  const closeContactPicker = () => {
    setContactPicker((prev) => ({ ...prev, visible: false }));
  };

  const setPickedContact = (contactId: string) => {
    if (contactPicker.scope === "top") {
      setField(contactPicker.fieldKey, contactId);
      closeContactPicker();
      return;
    }
    if (
      contactPicker.scope === "row" &&
      typeof contactPicker.rowIndex === "number" &&
      contactPicker.itemKey
    ) {
      updateObjectListItem(
        contactPicker.fieldKey,
        contactPicker.rowIndex,
        contactPicker.itemKey,
        contactId,
      );
      closeContactPicker();
    }
  };

  // ---- Render ----

  if (fields.length === 0) {
    return (
      <View>
        <Text className="text-sm text-muted-foreground">
          No mapped form fields for {recordType}.
        </Text>
      </View>
    );
  }

  return (
    <View className="relative">
      <View className="gap-4">
        {fields.map((f) => {
          const fieldValue = (value as any)?.[f.key];
          const fLabel = resolveLabel(
            f.label,
            (value as Record<string, unknown>) ?? {},
          );

          // Determine effective field type (heuristic overrides)
          let effectiveType: string = f.type ?? "text";
          if (
            effectiveType !== "date" &&
            isDateField(f.key, fLabel, f.placeholder)
          ) {
            effectiveType = "date";
          }
          if (isContactIdField(f.key) && effectiveType !== "objectList") {
            effectiveType = "contactId";
          }

          const Renderer = getFieldRenderer(effectiveType);

          const props: FieldRendererProps = {
            fieldKey: f.key,
            label: fLabel,
            rawLabel: f.label,
            placeholder: f.placeholder,
            fieldValue,
            options: f.options,
            showWhen: f.showWhen,
            required: f.required,
            content: f.content,
            type: f.type,
            itemFields: f.itemFields,
            addLabel: f.addLabel,
            forcePills: f.forcePills,
            setField,
            openDatePicker,
            openPickerSheet,
            openContactPicker,
            inlineAdd,
            setInlineAdd,
            openInlineAdd,
            closeInlineAdd,
            commitInlineAdd,
            expandedItem,
            expandItem,
            collapseItem,
            getObjectListItems,
            addObjectListItem,
            updateObjectListItem,
            removeObjectListItem,
            resolveContactLabel,
            allValues: (value as Record<string, unknown>) ?? {},
          };

          return <Renderer key={f.key} {...props} />;
        })}
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={datePickerState.visible}
        value={datePickerState.value}
        onConfirm={confirmDatePicker}
        onCancel={closeDatePicker}
        title={datePickerState.title}
      />

      {/* Option Picker Sheet */}
      <OptionPickerSheet
        visible={pickerSheet.visible}
        fieldKey={pickerSheet.fieldKey}
        label={pickerSheet.label}
        options={pickerSheet.options}
        selected={sheetSelected}
        multiSelect={pickerSheet.multiSelect}
        onToggle={sheetOnToggle}
        onDone={closePickerSheet}
      />

      {/* Contact Picker Modal */}
      <Modal
        visible={contactPicker.visible}
        transparent
        animationType="slide"
        onRequestClose={closeContactPicker}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl border-t border-border max-h-[78%] p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">
                {contactPicker.title || "Select contact"}
              </Text>
              <TouchableOpacity
                onPress={closeContactPicker}
                activeOpacity={0.85}
              >
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            {contactMode === "actions" ? (
              <View className="gap-3">
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Coming soon",
                      "Import from device contacts is not wired yet.",
                    )
                  }
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">
                    Upload from contacts
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Import from device contacts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await loadContacts();
                    setContactMode("directory");
                  }}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">
                    Add from Vault Directory
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Choose an existing contact
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    closeContactPicker();
                    router.push("/(vault)/contacts/add" as any);
                  }}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">
                    Create new contact
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Open Add Contact form
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Search contacts"
                  placeholderTextColor="rgb(162 162 168)"
                  value={contactSearch}
                  onChangeText={setContactSearch}
                />

                <TouchableOpacity
                  onPress={() => setContactMode("actions")}
                  className="self-start px-3 py-1.5 rounded-full bg-muted"
                  activeOpacity={0.85}
                >
                  <Text className="text-xs font-medium text-foreground">
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
