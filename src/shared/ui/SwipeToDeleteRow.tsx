// src/shared/ui/SwipeToDeleteRow.tsx
import React, { ReactNode, useMemo, useRef } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type Props = {
  children: ReactNode;
  titleForConfirm: string;
  onDelete: () => Promise<void> | void;
  disabled?: boolean;

  // 👇 add this
  simultaneousHandlers?: any;
};

// ✅ keep track of the currently-open row globally
let OPEN_ROW: Swipeable | null = null;

export default function SwipeToDeleteRow({
  children,
  titleForConfirm,
  onDelete,
  disabled,
  simultaneousHandlers,
}: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = useMemo(() => {
    function RightAction() {
      return (
        <View className="h-full justify-center pr-3">
          <Pressable
            disabled={disabled}
            onPress={() => {
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
    }

    RightAction.displayName = "SwipeToDeleteRightAction";
    return RightAction;
  }, [disabled, onDelete, titleForConfirm]);

  return (
    <Swipeable
      ref={swipeRef}
      enabled={!disabled}
      rightThreshold={32}
      friction={2}
      overshootRight={false}
      renderRightActions={renderRightActions}
      simultaneousHandlers={simultaneousHandlers}
      onSwipeableWillOpen={() => {
        // ✅ close any other open row
        if (OPEN_ROW && OPEN_ROW !== swipeRef.current) {
          OPEN_ROW.close();
        }
        OPEN_ROW = swipeRef.current ?? null;
      }}
      onSwipeableClose={() => {
        if (OPEN_ROW === swipeRef.current) OPEN_ROW = null;
      }}
    >
      {children}
    </Swipeable>
  );
}