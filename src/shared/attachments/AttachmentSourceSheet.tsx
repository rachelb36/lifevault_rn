import React from "react";
import { Alert, Animated, Easing, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Camera, ChevronRight, FileText, Image as ImageIcon, Pencil } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Attachment } from "@/shared/attachments/attachment.model";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPicked: (attachment: Attachment) => void;
  title?: string;
  onManual?: () => void;
};

function buildAttachment(input: {
  uri: string;
  fileName?: string;
  mimeType?: string;
  source: Attachment["source"];
}): Attachment {
  return {
    id: `att_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    uri: input.uri,
    fileName: input.fileName || "attachment",
    mimeType: input.mimeType || "application/octet-stream",
    source: input.source,
    createdAt: new Date().toISOString(),
  };
}

export default function AttachmentSourceSheet({
  visible,
  onClose,
  onPicked,
  title = "Add Attachment",
  onManual,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(320)).current;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: 320,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [translateY, visible]);

  const pickPhotoLibrary = React.useCallback(async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      onPicked(
        buildAttachment({
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          source: "library",
        })
      );
      onClose();
    } catch (e: any) {
      Alert.alert("Attachment error", e?.message ?? "Failed to open photo library.");
    }
  }, [onClose, onPicked]);

  const pickCamera = React.useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera access needed", "Please allow camera access to take a photo.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      onPicked(
        buildAttachment({
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          source: "camera",
        })
      );
      onClose();
    } catch (e: any) {
      Alert.alert("Attachment error", e?.message ?? "Failed to open camera.");
    }
  }, [onClose, onPicked]);

  const pickFile = React.useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file?.uri) return;
      onPicked(
        buildAttachment({
          uri: file.uri,
          fileName: file.name,
          mimeType: file.mimeType,
          source: "files",
        })
      );
      onClose();
    } catch (e: any) {
      Alert.alert("Attachment error", e?.message ?? "Failed to open files.");
    }
  }, [onClose, onPicked]);

  if (!mounted) return null;

  return (
    <Portal>
      <View className="absolute inset-0 justify-end">
        <Pressable className="absolute inset-0 bg-black/35" onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY }],
            paddingBottom: Math.max(insets.bottom, 12),
          }}
          className="px-4 pb-2"
        >
          <View className="rounded-3xl border border-border bg-card overflow-hidden">
            <View className="px-5 pt-4 pb-2">
              <Text className="text-base font-semibold text-foreground">{title}</Text>
            </View>

            {onManual ? (
              <TouchableOpacity
                onPress={onManual}
                activeOpacity={0.85}
                className="px-5 py-4 border-t border-border flex-row items-center justify-between"
              >
                <Text className="text-base text-foreground">Enter manually</Text>
                <Pencil size={18} className="text-muted-foreground" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={pickPhotoLibrary}
              activeOpacity={0.85}
              className="px-5 py-4 border-t border-border flex-row items-center justify-between"
            >
              <Text className="text-base text-foreground">Photo Library</Text>
              <ImageIcon size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickCamera}
              activeOpacity={0.85}
              className="px-5 py-4 border-t border-border flex-row items-center justify-between"
            >
              <Text className="text-base text-foreground">Take Photo</Text>
              <Camera size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFile}
              activeOpacity={0.85}
              className="px-5 py-4 border-t border-border flex-row items-center justify-between"
            >
              <Text className="text-base text-foreground">Choose File</Text>
              <FileText size={18} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="mt-3 rounded-2xl border border-border bg-background px-5 py-4 flex-row items-center justify-center"
          >
            <Text className="text-base font-semibold text-foreground">Cancel</Text>
            <ChevronRight size={0} className="text-transparent" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Portal>
  );
}
