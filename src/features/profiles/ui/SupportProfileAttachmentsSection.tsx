import React from "react";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Paperclip } from "lucide-react-native";

import type { Attachment } from "@/shared/attachments/attachment.model";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";
import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";

type Props = {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
};

export default function SupportProfileAttachmentsSection({ attachments, onChange }: Props) {
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null);
  const [titleDraft, setTitleDraft] = React.useState("");

  const handlePicked = (attachment: Attachment) => {
    setPendingAttachment(attachment);
    setTitleDraft("");
    setSheetVisible(false);
  };

  const handleConfirmTitle = () => {
    if (!pendingAttachment) return;
    const titled: Attachment = {
      ...pendingAttachment,
      title: titleDraft.trim() || pendingAttachment.fileName,
    };
    const exists = attachments.some((a) => a.id === titled.id);
    if (!exists) {
      onChange([...attachments, titled]);
    }
    setPendingAttachment(null);
    setTitleDraft("");
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setPendingAttachment(null);
    setTitleDraft("");
    Keyboard.dismiss();
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <View className="mt-4 gap-3">
      {/* Pending title input */}
      {pendingAttachment && (
        <View className="rounded-2xl border border-border bg-card px-4 pt-4 pb-3">
          <Text className="text-xs font-medium text-muted-foreground mb-2">
            Name this attachment
          </Text>
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            placeholder={pendingAttachment.fileName || "Attachment title"}
            placeholderTextColor="rgb(162 162 168)"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirmTitle}
            className="text-[17px] text-foreground border-b border-border pb-2"
          />
          <View className="flex-row justify-between items-center mt-3">
            <TouchableOpacity onPress={handleCancel} activeOpacity={0.85} hitSlop={8}>
              <Text className="text-sm text-muted-foreground font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmTitle} activeOpacity={0.85} hitSlop={8}>
              <Text className="text-sm text-primary font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Attachment rows */}
      {attachments.length > 0 && (
        <View className="rounded-2xl border border-border bg-card overflow-hidden">
          {attachments.map((att, idx) => (
            <View key={att.id} className={idx === 0 ? "" : "border-t border-border"}>
              <SwipeToDeleteRow
                titleForConfirm={att.title || att.fileName || "attachment"}
                onDelete={() => handleRemove(att.id)}
              >
                <View className="flex-row items-center px-4 py-3 gap-3">
                  <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                    <Paperclip size={15} className="text-muted-foreground" />
                  </View>
                  <Text className="flex-1 text-[15px] text-foreground" numberOfLines={1}>
                    {att.title || att.fileName || "Attachment"}
                  </Text>
                </View>
              </SwipeToDeleteRow>
            </View>
          ))}
        </View>
      )}

      {/* Apple-ish Add Attachments button */}
      <TouchableOpacity
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
        className="flex-row items-center justify-center rounded-2xl border border-border bg-card px-4 py-4"
      >
        <Paperclip size={16} className="text-foreground" />
        <Text className="ml-2 text-[15px] font-semibold text-foreground">Add Attachments</Text>
      </TouchableOpacity>

      <AttachmentSourceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPicked={handlePicked}
        title="Add Attachment"
      />
    </View>
  );
}
