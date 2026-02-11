import React from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

type KeyboardDismissProps = {
  children: React.ReactNode;
};

export default function KeyboardDismiss({ children }: KeyboardDismissProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
