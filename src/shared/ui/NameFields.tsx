import React from "react";
import { View, Text, TextInput } from "react-native";

type NameFieldsProps = {
  firstName: string;
  lastName: string;
  preferredName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPreferredNameChange: (value: string) => void;
  firstNameLabel?: string;
  lastNameLabel?: string;
  preferredNameLabel?: string;
  preferredNamePlaceholder?: string;
};

export default function NameFields({
  firstName,
  lastName,
  preferredName,
  onFirstNameChange,
  onLastNameChange,
  onPreferredNameChange,
  firstNameLabel = "First Name *",
  lastNameLabel = "Last Name *",
  preferredNameLabel = "Preferred Name (optional)",
  preferredNamePlaceholder = "What should we call them?",
}: NameFieldsProps) {
  return (
    <View className="gap-4">
      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          {firstNameLabel}
        </Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          placeholder="Enter first name"
          placeholderTextColor="rgb(113 113 122)"
          value={firstName}
          onChangeText={onFirstNameChange}
          autoCapitalize="words"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          {lastNameLabel}
        </Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          placeholder="Enter last name"
          placeholderTextColor="rgb(113 113 122)"
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          {preferredNameLabel}
        </Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
          placeholder={preferredNamePlaceholder}
          placeholderTextColor="rgb(113 113 122)"
          value={preferredName}
          onChangeText={onPreferredNameChange}
          autoCapitalize="words"
        />
      </View>
    </View>
  );
}
