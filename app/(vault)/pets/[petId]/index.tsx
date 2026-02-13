// app/(vault)/pets/[petId]/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar, PawPrint, Share2, Phone, FileText, Pill, Shield, AlertCircle, Check } from "lucide-react-native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";
import { formatDateLabel } from "@/shared/utils/date";
import { AccordionSection } from "@/features/pets/ui/components/AccordionSection";

type PetProfile = {
  id: string;
  petName: string;
  kind: string;
  kindOtherText?: string;
  dob?: string;
  adoptionDate?: string;
  breed?: string;
  breedOtherText?: string;
  breedOptionalText?: string;
  avatar?: string;
  vetContact?: { name: string; clinicName?: string; phone: string } | null;
  microchipId?: string;
  vaccinations?: Array<{ id: string; name: string; date?: string | null; notes?: string }>;
  serviceDocuments?: Array<{ id: string; type: string; expiryDate?: string | null }>;
  medications?: Array<{
    id: string;
    name: string;
    dosage?: string;
    frequency?: string;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string;
    status?: "active" | "history";
  }>;
  serviceProviders?: Array<{ id: string; name: string; type?: string; phone?: string; notes?: string }>;
  insuranceProvider?: string;
  policyNumber?: string;
  insuranceNotes?: string;
  emergencyInstructions?: string;
  checklistItems?: Array<{ id: string; label: string; isChecked?: boolean }>;
};

const PETS_STORAGE_KEY = "pets_v1";

async function findPet(petId: string): Promise<PetProfile | null> {
  const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const arr = Array.isArray(list) ? list : [];
  const found = arr.find((p: any) => String(p.id) === String(petId));
  return found ? (found as PetProfile) : null;
}

export default function PetDetailScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const resolvedPetId = Array.isArray(petId) ? petId[0] : petId;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basics"]));

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

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
    if (!resolvedPetId) return;
    const found = await findPet(String(resolvedPetId));
    setPet(found);
  }, [resolvedPetId]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!resolvedPetId) return;
        const found = await findPet(String(resolvedPetId));
        if (cancelled) return;
        setPet(found);

      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedPetId]);

  // Refresh when screen focused (so returning from add/edit updates UI)
  useFocusEffect(
    useCallback(() => {
      refreshPet();
    }, [refreshPet])
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
            onPress={() => router.replace("/(vault)/pets")}
            className="mt-6 bg-primary rounded-xl py-3 px-5"
            activeOpacity={0.85}
          >
            <Text className="text-primary-foreground font-semibold">Back to Pets</Text>
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

              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{ageLabel || "Age N/A"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Details (mirrors add-pet categories) */}
          <View className="px-6">
            <Text className="text-lg font-semibold text-foreground mb-2">Information</Text>

            <AccordionSection
              title="Basics"
              icon={<PawPrint size={20} className="text-primary" />}
              isExpanded={expandedSections.has("basics")}
              onToggle={() => toggleSection("basics")}
            >
              <View className="gap-2">
                <Text className="text-sm text-foreground">Pet Name: {displayName}</Text>
                <Text className="text-sm text-foreground">Kind: {kindLabel}</Text>
                <Text className="text-sm text-foreground">Breed: {pet.breed || "Not set"}</Text>
                <Text className="text-sm text-foreground">Birth/Adoption: {formatDateLabel(pet.dob || pet.adoptionDate, "Not set")}</Text>
              </View>
            </AccordionSection>

            <AccordionSection
              title="Vet & Microchip"
              icon={<Phone size={20} className="text-primary" />}
              isExpanded={expandedSections.has("vet")}
              onToggle={() => toggleSection("vet")}
            >
              <View className="gap-2">
                <Text className="text-sm text-foreground">Vet Name: {pet.vetContact?.name || "Not set"}</Text>
                <Text className="text-sm text-foreground">Clinic / Practice: {pet.vetContact?.clinicName || "Not set"}</Text>
                <Text className="text-sm text-foreground">Vet Phone: {pet.vetContact?.phone || "Not set"}</Text>
                <Text className="text-sm text-foreground">Microchip ID: {pet.microchipId || "Not set"}</Text>
              </View>
            </AccordionSection>

            <AccordionSection
              title="Records & Uploads"
              icon={<FileText size={20} className="text-primary" />}
              isExpanded={expandedSections.has("records")}
              onToggle={() => toggleSection("records")}
            >
              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">Vaccinations</Text>
                {(pet.vaccinations || []).length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No vaccination records yet.</Text>
                ) : (
                  (pet.vaccinations || []).map((v) => (
                    <View key={v.id} className="bg-muted/50 border border-border rounded-xl p-3">
                      <Text className="text-sm text-foreground font-medium">{v.name}</Text>
                      <Text className="text-xs text-muted-foreground">Date: {formatDateLabel(v.date, "Not set")}</Text>
                      {!!v.notes && <Text className="text-xs text-muted-foreground mt-1">{v.notes}</Text>}
                    </View>
                  ))
                )}

                <Text className="text-sm font-semibold text-foreground mt-2">Service Documents</Text>
                {(pet.serviceDocuments || []).length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No service documents yet.</Text>
                ) : (
                  (pet.serviceDocuments || []).map((d) => (
                    <View key={d.id} className="bg-muted/50 border border-border rounded-xl p-3">
                      <Text className="text-sm text-foreground font-medium">{d.type}</Text>
                      <Text className="text-xs text-muted-foreground">Expiry: {formatDateLabel(d.expiryDate, "Not set")}</Text>
                    </View>
                  ))
                )}
              </View>
            </AccordionSection>

            <AccordionSection
              title="Medications"
              icon={<Pill size={20} className="text-primary" />}
              isExpanded={expandedSections.has("medications")}
              onToggle={() => toggleSection("medications")}
            >
              {(pet.medications || []).length === 0 ? (
                <Text className="text-xs text-muted-foreground">No medications yet.</Text>
              ) : (
                <View className="gap-2">
                  {(pet.medications || []).map((m) => (
                    <View key={m.id} className="bg-muted/50 border border-border rounded-xl p-3">
                      <Text className="text-sm font-medium text-foreground">{m.name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {[m.dosage, m.frequency].filter(Boolean).join(" • ") || "No dosage/frequency"}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatDateLabel(m.startDate, "Start not set")} - {formatDateLabel(m.endDate, "Current")}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </AccordionSection>

            <AccordionSection
              title="Service Providers"
              icon={<Shield size={20} className="text-primary" />}
              isExpanded={expandedSections.has("providers")}
              onToggle={() => toggleSection("providers")}
            >
              {(pet.serviceProviders || []).length === 0 ? (
                <Text className="text-xs text-muted-foreground">No service providers yet.</Text>
              ) : (
                <View className="gap-2">
                  {(pet.serviceProviders || []).map((p) => (
                    <View key={p.id} className="bg-muted/50 border border-border rounded-xl p-3">
                      <Text className="text-sm font-medium text-foreground">{p.name}</Text>
                      <Text className="text-xs text-muted-foreground">{[p.type, p.phone].filter(Boolean).join(" • ")}</Text>
                      {!!p.notes && <Text className="text-xs text-muted-foreground mt-1">{p.notes}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </AccordionSection>

            <AccordionSection
              title="Insurance"
              icon={<Shield size={20} className="text-primary" />}
              isExpanded={expandedSections.has("insurance")}
              onToggle={() => toggleSection("insurance")}
            >
              <View className="gap-2">
                <Text className="text-sm text-foreground">Provider: {pet.insuranceProvider || "Not set"}</Text>
                <Text className="text-sm text-foreground">Policy Number: {pet.policyNumber || "Not set"}</Text>
                <Text className="text-sm text-foreground">Notes: {pet.insuranceNotes || "Not set"}</Text>
              </View>
            </AccordionSection>

            <AccordionSection
              title="Emergency Instructions"
              icon={<AlertCircle size={20} className="text-primary" />}
              isExpanded={expandedSections.has("emergency")}
              onToggle={() => toggleSection("emergency")}
            >
              <Text className="text-sm text-foreground">{pet.emergencyInstructions || "No emergency instructions yet."}</Text>
            </AccordionSection>

            <AccordionSection
              title="Checklist"
              icon={<Check size={20} className="text-primary" />}
              isExpanded={expandedSections.has("checklist")}
              onToggle={() => toggleSection("checklist")}
            >
              {(pet.checklistItems || []).length === 0 ? (
                <Text className="text-xs text-muted-foreground">No checklist items yet.</Text>
              ) : (
                <View className="gap-2">
                  {(pet.checklistItems || []).map((item) => (
                    <Text key={item.id} className={`text-sm ${item.isChecked ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.isChecked ? "✓ " : "○ "}
                      {item.label}
                    </Text>
                  ))}
                </View>
              )}
            </AccordionSection>
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
