/**
 * People List Screen — /(vault)/people
 *
 * Displays all person profiles as searchable cards sorted by relationship
 * rank (Self first, then family, then others). Each card shows avatar,
 * name, and relationship. Tapping a card navigates to the person detail
 * page. A floating "+" button navigates to the add-person flow.
 *
 * Route: /(vault)/people
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import { listPeopleProfiles } from "@/features/profiles/data/storage";
import type { PersonProfile } from "@/features/profiles/domain/types";

function normalize(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

function fullName(p: PersonProfile) {
  return `${p.firstName || ""} ${p.lastName || ""}`.trim();
}

function displayName(p: PersonProfile) {
  return p.preferredName?.trim() || fullName(p) || "Person";
}

function getAgeYears(dob?: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

function groupRank(p: PersonProfile) {
  if (p.isPrimary || normalize(p.relationship) === "self") return 0;
  const rel = normalize(p.relationship);
  if (["spouse", "partner", "husband", "wife"].some((x) => rel.includes(x)))
    return 1;
  if (
    ["child", "son", "daughter", "dependent", "kid"].some((x) =>
      rel.includes(x),
    )
  )
    return 3;
  return 2;
}

export default function PeopleIndexScreen() {
  const router = useRouter();
  const handleBack = () => {
    if ((router as any).canGoBack?.()) router.back();
    else router.replace("/(tabs)");
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPeople(await listPeopleProfiles());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    return [...people]
      .filter((p) => {
        if (!q) return true;
        return [p.firstName, p.lastName, p.preferredName, p.relationship]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const g = groupRank(a) - groupRank(b);
        if (g !== 0) return g;
        return displayName(a).localeCompare(displayName(b));
      });
  }, [people, searchQuery]);

  const renderCard = ({ item }: { item: PersonProfile }) => {
    const age = getAgeYears(item.dob);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(vault)/people/${item.id}` as any)}
        className="bg-card border border-border rounded-2xl p-4 flex-row items-center mb-3 active:opacity-70"
      >
        {item.avatarUri ? (
          <Image
            source={{ uri: item.avatarUri }}
            className="w-14 h-14 rounded-full bg-muted"
          />
        ) : (
          <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
            <User size={22} className="text-muted-foreground" />
          </View>
        )}

        <View className="flex-1 ml-4">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-lg font-semibold text-foreground">
              {displayName(item)}
            </Text>
            {item.isPrimary || normalize(item.relationship) === "self" ? (
              <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-primary font-semibold">
                  Primary
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm text-muted-foreground mt-0.5">
            {[item.relationship || "Person", age != null ? `Age ${age}` : ""]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>

        <ChevronRight size={20} className="text-muted-foreground" />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.85}
          >
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">People</Text>
          <View className="flex-row items-center gap-3">
            <ThemeToggle />
            <TouchableOpacity
              onPress={() => router.push("/(vault)/people/add")}
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
              placeholder="Search people..."
              placeholderTextColor="rgb(162 162 168)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-muted-foreground">Loading people…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
              <User size={40} className="text-muted-foreground" />
            </View>
            <Text className="text-xl font-semibold text-foreground mb-2">
              No people yet
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(vault)/people/add")}
              className="bg-primary rounded-xl py-3 px-8 flex-row items-center gap-2"
              activeOpacity={0.9}
            >
              <Plus size={20} className="text-primary-foreground" />
              <Text className="text-primary-foreground font-semibold">
                Add Person
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 128,
            }}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={reload}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
