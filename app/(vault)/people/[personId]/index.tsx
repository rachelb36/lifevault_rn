/**
 * Person Detail Screen — /(vault)/people/[personId]
 *
 * Displays a person's profile card (avatar, name, relationship, age) followed
 * by flat, scannable summary rows organized by record category (Identification,
 * Medical, Support Profile, School, etc.).
 *
 * Each row shows a smart summary if data exists, or "Add [Type] Information"
 * if empty. Tapping a row with data navigates to edit; tapping an empty row
 * navigates to add. The header provides settings (edit profile) and share
 * actions.
 *
 * Route: /(vault)/people/[personId]
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
  Calendar,
  Heart,
  Settings,
  Share2,
  User as UserIcon,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import SectionRecordRows from "@/shared/ui/SectionRecordRows";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

import { findProfile } from "@/features/profiles/data/storage";
import type { PersonProfile } from "@/features/profiles/domain/types";

import {
  PERSON_CATEGORY_ORDER,
  RecordCategory,
} from "@/domain/records/recordCategories";
import { RecordType } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { listRecordsForPerson } from "@/features/records/data/storage";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { Contact, getContacts } from "@/features/contacts/data/storage";

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAge(dob?: string): { label: string; years: number } | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  if (age < 0 || age >= 130) return null;
  return { label: `Age ${age}`, years: age };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PersonDetailScreen() {
  const router = useRouter();
  const { personId, mode } = useLocalSearchParams<{ personId?: string; mode?: string }>();
  const pid = Array.isArray(personId) ? personId[0] : personId;
  const isCompleteMode = mode === "complete";

  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    const [profile, nextRecords, allContacts] = await Promise.all([
      findProfile(pid),
      listRecordsForPerson(pid),
      getContacts(),
    ]);
    if (profile?.profileType === "PERSON") {
      setPerson(profile);
    } else {
      setPerson(null);
    }
    setRecords(nextRecords);
    setContacts(
      allContacts.filter((c) =>
        (c.linkedProfiles || []).some(
          (lp) => lp.id === pid && lp.type === "person",
        ),
      ),
    );
  }, [pid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const displayName = useMemo(() => {
    if (!person) return "";
    return (
      person.preferredName || `${person.firstName} ${person.lastName}`.trim()
    );
  }, [person]);

  const isPrimaryPerson = Boolean(
    person?.isPrimary || person?.relationship?.trim().toLowerCase() === "self",
  );

  const ageInfo = useMemo(() => computeAge(person?.dob), [person?.dob]);

  const isDependent18OrUnder = useMemo(
    () => (ageInfo ? ageInfo.years <= 18 : false),
    [ageInfo],
  );

  const visibleCategoryOrder = useMemo(
    () =>
      PERSON_CATEGORY_ORDER.filter(
        (category) => category !== "SCHOOL" || isDependent18OrUnder,
      ),
    [isDependent18OrUnder],
  );

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "-"}`,
          `Relationship: ${isPrimaryPerson ? "Self (Primary user)" : person?.relationship || "-"}`,
          `Date of Birth: ${person?.dob || "-"}`,
          ageInfo ? `Age: ${ageInfo.label.replace("Age ", "")}` : "Age: -",
        ].join("\n"),
      },
    ];
  }, [
    displayName,
    person?.relationship,
    person?.dob,
    ageInfo,
    isPrimaryPerson,
  ]);

  // ── Navigation handlers ────────────────────────────────────────────────

  const handleOpenRecord = useCallback(
    (record: LifeVaultRecord) => {
      router.push({
        pathname: "/(vault)/people/[personId]/records/[recordId]",
        params: { personId: String(pid), recordId: record.id },
      } as any);
    },
    [router, pid],
  );

  const handleAddRecordType = useCallback(
    (recordType: RecordType) => {
      if (!pid) return;

      if (isSingletonType(recordType)) {
        const existing = records.find((r) => r.recordType === recordType);
        if (existing) {
          handleOpenRecord(existing);
          return;
        }
      }

      router.push({
        pathname: "/(vault)/people/[personId]/records/add",
        params: { personId: String(pid), recordType },
      } as any);
    },
    [pid, records, router, handleOpenRecord],
  );

  // ── Not found state ────────────────────────────────────────────────────

  if (!person) {
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
            Profile Details
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">
            Person not found
          </Text>
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
          {isCompleteMode ? (
            <View className="w-10 h-10" />
          ) : (
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </Pressable>
          )}

          <Text className="text-lg font-semibold text-foreground">
            Profile Details
          </Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(vault)/people/add",
                  params: { id: person.id },
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
              {person.avatarUri ? (
                <Image
                  source={{ uri: person.avatarUri }}
                  className="w-24 h-24 rounded-full mb-4"
                  style={{ borderWidth: 3, borderColor: "rgb(244 244 245)" }}
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-full mb-4 bg-muted items-center justify-center"
                  style={{ borderWidth: 3, borderColor: "rgb(244 244 245)" }}
                >
                  <UserIcon size={36} className="text-muted-foreground" />
                </View>
              )}

              <Text className="text-2xl font-bold text-foreground mb-1">
                {displayName || "Person"}
              </Text>
              <Text className="text-muted-foreground mb-1">
                {isPrimaryPerson
                  ? "Self (Primary user)"
                  : person.relationship || "Relationship not set"}
              </Text>
              <Text className="text-sm text-muted-foreground mb-4">
                {person.dob ? `DOB: ${person.dob}` : "DOB not set"}
              </Text>

              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Heart
                    size={14}
                    className="text-primary"
                    fill="rgb(20 184 166)"
                  />
                  <Text className="text-sm text-primary font-medium">
                    Profile
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">
                    {ageInfo?.label || "Age N/A"}
                  </Text>
                </View>
              </View>
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
