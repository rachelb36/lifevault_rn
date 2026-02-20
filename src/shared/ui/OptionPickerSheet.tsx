import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  fieldKey: string;
  label: string;
  options: string[];
  selected: string[];
  multiSelect: boolean;
  onToggle: (option: string) => void;
  onDone: () => void;
};

export default function OptionPickerSheet({
  visible,
  label,
  options,
  selected,
  multiSelect,
  onToggle,
  onDone,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [showOtherInput, setShowOtherInput] = React.useState(false);
  const [otherInput, setOtherInput] = React.useState("");
  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    if (!visible) {
      setSearch("");
      setShowOtherInput(false);
      setOtherInput("");
    }
  }, [visible]);

  const handleOtherPill = () => {
    const next = !showOtherInput;
    setShowOtherInput(next);
    setOtherInput("");
    if (next) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const commitOtherInput = () => {
    const trimmed = otherInput.trim();
    if (trimmed) {
      onToggle(trimmed);
    }
    setOtherInput("");
    setShowOtherInput(false);
  };

  const query = search.trim().toLowerCase();
  const filteredOptions = !query
    ? options
    : options.filter((opt) => opt.toLowerCase().includes(query));

  const isSelected = (option: string) =>
    selected.some((s) => s.toLowerCase() === option.toLowerCase());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDone}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable className="flex-1 bg-black/50" onPress={onDone}>
          <Pressable
            className="mt-auto bg-background rounded-t-3xl border-t border-border"
            style={{ maxHeight: "84%" }}
            onPress={(e) => e.stopPropagation()}
          >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-3 pb-1">
            <Text className="text-lg font-semibold text-foreground flex-1 mr-4">
              {label}
            </Text>
            <TouchableOpacity onPress={onDone} activeOpacity={0.85} hitSlop={10}>
              <Text className="text-primary font-semibold text-base">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text className="text-xs text-muted-foreground px-6 pb-4">
            Select any that apply. You can update this anytime.
          </Text>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pb-10 gap-5">
              {/* Search field */}
              <TextInput
                className="bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                style={{ paddingVertical: 12 }}
                placeholder="Search options"
                placeholderTextColor="rgb(148 163 184)"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />

              {/* Scrollable list of all options as pills */}
              <View className="flex-row flex-wrap gap-2">
                {filteredOptions.map((option) => {
                  const isOther = option.toLowerCase() === "other";
                  const sel = isOther ? showOtherInput : isSelected(option);
                  return (
                    <TouchableOpacity
                      key={`opt-${option}`}
                      onPress={() => (isOther ? handleOtherPill() : onToggle(option))}
                      activeOpacity={0.8}
                      className={`flex-row items-center rounded-full border px-3 py-2 ${
                        sel
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                      style={{ gap: 5 }}
                    >
                      {sel && (
                        <Text className="text-primary text-xs font-semibold">
                          ✓
                        </Text>
                      )}
                      <Text
                        className={
                          sel
                            ? "text-xs font-semibold text-primary"
                            : "text-xs text-foreground"
                        }
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {filteredOptions.length === 0 && (
                  <Text className="text-xs text-muted-foreground py-2">
                    No matching options.
                  </Text>
                )}
              </View>

              {/* "Other" custom text input — revealed when Other pill is tapped */}
              {showOtherInput && (
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    className="flex-1 bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                    style={{ paddingVertical: 11 }}
                    placeholder="Describe your own…"
                    placeholderTextColor="rgb(148 163 184)"
                    value={otherInput}
                    onChangeText={setOtherInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={commitOtherInput}
                  />
                  <TouchableOpacity
                    onPress={commitOtherInput}
                    activeOpacity={0.85}
                    className="bg-primary rounded-xl px-4"
                    style={{ paddingVertical: 11 }}
                  >
                    <Text className="text-primary-foreground text-sm font-semibold">Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
