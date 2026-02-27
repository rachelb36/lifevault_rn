/**
 * Pet Detail Screen — /(vault)/pets/[petId]
 *
 * Displays a pet's profile card (avatar, name, breed, kind, age) followed
 * by flat, scannable summary rows organized by record category (Overview,
 * Basics, Medical, Daily Care, Behavior & Safety, Documents).
 *
 * Each row shows a smart summary if data exists, or "Add [Type] Information"
 * if empty. Tapping a row with data navigates to edit; tapping an empty row
 * navigates to add. The header provides settings (edit profile) and share
 * actions. Contacts are rendered separately below the record sections.
 *
 * Route: /(vault)/pets/[petId]
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Camera,
  PawPrint,
  Settings,
  Share2,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import SectionRecordRows from "@/shared/ui/SectionRecordRows";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

import { findProfile, upsertProfile } from "@/features/profiles/data/storage";
import type { PetProfile } from "@/features/profiles/domain/types";

import { PET_CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";
import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { listRecordsForEntity } from "@/features/records/data/storage";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { Contact, getContacts } from "@/features/contacts/data/storage";
import { getRecordData } from "@/shared/utils/recordData";
import { LineChart } from "react-native-gifted-charts";
import { useColorScheme } from "@/lib/useColorScheme";

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAge(dobString: string): string | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years--;
  }
  if (years < 1) {
    let months =
      (now.getFullYear() - dob.getFullYear()) * 12 +
      now.getMonth() -
      dob.getMonth();
    if (now.getDate() < dob.getDate()) months--;
    return months <= 0 ? "< 1 mo" : `${months} mo`;
  }
  return `${years} yr${years !== 1 ? "s" : ""}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PetDetailScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const resolvedPetId = Array.isArray(petId) ? petId[0] : petId;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const refresh = useCallback(async () => {
    if (!resolvedPetId) return;
    const [profile, nextRecords, allContacts] = await Promise.all([
      findProfile(resolvedPetId),
      listRecordsForEntity(resolvedPetId),
      getContacts(),
    ]);
    if (profile?.profileType === "PET") setPet(profile);
    else setPet(null);
    setRecords(nextRecords);
    setContacts(
      allContacts.filter((c) =>
        (c.linkedProfiles || []).some(
          (lp) => lp.id === resolvedPetId && lp.type === "pet",
        ),
      ),
    );
  }, [resolvedPetId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const displayName = useMemo(
    () => pet?.petName?.trim() || "Pet",
    [pet?.petName],
  );

  const kindLabel = useMemo(() => {
    if (!pet) return "Pet";
    if (pet.kind?.toLowerCase() === "other") return pet.kindOtherText || "Other";
    return pet.kind || pet.kindOtherText || "Pet";
  }, [pet]);

  const ageLabel = useMemo(() => {
    if (pet?.dob) return computeAge(pet.dob);
    if (pet?.adoptionDate) return computeAge(pet.adoptionDate);
    return null;
  }, [pet?.dob, pet?.adoptionDate]);

  const dateLabel = useMemo(() => {
    const fmt = (iso: string) => {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    if (pet?.dateType === "adoptionDate" && pet.adoptionDate) {
      return `Adopted: ${fmt(pet.adoptionDate)}`;
    }
    if (pet?.dob) return `DOB: ${fmt(pet.dob)}`;
    return null;
  }, [pet?.dateType, pet?.dob, pet?.adoptionDate]);

  const genderLabel = useMemo(() => {
    return pet?.gender || null;
  }, [pet?.gender]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const weightChartData = useMemo(() => {
    const entries = records
      .filter((r) => r.recordType === RECORD_TYPES.PET_WEIGHT_ENTRY)
      .map((r) => {
        const d = getRecordData(r);
        const w = parseFloat(String(d.weightValue || ""));
        const dateStr = String(d.measuredAt || "");
        return { weight: w, date: dateStr };
      })
      .filter((e) => Number.isFinite(e.weight) && e.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length < 2) return null;
    return entries.map((e) => ({
      value: e.weight,
      label: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [records]);

  const pickAvatar = useCallback(() => {
    if (!pet) return;

    const saveAvatar = async (uri: string | undefined) => {
      const updated = { ...pet, avatarUri: uri, updatedAt: new Date().toISOString() };
      await upsertProfile(updated);
      setPet(updated);
    };

    const fromLibrary = async () => {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          await saveAvatar(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open photo library.");
      }
    };

    const fromCamera = async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          if (!perm.canAskAgain) {
            Alert.alert("Camera access needed", "Camera permission was denied. Please enable it in Settings.", [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]);
          } else {
            Alert.alert("Camera access needed", "Please allow camera access to take a photo.");
          }
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          await saveAvatar(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open camera.");
      }
    };

    const buttons: any[] = [
      { text: "Choose from Library", onPress: fromLibrary },
      { text: "Take Photo", onPress: fromCamera },
    ];
    if (pet.avatarUri) {
      buttons.push({ text: "Remove Photo", style: "destructive", onPress: () => saveAvatar(undefined) });
    }
    buttons.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Pet Photo", undefined, buttons);
  }, [pet]);

  const visibleCategoryOrder = useMemo(
    () => PET_CATEGORY_ORDER,
    [],
  );

  const shareSections: ShareSection[] = useMemo(() => {
    const basicsRecord = records.find(
      (r) => r.recordType === RECORD_TYPES.PET_BASICS,
    );
    const basicsData = basicsRecord ? getRecordData(basicsRecord) : {};

    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "-"}`,
          `Type: ${kindLabel || "-"}`,
          `Breed: ${pet?.breed || "-"}`,
          `Gender: ${genderLabel || "-"}`,
          `Weight: ${String(basicsData.currentWeightValue || "-")} ${String(basicsData.currentWeightUnit || "")}`.trim(),
          `Microchip ID: ${String(basicsData.microchipId || "-")}`,
          dateLabel || "",
          ageLabel ? `Age: ${ageLabel}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
  }, [displayName, kindLabel, pet, records, genderLabel, dateLabel, ageLabel]);

  // ── Navigation handlers ────────────────────────────────────────────────

  const handleOpenRecord = useCallback(
    (record: LifeVaultRecord) => {
      router.push({
        pathname: "/(vault)/pets/[petId]/records/[recordId]",
        params: { petId: String(resolvedPetId), recordId: record.id },
      } as any);
    },
    [router, resolvedPetId],
  );

  const handleAddRecordType = useCallback(
    (recordType: RecordType) => {
      if (!resolvedPetId) return;

      if (isSingletonType(recordType)) {
        const existing = records.find((r) => r.recordType === recordType);
        if (existing) {
          handleOpenRecord(existing);
          return;
        }
      }

      router.push({
        pathname: "/(vault)/pets/[petId]/records/add",
        params: { petId: String(resolvedPetId), recordType },
      } as any);
    },
    [resolvedPetId, records, router, handleOpenRecord],
  );

  // ── Not found state ────────────────────────────────────────────────────

  if (!pet) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">
            Pet Details
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">Pet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </Pressable>

          <Text className="text-lg font-semibold text-foreground">
            Pet Details
          </Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(vault)/pets/add",
                  params: { id: pet.id },
                } as any)
              }
              hitSlop={10}
            >
              <Settings size={20} className="text-foreground" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowShareModal(true)}
              hitSlop={10}
            >
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 128 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile card */}
          <View className="p-6">
            <View className="bg-card rounded-2xl p-5 items-center shadow-sm">
              {/* Tappable avatar */}
              <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} className="relative mb-3">
                <View className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-background items-center justify-center">
                  {pet.avatarUri ? (
                    <Image source={{ uri: pet.avatarUri }} className="w-24 h-24" />
                  ) : (
                    <PawPrint size={36} className="text-muted-foreground" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                  <Camera size={14} className="text-primary-foreground" />
                </View>
              </TouchableOpacity>

              <Text className="text-2xl font-bold text-foreground text-center">
                {displayName}
              </Text>
              {pet.breed || kindLabel ? (
                <Text className="text-sm text-muted-foreground mt-0.5 text-center">
                  {[pet.breed, kindLabel].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {(genderLabel || dateLabel || ageLabel) ? (
                <Text className="text-sm text-muted-foreground mt-0.5 text-center">
                  {[genderLabel, dateLabel, ageLabel].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Weight history chart */}
          {weightChartData && (
            <View className="px-6 mb-2">
              <View className="bg-card rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Weight History
                </Text>
                <LineChart
                  data={weightChartData}
                  height={120}
                  curved
                  color="#6366f1"
                  dataPointsColor="#6366f1"
                  thickness={2}
                  hideRules
                  xAxisLabelTextStyle={{
                    fontSize: 10,
                    color: isDark ? "#a1a1aa" : "#71717a",
                  }}
                  yAxisTextStyle={{
                    fontSize: 10,
                    color: isDark ? "#a1a1aa" : "#71717a",
                  }}
                  yAxisColor="transparent"
                  xAxisColor="transparent"
                  spacing={60}
                  adjustToWidth
                  isAnimated
                />
              </View>
            </View>
          )}

          {/* Flat summary rows by category */}
          <View className="px-6">
            {visibleCategoryOrder.map((category) => (
              <SectionRecordRows
                key={category}
                category={category as RecordCategory}
                records={records}
                onAddRecordType={handleAddRecordType}
                onOpenRecord={handleOpenRecord}
              />
            ))}
          </View>

          {/* Linked contacts */}
          {contacts.length > 0 && (
            <View className="px-6 mt-4">
              <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Linked Contacts
              </Text>
              <View className="gap-2">
                {[...contacts]
                  .sort((a, b) =>
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
                  )
                  .map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(vault)/contacts/add",
                          params: { id: contact.id },
                        } as any)
                      }
                      className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-semibold text-foreground">
                          {`${contact.firstName} ${contact.lastName}`.trim()}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {[contact.categories?.[0], contact.phone]
                            .filter(Boolean)
                            .join(" • ") || "Contact"}
                        </Text>
                      </View>
                      <Text className="text-base text-muted-foreground">›</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}
        </ScrollView>

        <ProfileShareModal
          visible={showShareModal}
          profileName={displayName || "Profile"}
          sections={shareSections}
          onClose={() => setShowShareModal(false)}
          onShare={async (sections) => {
            await shareProfilePdf(displayName || "Profile", sections);
            setShowShareModal(false);
          }}
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
