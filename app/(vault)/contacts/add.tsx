import React, { useEffect, useMemo, useState } from "react";
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

const DEPENDENTS_STORAGE_KEY = "dependents_v1";

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
              <TouchableOpacity onPress={() => setIsOpen(false)}>
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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategory | "">("");
  const [linkedProfiles, setLinkedProfiles] = useState<LinkedProfile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<LinkedProfile[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);

  const title = editing ? "Edit Contact" : "Add Contact";
  const primaryCategory = category || "Other";

  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      const [fn, ln, pn, rawDependents] = await Promise.all([
        SecureStore.getItemAsync("userFirstName"),
        SecureStore.getItemAsync("userLastName"),
        SecureStore.getItemAsync("userPreferredName"),
        SecureStore.getItemAsync(DEPENDENTS_STORAGE_KEY),
      ]);

      if (cancelled) return;

      const userName = (pn || `${fn || ""} ${ln || ""}`.trim() || "Primary User").trim();
      const list: LinkedProfile[] = [{ id: "primary", name: userName, type: "user" }];

      if (rawDependents) {
        try {
          const parsed = JSON.parse(rawDependents);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const display = (p.preferredName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).trim();
              if (display) {
                list.push({ id: p.id || display, name: display, type: "dependent" });
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

  useEffect(() => {
    let cancelled = false;

    const loadContact = async () => {
      if (!id) return;
      const all = await getContacts();
      const found = all.find((c) => c.id === id);
      if (!found || cancelled) return;

      setEditing(found);
      setName(found.name);
      setPhone(found.phone);
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

  const toggleLinked = (p: LinkedProfile) => {
    setLinkedProfiles((prev) =>
      prev.find((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Name and phone are required.");
      return;
    }
    if (!category) {
      Alert.alert("Required", "Please select a category.");
      return;
    }

    const payload: Omit<Contact, "id"> & { id?: string } = {
      id: editing?.id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      categories: [primaryCategory],
      linkedProfiles: linkedProfiles.length ? linkedProfiles : undefined,
      isFavorite: editing?.isFavorite ?? false,
    };

    await upsertContact(payload);
    router.back();
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="active:opacity-70">
          <Text className="text-muted-foreground">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <TouchableOpacity onPress={handleSave} className="active:opacity-70">
          <Text className="text-primary font-semibold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Name *</Text>
          <TextInput
            className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Enter name"
            placeholderTextColor="rgb(168 162 158)"
            value={name}
            onChangeText={setName}
          />
        </View>

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

        <CustomSelect
          label="Category *"
          value={category}
          options={CATEGORIES}
          placeholder="Select category"
          onSelect={(val) => setCategory(val as ContactCategory)}
        />

        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-2">
            Link to User or Loved Ones (Optional)
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
                >
                  <Text
                    className={`text-xs ${
                      selected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          className="bg-primary rounded-xl py-4 items-center"
        >
          <Text className="text-primary-foreground font-semibold text-base">Save Contact</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
