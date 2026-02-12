// app/pet-detail.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar, Heart, PawPrint, Share2, User as UserIcon } from "lucide-react-native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

import RecordSection, { LifeVaultRecord } from "@/ui/records/RecordSection";
import { CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";

type PetProfile = {
  id: string;
  petName: string;
  kind: string;
  kindOtherText?: string;
  dob?: string;
  breed?: string;
  avatar?: string;
};

const PETS_STORAGE_KEY = "pets_v1";

/**
 * Records storage (local-only demo path)
 * We store per-pet records under: records_v1:<petId>
 */
const petRecordsKey = (petId: string) => `records_v1:${petId}`;

async function listPetRecords(petId: string): Promise<LifeVaultRecord[]> {
  const raw = await AsyncStorage.getItem(petRecordsKey(petId));
  const arr = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(arr) ? arr : [];

  return list.map((r: any) => ({
    id: String(r.id),
    recordType: r.recordType,
    title: r.title ?? null,
    updatedAt: r.updatedAt ?? null,
  }));
}

async function findPet(petId: string): Promise<PetProfile | null> {
  const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const arr = Array.isArray(list) ? list : [];
  const found = arr.find((p: any) => String(p.id) === String(petId));
  return found ? (found as PetProfile) : null;
}

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const petId = Array.isArray(id) ? id[0] : id;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Records
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);

  const [showShareModal, setShowShareModal] = useState(false);

  const displayName = useMemo(() => pet?.petName?.trim() || "Pet", [pet?.petName]);

  const kindLabel = useMemo(() => {
    const base = pet?.kind?.trim();
    if (!base) return pet?.kindOtherText?.trim() || "Pet";
    if (base.toLowerCase() === "other") return pet?.kindOtherText?.trim() || "Other";
    return base;
  }, [pet?.kind, pet?.kindOtherText]);

  const ageLabel = useMemo(() => {
    if (!pet?.dob) return "";
    const d = new Date(pet.dob);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? `Age ${age}` : "";
  }, [pet?.dob]);

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "—"}`,
          `Kind: ${kindLabel || "—"}`,
          `Breed: ${pet?.breed || "—"}`,
          `Date of Birth: ${pet?.dob || "—"}`,
          ageLabel ? `Age: ${ageLabel.replace("Age ", "")}` : "Age: —",
        ].join("\n"),
      },
    ];
  }, [displayName, kindLabel, pet?.breed, pet?.dob, ageLabel]);

  const refreshPet = useCallback(async () => {
    if (!petId) return;
    const found = await findPet(String(petId));
    setPet(found);
  }, [petId]);

  const refreshRecords = useCallback(async () => {
    if (!petId) return;
    const next = await listPetRecords(String(petId));
    setRecords(next);
  }, [petId]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!petId) return;
        const found = await findPet(String(petId));
        if (cancelled) return;
        setPet(found);

        const next = await listPetRecords(String(petId));
        if (cancelled) return;
        setRecords(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [petId]);

  // Refresh when screen focused (so returning from add/edit updates UI)
  useFocusEffect(
    useCallback(() => {
      refreshPet();
      refreshRecords();
    }, [refreshPet, refreshRecords])
  );

  if (loading) {
    return (
      <KeyboardDismiss>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-muted-foreground mt-3">Loading…</Text>
          </View>
        </SafeAreaView>
      </KeyboardDismiss>
    );
  }

  // If pet is missing (bad id), show a simple state
  if (!pet) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Pet Details</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">Pet not found</Text>
          <Text className="mt-2 text-muted-foreground text-center">
            This pet may have been deleted or the link is invalid.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/dependents")}
            className="mt-6 bg-primary rounded-xl py-3 px-5"
            activeOpacity={0.85}
          >
            <Text className="text-primary-foreground font-semibold">Back to Dependents</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={24} className="text-foreground" />
          </Pressable>

          <Text className="text-lg font-semibold text-foreground">Pet Details</Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setShowShareModal(true)} hitSlop={10}>
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
          {/* Pet Card */}
          <View className="p-6">
            <View className="bg-card rounded-2xl p-6 items-center shadow-sm">
              {pet.avatar ? (
                <Image
                  source={{ uri: pet.avatar }}
                  className="w-24 h-24 rounded-full mb-4"
                  style={{ borderWidth: 3, borderColor: "rgb(244 244 245)" }}
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-full mb-4 bg-muted items-center justify-center"
                  style={{ borderWidth: 3, borderColor: "rgb(244 244 245)" }}
                >
                  <PawPrint size={32} className="text-muted-foreground" />
                </View>
              )}

              <Text className="text-2xl font-bold text-foreground mb-1">{displayName}</Text>
              <Text className="text-muted-foreground mb-1">{pet.breed || "Breed not set"}</Text>
              <Text className="text-sm text-muted-foreground mb-4">Kind: {kindLabel}</Text>

              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Heart size={14} className="text-primary" fill="rgb(251 113 133)" />
                  <Text className="text-sm text-primary font-medium">Beloved Pet</Text>
                </View>

                <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{ageLabel || "Age N/A"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Records */}
          <View className="px-6">
            <Text className="text-lg font-semibold text-foreground mb-2">Information</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Add and edit pet records by category (vet records, documents, insurance, etc).
            </Text>

            {CATEGORY_ORDER.map((category) => (
              <RecordSection
                key={category}
                category={category as RecordCategory}
                records={records}
                onAdd={(recordType) => {
                  router.push({
                    pathname: "/pets/[petId]/records/add",
                    params: { petId: String(petId), recordType },
                  } as any);
                }}
                onEdit={(record) => {
                  router.push({
                    pathname: "/pets/[petId]/records/[recordId]/edit",
                    params: { petId: String(petId), recordId: record.id },
                  } as any);
                }}
                onOpen={(record) => {
                  router.push({
                    pathname: "/pets/[petId]/records/[recordId]",
                    params: { petId: String(petId), recordId: record.id },
                  } as any);
                }}
              />
            ))}
          </View>
        </ScrollView>

        <ProfileShareModal
          visible={showShareModal}
          profileName={displayName || "Pet Profile"}
          sections={shareSections}
          onClose={() => setShowShareModal(false)}
          onShare={async (sections) => {
            await shareProfilePdf(displayName || "Pet Profile", sections);
            setShowShareModal(false);
          }}
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
