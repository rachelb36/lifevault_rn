// src/shared/ui/SwipeToDeleteRow.tsx
import React, { ReactNode, useMemo, useRef } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type Props = {
  children: ReactNode;
  titleForConfirm: string;
  onDelete: () => Promise<void> | void;
  disabled?: boolean;
};

export default function SwipeToDeleteRow({ children, titleForConfirm, onDelete, disabled }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRight = useMemo(() => {
    return () => (
      <View className="h-full justify-center pr-3">
        <Pressable
          disabled={disabled}
          onPress={() => {
            // close swipe first so UI feels clean
            swipeRef.current?.close();

            Alert.alert(
              "Delete",
              `Delete ${titleForConfirm}? This can’t be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await onDelete();
                    } catch (e: any) {
                      Alert.alert("Delete failed", e?.message ?? "Unknown error");
                    }
                  },
                },
              ]
            );
          }}
          className={`rounded-xl px-4 py-3 ${disabled ? "bg-muted" : "bg-destructive"}`}
        >
          <Text className={`${disabled ? "text-muted-foreground" : "text-destructive-foreground"} font-semibold`}>
            Delete
          </Text>
        </Pressable>
      </View>
    );
  }, [disabled, onDelete, titleForConfirm]);

  return (
    <Swipeable
      ref={swipeRef}
      enabled={!disabled}
      rightThreshold={32}
      friction={2}
      overshootRight={false}
      renderRightActions={renderRight}
    >
      {children}
    </Swipeable>
  );
}