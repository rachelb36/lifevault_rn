// app/(vault)/contacts/index.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Plus,
  Phone,
  Mail,
  X,
  User,
  Star,
  ChevronRight,
  MapPin,
} from "lucide-react-native";
import { cssInterop } from "nativewind";
import { useFocusEffect, useRouter } from "expo-router";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import {
  Contact,
  ContactCategory,
  deleteContact as deleteContactStorage,
  getContacts,
  saveContacts,
  getContactDisplayName,
} from "@/features/contacts/data/storage";

// Enable className styling for icons
cssInterop(Search, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(Plus, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(Phone, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(Mail, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(X, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(Star, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(ChevronRight, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(MapPin, { className: { target: "style", nativeStyleToProp: { color: true } } });

// Types
type CategoryType = "All" | ContactCategory;

// Categories for filtering
const CATEGORIES: CategoryType[] = [
  "All",
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

// Organization should show only for these categories
const ORG_CATEGORIES: ContactCategory[] = [
  "Medical",
  "Service Provider",
  "Insurance",
  "Legal",
  "Other",
];

// Demo seed in NEW v2 shape (safe + optional)
// NOTE: You can delete this whole block later once you have real data.
const INITIAL_CONTACTS_V2: Contact[] = [
  {
    id: "seed-1",
    firstName: "Emily",
    lastName: "Smith",
    organization: "Vet Clinic",
    photo:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=60",
    phone: "(555) 123-4567",
    email: "dr.smith@vetclinic.com",
    categories: ["Medical"],
    linkedProfiles: [{ id: "pet-buddy", name: "Buddy", type: "pet", role: "Primary Vet" }],
    isFavorite: true,
  },
  {
    id: "seed-2",
    firstName: "Mom",
    lastName: "",
    organization: "",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60",
    phone: "(555) 987-6543",
    email: "mom@email.com",
    categories: ["Family", "Emergency"],
    linkedProfiles: [{ id: "dep-sarah", name: "Sarah Johnson", type: "person", role: "Emergency Contact" }],
    isFavorite: true,
  },
  {
    id: "seed-3",
    firstName: "City",
    lastName: "Pet Hospital",
    organization: "",
    phone: "(555) 456-7890",
    categories: ["Medical", "Emergency"],
    linkedProfiles: [{ id: "pet-whiskers", name: "Whiskers", type: "pet", role: "After Hours Care" }],
    isFavorite: false,
  },
  {
    id: "seed-4",
    firstName: "John",
    lastName: "Anderson",
    photo:
      "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=200&auto=format&fit=crop&q=60",
    phone: "(555) 321-0987",
    email: "john.work@company.com",
    categories: ["Work"],
    isFavorite: false,
  },
  {
    id: "seed-5",
    firstName: "Lincoln",
    lastName: "Elementary",
    phone: "(555) 654-3210",
    categories: ["School"],
    linkedProfiles: [{ id: "dep-tommy", name: "Tommy Johnson", type: "person", role: "School Pickup" }],
    isFavorite: false,
  },
  {
    id: "seed-6",
    firstName: "Pet",
    lastName: "Grooming Pro",
    phone: "(555) 789-0123",
    categories: ["Service Provider"],
    linkedProfiles: [{ id: "pet-buddy", name: "Buddy", type: "pet", role: "Groomer" }],
    isFavorite: false,
  },
];

export default function DirectoryScreen() {
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("All");

  const reload = useCallback(async () => {
    const list = await getContacts();

    // If empty, seed once (optional)
    if (list.length === 0) {
      await saveContacts(INITIAL_CONTACTS_V2);
      setContacts(INITIAL_CONTACTS_V2);
      return;
    }

    setContacts(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      try {
        const next = contacts.map((c) =>
          c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
        );
        setContacts(next);
        await saveContacts(next);
      } catch {
        Alert.alert("Error", "Unable to update favorite.");
      }
    },
    [contacts]
  );

  const deleteContact = useCallback((id: string) => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteContactStorage(id);
            setContacts((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Error", "Unable to delete contact.");
          }
        },
      },
    ]);
  }, []);

  // Filter contacts (v2-safe: uses firstName/lastName + organization)
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return contacts.filter((contact) => {
      const fullName = getContactDisplayName(contact);
      const matchesSearch =
        !q ||
        fullName.toLowerCase().includes(q) ||
        (contact.organization || "").toLowerCase().includes(q) ||
        (contact.phone || "").includes(searchQuery) ||
        (contact.email || "").toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All" || contact.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [contacts, searchQuery, selectedCategory]);

  const ContactItem = ({ item }: { item: Contact }) => {
    const displayName = getContactDisplayName(item) || "Unnamed Contact";

    const shouldShowOrg =
      !!item.organization?.trim() &&
      item.categories?.some((c) => ORG_CATEGORIES.includes(c));

    return (
      <TouchableOpacity
        className="bg-card rounded-2xl p-4 mb-3 border border-border active:bg-muted/50"
        onLongPress={() => deleteContact(item.id)}
        onPress={() =>
          router.push({ pathname: "/(vault)/contacts/add", params: { id: item.id } })
        }
        activeOpacity={0.9}
      >
        <View className="flex-row items-start">
          {/* Avatar */}
          <View className="w-14 h-14 rounded-full bg-muted items-center justify-center mr-4 overflow-hidden">
            {item.photo ? (
              <Image source={{ uri: item.photo }} className="w-full h-full" />
            ) : (
              <User size={24} className="text-muted-foreground" />
            )}
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-lg font-semibold text-foreground">{displayName}</Text>

                {shouldShowOrg && (
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {item.organization}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                className="p-1"
                activeOpacity={0.85}
              >
                <Star
                  size={18}
                  className={
                    item.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View className="flex-row flex-wrap gap-2 mt-2 mb-2">
              {item.categories.map((cat) => (
                <View
                  key={`${item.id}:${cat}`} // ✅ fixes key warning
                  className={`px-2 py-0.5 rounded-full ${
                    cat === "Emergency"
                      ? "bg-destructive/10"
                      : cat === "Medical" || cat === "Service Provider"
                        ? "bg-blue-500/10"
                        : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      cat === "Emergency"
                        ? "text-destructive"
                        : cat === "Medical" || cat === "Service Provider"
                          ? "text-blue-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </Text>
                </View>
              ))}
            </View>

            {/* Linked Profiles */}
            {item.linkedProfiles && item.linkedProfiles.length > 0 && (
              <View className="flex-row items-center gap-1 mb-2">
                <MapPin size={12} className="text-muted-foreground" />
                <Text className="text-xs text-muted-foreground">
                  Linked to {item.linkedProfiles.map((p) => p.name).join(", ")}
                </Text>
              </View>
            )}

            {/* Phone / Email */}
            <View className="gap-1">
              {!!item.phone && (
                <View className="flex-row items-center gap-2">
                  <Phone size={14} className="text-primary" />
                  <Text className="text-primary text-sm font-medium">{item.phone}</Text>
                </View>
              )}

              {!!item.email && (
                <View className="flex-row items-center gap-2">
                  <Mail size={14} className="text-muted-foreground" />
                  <Text className="text-muted-foreground text-sm">{item.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Chevron */}
          <ChevronRight size={20} className="text-muted-foreground ml-2" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-foreground mb-4">Directory</Text>

          {/* Search Bar */}
          <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center mb-4">
            <Search size={20} className="text-muted-foreground mr-3" />
            <TextInput
              className="flex-1 text-foreground"
              placeholder="Search contacts..."
              placeholderTextColor="rgb(168 162 158)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.85}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            keyboardShouldPersistTaps="handled"
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCategory === category
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                activeOpacity={0.85}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategory === category ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Contact List */}
        <FlatList
          data={filteredContacts}
          renderItem={ContactItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <User size={48} className="text-muted-foreground mb-4" />
              <Text className="text-foreground font-semibold mb-2">No Contacts Found</Text>
              <Text className="text-muted-foreground text-center">
                {searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search or filters"
                  : "Add your first contact to get started"}
              </Text>
            </View>
          }
        />

        {/* Add Contact FAB */}
        <TouchableOpacity
          onPress={() => router.push("/(vault)/contacts/add")}
          className="absolute bottom-24 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          activeOpacity={0.9}
        >
          <Plus size={28} className="text-primary-foreground" />
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}