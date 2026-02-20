import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, PawPrint, ChevronRight } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { listPetProfiles } from "@/features/profiles/data/storage";
import type { PetProfile } from "@/features/profiles/domain/types";

function normalize(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export default function PetsIndexScreen() {
  const router = useRouter();

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPets(await listPetProfiles());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    return [...pets]
      .filter((p) => {
        if (!q) return true;
        return [p.petName, p.kind, p.breed, p.kindOtherText].filter(Boolean).join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.petName || "").localeCompare(b.petName || ""));
  }, [pets, searchQuery]);

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Pets</Text>
          <View className="flex-row items-center gap-3">
            <ThemeToggle />
            <TouchableOpacity onPress={() => router.push("/(vault)/pets/add")} className="bg-primary w-10 h-10 rounded-full items-center justify-center" activeOpacity={0.9}>
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
            <Text className="text-muted-foreground">Loading pets...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
              <PawPrint size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-xl font-semibold text-foreground mb-2">No pets yet</Text>
            <TouchableOpacity onPress={() => router.push("/(vault)/pets/add")} className="bg-primary rounded-xl py-3 px-8 flex-row items-center gap-2" activeOpacity={0.9}>
              <Plus size={20} className="text-primary-foreground" />
              <Text className="text-primary-foreground font-semibold">Add Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(vault)/pets/${item.id}` as any)}
                className="bg-card border border-border rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
              >
                {item.avatarUri ? (
                  <Image source={{ uri: item.avatarUri }} className="w-14 h-14 rounded-full bg-muted" />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
                    <PawPrint size={22} className="text-muted-foreground" />
                  </View>
                )}

                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold text-foreground">{item.petName || "Pet"}</Text>
                  <Text className="text-sm text-muted-foreground mt-0.5">
                    {[item.kind || item.kindOtherText || "Type not set", item.breed || ""].filter(Boolean).join(" • ")}
                  </Text>
                </View>

                <ChevronRight size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            )}
            refreshing={loading}
            onRefresh={reload}
          />
        )}
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
