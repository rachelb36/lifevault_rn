/**
 * Add / Edit Pet Screen — /(vault)/pets/add
 *
 * Creates or edits a pet's header-level profile fields: name, kind (dog,
 * cat, other), breed (with searchable modal picker for dogs/cats), and
 * avatar photo. When an `id` param is present, loads the existing profile
 * for editing; otherwise starts a blank form.
 *
 * All other pet data (daily care, behavior, medical, etc.) is managed via
 * record forms on the pet detail page.
 *
 * Route: /(vault)/pets/add?id=<optional>
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Camera, PawPrint } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";

import {
  KIND_OPTIONS,
  DOG_BREEDS,
  CAT_BREEDS,
  PET_GENDER_OPTIONS,
} from "@/features/pets/constants/options";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { formatDateLabel, parseDate, toIsoDateOnly } from "@/shared/utils/date";

import { findProfile, upsertProfile } from "@/features/profiles/data/storage";
import type { PetProfile } from "@/features/profiles/domain/types";

function normalizeKind(kind: string) {
  return kind.trim().toLowerCase();
}

export default function AddPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = Array.isArray(id) ? id[0] : id;
  const isEditing = Boolean(editId);

  // Avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Identity
  const [petName, setPetName] = useState("");
  const [kind, setKind] = useState("");
  const [kindOtherText, setKindOtherText] = useState("");
  const [breed, setBreed] = useState("");
  const [breedOtherText, setBreedOtherText] = useState("");
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedModal, setShowBreedModal] = useState(false);

  // DOB & Gender
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [dateType, setDateType] = useState<"dob" | "adoptionDate">("dob");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showAdoptionDatePicker, setShowAdoptionDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    petName?: string;
    kind?: string;
    kindOtherText?: string;
    breed?: string;
    breedOtherText?: string;
    dob?: string;
    adoptionDate?: string;
  }>({});
  const [initialSnapshot, setInitialSnapshot] = useState("");

  // Save state
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");

  const isDog = normalizeKind(kind) === "dog";
  const isCat = normalizeKind(kind) === "cat";
  const showBreedDropdown = isDog || isCat;

  const breedOptions = useMemo(() => {
    if (isDog) return DOG_BREEDS;
    if (isCat) return CAT_BREEDS;
    return [];
  }, [isDog, isCat]);

  const filteredBreedOptions = useMemo(() => {
    const query = breedSearch.trim().toLowerCase();
    if (!query) return breedOptions;
    return breedOptions.filter((option) => option.toLowerCase().includes(query));
  }, [breedOptions, breedSearch]);
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        avatarUri,
        petName,
        kind,
        kindOtherText,
        breed,
        breedOtherText,
        dob,
        gender,
        dateType,
        adoptionDate,
      }),
    [avatarUri, petName, kind, kindOtherText, breed, breedOtherText, dob, gender, dateType, adoptionDate],
  );
  const hasUnsavedChanges =
    initialSnapshot.length > 0 && initialSnapshot !== currentSnapshot;

  // Load profile if editing
  useEffect(() => {
    if (!isEditing || !editId) return;
    let cancelled = false;

    (async () => {
      const profile = await findProfile(editId);
      if (!profile || cancelled || profile.profileType !== "PET") return;

      setAvatarUri(profile.avatarUri || null);
      setPetName(profile.petName || "");
      setKind(profile.kind || "");
      setKindOtherText(profile.kindOtherText || "");
      setBreed(profile.breed || "");
      setBreedOtherText(profile.breedOtherText || "");
      setDob(profile.dob || "");
      setGender(profile.gender || "");
      setDateType((profile.dateType as "dob" | "adoptionDate") || "dob");
      setAdoptionDate(profile.adoptionDate || "");
      setInitialSnapshot(
        JSON.stringify({
          avatarUri: profile.avatarUri || null,
          petName: profile.petName || "",
          kind: profile.kind || "",
          kindOtherText: profile.kindOtherText || "",
          breed: profile.breed || "",
          breedOtherText: profile.breedOtherText || "",
          dob: profile.dob || "",
          gender: profile.gender || "",
          dateType: (profile.dateType as "dob" | "adoptionDate") || "dob",
          adoptionDate: profile.adoptionDate || "",
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing, editId]);

  useEffect(() => {
    if (!isEditing && initialSnapshot.length === 0) {
      setInitialSnapshot(
        JSON.stringify({
          avatarUri: null,
          petName: "",
          kind: "",
          kindOtherText: "",
          breed: "",
          breedOtherText: "",
          dob: "",
          gender: "",
          dateType: "dob",
          adoptionDate: "",
        }),
      );
    }
  }, [isEditing, initialSnapshot.length]);

  const pickAvatar = () => {
    const fromLibrary = async () => {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setAvatarUri(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open photo library.");
      }
    };

    const fromCamera = async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          if (!perm.canAskAgain) {
            Alert.alert(
              "Camera access needed",
              "Camera permission was denied. Please enable it in Settings.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() },
              ],
            );
          } else {
            Alert.alert("Camera access needed", "Please allow camera access to take a photo.");
          }
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setAvatarUri(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open camera.");
      }
    };

    const buttons: any[] = [
      { text: "Choose from Library", onPress: fromLibrary },
      { text: "Take Photo", onPress: fromCamera },
    ];
    if (avatarUri) {
      buttons.push({ text: "Remove Photo", style: "destructive", onPress: () => setAvatarUri(null) });
    }
    buttons.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Pet Photo", undefined, buttons);
  };

  const validate = () => {
    const nextErrors: typeof fieldErrors = {};
    if (!petName.trim()) nextErrors.petName = "Pet name is required.";
    if (!kind.trim()) nextErrors.kind = "Pet type is required.";
    if (normalizeKind(kind) === "other" && !kindOtherText.trim()) {
      nextErrors.kindOtherText = "Please specify the pet type.";
    }
    if (showBreedDropdown && !breed.trim()) nextErrors.breed = "Breed is required.";
    if (showBreedDropdown && normalizeKind(breed) === "other" && !breedOtherText.trim()) {
      nextErrors.breedOtherText = "Please specify the breed.";
    }
    if (dateType === "dob" && !dob.trim()) nextErrors.dob = "Date of birth is required.";
    if (dateType === "adoptionDate" && !adoptionDate.trim()) nextErrors.adoptionDate = "Adoption date is required.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    const valid = validate();
    if (!valid) {
      Alert.alert("Required", "Please fix highlighted fields.");
      return;
    }

    const timestamp = new Date().toISOString();

    const next: PetProfile = {
      id: editId || `pet_${Date.now()}`,
      profileType: "PET",
      createdAt: timestamp,
      updatedAt: timestamp,
      avatarUri: avatarUri || undefined,
      petName: petName.trim(),
      kind: kind.trim(),
      kindOtherText: kindOtherText.trim() || undefined,
      breed: breed.trim() || undefined,
      breedOtherText: breedOtherText.trim() || undefined,
      dob: dob.trim() || undefined,
      dateType,
      adoptionDate: adoptionDate.trim() || undefined,
      gender: gender.trim() || undefined,
    };

    await upsertProfile(next);
    setSaveLabel("saved");
    setTimeout(() => router.back(), 700);
  };

  const handleBack = () => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }
    Alert.alert(
      "Discard changes?",
      "You have unsaved changes. Leave without saving?",
      [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ],
    );
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{isEditing ? "Edit Pet" : "Add Pet"}</Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View className="items-center py-2">
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} className="relative">
              <View className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-background items-center justify-center">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-24 h-24" />
                ) : (
                  <PawPrint className="text-muted-foreground" size={42} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                <Camera size={14} className="text-primary-foreground" />
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground mt-3">Tap to add photo</Text>
          </View>

          {/* Pet Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Pet Name</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
              value={petName}
              onChangeText={(value) => {
                setPetName(value);
                setFieldErrors((prev) => ({ ...prev, petName: undefined }));
              }}
              placeholder="Enter pet name"
              placeholderTextColor="rgb(162 162 168)"
              returnKeyType="done"
            />
            {fieldErrors.petName ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.petName}</Text>
            ) : null}
          </View>

          {/* Type */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {KIND_OPTIONS.map((opt) => {
                const active = kind === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setKind(opt);
                      setBreed("");
                      setBreedOtherText("");
                      setBreedSearch("");
                      setFieldErrors((prev) => ({
                        ...prev,
                        kind: undefined,
                        kindOtherText: undefined,
                        breed: undefined,
                        breedOtherText: undefined,
                      }));
                    }}
                    className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-background border-border"}`}
                    activeOpacity={0.85}
                  >
                    <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.kind ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.kind}</Text>
            ) : null}
          </View>

          {/* Other type text */}
          {normalizeKind(kind) === "other" ? (
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Specify Type</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={kindOtherText}
                onChangeText={(value) => {
                  setKindOtherText(value);
                  setFieldErrors((prev) => ({ ...prev, kindOtherText: undefined }));
                }}
                placeholder="e.g., Rabbit"
                placeholderTextColor="rgb(162 162 168)"
                returnKeyType="done"
              />
              {fieldErrors.kindOtherText ? (
                <Text className="mt-1 text-xs text-destructive">{fieldErrors.kindOtherText}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Breed selector */}
          {showBreedDropdown ? (
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Breed</Text>
              <TouchableOpacity
                onPress={() => { setBreedSearch(""); setShowBreedModal(true); }}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                activeOpacity={0.85}
              >
                <Text className={breed ? "text-foreground" : "text-muted-foreground"}>
                  {breed || "Select breed"}
                </Text>
                <Text className="text-muted-foreground text-lg">{"\u203A"}</Text>
              </TouchableOpacity>
              {fieldErrors.breed ? (
                <Text className="mt-1 text-xs text-destructive">{fieldErrors.breed}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Other breed text */}
          {normalizeKind(breed) === "other" ? (
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Specify Breed</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={breedOtherText}
                onChangeText={(value) => {
                  setBreedOtherText(value);
                  setFieldErrors((prev) => ({ ...prev, breedOtherText: undefined }));
                }}
                placeholder="Enter breed"
                placeholderTextColor="rgb(162 162 168)"
                returnKeyType="done"
              />
              {fieldErrors.breedOtherText ? (
                <Text className="mt-1 text-xs text-destructive">{fieldErrors.breedOtherText}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Gender */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Gender</Text>
            <View className="flex-row flex-wrap gap-2">
              {PET_GENDER_OPTIONS.map((opt) => {
                const active = gender === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setGender(active ? "" : opt)}
                    className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-background border-border"}`}
                    activeOpacity={0.85}
                  >
                    <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-muted-foreground text-xs"}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Type Toggle */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Date</Text>
            <View className="flex-row gap-2 mb-3">
              {([["dob", "Date of Birth"], ["adoptionDate", "Adoption Date"]] as const).map(([key, label]) => {
                const active = dateType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setDateType(key);
                      setFieldErrors((prev) => ({ ...prev, dob: undefined, adoptionDate: undefined }));
                    }}
                    className={`flex-1 py-2 rounded-full border items-center ${active ? "bg-primary border-primary" : "bg-background border-border"}`}
                    activeOpacity={0.85}
                  >
                    <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-muted-foreground text-xs"}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {dateType === "dob" ? (
              <TouchableOpacity
                onPress={() => setShowDobPicker(true)}
                className="bg-background border border-border rounded-xl px-4 py-3"
                activeOpacity={0.85}
              >
                <Text className={dob ? "text-foreground" : "text-muted-foreground"}>
                  {formatDateLabel(dob, "Select date of birth")}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowAdoptionDatePicker(true)}
                className="bg-background border border-border rounded-xl px-4 py-3"
                activeOpacity={0.85}
              >
                <Text className={adoptionDate ? "text-foreground" : "text-muted-foreground"}>
                  {formatDateLabel(adoptionDate, "Select adoption date")}
                </Text>
              </TouchableOpacity>
            )}
            {fieldErrors.dob ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.dob}</Text>
            ) : null}
            {fieldErrors.adoptionDate ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.adoptionDate}</Text>
            ) : null}
          </View>

          {/* Cancel */}
          <View className="mt-2">
            <TouchableOpacity onPress={handleBack} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky Save button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-3 bg-background border-t border-border"
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={handleSave}
            className={`rounded-xl py-4 items-center ${saveLabel === "saved" ? "bg-green-500" : "bg-primary"}`}
            activeOpacity={0.85}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              {saveLabel === "saved" ? "Saved \u2713" : isEditing ? "Save Changes" : "Save Pet"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <DatePickerModal
        visible={showDobPicker}
        value={parseDate(dob)}
        onConfirm={(date) => {
          setDob(toIsoDateOnly(date));
          setFieldErrors((prev) => ({ ...prev, dob: undefined }));
          setShowDobPicker(false);
        }}
        onCancel={() => setShowDobPicker(false)}
        title="Date of Birth"
      />

      <DatePickerModal
        visible={showAdoptionDatePicker}
        value={parseDate(adoptionDate)}
        onConfirm={(date) => {
          setAdoptionDate(toIsoDateOnly(date));
          setFieldErrors((prev) => ({ ...prev, adoptionDate: undefined }));
          setShowAdoptionDatePicker(false);
        }}
        onCancel={() => setShowAdoptionDatePicker(false)}
        title="Adoption Date"
      />

      {/* Breed picker bottom sheet */}
      <Modal
        visible={showBreedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable className="flex-1 bg-black/50" onPress={() => setShowBreedModal(false)}>
            <Pressable
              className="mt-auto bg-background rounded-t-3xl border-t border-border"
              style={{ maxHeight: "80%" }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </View>

              <View className="flex-row items-center justify-between px-6 pt-3 pb-4">
                <Text className="text-lg font-semibold text-foreground">Select Breed</Text>
                <TouchableOpacity onPress={() => setShowBreedModal(false)} activeOpacity={0.85} hitSlop={10}>
                  <Text className="text-primary font-semibold text-base">Done</Text>
                </TouchableOpacity>
              </View>

              <View className="px-6 pb-3">
                <TextInput
                  className="bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                  style={{ paddingVertical: 12 }}
                  value={breedSearch}
                  onChangeText={setBreedSearch}
                  placeholder="Search breed"
                  placeholderTextColor="rgb(162 162 168)"
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-6 pb-10 gap-1">
                  {filteredBreedOptions.map((opt) => {
                    const active = breed === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setBreed(opt);
                          setFieldErrors((prev) => ({ ...prev, breed: undefined, breedOtherText: undefined }));
                          setShowBreedModal(false);
                        }}
                        className={`rounded-xl border px-4 py-3 ${active ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                        activeOpacity={0.85}
                      >
                        <Text className={active ? "text-sm font-semibold text-primary" : "text-sm text-foreground"}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {filteredBreedOptions.length === 0 && (
                    <Text className="text-xs text-muted-foreground py-3">No matching breeds.</Text>
                  )}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardDismiss>
  );
}
