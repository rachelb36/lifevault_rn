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
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  PawPrint,
  Settings,
  Share2,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import SectionRecordRows from "@/shared/ui/SectionRecordRows";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

import { findProfile } from "@/features/profiles/data/storage";
import type { PetProfile } from "@/features/profiles/domain/types";

import { PET_CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";
import { RecordType, RECORD_TYPES } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { listRecordsForEntity } from "@/features/records/data/storage";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { Contact, getContacts } from "@/features/contacts/data/storage";
import { getRecordData } from "@/shared/utils/recordData";

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

  const overviewRecord = useMemo(
    () => records.find((r) => r.recordType === RECORD_TYPES.PET_OVERVIEW),
    [records],
  );

  const ageLabel = useMemo(() => {
    // Prefer dob from profile header; fall back to PET_OVERVIEW record
    const profileDob = pet?.dob;
    if (profileDob) return computeAge(profileDob);
    if (!overviewRecord) return null;
    const data = getRecordData(overviewRecord);
    return computeAge(String(data.dob || ""));
  }, [pet?.dob, overviewRecord]);

  const genderLabel = useMemo(() => {
    // Prefer gender from profile header; fall back to PET_OVERVIEW record
    if (pet?.gender) return pet.gender;
    if (!overviewRecord) return null;
    const data = getRecordData(overviewRecord);
    return String(data.gender || "").trim() || null;
  }, [pet?.gender, overviewRecord]);

  const visibleCategoryOrder = useMemo(
    () => PET_CATEGORY_ORDER,
    [],
  );

  const shareSections: ShareSection[] = useMemo(() => {
    const overviewData = overviewRecord ? getRecordData(overviewRecord) : {};
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
          `Gender: ${genderLabel || String(overviewData.gender || "-")}`,
          `Weight: ${String(basicsData.currentWeightValue || "-")} ${String(basicsData.currentWeightUnit || "")}`.trim(),
          `Microchip ID: ${String(basicsData.microchipId || "-")}`,
          overviewData.dob
            ? `DOB: ${String(overviewData.dob)}`
            : "",
          overviewData.adoptionDate
            ? `Adoption Date: ${String(overviewData.adoptionDate)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
  }, [displayName, kindLabel, pet, overviewRecord, records, genderLabel]);

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
            <View className="bg-card rounded-2xl p-6 items-center shadow-sm">
              {pet.avatarUri ? (
                <Image
                  source={{ uri: pet.avatarUri }}
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

              <Text className="text-2xl font-bold text-foreground mb-1">
                {displayName}
              </Text>
              <Text className="text-muted-foreground">
                {[pet.breed, kindLabel, genderLabel, ageLabel].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>

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
