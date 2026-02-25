import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";
import { resolveLabel } from "../../forms/formDefs";
import { formatDateLabel } from "@/shared/utils/date";
import {
  getItemSummary,
  isContactIdField,
  isFieldFilled,
  isNumericField,
  labelToSingular,
  toBoolean,
} from "./fieldUtils";

export default function ObjectListField({
  fieldKey,
  label,
  fieldValue,
  itemFields: rawItemFields,
  addLabel: customAddLabel,
  expandedItem,
  expandItem,
  collapseItem,
  getObjectListItems,
  addObjectListItem,
  updateObjectListItem,
  removeObjectListItem,
  openDatePicker,
  openContactPicker,
  resolveContactLabel,
}: FieldRendererProps) {
  const itemFields = rawItemFields ?? [];
  const items = getObjectListItems(fieldKey);
  const addLabel = customAddLabel || `Add ${labelToSingular(label)}`;
  const isExpanded = (idx: number) =>
    expandedItem?.fieldKey === fieldKey && expandedItem.index === idx;

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />

      <View className="gap-2">
        {items.map((item, idx) => {
          if (isExpanded(idx)) {
            return (
              <View
                key={`${fieldKey}-${idx}`}
                className="rounded-xl border border-primary/40 bg-card p-3 gap-3"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {labelToSingular(label)} {idx + 1}
                </Text>

                {itemFields.map((itemField) => {
                  if (itemField.showWhen) {
                    const actual = String(item[itemField.showWhen.key] ?? "")
                      .trim()
                      .toLowerCase();
                    if (actual !== itemField.showWhen.equals.toLowerCase())
                      return null;
                  }

                  const itemValue = item[itemField.key];
                  const itemLabel = resolveLabel(
                    itemField.label,
                    item as Record<string, unknown>,
                  );

                  // Contact ID sub-field
                  if (isContactIdField(itemField.key)) {
                    const contactLabel = resolveContactLabel(itemValue);
                    return (
                      <View
                        key={`${fieldKey}-${idx}-${itemField.key}`}
                        className="gap-1.5"
                      >
                        <Text className="text-xs font-medium text-muted-foreground">
                          {itemLabel}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            openContactPicker({
                              scope: "row",
                              fieldKey,
                              rowIndex: idx,
                              itemKey: itemField.key,
                              title: itemLabel,
                            })
                          }
                          className="bg-background border border-border rounded-xl px-3 py-2"
                          activeOpacity={0.85}
                        >
                          <Text
                            className={
                              contactLabel
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {contactLabel || "Select contact"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  // Select sub-field
                  if (itemField.type === "select") {
                    const options = (itemField.options ?? []).map((opt) =>
                      String(opt),
                    );
                    return (
                      <View
                        key={`${fieldKey}-${idx}-${itemField.key}`}
                        className="gap-1.5"
                      >
                        <Text className="text-xs font-medium text-muted-foreground">
                          {itemLabel}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {options.map((option) => {
                            const selected =
                              String(itemValue ?? "") === option;
                            return (
                              <TouchableOpacity
                                key={`${fieldKey}-${idx}-${itemField.key}-${option}`}
                                onPress={() =>
                                  updateObjectListItem(
                                    fieldKey,
                                    idx,
                                    itemField.key,
                                    option,
                                  )
                                }
                                className={`rounded-full border px-3 py-1.5 ${
                                  selected
                                    ? "bg-primary border-primary"
                                    : "bg-background border-border"
                                }`}
                                activeOpacity={0.85}
                              >
                                <Text
                                  className={
                                    selected
                                      ? "text-xs font-semibold text-primary-foreground"
                                      : "text-xs text-muted-foreground"
                                  }
                                >
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }

                  // Toggle sub-field
                  if (itemField.type === "toggle") {
                    const selected = toBoolean(itemValue);
                    return (
                      <View
                        key={`${fieldKey}-${idx}-${itemField.key}`}
                        className="gap-1.5"
                      >
                        <Text className="text-xs font-medium text-muted-foreground">
                          {itemLabel}
                        </Text>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() =>
                              updateObjectListItem(
                                fieldKey,
                                idx,
                                itemField.key,
                                true,
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 ${
                              selected
                                ? "bg-primary border-primary"
                                : "bg-background border-border"
                            }`}
                            activeOpacity={0.85}
                          >
                            <Text
                              className={
                                selected
                                  ? "text-xs font-semibold text-primary-foreground"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              Yes
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              updateObjectListItem(
                                fieldKey,
                                idx,
                                itemField.key,
                                false,
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 ${
                              !selected
                                ? "bg-primary border-primary"
                                : "bg-background border-border"
                            }`}
                            activeOpacity={0.85}
                          >
                            <Text
                              className={
                                !selected
                                  ? "text-xs font-semibold text-primary-foreground"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              No
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  // Date sub-field
                  if (itemField.type === "date") {
                    return (
                      <View
                        key={`${fieldKey}-${idx}-${itemField.key}`}
                        className="gap-1.5"
                      >
                        <Text className="text-xs font-medium text-muted-foreground">
                          {itemLabel}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            openDatePicker(itemField.key, itemLabel, {
                              listFieldKey: fieldKey,
                              rowIndex: idx,
                              itemKey: itemField.key,
                              currentValue: itemValue,
                            })
                          }
                          className="bg-background border border-border rounded-xl px-3 py-2"
                          activeOpacity={0.85}
                        >
                          <Text
                            className={
                              itemValue
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {formatDateLabel(
                              itemValue as string,
                              "Select date",
                            )}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  // Default: text / multiline input
                  return (
                    <View
                      key={`${fieldKey}-${idx}-${itemField.key}`}
                      className="gap-1.5"
                    >
                      <Text className="text-xs font-medium text-muted-foreground">
                        {itemLabel}
                      </Text>
                      <TextInput
                        className="bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder={itemField.placeholder ?? ""}
                        placeholderTextColor="rgb(162 162 168)"
                        value={String(itemValue ?? "")}
                        onChangeText={(t) =>
                          updateObjectListItem(fieldKey, idx, itemField.key, t)
                        }
                        multiline={itemField.type === "multiline"}
                        style={
                          itemField.type === "multiline"
                            ? {
                                minHeight: 80,
                                textAlignVertical: "top" as const,
                              }
                            : undefined
                        }
                        keyboardType={
                          itemField.type !== "multiline" &&
                          isNumericField(itemField.key)
                            ? "numeric"
                            : "default"
                        }
                        returnKeyType={
                          itemField.type === "multiline" ? "default" : "done"
                        }
                      />
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={collapseItem}
                  activeOpacity={0.85}
                  className="bg-primary rounded-xl py-2.5 items-center mt-1"
                >
                  <Text className="text-sm font-semibold text-primary-foreground">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // Collapsed row
          return (
            <SwipeToDeleteRow
              key={`${fieldKey}-${idx}`}
              titleForConfirm={`${labelToSingular(label)} ${idx + 1}`}
              onDelete={() => removeObjectListItem(fieldKey, idx)}
            >
              <TouchableOpacity
                onPress={() => expandItem(fieldKey, idx)}
                activeOpacity={0.85}
                className="rounded-xl border border-border bg-card px-4 py-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-sm text-foreground flex-1 mr-3"
                  numberOfLines={1}
                >
                  {getItemSummary(item, itemFields)}
                </Text>
                <Text className="text-base text-muted-foreground">
                  {"\u203A"}
                </Text>
              </TouchableOpacity>
            </SwipeToDeleteRow>
          );
        })}

        <TouchableOpacity
          onPress={() => {
            collapseItem();
            addObjectListItem(fieldKey, itemFields);
            // Note: expandItem will be triggered by the parent after the new item is added.
            // We rely on the parent setExpandedItem being called with the next index.
            expandItem(fieldKey, items.length);
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
