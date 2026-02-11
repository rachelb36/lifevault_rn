// app/add-user.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Camera, ArrowLeft, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { gql, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";

const COMPLETE_ONBOARDING = gql`
  mutation CompleteOnboarding {
    completeOnboarding {
      user {
        id
        hasOnboarded
      }
    }
  }
`;

export default function AddUserScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [completeOnboarding, { loading: completing }] =
    useMutation(COMPLETE_ONBOARDING);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // iOS fires onChange continuously; Android closes picker after selection.
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selected) setDob(selected);
  };

  const handleSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();

    if (!fn || !ln) {
      Alert.alert("Required Fields", "Please enter your first and last name.");
      return;
    }
    if (!dob) {
      Alert.alert("Required Fields", "Please enter your date of birth.");
      return;
    }

    try {
      // 1) Mark local “user profile created” gate so login can route to tabs next time
      await SecureStore.setItemAsync("userProfileCreated", "true");

      // Optional: store some user basics locally for now (useful for UI later)
      await SecureStore.setItemAsync("userFirstName", fn);
      await SecureStore.setItemAsync("userLastName", ln);
      await SecureStore.setItemAsync("userPreferredName", preferredName.trim());
      await SecureStore.setItemAsync("userDob", dob.toISOString());

      if (photoUri) {
        await SecureStore.setItemAsync("userPhotoUri", photoUri);
      } else {
        // keep storage clean
        await SecureStore.deleteItemAsync("userPhotoUri");
      }

      // 2) Tell backend onboarding is complete (so onboarding never shows again)
      // (Safe to call even if already complete, but this keeps things consistent.)
      await completeOnboarding({
        fetchPolicy: "no-cache",
      });

      // 3) Go to tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Something went wrong",
        err?.message || "Unable to create profile. Please try again."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft className="text-foreground" size={24} />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-foreground">
          Create Your Profile
        </Text>

        <View className="w-6" />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 128,
          gap: 24,
        }}
      >
        {/* Photo Upload (UI only for now) */}
        <View className="items-center">
          <TouchableOpacity className="relative" activeOpacity={0.85}>
            <View className="w-28 h-28 rounded-full bg-muted overflow-hidden border-4 border-background">
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <User className="text-muted-foreground" size={48} />
                </View>
              )}
            </View>

            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-background">
              <Camera className="text-primary-foreground" size={16} />
            </View>
          </TouchableOpacity>

          <Text className="text-sm text-muted-foreground mt-3">
            Tap to add photo
          </Text>
        </View>

        {/* Form Fields */}
        <View className="gap-5">
          {/* First Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              First Name *
            </Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Enter first name"
              placeholderTextColor="rgb(113 113 122)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Last Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Last Name *
            </Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Enter last name"
              placeholderTextColor="rgb(113 113 122)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Preferred Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Preferred Name (optional)
            </Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="What should we call you?"
              placeholderTextColor="rgb(113 113 122)"
              value={preferredName}
              onChangeText={setPreferredName}
              autoCapitalize="words"
            />
          </View>

          {/* Relationship - Read only for user */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Relationship
            </Text>
            <View className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <Text className="text-muted-foreground text-base">Self</Text>
            </View>
          </View>

          {/* Date of Birth */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Date of Birth *
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
              activeOpacity={0.85}
            >
              <Text
                className={
                  dob
                    ? "text-foreground text-base"
                    : "text-muted-foreground text-base"
                }
              >
                {dob ? formatDate(dob) : "Select date of birth"}
              </Text>
              <Calendar className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {showDatePicker && (
              <View className="mt-3">
                <DateTimePicker
                  value={dob || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />

                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="mt-3 bg-muted rounded-xl py-3 items-center"
                    activeOpacity={0.85}
                  >
                    <Text className="text-foreground font-semibold">Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Info Note */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Text className="text-sm text-primary leading-relaxed">
            You can add additional information like medical details, emergency
            contacts, and documents after creating your profile.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-area-pb">
        <TouchableOpacity
          onPress={handleSave}
          disabled={completing}
          className="bg-primary rounded-xl py-4 items-center"
          activeOpacity={0.85}
          style={{ opacity: completing ? 0.7 : 1 }}
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {completing ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}