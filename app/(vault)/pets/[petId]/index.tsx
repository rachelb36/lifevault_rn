import React, { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, PawPrint, Settings, Share2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";
import { findProfile } from "@/features/profiles/data/storage";
import type { PetProfile } from "@/features/profiles/domain/types";
import RecordSection from "@/features/records/ui/RecordSection";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { PET_CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";
import { RecordType } from "@/domain/records/recordTypes";
import { isSingletonType } from "@/domain/records/selectors/isSingletonType";
import { listRecordsForEntity } from "@/features/records/data/storage";
import { Contact, getContacts } from "@/features/contacts/data/storage";

// ── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHHmm(hhmm?: string) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!isFinite(h) || !isFinite(m)) return hhmm;
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between gap-4 py-2 border-b border-border/50">
      <Text className="text-sm text-muted-foreground flex-shrink-0">{label}</Text>
      <Text className="text-sm text-foreground font-medium flex-1 text-right">{value}</Text>
    </View>
  );
}

function PillList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mt-1">
      {items.map((item) => (
        <View key={item} className="bg-muted/60 border border-border rounded-full px-3 py-1">
          <Text className="text-xs text-foreground">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function CareSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card overflow-hidden mb-3">
      <TouchableOpacity
        onPress={onToggle}
        className="px-4 py-4 flex-row items-center justify-between"
        activeOpacity={0.85}
      >
        <Text className="text-foreground font-semibold">{title}</Text>
        {open ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </TouchableOpacity>
      {open && <View className="px-4 pb-4 gap-1">{children}</View>}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PetDetailScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const resolvedPetId = Array.isArray(petId) ? petId[0] : petId;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // Care section collapse state
  const [openDailyCare, setOpenDailyCare] = useState(false);
  const [openBathroom, setOpenBathroom] = useState(false);
  const [openSleep, setOpenSleep] = useState(false);
  const [openBehavior, setOpenBehavior] = useState(false);
  const [openMeds, setOpenMeds] = useState(false);
  const [openVax, setOpenVax] = useState(false);

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
        (c.linkedProfiles || []).some((lp) => lp.id === resolvedPetId && lp.type === "pet")
      )
    );
  }, [resolvedPetId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const displayName = useMemo(() => pet?.petName?.trim() || "Pet", [pet?.petName]);

  const kindLabel = useMemo(() => {
    if (!pet) return "Pet";
    if (pet.kind.toLowerCase() === "other") return pet.kindOtherText || "Other";
    return pet.kind || pet.kindOtherText || "Pet";
  }, [pet]);

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

  const visiblePetCategories = useMemo(
    () => PET_CATEGORY_ORDER.filter((category) => category !== "PET_BASICS"),
    []
  );

  // Extended fields (stored as any in AsyncStorage)
  const ext = pet as any;
  const medications: any[] = ext?.medications || [];
  const vaccinations: any[] = ext?.vaccinations || [];
  const feedingTimes: string[] = ext?.feedingTimes || [];
  const pottyTimes: string[] = ext?.pottyTimes || [];
  const avoidTriggers: string[] = ext?.avoidTriggers || [];
  const fears: string[] = ext?.fears || [];

  const hasCareData = !!(
    ext?.foodBrand ||
    ext?.foodType ||
    ext?.portionAmount ||
    feedingTimes.length ||
    ext?.treatAllowed ||
    ext?.pottyTimesPerDay ||
    pottyTimes.length ||
    ext?.leashHarnessNotes ||
    avoidTriggers.length ||
    ext?.sleepLocation ||
    ext?.crateRule ||
    ext?.bedtimeRoutine ||
    fears.length ||
    ext?.separationAnxietyLevel ||
    medications.length ||
    vaccinations.length
  );

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "-"}`,
          `Kind: ${kindLabel || "-"}`,
          `Breed: ${pet?.breed || "-"}`,
          `Date of Birth: ${pet?.dob || "-"}`,
          ageLabel ? `Age: ${ageLabel.replace("Age ", "")}` : "Age: -",
        ].join("\n"),
      },
    ];
  }, [displayName, kindLabel, pet?.breed, pet?.dob, ageLabel]);

  const handleEditRecord = useCallback(
    (record: LifeVaultRecord) => {
      router.push({
        pathname: "/(vault)/pets/[petId]/records/[recordId]/edit",
        params: { petId: String(resolvedPetId), recordId: record.id },
      } as any);
    },
    [router, resolvedPetId]
  );

  const handleAddRecordType = useCallback(
    (recordType: RecordType) => {
      if (!resolvedPetId) return;

      if (isSingletonType(recordType)) {
        const existing = records.find((r) => r.recordType === recordType);
        if (existing) {
          handleEditRecord(existing);
          return;
        }
      }

      router.push({
        pathname: "/(vault)/pets/[petId]/records/add",
        params: { petId: String(resolvedPetId), recordType },
      } as any);
    },
    [resolvedPetId, records, router, handleEditRecord]
  );

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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={24} className="text-foreground" />
          </Pressable>

          <Text className="text-lg font-semibold text-foreground">Pet Details</Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/(vault)/pets/add", params: { id: pet.id } } as any)
              }
              hitSlop={10}
            >
              <Settings size={20} className="text-foreground" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowShareModal(true)} hitSlop={10}>
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
          {/* Hero card */}
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

              <Text className="text-2xl font-bold text-foreground mb-1">{displayName}</Text>
              <Text className="text-muted-foreground mb-1">{pet.breed || kindLabel}</Text>
              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{ageLabel || "Age N/A"}</Text>
                </View>
              </View>

              {/* Quick overview stats */}
              {(ext?.weightValue || pet.microchipId) ? (
                <View className="w-full mt-4 pt-4 border-t border-border/50 flex-row flex-wrap gap-2 justify-center">
                  {ext?.weightValue ? (
                    <View className="bg-muted/60 px-3 py-1 rounded-full">
                      <Text className="text-xs text-muted-foreground">
                        {ext.weightValue} {ext.weightUnit || "lb"}
                      </Text>
                    </View>
                  ) : null}
                  {pet.microchipId ? (
                    <View className="bg-muted/60 px-3 py-1 rounded-full">
                      <Text className="text-xs text-muted-foreground">Chip: {pet.microchipId}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Care Profile sections ── */}
          {hasCareData ? (
            <View className="px-6">
              <Text className="text-lg font-semibold text-foreground mb-3">Care Profile</Text>

              {/* Daily Care */}
              {(ext?.foodBrand || ext?.foodType || ext?.portionAmount || feedingTimes.length || ext?.treatAllowed || ext?.treatRulesNotes) ? (
                <CareSection title="Daily Care" open={openDailyCare} onToggle={() => setOpenDailyCare((v) => !v)}>
                  <InfoRow label="Food brand" value={ext?.foodBrand} />
                  <InfoRow label="Food type" value={ext?.foodType} />
                  {(ext?.portionAmount) ? (
                    <InfoRow label="Portion" value={`${ext.portionAmount} ${ext.portionUnit || "cups"}`} />
                  ) : null}
                  {feedingTimes.filter(Boolean).length ? (
                    <View className="py-2 border-b border-border/50">
                      <Text className="text-sm text-muted-foreground mb-1">Feeding times</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {feedingTimes.filter(Boolean).map(formatHHmm).join("  •  ")}
                      </Text>
                    </View>
                  ) : null}
                  <InfoRow label="Treats allowed" value={ext?.treatAllowed} />
                  <InfoRow label="Treat rules" value={ext?.treatRulesNotes} />
                </CareSection>
              ) : null}

              {/* Bathroom / Walk */}
              {(ext?.pottyTimesPerDay || pottyTimes.length || ext?.leashHarnessNotes || avoidTriggers.length || ext?.avoidTriggersNotes) ? (
                <CareSection title="Bathroom / Walk" open={openBathroom} onToggle={() => setOpenBathroom((v) => !v)}>
                  <InfoRow label="Potty breaks / day" value={ext?.pottyTimesPerDay} />
                  {pottyTimes.filter(Boolean).length ? (
                    <View className="py-2 border-b border-border/50">
                      <Text className="text-sm text-muted-foreground mb-1">Times</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {pottyTimes.filter(Boolean).map(formatHHmm).join("  •  ")}
                      </Text>
                    </View>
                  ) : null}
                  <InfoRow label="Leash / harness" value={ext?.leashHarnessNotes} />
                  {avoidTriggers.length ? (
                    <View className="py-2 border-b border-border/50">
                      <Text className="text-sm text-muted-foreground mb-1">Avoid triggers</Text>
                      <PillList items={avoidTriggers} />
                    </View>
                  ) : null}
                  <InfoRow label="Trigger notes" value={ext?.avoidTriggersNotes} />
                </CareSection>
              ) : null}

              {/* Sleep */}
              {(ext?.sleepLocation || ext?.crateRule || ext?.bedtimeRoutine) ? (
                <CareSection title="Sleep" open={openSleep} onToggle={() => setOpenSleep((v) => !v)}>
                  <InfoRow label="Sleeps" value={ext?.sleepLocation} />
                  <InfoRow label="Crate" value={ext?.crateRule} />
                  <InfoRow label="Bedtime routine" value={ext?.bedtimeRoutine} />
                </CareSection>
              ) : null}

              {/* Behavior & Safety */}
              {(fears.length || ext?.separationAnxietyLevel || ext?.separationAnxietyNotes) ? (
                <CareSection title="Behavior & Safety" open={openBehavior} onToggle={() => setOpenBehavior((v) => !v)}>
                  {fears.length ? (
                    <View className="py-2 border-b border-border/50">
                      <Text className="text-sm text-muted-foreground mb-1">Fears</Text>
                      <PillList items={fears} />
                    </View>
                  ) : null}
                  <InfoRow label="Separation anxiety" value={ext?.separationAnxietyLevel} />
                  <InfoRow label="Anxiety notes" value={ext?.separationAnxietyNotes} />
                </CareSection>
              ) : null}

              {/* Medications */}
              {medications.filter((m: any) => m.name).length ? (
                <CareSection title="Medications & Supplements" open={openMeds} onToggle={() => setOpenMeds((v) => !v)}>
                  {medications.filter((m: any) => m.name).map((m: any, idx: number) => (
                    <View key={m.id || idx} className="py-2 border-b border-border/50 gap-1">
                      <Text className="text-sm font-semibold text-foreground">{m.name}</Text>
                      {m.dosage ? <Text className="text-xs text-muted-foreground">Dosage: {m.dosage}</Text> : null}
                      {m.adminMethod ? <Text className="text-xs text-muted-foreground">Given: {m.adminMethod}</Text> : null}
                      {m.scheduleNotes ? <Text className="text-xs text-muted-foreground">Schedule: {m.scheduleNotes}</Text> : null}
                      {m.missedDoseNotes ? <Text className="text-xs text-muted-foreground">If missed: {m.missedDoseNotes}</Text> : null}
                      {m.sideEffectsNotes ? <Text className="text-xs text-muted-foreground">Side effects: {m.sideEffectsNotes}</Text> : null}
                    </View>
                  ))}
                </CareSection>
              ) : null}

              {/* Vaccinations */}
              {vaccinations.filter((v: any) => v.name).length ? (
                <CareSection title="Vaccinations" open={openVax} onToggle={() => setOpenVax((v) => !v)}>
                  {vaccinations.filter((v: any) => v.name).map((v: any, idx: number) => (
                    <View key={v.id || idx} className="flex-row justify-between items-center py-2 border-b border-border/50">
                      <Text className="text-sm text-foreground font-medium flex-1">{v.name}</Text>
                      {v.date ? (
                        <Text className="text-xs text-muted-foreground ml-4">
                          {new Date(v.date).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </CareSection>
              ) : null}
            </View>
          ) : null}

          {/* Edit care profile prompt if empty */}
          {!hasCareData ? (
            <View className="px-6 mb-4">
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: "/(vault)/pets/add", params: { id: pet.id } } as any)
                }
                className="bg-card border border-border rounded-2xl px-4 py-4 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-sm text-muted-foreground mb-1">No care profile yet.</Text>
                <Text className="text-sm text-primary font-semibold">+ Fill out care details</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Records */}
          <View className="px-6">
            <Text className="text-lg font-semibold text-foreground mb-2">Information</Text>
            <Text className="text-sm text-muted-foreground mb-4">Add and edit records by category.</Text>

            {visiblePetCategories.map((category) => (
              <RecordSection
                key={category}
                category={category as RecordCategory}
                records={records}
                onAdd={handleAddRecordType}
                onEdit={handleEditRecord}
                onOpen={(record) => {
                  router.push({
                    pathname: "/(vault)/pets/[petId]/records/[recordId]",
                    params: { petId: String(resolvedPetId), recordId: record.id },
                  } as any);
                }}
              />
            ))}
          </View>

          {/* Contacts */}
          <View className="px-6 mt-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-foreground">Contacts</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(vault)/contacts/add",
                    params: { profileId: pet.id, profileType: "pet", context: "pet" },
                  } as any)
                }
                className="px-3 py-1.5 rounded-full bg-primary"
              >
                <Text className="text-xs font-semibold text-primary-foreground">Add Contact</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-muted-foreground mb-3">
              Shared contacts linked to this pet.
            </Text>

            {contacts.length === 0 ? (
              <View className="bg-card border border-border rounded-xl px-4 py-3">
                <Text className="text-sm text-muted-foreground">No linked contacts yet.</Text>
              </View>
            ) : (
              <View className="gap-2">
                {contacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    onPress={() =>
                      router.push({ pathname: "/(vault)/contacts/add", params: { id: contact.id } } as any)
                    }
                    className="bg-card border border-border rounded-xl px-4 py-3"
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {`${contact.firstName} ${contact.lastName}`.trim()}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      {[contact.categories?.[0], contact.phone].filter(Boolean).join(" • ") || "Contact"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
