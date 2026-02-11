// app/(tabs)/dependents.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, User, PawPrint, ChevronRight, X } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";

// ✅ People-only (no pets)
export type DependentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string; // Self, Spouse, Partner, Child, Mother, Father, Grandparent, Other Adult, etc.
  dob?: string; // ISO yyyy-mm-dd
  avatar?: string;
  isPrimary?: boolean; // optional convenience flag
};

const DEPENDENTS_STORAGE_KEY = "dependents_v1";
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

async function loadDependentsFromStorage(): Promise<DependentProfile[]> {
  const raw = await AsyncStorage.getItem(DEPENDENTS_STORAGE_KEY);
  const asyncList = parseList<DependentProfile>(raw);
  if (asyncList.length > 0) return asyncList;

  const legacy = await SecureStore.getItemAsync(DEPENDENTS_STORAGE_KEY);
  const legacyList = parseList<DependentProfile>(legacy);
  if (legacyList.length > 0) {
    // Migrate legacy data into AsyncStorage for future reads.
    await AsyncStorage.setItem(DEPENDENTS_STORAGE_KEY, JSON.stringify(legacyList));
    return legacyList;
  }

  return asyncList;
}

type PetProfile = {
  id: string;
  petName: string;
  kind?: string;
  kindOtherText?: string;
  breed?: string;
  breedOtherText?: string;
  avatar?: string;
};

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

function safeDate(dob?: string) {
  if (!dob) return null;
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getAgeYears(dob?: string) {
  const d = safeDate(dob);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

// Relationship classification (dependents only)
function isPrimary(p: DependentProfile) {
  if (p.isPrimary) return true;
  return normalize(p.relationship) === "self";
}

function isSpouseOrPartner(p: DependentProfile) {
  const r = normalize(p.relationship);
  return r.includes("spouse") || r.includes("partner") || r.includes("husband") || r.includes("wife");
}

function isChild(p: DependentProfile) {
  const r = normalize(p.relationship);
  return r.includes("child") || r.includes("son") || r.includes("daughter") || r.includes("dependent") || r.includes("kid");
}

function isOtherAdult(p: DependentProfile) {
  if (isPrimary(p) || isSpouseOrPartner(p) || isChild(p)) return false;

  const r = normalize(p.relationship);

  // Treat parents/grandparents/etc as "Other Adults" (your “primary’s mother” falls here)
  if (
    r.includes("mother") ||
    r.includes("father") ||
    r.includes("parent") ||
    r.includes("grand") ||
    r.includes("aunt") ||
    r.includes("uncle") ||
    r.includes("sibling") ||
    r.includes("brother") ||
    r.includes("sister") ||
    r.includes("other adult")
  ) {
    return true;
  }

  // Default any remaining person that isn’t child/spouse/self into other adults
  return true;
}

function groupRank(p: DependentProfile) {
  if (isPrimary(p)) return 0;
  if (isSpouseOrPartner(p)) return 1;
  if (isOtherAdult(p)) return 2;
  if (isChild(p)) return 3;
  return 2;
}

function alphaKey(p: DependentProfile) {
  const first = normalize(p.preferredName || p.firstName);
  const last = normalize(p.lastName);
  return `${last}::${first}`;
}

function displayName(p: DependentProfile) {
  return p.preferredName || `${p.firstName} ${p.lastName}`.trim();
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

export default function DependentsScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const [people, petList] = await Promise.all([
        loadDependentsFromStorage(),
        loadPetsFromStorage(),
      ]);
      setDependents(people);
      setPets(petList);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load loved ones");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filteredAndSortedDependents = useMemo(() => {
    const q = normalize(searchQuery);

    const filtered = dependents.filter((p) => {
      if (!q) return true;
      const haystack = [p.firstName, p.lastName, p.preferredName, p.relationship]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      const gr = groupRank(a) - groupRank(b);
      if (gr !== 0) return gr;

      const aIsChild = isChild(a);
      const bIsChild = isChild(b);

      // Children: oldest first (earlier DOB first)
      if (aIsChild && bIsChild) {
        const ad = safeDate(a.dob);
        const bd = safeDate(b.dob);
        if (ad && bd) {
          const diff = ad.getTime() - bd.getTime();
          if (diff !== 0) return diff;
        } else if (ad && !bd) {
          return -1;
        } else if (!ad && bd) {
          return 1;
        }
        return alphaKey(a).localeCompare(alphaKey(b));
      }

      // Adults: alpha by last then first
      return alphaKey(a).localeCompare(alphaKey(b));
    });

    return sorted;
  }, [dependents, searchQuery]);

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

  const subtitle = (p: DependentProfile) => {
    const age = getAgeYears(p.dob);
    const parts = [p.relationship || "Loved One"];
    if (age !== null) parts.push(`Age ${age}`);
    return parts.join(" • ");
  };

  const Avatar = ({ item }: { item: DependentProfile }) => {
    const hasAvatar = !!item.avatar;

    if (hasAvatar) {
      return <Image source={{ uri: item.avatar! }} className="w-14 h-14 rounded-full bg-muted" />;
    }

    return (
      <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
        <User size={22} className="text-muted-foreground" />
      </View>
    );
  };

  const renderDependentCard = ({ item }: { item: DependentProfile }) => (
    <TouchableOpacity
      onPress={() => router.push(`/dependent-detail?id=${item.id}`)}
      className="bg-card border border-border rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
    >
      <Avatar item={item} />

      <View className="flex-1 ml-4">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-lg font-semibold text-foreground">{displayName(item)}</Text>

          {isPrimary(item) && (
            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-primary font-semibold">Primary</Text>
            </View>
          )}
        </View>

        <Text className="text-sm text-muted-foreground mt-0.5">{subtitle(item)}</Text>
      </View>

      <ChevronRight size={20} className="text-muted-foreground" />
    </TouchableOpacity>
  );

  const renderPetCard = ({ item }: { item: PetProfile }) => (
    <TouchableOpacity
      onPress={() => router.push(`/pet-detail?id=${item.id}`)}
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

  type HouseholdRow =
    | { type: "header"; id: string; title: string }
    | { type: "person"; id: string; item: DependentProfile }
    | { type: "pet"; id: string; item: PetProfile };

  const householdRows = useMemo<HouseholdRow[]>(() => {
    const rows: HouseholdRow[] = [];
    if (filteredAndSortedDependents.length > 0) {
      rows.push({ type: "header", id: "header-people", title: "People" });
      rows.push(
        ...filteredAndSortedDependents.map((item) => ({
          type: "person",
          id: `person-${item.id}`,
          item,
        }))
      );
    }
    if (filteredAndSortedPets.length > 0) {
      rows.push({ type: "header", id: "header-pets", title: "Pets" });
      rows.push(
        ...filteredAndSortedPets.map((item) => ({
          type: "pet",
          id: `pet-${item.id}`,
          item,
        }))
      );
    }
    return rows;
  }, [filteredAndSortedDependents, filteredAndSortedPets]);

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Household Members</Text>
        <View className="flex-row items-center gap-3">
          <ThemeToggle />

          {/* Big + button opens Add Loved One chooser */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.9}
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
            placeholder="Search loved ones..."
            placeholderTextColor="rgb(168 162 158)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground">Loading dependents…</Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground font-semibold mb-2">Couldn’t load dependents</Text>
          <Text className="text-muted-foreground text-center mb-6">{loadError}</Text>
          <TouchableOpacity
            onPress={reload}
            className="bg-primary rounded-xl py-3 px-8"
            activeOpacity={0.9}
          >
            <Text className="text-primary-foreground font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : householdRows.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
            <User size={40} className="text-muted-foreground" />
          </View>
          <Text className="text-xl font-semibold text-foreground mb-2">No household members yet</Text>
          <Text className="text-muted-foreground text-center mb-6">
            Add family members so their medical info, documents, and emergency contacts are easy to find.
          </Text>

          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-xl py-3 px-8 flex-row items-center gap-2"
            activeOpacity={0.9}
          >
            <Plus size={20} className="text-primary-foreground" />
            <Text className="text-primary-foreground font-semibold">Add a Loved One</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={householdRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text className="text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                  {item.title}
                </Text>
              );
            }
            if (item.type === "person") {
              return renderDependentCard({ item: item.item });
            }
            return renderPetCard({ item: item.item });
          }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshing={loading}
          onRefresh={reload}
        />
      )}

      {/* Add Loved One modal (Loved One vs Pet) */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowAddModal(false)}>
          <Pressable
            className="bg-background rounded-t-3xl px-6 pt-4 pb-10 border-t border-border"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">Add a Loved One</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={10}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                router.push("/add-dependent");
              }}
              className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between mb-3"
              activeOpacity={0.9}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <User size={18} className="text-primary" />
                </View>
                <View>
                  <Text className="text-foreground font-semibold">Loved One</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">Primary, spouse, kids, parents, etc.</Text>
                </View>
              </View>
              <ChevronRight size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                router.push("/add-pet");
              }}
              className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between"
              activeOpacity={0.9}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  {/* Using PawPrint icon here to keep this screen pet-free visually */}
                  <PawPrint size={18} className="text-primary" />
                </View>
                <View>
                  <Text className="text-foreground font-semibold">Pet</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">Species, breed, vet, meds, etc.</Text>
                </View>
              </View>
              <ChevronRight size={18} className="text-muted-foreground" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
