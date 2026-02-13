import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Edit, Plus } from "lucide-react-native";

export type NotesModuleProps = {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  value: string;
  setValue: (next: string) => void;
  dirty: boolean;
  markDirty: () => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  emptyText?: string;
};

export default function NotesModule({
  title,
  isEditing,
  onEdit,
  value,
  setValue,
  dirty,
  markDirty,
  onSave,
  onCancel,
  placeholder = "Add notes...",
  emptyText = "No info added yet.",
}: NotesModuleProps) {
  const isEmpty = !value?.trim();

  return (
    <View className="gap-3 pt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">{title}</Text>
        <TouchableOpacity onPress={onEdit} className="flex-row items-center gap-2">
          <Edit size={16} className="text-primary" />
          <Text className="text-primary font-medium text-sm">Edit</Text>
        </TouchableOpacity>
      </View>

      {!isEditing && (
        <View className="gap-3">
          <View className="bg-card border border-border rounded-xl p-3">
            <Text className="text-muted-foreground">{isEmpty ? emptyText : value}</Text>
          </View>
          {isEmpty && (
            <TouchableOpacity
              onPress={onEdit}
              className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg"
            >
              <Plus size={16} className="text-primary" />
              <Text className="text-primary font-medium">Add {title}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isEditing && (
        <>
          <TextInput
            className="bg-muted/50 rounded-lg p-3 text-foreground min-h-[120px]"
            multiline
            value={value}
            onChangeText={(text) => {
              setValue(text);
              markDirty();
            }}
            placeholder={placeholder}
            placeholderTextColor="rgb(148 163 184)"
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onSave}
              disabled={!dirty}
              className={`flex-1 rounded-xl py-3 items-center ${
                dirty ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text
                className={`font-semibold ${dirty ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
