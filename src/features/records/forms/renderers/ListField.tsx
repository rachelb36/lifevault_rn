import React from "react";
import { Keyboard, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { FieldRendererProps } from "./FieldRendererProps";
import FieldLabel from "./FieldLabel";
import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";
import { buildSheetCopy, isFieldFilled, safeStringArray } from "./fieldUtils";

export default function ListField({
  fieldKey,
  label,
  fieldValue,
  options: rawOptions,
  setField,
  openPickerSheet,
  inlineAdd,
  setInlineAdd,
  openInlineAdd,
  closeInlineAdd,
  commitInlineAdd,
}: FieldRendererProps) {
  const items = safeStringArray(fieldValue);
  const copy = buildSheetCopy(label);
  const options = (rawOptions ?? []).map((opt) => String(opt));
  const hasOptionCatalog = options.length > 0;
  const usePills = options.length <= 6;

  const toggleListItem = (nextItem: string) => {
    const normalized = nextItem.trim();
    if (!normalized) return;
    const exists = items.some(
      (item) => item.toLowerCase() === normalized.toLowerCase(),
    );
    if (exists) {
      setField(
        fieldKey,
        items.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      );
      return;
    }
    setField(fieldKey, [...items, normalized]);
  };

  const removeListItemAt = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    setField(fieldKey, next);
  };

  return (
    <View className="gap-2">
      <FieldLabel label={label} filled={isFieldFilled(fieldValue)} />

      <View className="bg-card border border-border rounded-xl overflow-hidden">
        {items.map((item, idx) => (
          <View
            key={`${fieldKey}-${idx}`}
            className={idx === 0 ? "" : "border-t border-border"}
          >
            <SwipeToDeleteRow
              titleForConfirm={item}
              onDelete={() => removeListItemAt(idx)}
            >
              <View className="px-4 py-3">
                <Text className="text-[17px] text-foreground">{item}</Text>
              </View>
            </SwipeToDeleteRow>
          </View>
        ))}

        {!hasOptionCatalog && inlineAdd.fieldKey === fieldKey ? (
          <View
            className={
              items.length > 0
                ? "border-t border-border px-4 py-3"
                : "px-4 py-3"
            }
          >
            <View className="bg-muted/40 border border-border rounded-xl px-3 py-2">
              <TextInput
                value={inlineAdd.draft}
                onChangeText={(t) =>
                  setInlineAdd((prev) => ({ ...prev, draft: t }))
                }
                placeholder={copy.placeholder}
                placeholderTextColor="rgb(162 162 168)"
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
                <Text className="text-[15px] text-muted-foreground font-medium">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={commitInlineAdd}
                hitSlop={10}
                disabled={!inlineAdd.draft.trim()}
              >
                <Text
                  className={
                    inlineAdd.draft.trim()
                      ? "text-[15px] text-primary font-semibold"
                      : "text-[15px] text-muted-foreground font-semibold"
                  }
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>
        ) : !hasOptionCatalog ? (
          <TouchableOpacity
            onPress={() => openInlineAdd(fieldKey, label)}
            activeOpacity={0.85}
            className={
              items.length > 0
                ? "border-t border-border px-4 py-3"
                : "px-4 py-3"
            }
          >
            <Text className="text-[17px] text-primary font-medium">
              {copy.addRowText}
            </Text>
          </TouchableOpacity>
        ) : usePills ? (
          <View
            className={
              items.length > 0
                ? "border-t border-border p-3 gap-2"
                : "p-3 gap-2"
            }
          >
            <View className="flex-row flex-wrap gap-2">
              {options.map((option) => {
                const selected = items.some(
                  (item) => item.toLowerCase() === option.toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    key={`${fieldKey}-list-opt-${option}`}
                    onPress={() => toggleListItem(option)}
                    activeOpacity={0.85}
                    className={`rounded-full border px-3 py-1.5 ${
                      selected
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
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
        ) : (
          <TouchableOpacity
            onPress={() => openPickerSheet(fieldKey, label, options, true)}
            activeOpacity={0.85}
            className={
              items.length > 0
                ? "border-t border-border px-4 py-3"
                : "px-4 py-3"
            }
          >
            <Text className="text-[17px] text-primary font-medium">+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
