// app/(vault)/pet/add.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, PawPrint, ChevronDown, ChevronUp, Plus, Trash2, Clock } from "lucide-react-native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import TimePickerModal from "@/shared/ui/TimePickerModal";

import { toIsoDateOnly, formatDateLabel } from "@/shared/utils/date";

import {
  KIND_OPTIONS,
  DOG_BREEDS,
  CAT_BREEDS,
  PET_PORTION_UNIT_OPTIONS,
  PET_FOOD_TYPE_OPTIONS,
  PET_TREAT_ALLOWED_OPTIONS,
  PET_AVOID_TRIGGER_OPTIONS,
  PET_SLEEP_LOCATION_OPTIONS,
  PET_CRATE_RULE_OPTIONS,
  PET_FEAR_OPTIONS,
  PET_SEPARATION_ANXIETY_LEVEL_OPTIONS,
  PET_MED_ADMIN_METHOD_OPTIONS,
  DOG_VACCINATION_OPTIONS,
  CAT_VACCINATION_OPTIONS,
} from "@/features/pets/constants/options";

import { findProfile, upsertProfile } from "@/features/profiles/data/storage";
import type { PetProfile, PetMedication } from "@/features/profiles/domain/types";

function normalizeKind(kind: string) {
  return kind.trim().toLowerCase();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHHmmForDisplay(hhmm?: string) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!isFinite(h) || !isFinite(m)) return hhmm;

  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${pad2(m)} ${ampm}`;
}

function Section({
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
    <View className="rounded-2xl border border-border bg-card overflow-hidden">
      <TouchableOpacity onPress={onToggle} className="px-4 py-4 flex-row items-center justify-between" activeOpacity={0.85}>
        <Text className="text-foreground font-semibold">{title}</Text>
        {open ? <ChevronUp className="text-muted-foreground" size={18} /> : <ChevronDown className="text-muted-foreground" size={18} />}
      </TouchableOpacity>
      {open ? <View className="px-4 pb-4 gap-3">{children}</View> : null}
    </View>
  );
}

function PillMultiSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => {
              if (active) onChange(value.filter((x) => x !== opt));
              else onChange([...value, opt]);
            }}
            className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
            activeOpacity={0.85}
          >
            <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PillSingleSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
            activeOpacity={0.85}
          >
            <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type VaxRow = {
  id: string;
  name: string;
  date: Date | null;
  notes?: string;
};

export default function AddPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = Array.isArray(id) ? id[0] : id;
  const isEditing = Boolean(editId);

  // Overview
  const [petName, setPetName] = useState("");
  const [kind, setKind] = useState("");
  const [kindOtherText, setKindOtherText] = useState("");
  const [breed, setBreed] = useState("");
  const [breedOtherText, setBreedOtherText] = useState("");
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showVaxModal, setShowVaxModal] = useState(false);
  const [microchipId, setMicrochipId] = useState("");

  // Date (DOB/Adoption toggle)
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [adoptionDate, setAdoptionDate] = useState<Date | null>(null);
  const [dateMode, setDateMode] = useState<"DOB" | "ADOPTION">("DOB");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Weight
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");

  // Daily Care
  const [foodBrand, setFoodBrand] = useState("");
  const [foodType, setFoodType] = useState("");
  const [portionAmount, setPortionAmount] = useState("");
  const [portionUnit, setPortionUnit] = useState<(typeof PET_PORTION_UNIT_OPTIONS)[number]>("Cups");
  const [feedingTimes, setFeedingTimes] = useState<string[]>([]); // HH:mm
  const [treatAllowed, setTreatAllowed] = useState("");
  const [treatRulesNotes, setTreatRulesNotes] = useState("");

  // Bathroom / Walk
  const [pottyTimesPerDay, setPottyTimesPerDay] = useState("3");
  const [pottyTimes, setPottyTimes] = useState<string[]>([]); // HH:mm
  const [leashHarnessNotes, setLeashHarnessNotes] = useState("");
  const [avoidTriggers, setAvoidTriggers] = useState<string[]>([]);
  const [avoidTriggersNotes, setAvoidTriggersNotes] = useState("");

  // Sleep
  const [sleepLocation, setSleepLocation] = useState("");
  const [crateRule, setCrateRule] = useState("");
  const [bedtimeRoutine, setBedtimeRoutine] = useState("");

  // Behavior & Safety
  const [fears, setFears] = useState<string[]>([]);
  const [fearOtherText, setFearOtherText] = useState("");
  const [separationAnxietyLevel, setSeparationAnxietyLevel] = useState("");
  const [separationAnxietyNotes, setSeparationAnxietyNotes] = useState("");

  // Medications
  const [medications, setMedications] = useState<PetMedication[]>([]);

  // Vaccinations
  const [vaccinations, setVaccinations] = useState<VaxRow[]>([]);
  const [vaxSearch, setVaxSearch] = useState("");
  const [vaxPickerForId, setVaxPickerForId] = useState<string | null>(null);
  const [showVaxDatePicker, setShowVaxDatePicker] = useState(false);
  const [vaxDateForId, setVaxDateForId] = useState<string | null>(null);

  // Time picker control (feeding/potty)
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState<string | undefined>(undefined);
  const [timePickerContext, setTimePickerContext] = useState<{ kind: "FEED" | "POTTY"; index: number } | null>(null);

  // Section open states
  const [openOverview, setOpenOverview] = useState(true);
  const [openDailyCare, setOpenDailyCare] = useState(false);
  const [openBathroom, setOpenBathroom] = useState(false);
  const [openSleep, setOpenSleep] = useState(false);
  const [openBehavior, setOpenBehavior] = useState(false);
  const [openMeds, setOpenMeds] = useState(false);
  const [openVax, setOpenVax] = useState(false);

  // Save state
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved">("idle");

  const isDog = normalizeKind(kind) === "dog";
  const isCat = normalizeKind(kind) === "cat";
  const showBreedDropdown = isDog || isCat;

  const breedOptions = useMemo(() => {
    if (isDog) return DOG_BREEDS;
    if (isCat) return CAT_BREEDS;
    return [];
  }, [isDog, isCat]);

  const filteredBreedOptions = useMemo(() => {
    const query = breedSearch.trim().toLowerCase();
    if (!query) return breedOptions;
    return breedOptions.filter((option) => option.toLowerCase().includes(query));
  }, [breedOptions, breedSearch]);

  const vaxOptions = useMemo(() => {
    if (isDog) return DOG_VACCINATION_OPTIONS;
    if (isCat) return CAT_VACCINATION_OPTIONS;
    return [];
  }, [isDog, isCat]);

  const filteredVaxOptions = useMemo(() => {
    const q = vaxSearch.trim().toLowerCase();
    if (!q) return vaxOptions;
    return vaxOptions.filter((x) => x.toLowerCase().includes(q));
  }, [vaxOptions, vaxSearch]);

  // Keep potty times array length in sync with selection
  useEffect(() => {
    const n = Math.max(1, Math.min(6, Number(pottyTimesPerDay || "1")));
    setPottyTimes((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }, [pottyTimesPerDay]);

  // Load profile if editing
  useEffect(() => {
    if (!isEditing || !editId) return;
    let cancelled = false;

    (async () => {
      const profile = await findProfile(editId);
      if (!profile || cancelled || profile.profileType !== "PET") return;

      setPetName(profile.petName || "");
      setKind(profile.kind || "");
      setKindOtherText(profile.kindOtherText || "");
      setBreed(profile.breed || "");
      setBreedOtherText(profile.breedOtherText || "");
      setMicrochipId(profile.microchipId || "");

      setDobDate(profile.dob ? new Date(profile.dob) : null);
      setAdoptionDate(profile.adoptionDate ? new Date(profile.adoptionDate) : null);

      setWeightValue(profile.weightValue || "");
      setWeightUnit(profile.weightUnit || "lb");

      setFoodBrand(profile.foodBrand || "");
      setFoodType(profile.foodType || "");
      setPortionAmount(profile.portionAmount || "");
      setPortionUnit((profile.portionUnit as typeof PET_PORTION_UNIT_OPTIONS[number]) || "Cups");
      setFeedingTimes(profile.feedingTimes?.length ? profile.feedingTimes : []);
      setTreatAllowed(profile.treatAllowed || "");
      setTreatRulesNotes(profile.treatRulesNotes || "");

      setPottyTimesPerDay(profile.pottyTimesPerDay || "3");
      setPottyTimes(profile.pottyTimes?.length ? profile.pottyTimes : []);

      setLeashHarnessNotes(profile.leashHarnessNotes || "");
      setAvoidTriggers(profile.avoidTriggers || []);
      setAvoidTriggersNotes(profile.avoidTriggersNotes || "");

      setSleepLocation(profile.sleepLocation || "");
      setCrateRule(profile.crateRule || "");
      setBedtimeRoutine(profile.bedtimeRoutine || "");

      setFears(profile.fears || []);
      setSeparationAnxietyLevel(profile.separationAnxietyLevel || "");
      setSeparationAnxietyNotes(profile.separationAnxietyNotes || "");

      setMedications(profile.medications || []);

      setVaccinations(
        (profile.vaccinations || []).map((v) => ({
          id: v.id || `vax_${Date.now()}`,
          name: v.name || "",
          date: v.date ? new Date(v.date) : null,
          notes: v.notes || "",
        }))
      );

      // Expand all sections so every field is visible when editing
      setOpenDailyCare(true);
      setOpenBathroom(true);
      setOpenSleep(true);
      setOpenBehavior(true);
      setOpenMeds(true);
      setOpenVax(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing, editId]);

  function openTimePicker(kindKey: "FEED" | "POTTY", index: number, current?: string) {
    setTimePickerContext({ kind: kindKey, index });
    setTimePickerValue(current);
    setTimePickerOpen(true);
  }

  const handleTimePicked = (hhmm: string) => {
    const ctx = timePickerContext;
    if (!ctx) return;

    if (ctx.kind === "FEED") {
      setFeedingTimes((prev) => {
        const next = [...prev];
        next[ctx.index] = hhmm;
        return next;
      });
    } else {
      setPottyTimes((prev) => {
        const next = [...prev];
        next[ctx.index] = hhmm;
        return next;
      });
    }

    setTimePickerOpen(false);
    setTimePickerContext(null);
  };

  const validate = () => {
    if (!petName.trim()) return "Please enter a pet name.";
    if (!kind.trim()) return "Please select a pet type.";
    if (normalizeKind(kind) === "other" && !kindOtherText.trim()) return "Please specify the pet type.";
    if (showBreedDropdown && !breed.trim()) return "Please select a breed.";
    if (showBreedDropdown && normalizeKind(breed) === "other" && !breedOtherText.trim()) return "Please specify the breed.";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Required", error);
      return;
    }

    const timestamp = new Date().toISOString();

    const finalFears =
      fears.includes("Other") && fearOtherText.trim()
        ? Array.from(new Set([...fears.filter((f) => f !== "Other"), `Other: ${fearOtherText.trim()}`]))
        : fears;

    const next: PetProfile = {
      id: editId || `pet_${Date.now()}`,
      profileType: "PET",
      createdAt: timestamp,
      updatedAt: timestamp,

      petName: petName.trim(),
      kind: kind.trim(),
      kindOtherText: kindOtherText.trim() || undefined,

      dob: dobDate ? toIsoDateOnly(dobDate) : undefined,
      adoptionDate: adoptionDate ? toIsoDateOnly(adoptionDate) : undefined,

      breed: breed.trim() || undefined,
      breedOtherText: breedOtherText.trim() || undefined,
      microchipId: microchipId.trim() || undefined,

      ...(weightValue.trim()
        ? { weightValue: weightValue.trim(), weightUnit }
        : { weightValue: undefined, weightUnit: undefined }),

      foodBrand: foodBrand.trim() || undefined,
      foodType: foodType || undefined,
      portionAmount: portionAmount.trim() || undefined,
      portionUnit: portionAmount.trim() ? portionUnit : undefined,
      feedingTimes: feedingTimes.map((t) => t.trim()).filter(Boolean),

      treatAllowed: treatAllowed || undefined,
      treatRulesNotes: treatRulesNotes.trim() || undefined,

      pottyTimesPerDay,
      pottyTimes: pottyTimes.map((t) => t.trim()).filter(Boolean),

      leashHarnessNotes: leashHarnessNotes.trim() || undefined,
      avoidTriggers,
      avoidTriggersNotes: avoidTriggersNotes.trim() || undefined,

      sleepLocation: sleepLocation || undefined,
      crateRule: crateRule || undefined,
      bedtimeRoutine: bedtimeRoutine.trim() || undefined,

      fears: finalFears,
      separationAnxietyLevel: separationAnxietyLevel || undefined,
      separationAnxietyNotes: separationAnxietyNotes.trim() || undefined,

      medications: medications
        .map((m) => ({
          ...m,
          name: m.name.trim(),
          dosage: m.dosage?.trim() || undefined,
          adminMethod: m.adminMethod || undefined,
          scheduleNotes: m.scheduleNotes?.trim() || undefined,
          missedDoseNotes: m.missedDoseNotes?.trim() || undefined,
          sideEffectsNotes: m.sideEffectsNotes?.trim() || undefined,
        }))
        .filter((m) => m.name),

      vaccinations: vaccinations
        .map((v) => ({
          id: v.id,
          name: v.name.trim(),
          date: v.date ? toIsoDateOnly(v.date) : undefined,
          notes: v.notes?.trim() || undefined,
        }))
        .filter((v) => v.name),
    };

    await upsertProfile(next);
    setSaveLabel("saved");
    setTimeout(() => router.back(), 700);
  };

  const addFeedingTime = () => {
    setFeedingTimes((prev) => [...prev, ""]);
    // open picker immediately for the new one
    const idx = feedingTimes.length;
    setTimeout(() => openTimePicker("FEED", idx, ""), 0);
  };

  const removeFeedingTime = (idx: number) => {
    setFeedingTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const setFeedingTime = (idx: number, hhmm: string) => {
    setFeedingTimes((prev) => prev.map((x, i) => (i === idx ? hhmm : x)));
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{isEditing ? "Edit Pet" : "Add Pet"}</Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180, gap: 12 }} keyboardShouldPersistTaps="handled">
          <View className="items-center py-2">
            <View className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-background items-center justify-center">
              <PawPrint className="text-muted-foreground" size={42} />
            </View>
            <Text className="text-xs text-muted-foreground mt-3">Avatar optional</Text>
          </View>

          {/* OVERVIEW */}
          <Section title="Overview" open={openOverview} onToggle={() => setOpenOverview((v) => !v)}>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Pet Name</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={petName}
                onChangeText={setPetName}
                placeholder="Enter pet name"
                placeholderTextColor="rgb(148 163 184)"
                returnKeyType="done"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {KIND_OPTIONS.map((opt) => {
                  const active = kind === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setKind(opt);
                        setBreed("");
                        setBreedOtherText("");
                        setBreedSearch("");
                        // reset vaccination picker search if kind changes
                        setVaxSearch("");
                        setVaxPickerForId(null);
                      }}
                      className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-background border-border"}`}
                      activeOpacity={0.85}
                    >
                      <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {normalizeKind(kind) === "other" ? (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Specify Type</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={kindOtherText}
                  onChangeText={setKindOtherText}
                  placeholder="e.g., Rabbit"
                  placeholderTextColor="rgb(148 163 184)"
                  returnKeyType="done"
                />
              </View>
            ) : null}

            {showBreedDropdown ? (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Breed</Text>
                <TouchableOpacity
                  onPress={() => { setBreedSearch(""); setShowBreedModal(true); }}
                  className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                  activeOpacity={0.85}
                >
                  <Text className={breed ? "text-foreground" : "text-muted-foreground"}>
                    {breed || "Select breed"}
                  </Text>
                  <Text className="text-muted-foreground text-lg">›</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {normalizeKind(breed) === "other" ? (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Specify Breed</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={breedOtherText}
                  onChangeText={setBreedOtherText}
                  placeholder="Enter breed"
                  placeholderTextColor="rgb(148 163 184)"
                  returnKeyType="done"
                />
              </View>
            ) : null}

            {/* Weight */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">Weight</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder="e.g., 42"
                  keyboardType="decimal-pad"
                  placeholderTextColor="rgb(148 163 184)"
                  returnKeyType="done"
                />
              </View>

              <View className="w-28">
                <Text className="text-sm font-medium text-foreground mb-2">Unit</Text>
                <View className="flex-row gap-2">
                  {(["lb", "kg"] as const).map((u) => {
                    const active = weightUnit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setWeightUnit(u)}
                        className={`flex-1 rounded-xl border px-3 py-3 items-center ${active ? "bg-primary border-primary" : "bg-background border-border"}`}
                        activeOpacity={0.85}
                      >
                        <Text className={active ? "text-primary-foreground font-semibold" : "text-foreground"}>{u}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Date toggle row (single row) */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Date (optional)</Text>

              <View className="flex-row gap-2 mb-2">
                {(["DOB", "ADOPTION"] as const).map((m) => {
                  const active = dateMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setDateMode(m)}
                      className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
                      activeOpacity={0.85}
                    >
                      <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>
                        {m === "DOB" ? "Date of Birth" : "Adoption Date"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                activeOpacity={0.85}
              >
                <Text className={(dateMode === "DOB" ? dobDate : adoptionDate) ? "text-foreground" : "text-muted-foreground"}>
                  {formatDateLabel(dateMode === "DOB" ? dobDate : adoptionDate, "Select date")}
                </Text>
                <Calendar size={18} className="text-muted-foreground" />
              </TouchableOpacity>

              {(dateMode === "DOB" ? dobDate : adoptionDate) ? (
                <TouchableOpacity
                  onPress={() => (dateMode === "DOB" ? setDobDate(null) : setAdoptionDate(null))}
                  className="mt-2"
                  activeOpacity={0.85}
                >
                  <Text className="text-xs text-primary font-semibold">Clear {dateMode === "DOB" ? "DOB" : "Adoption Date"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Microchip ID (optional)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={microchipId}
                onChangeText={setMicrochipId}
                placeholder="Enter microchip ID"
                placeholderTextColor="rgb(148 163 184)"
                returnKeyType="done"
              />
            </View>
          </Section>

          {/* DAILY CARE */}
          <Section title="Daily Care" open={openDailyCare} onToggle={() => setOpenDailyCare((v) => !v)}>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Food brand</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={foodBrand}
                onChangeText={setFoodBrand}
                placeholder="e.g., Purina Pro Plan"
                placeholderTextColor="rgb(148 163 184)"
                returnKeyType="done"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Food type</Text>
              <PillSingleSelect options={PET_FOOD_TYPE_OPTIONS} value={foodType} onChange={setFoodType} />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">Portion</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={portionAmount}
                  onChangeText={setPortionAmount}
                  placeholder="e.g., 1.5"
                  keyboardType="decimal-pad"
                  placeholderTextColor="rgb(148 163 184)"
                  returnKeyType="done"
                />
              </View>
              <View className="w-28">
                <Text className="text-sm font-medium text-foreground mb-2">Unit</Text>
                <PillSingleSelect options={PET_PORTION_UNIT_OPTIONS} value={portionUnit} onChange={(v) => setPortionUnit(v as any)} />
              </View>
            </View>

            {/* Feeding times (time-only picker) */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Feeding schedule</Text>

              <View className="gap-2">
                {feedingTimes.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No feeding times added yet.</Text>
                ) : null}

                {feedingTimes.map((t, idx) => (
                  <View key={`${idx}_${t}`} className="flex-row gap-2 items-center">
                    <TouchableOpacity
                      onPress={() => openTimePicker("FEED", idx, t)}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                      activeOpacity={0.85}
                    >
                      <Text className={t ? "text-foreground" : "text-muted-foreground"}>
                        {t ? formatHHmmForDisplay(t) : `Select time ${idx + 1}`}
                      </Text>
                      <Clock size={18} className="text-muted-foreground" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => removeFeedingTime(idx)}
                      className="w-10 h-10 rounded-xl border border-border items-center justify-center"
                      activeOpacity={0.85}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity onPress={addFeedingTime} className="flex-row items-center gap-2 px-3 py-3 rounded-xl border border-border" activeOpacity={0.85}>
                  <Plus size={16} className="text-muted-foreground" />
                  <Text className="text-foreground font-semibold">Add feeding time</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Treats allowed?</Text>
              <PillSingleSelect options={PET_TREAT_ALLOWED_OPTIONS} value={treatAllowed} onChange={setTreatAllowed} />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Treat rules (notes)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={treatRulesNotes}
                onChangeText={setTreatRulesNotes}
                placeholder="e.g., max 2/day, only after potty"
                placeholderTextColor="rgb(148 163 184)"
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            </View>
          </Section>

          {/* BATHROOM / WALK */}
          <Section title="Bathroom / Walk" open={openBathroom} onToggle={() => setOpenBathroom((v) => !v)}>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">How many times per day?</Text>
              <PillSingleSelect options={["1", "2", "3", "4", "5", "6"] as const} value={pottyTimesPerDay} onChange={setPottyTimesPerDay} />
            </View>

            {/* Potty times (time-only picker) */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Times</Text>
              <View className="gap-2">
                {pottyTimes.map((t, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openTimePicker("POTTY", idx, t)}
                    className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.85}
                  >
                    <Text className={t ? "text-foreground" : "text-muted-foreground"}>
                      {t ? formatHHmmForDisplay(t) : `Select time ${idx + 1}`}
                    </Text>
                    <Clock size={18} className="text-muted-foreground" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Leash / harness details</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={leashHarnessNotes}
                onChangeText={setLeashHarnessNotes}
                placeholder="e.g., Front-clip harness, no retractable leash"
                placeholderTextColor="rgb(148 163 184)"
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Avoid triggers</Text>
              <PillMultiSelect options={PET_AVOID_TRIGGER_OPTIONS} value={avoidTriggers} onChange={setAvoidTriggers} />
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mt-3"
                value={avoidTriggersNotes}
                onChangeText={setAvoidTriggersNotes}
                placeholder='Extra notes (e.g., "reactive to huskies")'
                placeholderTextColor="rgb(148 163 184)"
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            </View>
          </Section>

          {/* SLEEP */}
          <Section title="Sleep" open={openSleep} onToggle={() => setOpenSleep((v) => !v)}>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Where do they sleep?</Text>
              <PillSingleSelect options={PET_SLEEP_LOCATION_OPTIONS} value={sleepLocation} onChange={setSleepLocation} />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Crate rules</Text>
              <PillSingleSelect options={PET_CRATE_RULE_OPTIONS} value={crateRule} onChange={setCrateRule} />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Bedtime routine</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                value={bedtimeRoutine}
                onChangeText={setBedtimeRoutine}
                placeholder="e.g., last potty 9pm, then crate + white noise"
                placeholderTextColor="rgb(148 163 184)"
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            </View>
          </Section>

          {/* BEHAVIOR */}
          <Section title="Behavior & Safety" open={openBehavior} onToggle={() => setOpenBehavior((v) => !v)}>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Fears (select all that apply)</Text>
              <PillMultiSelect options={PET_FEAR_OPTIONS} value={fears} onChange={setFears} />
              {fears.includes("Other") ? (
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mt-3"
                  value={fearOtherText}
                  onChangeText={setFearOtherText}
                  placeholder="Describe other fear"
                  placeholderTextColor="rgb(148 163 184)"
                  returnKeyType="done"
                />
              ) : null}
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Separation anxiety</Text>
              <PillSingleSelect options={PET_SEPARATION_ANXIETY_LEVEL_OPTIONS} value={separationAnxietyLevel} onChange={setSeparationAnxietyLevel} />
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mt-3"
                value={separationAnxietyNotes}
                onChangeText={setSeparationAnxietyNotes}
                placeholder="Notes (optional)"
                placeholderTextColor="rgb(148 163 184)"
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            </View>
          </Section>

          {/* MEDS */}
          <Section title="Medications & Supplements" open={openMeds} onToggle={() => setOpenMeds((v) => !v)}>
            <View className="gap-3">
              {medications.map((m, idx) => (
                <View key={m.id} className="rounded-2xl border border-border bg-background p-3 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-semibold">Medication {idx + 1}</Text>
                    <TouchableOpacity
                      onPress={() => setMedications((prev) => prev.filter((x) => x.id !== m.id))}
                      className="w-10 h-10 rounded-xl border border-border items-center justify-center"
                      activeOpacity={0.85}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={m.name}
                    onChangeText={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, name: v } : x)))}
                    placeholder="Name (required)"
                    placeholderTextColor="rgb(148 163 184)"
                    returnKeyType="done"
                  />
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={m.dosage || ""}
                    onChangeText={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, dosage: v } : x)))}
                    placeholder="Exact dosage (e.g., 10mg)"
                    placeholderTextColor="rgb(148 163 184)"
                    returnKeyType="done"
                  />

                  <Text className="text-sm font-medium text-foreground mt-1">How administered</Text>
                  <PillSingleSelect
                    options={PET_MED_ADMIN_METHOD_OPTIONS}
                    value={m.adminMethod || ""}
                    onChange={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, adminMethod: v } : x)))}
                  />

                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={m.scheduleNotes || ""}
                    onChangeText={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, scheduleNotes: v } : x)))}
                    placeholder="Schedule / notes (e.g., with dinner)"
                    placeholderTextColor="rgb(148 163 184)"
                    multiline
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                  />
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={m.missedDoseNotes || ""}
                    onChangeText={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, missedDoseNotes: v } : x)))}
                    placeholder="If missed dose…"
                    placeholderTextColor="rgb(148 163 184)"
                    multiline
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                  />
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={m.sideEffectsNotes || ""}
                    onChangeText={(v) => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, sideEffectsNotes: v } : x)))}
                    placeholder="Side effects to watch for"
                    placeholderTextColor="rgb(148 163 184)"
                    multiline
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={() =>
                  setMedications((prev) => [
                    ...prev,
                    { id: `med_${Date.now()}`, name: "", dosage: "", adminMethod: "", scheduleNotes: "" },
                  ])
                }
                className="flex-row items-center gap-2 px-3 py-3 rounded-xl border border-border"
                activeOpacity={0.85}
              >
                <Plus size={16} className="text-muted-foreground" />
                <Text className="text-foreground font-semibold">Add medication</Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* VACCINATIONS */}
          <Section title="Vaccinations" open={openVax} onToggle={() => setOpenVax((v) => !v)}>
            {!isDog && !isCat ? (
              <Text className="text-xs text-muted-foreground">Select Dog or Cat to see recommended vaccination options.</Text>
            ) : null}

            <View className="gap-3">
              {vaccinations.map((v, idx) => (
                <View key={v.id} className="rounded-2xl border border-border bg-background p-3 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-semibold">Vaccine {idx + 1}</Text>
                    <TouchableOpacity
                      onPress={() => setVaccinations((prev) => prev.filter((x) => x.id !== v.id))}
                      className="w-10 h-10 rounded-xl border border-border items-center justify-center"
                      activeOpacity={0.85}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setVaxSearch("");
                      setVaxPickerForId(v.id);
                      setShowVaxModal(true);
                    }}
                    className="bg-card border border-border rounded-xl px-4 py-3"
                    activeOpacity={0.85}
                  >
                    <Text className={v.name ? "text-foreground" : "text-muted-foreground"}>{v.name || "Select vaccine"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setVaxDateForId(v.id);
                      setShowVaxDatePicker(true);
                    }}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                    activeOpacity={0.85}
                  >
                    <Text className={v.date ? "text-foreground" : "text-muted-foreground"}>{formatDateLabel(v.date, "Select date (optional)")}</Text>
                    <Calendar size={18} className="text-muted-foreground" />
                  </TouchableOpacity>

                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    value={v.notes || ""}
                    onChangeText={(val) => setVaccinations((prev) => prev.map((x) => (x.id === v.id ? { ...x, notes: val } : x)))}
                    placeholder="Notes (optional)"
                    placeholderTextColor="rgb(148 163 184)"
                    multiline
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={() =>
                  setVaccinations((prev) => [
                    ...prev,
                    { id: `vax_${Date.now()}`, name: "", date: null, notes: "" },
                  ])
                }
                className="flex-row items-center gap-2 px-3 py-3 rounded-xl border border-border"
                activeOpacity={0.85}
              >
                <Plus size={16} className="text-muted-foreground" />
                <Text className="text-foreground font-semibold">Add vaccination</Text>
              </TouchableOpacity>
            </View>

          </Section>

          {/* ACTIONS */}
          <View className="mt-2">
            <TouchableOpacity onPress={() => router.back()} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky Save button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-3 bg-background border-t border-border"
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={handleSave}
            className={`rounded-xl py-4 items-center ${saveLabel === "saved" ? "bg-green-500" : "bg-primary"}`}
            activeOpacity={0.85}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              {saveLabel === "saved" ? "Saved ✓" : isEditing ? "Save Changes" : "Save Pet"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Single DOB/Adoption Date Picker */}
        <DatePickerModal
          visible={showDatePicker}
          value={dateMode === "DOB" ? dobDate : adoptionDate}
          onConfirm={(d) => {
            if (dateMode === "DOB") setDobDate(d);
            else setAdoptionDate(d);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
          title={dateMode === "DOB" ? "Select date of birth" : "Select adoption date"}
        />

        {/* Vaccination Date Picker */}
        <DatePickerModal
          visible={showVaxDatePicker}
          value={vaxDateForId ? vaccinations.find((x) => x.id === vaxDateForId)?.date ?? null : null}
          onConfirm={(d) => {
            if (!vaxDateForId) return;
            setVaccinations((prev) => prev.map((x) => (x.id === vaxDateForId ? { ...x, date: d } : x)));
            setShowVaxDatePicker(false);
            setVaxDateForId(null);
          }}
          onCancel={() => {
            setShowVaxDatePicker(false);
            setVaxDateForId(null);
          }}
          title="Select vaccination date"
        />

        {/* Time Picker (HH:mm) */}
        <TimePickerModal
          visible={timePickerOpen}
          value={timePickerValue}
          title="Select time"
          onConfirm={(hhmm) => {
            // Save to the correct schedule
            handleTimePicked(hhmm);

            // Also keep local state in sync for the row immediately
            const ctx = timePickerContext;
            if (!ctx) return;
            if (ctx.kind === "FEED") setFeedingTime(ctx.index, hhmm);
          }}
          onCancel={() => {
            setTimePickerOpen(false);
            setTimePickerContext(null);
          }}
        />
      </SafeAreaView>

      {/* ── Breed picker bottom sheet ── */}
      <Modal
        visible={showBreedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setShowBreedModal(false)}>
          <Pressable
            className="mt-auto bg-background rounded-t-3xl border-t border-border"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </View>

            <View className="flex-row items-center justify-between px-6 pt-3 pb-4">
              <Text className="text-lg font-semibold text-foreground">Select Breed</Text>
              <TouchableOpacity onPress={() => setShowBreedModal(false)} activeOpacity={0.85} hitSlop={10}>
                <Text className="text-primary font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>

            <View className="px-6 pb-3">
              <TextInput
                className="bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                style={{ paddingVertical: 12 }}
                value={breedSearch}
                onChangeText={setBreedSearch}
                placeholder="Search breed"
                placeholderTextColor="rgb(148 163 184)"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="px-6 pb-10 gap-1">
                {filteredBreedOptions.map((opt) => {
                  const active = breed === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => { setBreed(opt); setShowBreedModal(false); }}
                      className={`rounded-xl border px-4 py-3 ${active ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                      activeOpacity={0.85}
                    >
                      <Text className={active ? "text-sm font-semibold text-primary" : "text-sm text-foreground"}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
                {filteredBreedOptions.length === 0 && (
                  <Text className="text-xs text-muted-foreground py-3">No matching breeds.</Text>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Vaccine picker bottom sheet ── */}
      <Modal
        visible={showVaxModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowVaxModal(false); setVaxPickerForId(null); }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => { setShowVaxModal(false); setVaxPickerForId(null); }}
        >
          <Pressable
            className="mt-auto bg-background rounded-t-3xl border-t border-border"
            style={{ maxHeight: "82%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </View>

            <View className="flex-row items-center justify-between px-6 pt-3 pb-4">
              <Text className="text-lg font-semibold text-foreground">Select Vaccine</Text>
              <TouchableOpacity
                onPress={() => { setShowVaxModal(false); setVaxPickerForId(null); }}
                activeOpacity={0.85}
                hitSlop={10}
              >
                <Text className="text-primary font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>

            <View className="px-6 pb-3">
              <TextInput
                className="bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                style={{ paddingVertical: 12 }}
                value={vaxSearch}
                onChangeText={setVaxSearch}
                placeholder="Search vaccines"
                placeholderTextColor="rgb(148 163 184)"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="px-6 pb-10 gap-1">
                {filteredVaxOptions.map((opt) => {
                  const active = vaccinations.find((x) => x.id === vaxPickerForId)?.name === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setVaccinations((prev) => prev.map((x) => (x.id === vaxPickerForId ? { ...x, name: opt } : x)));
                        setShowVaxModal(false);
                        setVaxPickerForId(null);
                      }}
                      className={`rounded-xl border px-4 py-3 ${active ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                      activeOpacity={0.85}
                    >
                      <Text className={active ? "text-sm font-semibold text-primary" : "text-sm text-foreground"}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}

                <View className="mt-4 pt-4 border-t border-border gap-2">
                  <Text className="text-xs text-muted-foreground">Or enter a custom vaccine name:</Text>
                  <View className="flex-row gap-2 items-center">
                    <TextInput
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-4 text-foreground"
                      style={{ paddingVertical: 11 }}
                      placeholder="e.g., Custom vaccine"
                      placeholderTextColor="rgb(148 163 184)"
                      returnKeyType="done"
                      onSubmitEditing={(e) => {
                        const val = e.nativeEvent.text?.trim();
                        if (!val) return;
                        setVaccinations((prev) => prev.map((x) => (x.id === vaxPickerForId ? { ...x, name: val } : x)));
                        setShowVaxModal(false);
                        setVaxPickerForId(null);
                      }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardDismiss>
  );
}