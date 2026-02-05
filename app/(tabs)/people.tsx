import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  User,
  PawPrint,
  ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { ThemeToggle } from "@/components/ThemeToggle";

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  type: "person" | "pet";
  avatar: string;
  species?: string;
};

const SPECIES_FILTERS = [
  "All",
  "Dogs",
  "Cats",
  "Birds",
  "Fish",
  "Reptile",
  "Small Animal",
  "Other",
];

export default function PeoplePetsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Mock data - in real app, this would come from state/storage
  const profiles: Profile[] = [
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      preferredName: "Sarah",
      relationship: "Self",
      type: "person",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "2",
      firstName: "Max",
      lastName: "Johnson",
      relationship: "Pet",
      type: "pet",
      species: "Dogs",
      avatar:
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "3",
      firstName: "David",
      lastName: "Johnson",
      relationship: "Spouse",
      type: "person",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "4",
      firstName: "Luna",
      lastName: "",
      relationship: "Pet",
      type: "pet",
      species: "Cats",
      avatar:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "5",
      firstName: "Tweety",
      lastName: "",
      relationship: "Pet",
      type: "pet",
      species: "Birds",
      avatar:
        "https://images.unsplash.com/photo-1552728089-57bdde30ebd1?w=200&auto=format&fit=crop&q=60",
    },
  ];

  const filteredProfiles = profiles.filter((profile) => {
    // Search filter
    const matchesSearch =
      profile.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.preferredName &&
        profile.preferredName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      profile.relationship.toLowerCase().includes(searchQuery.toLowerCase());

    // Species filter
    let matchesSpecies = true;
    if (selectedFilter !== "All") {
      if (profile.type === "pet") {
        matchesSpecies = profile.species === selectedFilter;
      } else {
        // People are not shown when filtering for specific species
        matchesSpecies = false;
      }
    }

    return matchesSearch && matchesSpecies;
  });

  const getDisplayName = (profile: Profile) => {
    return (
      profile.preferredName || `${profile.firstName} ${profile.lastName}`.trim()
    );
  };

  const renderProfileCard = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      onPress={() => router.push(`/profile-detail?id=${item.id}`)}
      className="bg-card border border-border rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
    >
      {/* Avatar */}
      <Image
        source={{ uri: item.avatar }}
        className="w-14 h-14 rounded-full bg-muted"
      />

      {/* Info */}
      <View className="flex-1 ml-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-foreground">
            {getDisplayName(item)}
          </Text>
          {item.type === "pet" && (
            <PawPrint size={16} className="text-muted-foreground" />
          )}
        </View>
        <Text className="text-sm text-muted-foreground mt-0.5">
          {item.relationship}
        </Text>
      </View>

      {/* Chevron */}
      <ChevronRight size={20} className="text-muted-foreground" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">
          People & Pets
        </Text>
        <View className="flex-row items-center gap-3">
          <ThemeToggle />
          <TouchableOpacity
            onPress={() => router.push("/add-profile")}
            className="bg-primary w-10 h-10 rounded-full items-center justify-center"
          >
            <Plus size={20} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
          <Search size={20} className="text-muted-foreground mr-3" />
          <TextInput
            className="flex-1 py-3 text-foreground"
            placeholder="Search profiles..."
            placeholderTextColor="rgb(168 162 158)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Species Filter Bar */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {SPECIES_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full border ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {filteredProfiles.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
            <User size={40} className="text-muted-foreground" />
          </View>
          <Text className="text-xl font-semibold text-foreground mb-2">
            No Profiles Found
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            {selectedFilter === "All"
              ? "Add family members and pets to keep all their information organized in one place."
              : `No ${selectedFilter.toLowerCase()} found matching your search.`}
          </Text>
          {selectedFilter === "All" && (
            <TouchableOpacity
              onPress={() => router.push("/add-profile")}
              className="bg-primary rounded-xl py-3 px-8 flex-row items-center gap-2"
            >
              <Plus size={20} className="text-primary-foreground" />
              <Text className="text-primary-foreground font-semibold">
                Add First Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          renderItem={renderProfileCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}