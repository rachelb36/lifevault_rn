import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { User as UserIcon, PawPrint, ChevronRight } from "lucide-react-native";

import SwipeToDeleteRow from "@/shared/ui/SwipeToDeleteRow";
import { deletePersonLocal, deletePetLocal } from "@/shared/utils/deleteLocalProfiles";
import { listPeopleProfiles, listPetProfiles } from "@/features/profiles/data/storage";
import type { PersonProfile, PetProfile } from "@/features/profiles/domain/types";

function safeName(first?: string, last?: string) {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || "Person";
}

function personDisplay(p: PersonProfile) {
  return p.preferredName?.trim() || safeName(p.firstName, p.lastName);
}

function petDisplay(p: PetProfile) {
  return p.petName?.trim() || "Pet";
}

function normalizeRel(r?: string) {
  return (r ?? "").trim().toLowerCase();
}

export function HouseholdList() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPeople, nextPets] = await Promise.all([listPeopleProfiles(), listPetProfiles()]);
      setPeople(nextPeople);
      setPets(nextPets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedPeople = useMemo(() => {
    const arr = [...people];

    arr.sort((a, b) => {
      const ap = a.isPrimary ? 1 : 0;
      const bp = b.isPrimary ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const ar = normalizeRel(a.relationship);
      const br = normalizeRel(b.relationship);
      if (ar !== br) return ar.localeCompare(br);

      return personDisplay(a).localeCompare(personDisplay(b));
    });

    return arr;
  }, [people]);

  const sortedPets = useMemo(() => {
    const arr = [...pets];
    arr.sort((a, b) => petDisplay(a).localeCompare(petDisplay(b)));
    return arr;
  }, [pets]);

  const PeopleHeader = () => (
    <View className="mt-2 mb-2">
      <Text className="text-xs font-semibold text-muted-foreground tracking-wider px-1">PEOPLE</Text>
    </View>
  );

  const PetsHeader = () => (
    <View className="mt-8 mb-2">
      <View className="h-px bg-border" />
      <View className="pt-3">
        <Text className="text-xs font-semibold text-muted-foreground tracking-wider px-1">PETS</Text>
      </View>
    </View>
  );

  const Row = ({ leftIcon, title, subtitle, onPress }: { leftIcon: React.ReactNode; title: string; subtitle?: string; onPress: () => void }) => {
    return (
      <Pressable onPress={onPress} className="rounded-2xl border border-border bg-card px-4 py-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center mr-3">{leftIcon}</View>

        <View className="flex-1">
          <Text className="text-foreground font-semibold">{title}</Text>
          {subtitle ? <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text> : null}
        </View>

        <ChevronRight size={18} className="text-muted-foreground" />
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
        <Text className="text-muted-foreground mt-3">Loading...</Text>
      </View>
    );
  }

  if (sortedPeople.length === 0 && sortedPets.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-foreground font-semibold">No household members yet</Text>
        <Text className="text-muted-foreground mt-2 text-center">Add a person or pet from your Dashboard.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <PeopleHeader />

      <View className="gap-3">
        {sortedPeople.map((p) => {
          const title = personDisplay(p);
          const subtitle = p.isPrimary ? "Primary" : p.relationship?.trim() || "Person";

          return (
            <SwipeToDeleteRow
              key={`person-${p.id}`}
              titleForConfirm={title}
              onDelete={async () => {
                await deletePersonLocal(String(p.id));
                await load();
              }}
            >
              <Row leftIcon={<UserIcon size={18} className="text-muted-foreground" />} title={title} subtitle={subtitle} onPress={() => router.push(`/(vault)/people/${p.id}` as any)} />
            </SwipeToDeleteRow>
          );
        })}
      </View>

      {sortedPets.length > 0 ? <PetsHeader /> : null}

      <View className="gap-3">
        {sortedPets.map((p) => {
          const title = petDisplay(p);
          const subtitle = (p.kind || p.kindOtherText || "Pet").trim();

          return (
            <SwipeToDeleteRow
              key={`pet-${p.id}`}
              titleForConfirm={title}
              onDelete={async () => {
                await deletePetLocal(String(p.id));
                await load();
              }}
            >
              <Row leftIcon={<PawPrint size={18} className="text-muted-foreground" />} title={title} subtitle={subtitle} onPress={() => router.push(`/(vault)/pets/${p.id}` as any)} />
            </SwipeToDeleteRow>
          );
        })}
      </View>
    </View>
  );
}
