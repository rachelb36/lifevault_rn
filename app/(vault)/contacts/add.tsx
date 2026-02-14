// app/(vault)/contacts/add.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, Check } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import {
  Contact,
  ContactCategory,
  LinkedProfile,
  getContacts,
  upsertContact,
} from "@/features/contacts/data/storage";

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onSelect: (val: string) => void;
};

const CATEGORIES: ContactCategory[] = [
  "Medical",
  "Service Provider",
  "Emergency",
  "Family",
  "School",
  "Work",
  "Insurance",
  "Legal",
  "Other",
];

// Only show Organization for these categories
const ORG_CATEGORIES: ContactCategory[] = [
  "Medical",
  "Service Provider",
  "Insurance",
  "Legal",
  "Other",
];

const DEPENDENTS_STORAGE_KEY = "dependents_v1";
const PETS_STORAGE_KEY = "pets_v1";

const CustomSelect: React.FC<SelectProps> = ({
  label,
  value,
  options,
  placeholder,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
        activeOpacity={0.85}
      >
        <Text className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} className="text-muted-foreground" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} activeOpacity={0.85}>
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[80%]" keyboardShouldPersistTaps="handled">
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="py-3 border-b border-border flex-row justify-between items-center"
                  activeOpacity={0.85}
                >
                  <Text className="text-foreground">{opt}</Text>
                  {value === opt && <Check size={18} className="text-primary" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function AddContactScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [category, setCategory] = useState<ContactCategory | "">("");
  const [linkedProfiles, setLinkedProfiles] = useState<LinkedProfile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<LinkedProfile[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);

  const title = editing ? "Edit Contact" : "Add Contact";
  const primaryCategory = (category || "Other") as ContactCategory;

  const shouldShowOrganization = useMemo(() => {
    return !!category && ORG_CATEGORIES.includes(category as ContactCategory);
  }, [category]);

  const handleImportFromContacts = useCallback(() => {
    Alert.alert("Coming soon", "iOS Contacts import will be added here.");
  }, []);

  // Load profiles: primary user + dependents (SecureStore) + pets (AsyncStorage)
  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      const [fn, ln, pn, rawDependents, rawPets] = await Promise.all([
        SecureStore.getItemAsync("userFirstName"),
        SecureStore.getItemAsync("userLastName"),
        SecureStore.getItemAsync("userPreferredName"),
        SecureStore.getItemAsync(DEPENDENTS_STORAGE_KEY),
        AsyncStorage.getItem(PETS_STORAGE_KEY),
      ]);

      if (cancelled) return;

      const userName = (pn || `${fn || ""} ${ln || ""}`.trim() || "Primary User").trim();

      const list: LinkedProfile[] = [{ id: "primary", name: userName, type: "person" }];

      // Dependents as person
      if (rawDependents) {
        try {
          const parsed = JSON.parse(rawDependents);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const display = (
                p.preferredName ||
                `${p.firstName || ""} ${p.lastName || ""}`.trim()
              ).trim();
              if (display) {
                list.push({
                  id: String(p.id || display),
                  name: display,
                  type: "person",
                });
              }
            });
          }
        } catch {
          // ignore
        }
      }

      // Pets as pet
      if (rawPets) {
        try {
          const parsedPets = JSON.parse(rawPets);
          if (Array.isArray(parsedPets)) {
            parsedPets.forEach((pet: any) => {
              const petName = String(pet.petName || pet.name || "").trim();
              const petId = String(pet.id || petName).trim();
              if (petName && petId) {
                list.push({ id: petId, name: petName, type: "pet" });
              }
            });
          }
        } catch {
          // ignore
        }
      }

      setAvailableProfiles(list);
    };

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load contact in edit mode
  useEffect(() => {
    let cancelled = false;

    const loadContact = async () => {
      if (!id) return;

      const all = await getContacts();
      const found = all.find((c) => c.id === id);
      if (!found || cancelled) return;

      setEditing(found);

      setFirstName(found.firstName || "");
      setLastName(found.lastName || "");
      setOrganization(found.organization || "");

      setPhone(found.phone || "");
      setEmail(found.email || "");
      setCategory(found.categories?.[0] || "");
      setLinkedProfiles(found.linkedProfiles || []);
    };

    loadContact();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const linkedMap = useMemo(() => {
    const map = new Map<string, LinkedProfile>();
    linkedProfiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [linkedProfiles]);

  const toggleLinked = useCallback((p: LinkedProfile) => {
    setLinkedProfiles((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert("Required", "First name, last name, and phone are required.");
      return;
    }
    if (!category) {
      Alert.alert("Required", "Please select a category.");
      return;
    }

    const payload: Omit<Contact, "id"> & { id?: string } = {
      id: editing?.id,

      firstName: firstName.trim(),
      lastName: lastName.trim(),

      // Only persist organization when it’s relevant (keeps data clean)
      organization:
        shouldShowOrganization && organization.trim() ? organization.trim() : undefined,

      phone: phone.trim(),
      email: email.trim() || undefined,

      categories: [primaryCategory],
      linkedProfiles: linkedProfiles.length ? linkedProfiles : undefined,

      // preserve existing optional fields when editing
      isFavorite: editing?.isFavorite ?? false,
      photo: editing?.photo,
      relationship: editing?.relationship,
    };

    await upsertContact(payload);
    router.back();
  }, [
    firstName,
    lastName,
    phone,
    email,
    category,
    primaryCategory,
    linkedProfiles,
    editing,
    organization,
    shouldShowOrganization,
    router,
  ]);

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Top bar */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
            <Text className="text-muted-foreground">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-foreground">{title}</Text>

          <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
            <Text className="text-primary font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 128 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Import from iOS */}
          <TouchableOpacity
            className="bg-muted rounded-xl px-4 py-3 mb-6"
            onPress={handleImportFromContacts}
            activeOpacity={0.85}
          >
            <Text className="text-foreground font-semibold">Import from iOS Contacts</Text>
            <Text className="text-muted-foreground text-xs mt-1">
              Pull name, phone, email, and photo (if available)
            </Text>
          </TouchableOpacity>

          {/* First / Last */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">First Name *</Text>
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="First name"
              placeholderTextColor="rgb(168 162 158)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Last Name *</Text>
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Last name"
              placeholderTextColor="rgb(168 162 158)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          {/* Category */}
          <CustomSelect
            label="Category *"
            value={category}
            options={CATEGORIES}
            placeholder="Select category"
            onSelect={(val) => setCategory(val as ContactCategory)}
          />

          {/* Organization (conditional) */}
          {shouldShowOrganization && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Organization</Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Optional"
                placeholderTextColor="rgb(168 162 158)"
                value={organization}
                onChangeText={setOrganization}
              />
              <Text className="text-xs text-muted-foreground mt-2">
                Shows in Directory for {ORG_CATEGORIES.join(", ")} contacts.
              </Text>
            </View>
          )}

          {/* Phone */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Phone *</Text>
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="(555) 000-0000"
              placeholderTextColor="rgb(168 162 158)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="email@example.com"
              placeholderTextColor="rgb(168 162 158)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Linked profiles */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Link to Profiles (Optional)
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {availableProfiles.map((p) => {
                const selected = linkedMap.has(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => toggleLinked(p)}
                    className={`px-3 py-1.5 rounded-full border ${
                      selected ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                    activeOpacity={0.85}
                  >
                    <Text className={`text-xs ${selected ? "text-primary-foreground" : "text-foreground"}`}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-xs text-muted-foreground mt-3">
              Tip: You can link a contact to multiple people and pets.
            </Text>
          </View>

          {/* Save CTA */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-xl py-4 items-center"
            activeOpacity={0.9}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Save Contact
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}