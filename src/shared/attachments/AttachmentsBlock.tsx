import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Paperclip } from "lucide-react-native";

import type { Attachment } from "@/shared/attachments/attachment.model";
import AttachmentSourceSheet from "@/shared/attachments/AttachmentSourceSheet";

type Props = {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  initialAttachment?: Attachment | null;
};

export default function AttachmentsBlock({ attachments, onChange, initialAttachment }: Props) {
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const handleAdd = React.useCallback(
    (attachment: Attachment) => {
      const exists = (attachments || []).some((a) => a.uri === attachment.uri && a.fileName === attachment.fileName);
      if (exists) return;
      onChange([...(attachments || []), attachment]);
    },
    [attachments, onChange]
  );

  const handleRemove = React.useCallback(
    (attachmentId: string) => {
      onChange((attachments || []).filter((a) => a.id !== attachmentId));
    },
    [attachments, onChange]
  );

  React.useEffect(() => {
    if (!initialAttachment) return;
    handleAdd(initialAttachment);
  }, [handleAdd, initialAttachment]);

  return (
    <View className="mt-6 rounded-xl border border-border bg-card p-4">
      <Text className="text-base font-semibold text-foreground">Attachments</Text>

      <TouchableOpacity
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
        className="mt-3 flex-row items-center justify-center rounded-xl border border-border bg-background px-4 py-3"
      >
        <Paperclip size={16} className="text-foreground" />
        <Text className="ml-2 text-sm font-semibold text-foreground">Add attachment</Text>
      </TouchableOpacity>

      <View className="mt-3 gap-2">
        {(attachments || []).length > 0 &&
          attachments.map((attachment) => (
            <View key={attachment.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Text className="text-sm text-foreground">{attachment.fileName || "Attachment"}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{attachment.source}</Text>
              <TouchableOpacity onPress={() => handleRemove(attachment.id)} className="mt-2 self-start" activeOpacity={0.85}>
                <Text className="text-xs font-medium text-destructive">Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>

      <AttachmentSourceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPicked={handleAdd}
        title="Add Attachment"
      />
    </View>
  );
}
