import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Image, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { gql, useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { User as UserIcon, PawPrint, Plus } from "lucide-react-native";

type DependentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  dob?: string;
  avatar?: string;
  isPrimary?: boolean;
};

type PetProfile = {
  id: string;
  petName: string;
  kind?: string;
  kindOtherText?: string;
  dob?: string;
  avatar?: string;
};

type HouseholdItem =
  | {
      id: string;
      type: "user" | "dependent";
      name: string;
      relationship?: string;
      dob?: string;
      avatar?: string;
    }
  | {
      id: string;
      type: "pet";
      name: string;
      kind?: string;
      dob?: string;
      avatar?: string;
    };

const ME = gql`
  query Me {
    me {
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

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

async function loadFromStorage<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  const asyncList = parseList<T>(raw);
  if (asyncList.length > 0) return asyncList;

  const legacy = await SecureStore.getItemAsync(key);
  const legacyList = parseList<T>(legacy);
  if (legacyList.length > 0) {
    await AsyncStorage.setItem(key, JSON.stringify(legacyList));
    return legacyList;
  }

  return asyncList;
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

export function HouseholdList() {
  const router = useRouter();
  const { data, refetch } = useQuery(ME, { fetchPolicy: "network-only" });
  const user = data?.me?.user;

  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLocal = useCallback(async () => {
    const [deps, p] = await Promise.all([
      loadFromStorage<DependentProfile>(DEPENDENTS_STORAGE_KEY),
      loadFromStorage<PetProfile>(PETS_STORAGE_KEY),
    ]);
    setDependents(deps);
    setPets(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocal();
    }, [loadLocal])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetch(), loadLocal()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadLocal]);

  const items = useMemo<HouseholdItem[]>(() => {
    const list: HouseholdItem[] = [];
    if (user) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      list.push({
        id: `user-${user.id}`,
        type: "user",
        name: name || "Primary User",
        relationship: "Primary",
      });
    }

    dependents.forEach((d) => {
      const name = d.preferredName || `${d.firstName} ${d.lastName}`.trim();
      list.push({
        id: d.id,
        type: "dependent",
        name,
        relationship: d.relationship,
        dob: d.dob,
        avatar: d.avatar,
      });
    });

    pets.forEach((p) => {
      list.push({
        id: p.id,
        type: "pet",
        name: p.petName,
        kind: p.kind || p.kindOtherText,
        dob: p.dob,
        avatar: p.avatar,
      });
    });

    return list;
  }, [user, dependents, pets]);

  const renderAvatar = (item: HouseholdItem) => {
    if (item.avatar) {
      return <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full bg-muted" />;
    }
    if (item.type === "pet") {
      return (
        <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
          <PawPrint size={20} className="text-muted-foreground" />
        </View>
      );
    }
    return (
      <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
        <UserIcon size={20} className="text-muted-foreground" />
      </View>
    );
  };

  const renderSubtitle = (item: HouseholdItem) => {
    if (item.type === "pet") {
      const age = getAgeYears(item.dob);
      const parts = [item.kind || "Pet"];
      if (age !== null) parts.push(`Age ${age}`);
      return parts.join(" • ");
    }

    const age = getAgeYears(item.dob);
    const parts = [item.relationship || "Loved One"];
    if (age !== null) parts.push(`Age ${age}`);
    return parts.join(" • ");
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 8, gap: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={null}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            if (item.type === "user") router.push("/(vault)/me?primary=true");
            else if (item.type === "dependent") router.push(`/(vault)/people/${item.id}`);
            else router.push(`/(vault)/pets/${item.id}`);
          }}
          className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center"
          activeOpacity={0.85}
        >
          {renderAvatar(item)}
          <View className="ml-4 flex-1">
            <Text className="text-base font-semibold text-foreground">{item.name}</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {renderSubtitle(item)}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          onPress={() => router.push("/(vault)/people/add")}
          className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center"
          activeOpacity={0.85}
        >
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
            <Plus size={18} className="text-primary" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-base font-semibold text-foreground">Add Profile</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Add a loved one or a pet
            </Text>
          </View>
        </TouchableOpacity>
      }
      ListEmptyComponent={
        <View className="items-center justify-center py-16">
          <UserIcon size={48} className="text-muted-foreground mb-3" />
          <Text className="text-foreground font-semibold mb-1">No Household Yet</Text>
          <Text className="text-muted-foreground text-center">
            Add loved ones or pets to populate your household list.
          </Text>
        </View>
      }
    />
  );
}
