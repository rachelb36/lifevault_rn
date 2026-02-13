import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, PawPrint, ChevronRight } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";

type PetProfile = {
  id: string;
  petName: string;
  kind?: string;
  kindOtherText?: string;
  breed?: string;
  breedOtherText?: string;
  avatar?: string;
};

const PETS_STORAGE_KEY = "pets_v1";

function parseList<T>(raw?: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function loadPetsFromStorage(): Promise<PetProfile[]> {
  const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
  const asyncList = parseList<PetProfile>(raw);
  if (asyncList.length > 0) return asyncList;

  const legacy = await SecureStore.getItemAsync(PETS_STORAGE_KEY);
  const legacyList = parseList<PetProfile>(legacy);
  if (legacyList.length > 0) {
    await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(legacyList));
    return legacyList;
  }

  return asyncList;
}

function normalize(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

function petDisplayName(p: PetProfile) {
  return p.petName || "Pet";
}

function petSubtitle(p: PetProfile) {
  const kind = p.kind === "Other" ? p.kindOtherText : p.kind;
  const breed = p.breed === "Other" ? p.breedOtherText : p.breed;
  const parts = [kind, breed].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" • ") : "Pet";
}

export default function PetsIndexScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const petList = await loadPetsFromStorage();
      setPets(petList);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load pets");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filteredAndSortedPets = useMemo(() => {
    const q = normalize(searchQuery);
    const filtered = pets.filter((p) => {
      if (!q) return true;
      const haystack = [p.petName, p.kind, p.kindOtherText, p.breed, p.breedOtherText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...filtered].sort((a, b) => petDisplayName(a).localeCompare(petDisplayName(b)));
  }, [pets, searchQuery]);

  const renderPetCard = ({ item }: { item: PetProfile }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(vault)/pets/${item.id}`)}
      className="bg-card border border-border rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-full bg-muted" />
      ) : (
        <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
          <PawPrint size={22} className="text-muted-foreground" />
        </View>
      )}

      <View className="flex-1 ml-4">
        <Text className="text-lg font-semibold text-foreground">{petDisplayName(item)}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5">{petSubtitle(item)}</Text>
      </View>

      <ChevronRight size={20} className="text-muted-foreground" />
    </TouchableOpacity>
  );

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Pets</Text>
          <View className="flex-row items-center gap-3">
            <ThemeToggle />
            <TouchableOpacity
              onPress={() => router.push("/(vault)/pets/add")}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
              activeOpacity={0.9}
            >
              <Plus size={20} className="text-primary-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
            <Search size={20} className="text-muted-foreground mr-3" />
            <TextInput
              className="flex-1 py-3 text-foreground"
              placeholder="Search pets..."
              placeholderTextColor="rgb(168 162 158)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-muted-foreground">Loading pets…</Text>
          </View>
        ) : loadError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-foreground font-semibold mb-2">Couldn’t load pets</Text>
            <Text className="text-muted-foreground text-center mb-6">{loadError}</Text>
            <TouchableOpacity
              onPress={reload}
              className="bg-primary rounded-xl py-3 px-8"
              activeOpacity={0.9}
            >
              <Text className="text-primary-foreground font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAndSortedPets.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
              <PawPrint size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-xl font-semibold text-foreground mb-2">No pets yet</Text>
            <Text className="text-muted-foreground text-center mb-6">
              Add pets to keep their records in one place.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(vault)/pets/add")}
              className="bg-primary rounded-xl py-3 px-8 flex-row items-center gap-2"
              activeOpacity={0.9}
            >
              <Plus size={20} className="text-primary-foreground" />
              <Text className="text-primary-foreground font-semibold">Add Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedPets}
            keyExtractor={(item) => `pet-${item.id}`}
            renderItem={renderPetCard}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshing={loading}
            onRefresh={reload}
          />
        )}
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
