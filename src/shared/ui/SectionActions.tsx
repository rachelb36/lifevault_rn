// src/shared/ui/SectionActions.tsx
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { MoreVertical, Trash2, Pencil } from "lucide-react-native";

type Props = {
  visible: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function SectionActions({ visible, onEdit, onDelete }: Props) {
  if (!visible) return null;

  return (
    <View className="flex-row items-center gap-3">
      {onEdit ? (
        <TouchableOpacity onPress={onEdit} hitSlop={10} activeOpacity={0.8}>
          <Pencil size={18} className="text-muted-foreground" />
        </TouchableOpacity>
      ) : null}
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} hitSlop={10} activeOpacity={0.8}>
          <Trash2 size={18} className="text-destructive" />
        </TouchableOpacity>
      ) : null}
      {/* Optional “kebab” placeholder if you want later */}
      <MoreVertical size={18} className="text-muted-foreground" />
    </View>
  );
}