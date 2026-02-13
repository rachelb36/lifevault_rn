// app/(vault)/people/[personId]/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Heart, Calendar, Share2, User as UserIcon } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

import { findDependent, updateDependent } from "@/features/profiles/data/storage";
import { DependentProfile } from "@/features/profiles/domain/profile.model";

import RecordSection, { LifeVaultRecord } from "@/features/records/ui/RecordSection";
import { PERSON_CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";
import { RecordType } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";

import { listRecordsForPerson } from "@/features/records/data/storage";

export default function DependentDetailScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const depId = Array.isArray(personId) ? personId[0] : personId;

  const [person, setPerson] = useState<DependentProfile | null>(null);

  // Relationship edit UX
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [relationshipDirty, setRelationshipDirty] = useState(false);

  // Records for this person
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);

  const [showShareModal, setShowShareModal] = useState(false);

  const isPrimaryPerson = useMemo(() => {
    if (!person) return false;
    return !!person.isPrimary || person.relationship?.trim().toLowerCase() === "self";
  }, [person]);

  const displayName = useMemo(() => {
    if (!person) return "";
    return person.preferredName || `${person.firstName} ${person.lastName}`.trim();
  }, [person]);

  const ageLabel = useMemo(() => {
    if (!person?.dob) return "";
    const d = new Date(person.dob);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? `Age ${age}` : "";
  }, [person?.dob]);

  const isDependent18OrUnder = useMemo(() => {
    if (!person?.dob) return false;
    const d = new Date(person.dob);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age <= 18;
  }, [person?.dob]);

  const visibleCategoryOrder = useMemo(
    () =>
      PERSON_CATEGORY_ORDER.filter(
        (category) => category !== "SCHOOL_INFO" || isDependent18OrUnder
      ),
    [isDependent18OrUnder]
  );

  // Load dependent once (or when depId changes)
  useEffect(() => {
    if (!depId) return;

    let cancelled = false;
    const load = async () => {
      const found = await findDependent(depId);
      if (!found || cancelled) return;
      setPerson(found);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [depId]);

  // Refresh records whenever screen focuses (and also when depId changes)
  const refreshRecords = useCallback(async () => {
    if (!depId) return;
    const depRecords = await listRecordsForPerson(String(depId));
    setRecords(depRecords);
  }, [depId]);

  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords])
  );

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "—"}`,
          `Relationship: ${isPrimaryPerson ? "Self (Primary user)" : person?.relationship || "—"}`,
          `Date of Birth: ${person?.dob || "—"}`,
          ageLabel ? `Age: ${ageLabel.replace("Age ", "")}` : "Age: —",
        ].join("\n"),
      },
    ];
  }, [displayName, person?.relationship, person?.dob, ageLabel, isPrimaryPerson]);

  const saveRelationship = async () => {
    if (!depId) return;
    if (isPrimaryPerson) return;

    try {
      await updateDependent(depId, (d) => ({
        ...d,
        relationship: person?.relationship || "",
        hasCompletedProfile: true,
      }));
      setRelationshipDirty(false);
      setIsEditingRelationship(false);
      Alert.alert("Saved", "Relationship updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  // --------------------
  // Record handlers
  // --------------------
  const handleEditRecord = useCallback(
    (record: LifeVaultRecord) => {
      router.push({
        pathname: "/(vault)/people/[personId]/records/[recordId]/edit",
        params: { personId: String(depId), recordId: record.id },
      } as any);
    },
    [router, depId]
  );

  const handleAddRecordType = useCallback(
    (recordType: RecordType) => {
      if (!depId) return;

      // If SINGLE and already exists → edit it (prevents duplicates)
      if (isSingletonType(recordType)) {
        const existing = records.find((r) => r.recordType === recordType);
        if (existing) {
          handleEditRecord(existing);
          return;
        }
      }

      router.push({
        pathname: "/(vault)/people/[personId]/records/add",
        params: { personId: String(depId), recordType },
      } as any);
    },
    [depId, records, router, handleEditRecord]
  );

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={24} className="text-foreground" />
          </Pressable>

          <Text className="text-lg font-semibold text-foreground">Profile Details</Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setShowShareModal(true)} hitSlop={10}>
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
          {/* Dependent Card */}
          <View className="p-6">
            <View className="bg-card rounded-2xl p-6 items-center shadow-sm">
              {person?.avatar ? (
                <Image
                  source={{ uri: person.avatar }}
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

              <Text className="text-2xl font-bold text-foreground mb-1">{displayName || "Dependent"}</Text>
              <Text className="text-muted-foreground mb-1">
                {isPrimaryPerson ? "Self (Primary user)" : person?.relationship || "Relationship not set"}
              </Text>
              <Text className="text-sm text-muted-foreground mb-4">{person?.dob ? `DOB: ${person.dob}` : "DOB not set"}</Text>

              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Heart size={14} className="text-primary" fill="rgb(20 184 166)" />
                  <Text className="text-sm text-primary font-medium">Profile</Text>
                </View>

                <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{ageLabel || "Age N/A"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Relationship */}
          <View className="px-6 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-foreground">Relationship</Text>

              {!isPrimaryPerson && (
                <TouchableOpacity
                  onPress={() => setIsEditingRelationship((v) => !v)}
                  className="px-3 py-1.5 rounded-full bg-muted"
                >
                  <Text className="text-sm text-foreground font-medium">{isEditingRelationship ? "Done" : "Edit"}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-sm text-muted-foreground mb-3">
              {isPrimaryPerson
                ? "Primary profile relationship is fixed as Self."
                : "Choose how this person is related to you."}
            </Text>

            {isEditingRelationship && !isPrimaryPerson ? (
              <View className="bg-card border border-border rounded-xl px-4 py-3">
                <TextInput
                  className="text-foreground"
                  value={person?.relationship || ""}
                  placeholder="e.g., Son, Daughter, Parent"
                  onChangeText={(text) => {
                    setPerson((prev) => (prev ? { ...prev, relationship: text } : prev));
                    setRelationshipDirty(true);
                  }}
                />
              </View>
            ) : (
              <Text className="text-foreground">
                {isPrimaryPerson ? "Self (Primary user)" : person?.relationship || "Not set"}
              </Text>
            )}

            {isEditingRelationship && relationshipDirty && !isPrimaryPerson && (
              <TouchableOpacity onPress={saveRelationship} className="mt-3 bg-primary rounded-xl py-2 items-center">
                <Text className="text-primary-foreground font-semibold">Save Relationship</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Records */}
          <View className="px-6">
            <Text className="text-lg font-semibold text-foreground mb-2">Information</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Add and edit records by category (medical, travel, education, documents, etc).
            </Text>

            {visibleCategoryOrder.map((category) => (
              <RecordSection
                key={category}
                category={category as RecordCategory}
                records={records}
                onAdd={handleAddRecordType}
                onEdit={handleEditRecord}
                onOpen={(record) => {
                  router.push({
                    pathname: "/(vault)/people/[personId]/records/[recordId]",
                    params: { personId: String(depId), recordId: record.id },
                  } as any);
                }}
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
