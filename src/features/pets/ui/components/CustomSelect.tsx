import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ScrollView,
} from "react-native";
import { Check, ChevronDown, Search, X } from "lucide-react-native";

type Props = {
  label: React.ReactNode;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder?: string;
};

export function CustomSelect({ label, value, options, onSelect, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} className="text-muted-foreground" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center px-6">
              <View className="bg-background rounded-3xl p-6 border border-border max-h-[70%]">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-foreground">{label}</Text>
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Text className="text-primary font-semibold">Done</Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center mb-4">
                  <Search size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    className="flex-1 text-foreground"
                    placeholder="Search..."
                    placeholderTextColor="rgb(168 162 158)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    blurOnSubmit={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <X size={18} className="text-muted-foreground" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView className="max-h-[80%]" keyboardShouldPersistTaps="handled">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          onSelect(option);
                          setIsOpen(false);
                          setSearchQuery("");
                          Keyboard.dismiss();
                        }}
                        className="py-3 border-b border-border flex-row justify-between items-center"
                      >
                        <Text className="text-foreground">{option}</Text>
                        {value === option && <Check size={18} className="text-primary" />}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="py-8 items-center">
                      <Text className="text-muted-foreground">No results found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
