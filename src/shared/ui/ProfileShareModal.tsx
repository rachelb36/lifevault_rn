import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Check } from "lucide-react-native";
import { ShareSection } from "@/shared/share/profilePdf";

type Props = {
  visible: boolean;
  profileName: string;
  sections: ShareSection[];
  onClose: () => void;
  onShare: (selected: ShareSection[]) => void;
};

export default function ProfileShareModal({ visible, profileName, sections, onClose, onShare }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    setSelectedIds(new Set(sections.map((s) => s.id)));
  }, [visible, sections]);

  const selectedList = useMemo(() => sections.filter((s) => selectedIds.has(s.id)), [sections, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-background rounded-2xl p-6">
          <Text className="text-lg font-semibold text-foreground mb-1">Share {profileName}</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Select the categories to include in the PDF.
          </Text>

          <ScrollView className="max-h-80" contentContainerStyle={{ gap: 10 }} keyboardShouldPersistTaps="handled">
            {sections.map((section) => {
              const checked = selectedIds.has(section.id);
              return (
                <Pressable
                  key={section.id}
                  onPress={() => toggle(section.id)}
                  className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3"
                >
                  <Text className="text-foreground font-medium">{section.title}</Text>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      checked ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    {checked && <Check size={14} className="text-primary-foreground" />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={onClose}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onShare(selectedList)}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              <Text className="text-primary-foreground font-semibold">Create PDF</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
