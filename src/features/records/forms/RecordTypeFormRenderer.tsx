import React from "react";
import { Alert, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { RecordType } from "@/domain/records/recordTypes";
import { getFieldsForRecordType, resolveLabel, type ObjectListItemField } from "@/features/records/forms/formDefs";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";
import OptionPickerSheet from "@/shared/ui/OptionPickerSheet";
import { formatDateLabel, parseDate, toIsoDateOnly } from "@/shared/utils/date";
import { Contact, getContactDisplayName, getContacts } from "@/features/contacts/data/storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

type AnyRecord = Record<string, any> | null | undefined;

function labelToSingular(label: string) {
  const clean = label.replace(/\s*\(.*?\)\s*/g, "").trim();
  const lower = clean.toLowerCase();
  if (lower.endsWith("ies")) return clean.slice(0, -3) + "y"; // Hobbies -> Hobby
  if (lower.endsWith("s")) return clean.slice(0, -1); // Likes -> Like
  return clean;
}

function buildSheetCopy(fieldLabel: string) {
  const singular = labelToSingular(fieldLabel);
  return {
    title: `Add ${singular}`,
    placeholder: `Enter a ${singular.toLowerCase()}`,
    addRowText: `+ Add ${singular}`,
  };
}

function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

export default function RecordTypeFormRenderer({
  recordType,
  value,
  onChange,
}: {
  recordType: RecordType;
  value: AnyRecord;
  onChange: (next: any) => void;
}) {
  const router = useRouter();
  const fields = getFieldsForRecordType(recordType, value);

  const setField = (key: string, nextValue: any) => {
    onChange({ ...(value ?? {}), [key]: nextValue });
  };

  const isDateField = (key: string, label: string, placeholder?: string) => {
    const lower = `${key} ${label} ${placeholder ?? ""}`.toLowerCase();
    return lower.includes("yyyy-mm-dd") || lower.includes(" date") || lower.includes("dob");
  };

  const [datePickerState, setDatePickerState] = React.useState<{
    visible: boolean;
    fieldKey: string | null;
    title: string;
    value: Date | null;
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
  }>({ visible: false, fieldKey: "", label: "", options: [], multiSelect: true });
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = React.useState("");
  const [contactMode, setContactMode] = React.useState<"actions" | "directory">("actions");
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

  const [expandedItem, setExpandedItem] = React.useState<{ fieldKey: string; index: number } | null>(null);

  const loadContacts = React.useCallback(async () => {
    const list = await getContacts();
    setContacts(list);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const openDatePicker = (fieldKey: string, fieldLabel: string) => {
    setDatePickerState({
      visible: true,
      fieldKey,
      title: fieldLabel,
      value: parseDate((value as any)?.[fieldKey] ?? null),
    });
  };

  const closeDatePicker = () => {
    setDatePickerState((prev) => ({ ...prev, visible: false, fieldKey: null }));
  };

  const confirmDatePicker = (date: Date) => {
    if (!datePickerState.fieldKey) return;
    setField(datePickerState.fieldKey, toIsoDateOnly(date));
    closeDatePicker();
  };

  const openInlineAdd = (fieldKey: string, fieldLabel: string) => {
    setInlineAdd({ fieldKey, fieldLabel, draft: "" });
    // focus comes from autoFocus on the TextInput
  };

  const closeInlineAdd = () => {
    setInlineAdd({ fieldKey: null, fieldLabel: "", draft: "" });
    Keyboard.dismiss();
  };

  const openPickerSheet = (fieldKey: string, label: string, options: string[], multiSelect: boolean) => {
    setPickerSheet({ visible: true, fieldKey, label, options, multiSelect });
  };

  const closePickerSheet = () => {
    setPickerSheet((prev) => ({ ...prev, visible: false }));
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

  const removeListItemAt = (key: string, idx: number) => {
    const current = safeStringArray((value as any)?.[key]);
    const next = [...current];
    next.splice(idx, 1);
    setField(key, next);
  };

  const getObjectListItems = (fieldKey: string): Array<Record<string, unknown>> => {
    const raw = (value as any)?.[fieldKey];
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => !!row && typeof row === "object");
  };

  const setObjectListItems = (fieldKey: string, nextItems: Array<Record<string, unknown>>) => {
    setField(fieldKey, nextItems);
  };

  const addObjectListItem = (fieldKey: string, itemFields: ObjectListItemField[]) => {
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
    nextValue: unknown
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

  const getItemSummary = (item: Record<string, unknown>, itemFields: ObjectListItemField[]): string => {
    const parts: string[] = [];
    for (const f of itemFields) {
      if (parts.length >= 3) break;
      const v = String(item[f.key] ?? "").trim();
      if (v) parts.push(v);
    }
    return parts.length > 0 ? parts.join(" · ") : "New entry";
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

  const isContactIdField = (key: string) => {
    const lower = key.toLowerCase();
    return lower.endsWith("contactid") || (lower.includes("contact") && lower.endsWith("id")) || lower === "contactid";
  };

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
    return `${getContactDisplayName(found)}${found.phone ? ` • ${found.phone}` : ""}`;
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
      updateObjectListItem(contactPicker.fieldKey, contactPicker.rowIndex, contactPicker.itemKey, contactId);
      closeContactPicker();
    }
  };

  const sheetSelected = pickerSheet.multiSelect
    ? safeStringArray((value as any)?.[pickerSheet.fieldKey])
    : [String((value as any)?.[pickerSheet.fieldKey] ?? "").trim()].filter(Boolean);

  const sheetOnToggle = (option: string) => {
    const key = pickerSheet.fieldKey;
    if (pickerSheet.multiSelect) {
      const current = safeStringArray((value as any)?.[key]);
      const normalized = option.trim();
      const exists = current.some((item) => item.toLowerCase() === normalized.toLowerCase());
      setField(
        key,
        exists
          ? current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())
          : [...current, normalized]
      );
    } else {
      const current = String((value as any)?.[key] ?? "").trim();
      setField(key, current.toLowerCase() === option.toLowerCase() ? "" : option);
    }
  };

  if (fields.length === 0) {
    return (
      <View>
        <Text className="text-sm text-muted-foreground">No mapped form fields for {recordType}.</Text>
      </View>
    );
  }


  return (
    <View className="relative">
      <View className="gap-4">
        {fields.map((f) => {
          const fieldValue = (value as any)?.[f.key];
          const fLabel = resolveLabel(f.label, (value as Record<string, unknown>) ?? {});

          if (f.type === "description") {
            return (
              <View key={f.key} className="rounded-2xl bg-muted/40 border border-border px-4 py-4">
                <Text className="text-sm text-muted-foreground leading-5">{f.content ?? fLabel}</Text>
              </View>
            );
          }

          if (f.type === "objectList") {
            const itemFields = f.itemFields ?? [];
            const items = getObjectListItems(f.key);
            const addLabel = f.addLabel || `Add ${labelToSingular(fLabel)}`;
            const isExpanded = (idx: number) =>
              expandedItem?.fieldKey === f.key && expandedItem.index === idx;

            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>

                <View className="gap-2">
                  {items.map((item, idx) => {
                    if (isExpanded(idx)) {
                      return (
                        <View key={`${f.key}-${idx}`} className="rounded-xl border border-primary/40 bg-card p-3 gap-3">
                          <Text className="text-sm font-semibold text-foreground">{labelToSingular(fLabel)} {idx + 1}</Text>

                          {itemFields.map((itemField) => {
                            if (itemField.showWhen) {
                              const actual = String(item[itemField.showWhen.key] ?? "").trim().toLowerCase();
                              if (actual !== itemField.showWhen.equals.toLowerCase()) return null;
                            }

                            const itemValue = item[itemField.key];
                            const label = resolveLabel(itemField.label, item as Record<string, unknown>);

                            if (isContactIdField(itemField.key)) {
                              const contactLabel = resolveContactLabel(itemValue);
                              return (
                                <View key={`${f.key}-${idx}-${itemField.key}`} className="gap-1.5">
                                  <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      openContactPicker({
                                        scope: "row",
                                        fieldKey: f.key,
                                        rowIndex: idx,
                                        itemKey: itemField.key,
                                        title: label,
                                      })
                                    }
                                    className="bg-background border border-border rounded-xl px-3 py-2"
                                    activeOpacity={0.85}
                                  >
                                    <Text className={contactLabel ? "text-foreground" : "text-muted-foreground"}>
                                      {contactLabel || "Select contact"}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              );
                            }

                            if (itemField.type === "select") {
                              const options = (itemField.options ?? []).map((opt) => String(opt));
                              return (
                                <View key={`${f.key}-${idx}-${itemField.key}`} className="gap-1.5">
                                  <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
                                  <View className="flex-row flex-wrap gap-2">
                                    {options.map((option) => {
                                      const selected = String(itemValue ?? "") === option;
                                      return (
                                        <TouchableOpacity
                                          key={`${f.key}-${idx}-${itemField.key}-${option}`}
                                          onPress={() => updateObjectListItem(f.key, idx, itemField.key, option)}
                                          className={`rounded-full border px-3 py-1.5 ${
                                            selected ? "bg-primary border-primary" : "bg-background border-border"
                                          }`}
                                          activeOpacity={0.85}
                                        >
                                          <Text className={selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>
                                            {option}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                </View>
                              );
                            }

                            if (itemField.type === "toggle") {
                              const selected = toBoolean(itemValue);
                              return (
                                <View key={`${f.key}-${idx}-${itemField.key}`} className="gap-1.5">
                                  <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
                                  <View className="flex-row gap-2">
                                    <TouchableOpacity
                                      onPress={() => updateObjectListItem(f.key, idx, itemField.key, true)}
                                      className={`rounded-full border px-3 py-1.5 ${selected ? "bg-primary border-primary" : "bg-background border-border"}`}
                                      activeOpacity={0.85}
                                    >
                                      <Text className={selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => updateObjectListItem(f.key, idx, itemField.key, false)}
                                      className={`rounded-full border px-3 py-1.5 ${!selected ? "bg-primary border-primary" : "bg-background border-border"}`}
                                      activeOpacity={0.85}
                                    >
                                      <Text className={!selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>No</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            }

                            return (
                              <View key={`${f.key}-${idx}-${itemField.key}`} className="gap-1.5">
                                <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
                                <TextInput
                                  className="bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                                  placeholder={itemField.placeholder ?? (itemField.type === "date" ? "YYYY-MM-DD" : "")}
                                  placeholderTextColor="rgb(148 163 184)"
                                  value={String(itemValue ?? "")}
                                  onChangeText={(t) => updateObjectListItem(f.key, idx, itemField.key, t)}
                                  multiline={itemField.type === "multiline"}
                                  style={itemField.type === "multiline" ? { minHeight: 80, textAlignVertical: "top" as const } : undefined}
                                />
                              </View>
                            );
                          })}

                          <TouchableOpacity
                            onPress={collapseItem}
                            activeOpacity={0.85}
                            className="bg-primary rounded-xl py-2.5 items-center mt-1"
                          >
                            <Text className="text-sm font-semibold text-primary-foreground">Done</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <SwipeToDeleteRow
                        key={`${f.key}-${idx}`}
                        titleForConfirm={`${labelToSingular(fLabel)} ${idx + 1}`}
                        onDelete={() => removeObjectListItem(f.key, idx)}
                      >
                        <TouchableOpacity
                          onPress={() => expandItem(f.key, idx)}
                          activeOpacity={0.85}
                          className="rounded-xl border border-border bg-card px-4 py-3 flex-row items-center justify-between"
                        >
                          <Text className="text-sm text-foreground flex-1 mr-3" numberOfLines={1}>
                            {getItemSummary(item, itemFields)}
                          </Text>
                          <Text className="text-base text-muted-foreground">›</Text>
                        </TouchableOpacity>
                      </SwipeToDeleteRow>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => {
                      collapseItem();
                      addObjectListItem(f.key, itemFields);
                      setExpandedItem({ fieldKey: f.key, index: items.length });
                    }}
                    activeOpacity={0.85}
                    className="rounded-xl border border-dashed border-border bg-card px-4 py-3"
                  >
                    <Text className="text-sm font-medium text-primary">{`+ ${addLabel}`}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          // ✅ LIST FIELDS: Apple-ish rows + swipe delete + "Add" row opens inline add
          if (f.type === "list") {
            const items = safeStringArray(fieldValue);
            const copy = buildSheetCopy(fLabel);
            const options = (f.options ?? []).map((opt) => String(opt));
            const hasOptionCatalog = options.length > 0;
            const usePills = options.length <= 6;
            const toggleListItem = (nextItem: string) => {
              const normalized = nextItem.trim();
              if (!normalized) return;
              const exists = items.some((item) => item.toLowerCase() === normalized.toLowerCase());
              if (exists) {
                setField(
                  f.key,
                  items.filter((item) => item.toLowerCase() !== normalized.toLowerCase())
                );
                return;
              }
              setField(f.key, [...items, normalized]);
            };

            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>

                <View className="bg-card border border-border rounded-xl overflow-hidden">
                  {items.map((item, idx) => (
                    <View key={`${f.key}-${idx}`} className={idx === 0 ? "" : "border-t border-border"}>
                      <SwipeToDeleteRow titleForConfirm={item} onDelete={() => removeListItemAt(f.key, idx)}>
                        <View className="px-4 py-3">
                          <Text className="text-[17px] text-foreground">{item}</Text>
                        </View>
                      </SwipeToDeleteRow>
                    </View>
                  ))}

                  {!hasOptionCatalog && inlineAdd.fieldKey === f.key ? (
                    <View className={items.length > 0 ? "border-t border-border px-4 py-3" : "px-4 py-3"}>
                      <View className="bg-muted/40 border border-border rounded-xl px-3 py-2">
                        <TextInput
                          value={inlineAdd.draft}
                          onChangeText={(t) => setInlineAdd((prev) => ({ ...prev, draft: t }))}
                          placeholder={copy.placeholder}
                          placeholderTextColor="rgb(148 163 184)"
                          autoCapitalize="sentences"
                          autoCorrect
                          returnKeyType="done"
                          onSubmitEditing={commitInlineAdd}
                          autoFocus
                          className="text-[17px] text-foreground"
                        />
                      </View>

                      <View className="flex-row justify-between items-center mt-2">
                        <Pressable onPress={closeInlineAdd} hitSlop={10}>
                          <Text className="text-[15px] text-muted-foreground font-medium">Cancel</Text>
                        </Pressable>

                        <Pressable
                          onPress={commitInlineAdd}
                          hitSlop={10}
                          disabled={!inlineAdd.draft.trim()}
                        >
                          <Text className={inlineAdd.draft.trim() ? "text-[15px] text-primary font-semibold" : "text-[15px] text-muted-foreground font-semibold"}>
                            Add
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : !hasOptionCatalog ? (
                    <TouchableOpacity
                      onPress={() => openInlineAdd(f.key, fLabel)}
                      activeOpacity={0.85}
                      className={items.length > 0 ? "border-t border-border px-4 py-3" : "px-4 py-3"}
                    >
                      <Text className="text-[17px] text-primary font-medium">{copy.addRowText}</Text>
                    </TouchableOpacity>
                  ) : usePills ? (
                    <View className={items.length > 0 ? "border-t border-border p-3 gap-2" : "p-3 gap-2"}>
                      <View className="flex-row flex-wrap gap-2">
                        {options.map((option) => {
                          const selected = items.some((item) => item.toLowerCase() === option.toLowerCase());
                          return (
                            <TouchableOpacity
                              key={`${f.key}-list-opt-${option}`}
                              onPress={() => toggleListItem(option)}
                              activeOpacity={0.85}
                              className={`rounded-full border px-3 py-1.5 ${
                                selected ? "bg-primary border-primary" : "bg-background border-border"
                              }`}
                            >
                              <Text className={selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => openPickerSheet(f.key, fLabel, options, true)}
                      activeOpacity={0.85}
                      className={items.length > 0 ? "border-t border-border px-4 py-3" : "px-4 py-3"}
                    >
                      <Text className="text-[17px] text-primary font-medium">+ Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }

          // Document helper block
          if (f.type === "document") {
            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
                <View className="bg-card border border-border rounded-xl px-4 py-3">
                  <Text className="text-sm text-foreground">Use the Attachments section below to add files for this record.</Text>
                </View>
              </View>
            );
          }

          // Date field
          if (f.type === "date" || isDateField(f.key, fLabel, f.placeholder)) {
            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
                <TouchableOpacity
                  onPress={() => openDatePicker(f.key, fLabel)}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className={fieldValue ? "text-foreground" : "text-muted-foreground"}>
                    {formatDateLabel(fieldValue, f.placeholder ?? "Select date")}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          if (isContactIdField(f.key)) {
            const contactLabel = resolveContactLabel(fieldValue);
            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
                <TouchableOpacity
                  onPress={() =>
                    openContactPicker({
                      scope: "top",
                      fieldKey: f.key,
                      title: fLabel,
                    })
                  }
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className={contactLabel ? "text-foreground" : "text-muted-foreground"}>
                    {contactLabel || "Select contact"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // Select field
          if (f.type === "select") {
            const options = (f.options ?? []).map((option) => String(option));
            const selected = String(fieldValue ?? "").trim();
            const usePills = options.length <= 6;

            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
                {usePills ? (
                  <View className="flex-row flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
                    {options.map((option) => {
                      const isSelected = selected === option;
                      return (
                        <TouchableOpacity
                          key={`${f.key}-${option}`}
                          onPress={() => setField(f.key, option)}
                          activeOpacity={0.85}
                          className={`rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "bg-background border-border"
                          }`}
                        >
                          <Text
                            className={
                              isSelected
                                ? "text-xs font-semibold text-primary-foreground"
                                : "text-xs text-foreground"
                            }
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => openPickerSheet(f.key, fLabel, options, false)}
                    activeOpacity={0.85}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className={selected ? "text-foreground" : "text-muted-foreground"}>
                      {selected || `Select ${labelToSingular(fLabel).toLowerCase()}`}
                    </Text>
                    <Text className="text-muted-foreground text-lg">›</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          if (f.type === "toggle") {
            const selected = toBoolean(fieldValue);
            return (
              <View key={f.key} className="gap-2">
                <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
                <View className="flex-row gap-2 rounded-xl border border-border bg-card p-3">
                  <TouchableOpacity
                    onPress={() => setField(f.key, true)}
                    className={`rounded-full border px-3 py-1.5 ${selected ? "bg-primary border-primary" : "bg-background border-border"}`}
                    activeOpacity={0.85}
                  >
                    <Text className={selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setField(f.key, false)}
                    className={`rounded-full border px-3 py-1.5 ${!selected ? "bg-primary border-primary" : "bg-background border-border"}`}
                    activeOpacity={0.85}
                  >
                    <Text className={!selected ? "text-xs font-semibold text-primary-foreground" : "text-xs text-foreground"}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          // Default text input
          return (
            <View key={f.key} className="gap-2">
              <Text className="text-sm font-medium text-foreground">{fLabel}</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder={f.placeholder ?? ""}
                placeholderTextColor="rgb(148 163 184)"
                value={String(fieldValue ?? "")}
                onChangeText={(t) => setField(f.key, t)}
                multiline={f.type === "multiline"}
                style={f.type === "multiline" ? { minHeight: 110, textAlignVertical: "top" as any } : undefined}
              />
            </View>
          );
        })}
      </View>


      <DatePickerModal
        visible={datePickerState.visible}
        value={datePickerState.value}
        onConfirm={confirmDatePicker}
        onCancel={closeDatePicker}
        title={datePickerState.title}
      />

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

      <Modal visible={contactPicker.visible} transparent animationType="slide" onRequestClose={closeContactPicker}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl border-t border-border max-h-[78%] p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">{contactPicker.title || "Select contact"}</Text>
              <TouchableOpacity onPress={closeContactPicker} activeOpacity={0.85}>
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            {contactMode === "actions" ? (
              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => Alert.alert("Coming soon", "Import from device contacts is not wired yet.")}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">Upload from contacts</Text>
                  <Text className="text-xs text-muted-foreground mt-1">Import from device contacts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await loadContacts();
                    setContactMode("directory");
                  }}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">Add from Vault Directory</Text>
                  <Text className="text-xs text-muted-foreground mt-1">Choose an existing contact</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    closeContactPicker();
                    router.push("/(vault)/contacts/add" as any);
                  }}
                  className="bg-card border border-border rounded-xl px-4 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground font-medium">Create new contact</Text>
                  <Text className="text-xs text-muted-foreground mt-1">Open Add Contact form</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Search contacts"
                  placeholderTextColor="rgb(148 163 184)"
                  value={contactSearch}
                  onChangeText={setContactSearch}
                />

                <ScrollView keyboardShouldPersistTaps="handled">
                  <View className="gap-2 pb-6">
                    {contacts
                      .filter((c) => {
                        const q = contactSearch.trim().toLowerCase();
                        if (!q) return true;
                        const name = getContactDisplayName(c).toLowerCase();
                        return name.includes(q) || (c.phone || "").toLowerCase().includes(q);
                      })
                      .map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setPickedContact(c.id)}
                          className="bg-card border border-border rounded-xl px-4 py-3"
                          activeOpacity={0.85}
                        >
                          <Text className="text-foreground font-medium">{getContactDisplayName(c) || "Unnamed contact"}</Text>
                          <Text className="text-xs text-muted-foreground mt-1">{c.phone || "No phone"}</Text>
                        </TouchableOpacity>
                      ))}

                    {contacts.length === 0 ? (
                      <View className="bg-card border border-border rounded-xl px-4 py-3">
                        <Text className="text-sm text-muted-foreground">No contacts in Vault Directory yet.</Text>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setContactMode("actions")}
                  className="self-start px-3 py-1.5 rounded-full bg-muted"
                  activeOpacity={0.85}
                >
                  <Text className="text-xs font-medium text-foreground">Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
