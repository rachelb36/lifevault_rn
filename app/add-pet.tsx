import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PawPrint,
  Calendar,
  Plus,
  Trash,
  Phone,
  FileText,
  AlertCircle,
  Edit,
  Pill,
  Clock,
  Archive,
  Shield,
  Check,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { toIsoDateOnly, parseDate, formatDateLabel } from "@/shared/utils/date";
import { getLocalOnlyMode } from "@/shared/utils/localStorage";

import { KIND_OPTIONS, DOG_BREEDS, CAT_BREEDS } from "@/features/pets/domain/constants";
import { MY_VAULTS, CREATE_VAULT, CREATE_ENTITY, UPSERT_RECORD } from "@/features/pets/data/graphql";
import type {
  ChecklistItem,
  Medication,
  ServiceDocument,
  ServiceProvider,
  VaccinationRecord,
  Dateish,
} from "@/features/pets/domain/types";
import { mergeChecklistPreservingCustom } from "@/features/pets/domain/checklist";

import { AccordionSection } from "@/features/pets/ui/components/AccordionSection";
import { CustomSelect } from "@/features/pets/ui/components/CustomSelect";
import { VaccinationModal } from "@/features/pets/ui/components/modals/VaccinationModal";
import { ServiceDocumentModal } from "@/features/pets/ui/components/modals/ServiceDocumentModal";
import { MedicationModal } from "@/features/pets/ui/components/modals/MedicationModal";
import { ProviderModal } from "@/features/pets/ui/components/modals/ProviderModal";
import { ChecklistAddItemModal } from "@/features/pets/ui/components/modals/ChecklistAddItemModal";

export default function AddPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const editId = Array.isArray(id) ? id[0] : id;
  const isEditing = !!editId;

  const PETS_STORAGE_KEY = "pets_v1";

  const apolloClient = useApolloClient();
  const [createEntity, { loading: isSaving }] = useMutation(CREATE_ENTITY);
  const [upsertRecord] = useMutation(UPSERT_RECORD);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basics"]));

  // Basics
  const [petName, setPetName] = useState("");
  const [kind, setKind] = useState("");
  const [kindOtherText, setKindOtherText] = useState("");
  const [petDate, setPetDate] = useState<Date | null>(null);
  const [breed, setBreed] = useState("");
  const [breedOtherText, setBreedOtherText] = useState("");
  const [breedOptionalText, setBreedOptionalText] = useState("");

  // Vet & Microchip
  const [vetContact, setVetContact] = useState<{ name: string; phone: string } | null>(null);
  const [microchipId, setMicrochipId] = useState("");

  // Records
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [serviceDocuments, setServiceDocuments] = useState<ServiceDocument[]>([]);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showServiceDocModal, setShowServiceDocModal] = useState(false);
  const [newVaccination, setNewVaccination] = useState<{ name: string; date: Date | null; notes: string }>({
    name: "",
    date: null,
    notes: "",
  });
  const [newServiceDoc, setNewServiceDoc] = useState<{ type: ServiceDocument["type"]; expiryDate: Date | null }>({
    type: "ESA Letter",
    expiryDate: null,
  });

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [medicationTab, setMedicationTab] = useState<"active" | "history">("active");
  const [newMedication, setNewMedication] = useState<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date | null;
    endDate: Date | null;
    notes: string;
  }>({
    name: "",
    dosage: "",
    frequency: "",
    startDate: null,
    endDate: null,
    notes: "",
  });

  // Providers
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [newProvider, setNewProvider] = useState<{ name: string; type: ServiceProvider["type"]; phone: string; notes: string }>({
    name: "",
    type: "Walker",
    phone: "",
    notes: "",
  });

  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [insuranceNotes, setInsuranceNotes] = useState("");

  // Emergency
  const [emergencyInstructions, setEmergencyInstructions] = useState("");

  // Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Shared Date Picker
  const [datePickerState, setDatePickerState] = useState<{ visible: boolean; title: string; value: Date | null }>({
    visible: false,
    title: "Select date",
    value: null,
  });
  const datePickerOnConfirmRef = useRef<(date: Date) => void>(() => {});

  const openDatePicker = (title: string, currentValue: Dateish, onConfirm: (date: Date) => void) => {
    setDatePickerState({ visible: true, title, value: parseDate(currentValue) });
    datePickerOnConfirmRef.current = (d: Date) => onConfirm(d);
  };

  const closeDatePicker = () => setDatePickerState((p) => ({ ...p, visible: false }));

  const handleDateConfirm = (date: Date) => {
    datePickerOnConfirmRef.current(date);
    closeDatePicker();
  };

  // Derived UI
  const isDog = kind === "Dog";
  const isCat = kind === "Cat";
  const showBreedDropdown = isDog || isCat;
  const showKindOther = kind === "Other";
  const showSpecificsField = !!kind && !showBreedDropdown && kind !== "Other";
  const showBreedOtherText = showBreedDropdown && breed === "Other";

  const breedOptions = useMemo(() => {
    if (isDog) return [...DOG_BREEDS];
    if (isCat) return [...CAT_BREEDS];
    return [];
  }, [isDog, isCat]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSelectKind = (val: string) => {
    setKind(val);
    setKindOtherText("");
    setBreed("");
    setBreedOtherText("");
    setBreedOptionalText("");
  };

  const getOrCreateVaultId = async () => {
    const res = await apolloClient.query({ query: MY_VAULTS, fetchPolicy: "network-only" });
    const existing = res.data?.myVaults?.[0]?.id;
    if (existing) return existing;

    const created = await apolloClient.mutate({
      mutation: CREATE_VAULT,
      variables: { input: { name: "My Family Vault" } },
    });

    return created.data?.createVault?.id as string;
  };

  // Load edit state
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;

    (async () => {
      const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(list) ? list.find((p: any) => p.id === editId) : null;
      if (!found || cancelled) return;

      setPetName(found.petName || "");
      setKind(found.kind || "");
      setKindOtherText(found.kindOtherText || "");
      const loadedDob = found.dob ? new Date(found.dob) : null;
      const loadedAdoption = found.adoptionDate ? new Date(found.adoptionDate) : null;
      setPetDate(loadedDob || loadedAdoption);
      setBreed(found.breed || "");
      setBreedOtherText(found.breedOtherText || "");
      setBreedOptionalText(found.breedOptionalText || "");

      setVetContact(found.vetContact || null);
      setMicrochipId(found.microchipId || "");

      setVaccinations((found.vaccinations || []).map((v: any) => ({ ...v, date: v.date ? new Date(v.date) : null })));
      setServiceDocuments((found.serviceDocuments || []).map((d: any) => ({ ...d, expiryDate: d.expiryDate ? new Date(d.expiryDate) : null })));
      setMedications(
        (found.medications || []).map((m: any) => ({
          ...m,
          startDate: m.startDate ? new Date(m.startDate) : null,
          endDate: m.endDate ? new Date(m.endDate) : null,
        }))
      );
      setServiceProviders(found.serviceProviders || []);

      setInsuranceProvider(found.insuranceProvider || "");
      setPolicyNumber(found.policyNumber || "");
      setInsuranceNotes(found.insuranceNotes || "");

      setEmergencyInstructions(found.emergencyInstructions || "");
      setChecklistItems(found.checklistItems || []);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing, editId]);

  // ✅ Fix: preserve custom checklist items when kind changes
  useEffect(() => {
    setChecklistItems((prev) => mergeChecklistPreservingCustom(kind, prev));
  }, [kind]);

  const validate = (): string | null => {
    if (!petName.trim()) return "Please enter a pet name.";
    if (!kind) return "Please select a kind.";
    if (kind === "Other" && !kindOtherText.trim()) return "Please specify the kind.";
    if ((kind === "Dog" || kind === "Cat") && !breed) return "Please select a breed.";
    if ((kind === "Dog" || kind === "Cat") && breed === "Other" && !breedOtherText.trim()) return "Please specify the breed.";
    return null;
  };

  const buildInput = () => {
    const normalizedVet =
      vetContact && (vetContact.name.trim() || vetContact.phone.trim())
        ? { name: vetContact.name.trim(), phone: vetContact.phone.trim() }
        : null;

    return {
      petName: petName.trim(),
      kind,
      kindOtherText: kindOtherText.trim() || "",
      dob: petDate && !Number.isNaN(petDate.getTime()) ? toIsoDateOnly(petDate) : "",
      adoptionDate: petDate && !Number.isNaN(petDate.getTime()) ? toIsoDateOnly(petDate) : "",
      breed: breed || "",
      breedOtherText: breedOtherText.trim() || "",
      breedOptionalText: breedOptionalText.trim() || "",
      vetContact: normalizedVet,
      microchipId: microchipId.trim() || "",
      vaccinations: vaccinations.map((v) => ({ ...v, date: v.date ? toIsoDateOnly(v.date) : "" })),
      serviceDocuments: serviceDocuments.map((d) => ({ ...d, expiryDate: d.expiryDate ? toIsoDateOnly(d.expiryDate) : "" })),
      medications: medications.map((m) => ({
        ...m,
        startDate: m.startDate ? toIsoDateOnly(m.startDate) : "",
        endDate: m.endDate ? toIsoDateOnly(m.endDate) : "",
      })),
      serviceProviders,
      insuranceProvider: insuranceProvider.trim() || "",
      policyNumber: policyNumber.trim() || "",
      insuranceNotes: insuranceNotes.trim() || "",
      emergencyInstructions: emergencyInstructions.trim() || "",
      checklistItems,
    };
  };

  const handleSave = async () => {
    try {
      const error = validate();
      if (error) {
        Alert.alert("Required", error);
        return;
      }

      const input = buildInput();

      const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];

      const baseItem = {
        id: editId || `pet-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
      };

      if (isEditing) {
        const next = Array.isArray(list)
          ? list.map((p: any) =>
              p.id === editId ? { ...p, ...baseItem, createdAt: p.createdAt || baseItem.createdAt } : p
            )
          : [baseItem];
        await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(next));
        router.back();
        return;
      }

      const localOnly = await getLocalOnlyMode();
      let createdId = baseItem.id;

      if (!localOnly) {
        const petDateTime = petDate && !Number.isNaN(petDate.getTime()) ? petDate.toISOString() : null;
        const vaultId = await getOrCreateVaultId();
        const entityRes = await createEntity({
          variables: {
            input: {
              vaultId,
              entityType: "PET",
              displayName: input.petName,
              dateOfBirth: petDateTime,
              adoptionDate: petDateTime,
            },
          },
        });

        const entityId = entityRes.data?.createEntity?.id;

        if (entityId) {
          await upsertRecord({
            variables: {
              input: {
                vaultId,
                entityId,
                recordType: "PET_PROFILE",
                payload: {
                  kind: input.kind,
                  kindOtherText: input.kindOtherText,
                  breed: input.breed,
                  breedOtherText: input.breedOtherText,
                  details: input.breedOptionalText,
                  dob: input.dob || "",
                  adoptionDate: input.adoptionDate || "",
                  microchipId: input.microchipId || "",
                  emergencyInstructions: input.emergencyInstructions || "",
                  insuranceProvider: input.insuranceProvider || "",
                  policyNumber: input.policyNumber || "",
                  insuranceNotes: input.insuranceNotes || "",
                  vetContact: input.vetContact || null,
                  vaccinations: input.vaccinations || [],
                  serviceDocuments: input.serviceDocuments || [],
                  medications: input.medications || [],
                  serviceProviders: input.serviceProviders || [],
                  checklistItems: input.checklistItems || [],
                },
                payloadVersion: 1,
                source: "MANUAL",
                privacy: "STANDARD",
                fileIds: [],
              },
            },
          });

          createdId = entityId;
        }
      }

      const next = [{ ...baseItem, id: createdId }, ...(Array.isArray(list) ? list : [])];
      await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(next));
      router.back();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Please try again.");
    }
  };

  // Vaccinations
  const addVaccination = () => {
    if (!newVaccination.name.trim()) return;
    const record: VaccinationRecord = {
      id: `vac-${Date.now()}`,
      name: newVaccination.name.trim(),
      date: newVaccination.date,
      notes: newVaccination.notes,
    };
    setVaccinations((prev) => [...prev, record]);
    setNewVaccination({ name: "", date: null, notes: "" });
    setShowVaccinationModal(false);
  };

  const deleteVaccination = (id: string) => {
    Alert.alert("Delete Record", "Remove this vaccination record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setVaccinations((prev) => prev.filter((v) => v.id !== id)) },
    ]);
  };

  // Service docs
  const addServiceDocument = () => {
    setServiceDocuments((prev) => [...prev, { id: `svc-${Date.now()}`, type: newServiceDoc.type, expiryDate: newServiceDoc.expiryDate }]);
    setNewServiceDoc({ type: "ESA Letter", expiryDate: null });
    setShowServiceDocModal(false);
  };

  const deleteServiceDocument = (id: string) => {
    Alert.alert("Delete Document", "Remove this document?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setServiceDocuments((prev) => prev.filter((d) => d.id !== id)) },
    ]);
  };

  // Medications
  const openAddMedicationModal = () => {
    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "", startDate: null, endDate: null, notes: "" });
    setShowMedicationModal(true);
  };

  const openEditMedicationModal = (m: Medication) => {
    setEditingMedication(m);
    setNewMedication({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: m.startDate,
      endDate: m.endDate || null,
      notes: m.notes || "",
    });
    setShowMedicationModal(true);
  };

  const saveMedication = () => {
    if (!newMedication.name.trim()) {
      Alert.alert("Required Field", "Please enter medication name.");
      return;
    }

    if (editingMedication) {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === editingMedication.id
            ? {
                ...m,
                name: newMedication.name.trim(),
                dosage: newMedication.dosage.trim(),
                frequency: newMedication.frequency.trim(),
                startDate: newMedication.startDate,
                endDate: newMedication.endDate || null,
                notes: newMedication.notes.trim() || undefined,
              }
            : m
        )
      );
    } else {
      setMedications((prev) => [
        ...prev,
        {
          id: `med-${Date.now()}`,
          name: newMedication.name.trim(),
          dosage: newMedication.dosage.trim(),
          frequency: newMedication.frequency.trim(),
          startDate: newMedication.startDate,
          endDate: newMedication.endDate || null,
          notes: newMedication.notes.trim() || undefined,
          status: "active",
        },
      ]);
    }

    setShowMedicationModal(false);
    setEditingMedication(null);
  };

  const deleteMedication = (id: string) => {
    Alert.alert("Delete Medication", "Remove this medication?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setMedications((prev) => prev.filter((m) => m.id !== id)) },
    ]);
  };

  const moveToHistory = (m: Medication) => {
    Alert.alert("Move to History", "Move this medication to history? You can reactivate it later.", [
      { text: "Cancel", style: "cancel" },
      { text: "Move", onPress: () => setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "history" } : x))) },
    ]);
  };

  const moveToActive = (m: Medication) => {
    setMedications((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "active" } : x)));
  };

  // Providers
  const openAddProviderModal = () => {
    setEditingProvider(null);
    setNewProvider({ name: "", type: "Walker", phone: "", notes: "" });
    setShowProviderModal(true);
  };

  const openEditProviderModal = (p: ServiceProvider) => {
    setEditingProvider(p);
    setNewProvider({ name: p.name, type: p.type, phone: p.phone, notes: p.notes || "" });
    setShowProviderModal(true);
  };

  const saveProvider = () => {
    if (!newProvider.name.trim() || !newProvider.phone.trim()) {
      Alert.alert("Required Fields", "Please enter provider name and phone number.");
      return;
    }

    if (editingProvider) {
      setServiceProviders((prev) =>
        prev.map((p) =>
          p.id === editingProvider.id
            ? { ...p, name: newProvider.name.trim(), type: newProvider.type, phone: newProvider.phone.trim(), notes: newProvider.notes.trim() || undefined }
            : p
        )
      );
    } else {
      setServiceProviders((prev) => [
        ...prev,
        { id: `prov-${Date.now()}`, name: newProvider.name.trim(), type: newProvider.type, phone: newProvider.phone.trim(), notes: newProvider.notes.trim() || undefined },
      ]);
    }

    setShowProviderModal(false);
    setEditingProvider(null);
  };

  const deleteProvider = (id: string) => {
    Alert.alert("Delete Provider", "Remove this service provider?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setServiceProviders((prev) => prev.filter((p) => p.id !== id)) },
    ]);
  };

  // Checklist
  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item)));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, label: newItemText.trim(), isChecked: false, isSuggested: false, category: "general" },
    ]);
    setNewItemText("");
    setShowAddItemModal(false);
  };

  const deleteChecklistItem = (id: string) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setChecklistItems((prev) => prev.filter((item) => item.id !== id)) },
    ]);
  };

  const headerTitle = isEditing ? "Edit Pet" : "Add Pet";

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <TouchableOpacity onPress={() => router.back()} disabled={isSaving}>
            <Text className="text-muted-foreground">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">{headerTitle}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text className="text-primary font-semibold">{isSaving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
          <AccordionSection
            title="Basics"
            icon={<PawPrint size={20} className="text-primary" />}
            isExpanded={expandedSections.has("basics")}
            onToggle={() => toggleSection("basics")}
          >
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Pet Name *</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Enter pet name"
                  placeholderTextColor="rgb(113 113 122)"
                  value={petName}
                  onChangeText={setPetName}
                />
              </View>

              <CustomSelect label="Kind" value={kind} options={[...KIND_OPTIONS]} onSelect={handleSelectKind} placeholder="Select kind" />

              {showKindOther && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Specify Kind *</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                    placeholder="Enter kind"
                    placeholderTextColor="rgb(113 113 122)"
                    value={kindOtherText}
                    onChangeText={setKindOtherText}
                  />
                </View>
              )}

              {showBreedDropdown && (
                <CustomSelect
                  label={isDog ? "Dog Breed" : "Cat Breed"}
                  value={breed}
                  options={breedOptions}
                  onSelect={setBreed}
                  placeholder={isDog ? "Select dog breed" : "Select cat breed"}
                />
              )}

              <TouchableOpacity
                onPress={() => openDatePicker("Birthdate / Adoption date (optional)", petDate, (d) => setPetDate(d))}
                className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
                activeOpacity={0.85}
              >
                <Text className={petDate ? "text-foreground" : "text-muted-foreground"}>
                  {formatDateLabel(petDate, "Birthdate / Adoption date (optional)")}
                </Text>
                <Calendar size={18} className="text-muted-foreground" />
              </TouchableOpacity>

              {showBreedOtherText && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Specify Breed *</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                    placeholder="Enter breed"
                    placeholderTextColor="rgb(113 113 122)"
                    value={breedOtherText}
                    onChangeText={setBreedOtherText}
                  />
                </View>
              )}

              {showSpecificsField && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Details (optional)</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                    placeholder="Add any details"
                    placeholderTextColor="rgb(113 113 122)"
                    value={breedOptionalText}
                    onChangeText={setBreedOptionalText}
                  />
                </View>
              )}
            </View>
          </AccordionSection>

          <AccordionSection
            title="Vet & Microchip"
            icon={<Phone size={20} className="text-primary" />}
            isExpanded={expandedSections.has("vet")}
            onToggle={() => toggleSection("vet")}
          >
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Vet Name</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Enter vet name"
                  placeholderTextColor="rgb(113 113 122)"
                  value={vetContact?.name || ""}
                  onChangeText={(text) => setVetContact((prev) => ({ name: text, phone: prev?.phone || "" }))}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Vet Phone</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="(555) 000-0000"
                  placeholderTextColor="rgb(113 113 122)"
                  value={vetContact?.phone || ""}
                  onChangeText={(text) => setVetContact((prev) => ({ name: prev?.name || "", phone: text }))}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Microchip ID</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Enter microchip ID"
                  placeholderTextColor="rgb(113 113 122)"
                  value={microchipId}
                  onChangeText={setMicrochipId}
                />
              </View>
            </View>
          </AccordionSection>

          <AccordionSection
            title="Records & Uploads"
            icon={<FileText size={20} className="text-primary" />}
            isExpanded={expandedSections.has("records")}
            onToggle={() => toggleSection("records")}
          >
            <View className="gap-5">
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-foreground">Vaccinations</Text>
                  <TouchableOpacity onPress={() => setShowVaccinationModal(true)} className="flex-row items-center gap-1">
                    <Plus size={16} className="text-primary" />
                    <Text className="text-primary font-medium">Add</Text>
                  </TouchableOpacity>
                </View>

                {vaccinations.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No vaccination records yet.</Text>
                ) : (
                  vaccinations.map((v) => (
                    <View key={v.id} className="bg-muted/50 border border-border rounded-xl p-3 mb-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-foreground font-medium">{v.name}</Text>
                        <TouchableOpacity onPress={() => deleteVaccination(v.id)}>
                          <Trash size={16} className="text-muted-foreground" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-muted-foreground">Date: {formatDateLabel(v.date, "Not set")}</Text>
                      {!!v.notes && <Text className="text-xs text-muted-foreground mt-1">{v.notes}</Text>}
                    </View>
                  ))
                )}
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-foreground">Service Documents</Text>
                  <TouchableOpacity onPress={() => setShowServiceDocModal(true)} className="flex-row items-center gap-1">
                    <Plus size={16} className="text-primary" />
                    <Text className="text-primary font-medium">Add</Text>
                  </TouchableOpacity>
                </View>

                {serviceDocuments.length === 0 ? (
                  <Text className="text-xs text-muted-foreground">No service documents yet.</Text>
                ) : (
                  serviceDocuments.map((d) => (
                    <View key={d.id} className="bg-muted/50 border border-border rounded-xl p-3 mb-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-foreground font-medium">{d.type}</Text>
                        <TouchableOpacity onPress={() => deleteServiceDocument(d.id)}>
                          <Trash size={16} className="text-muted-foreground" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-muted-foreground">Expiry: {formatDateLabel(d.expiryDate, "Not set")}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </AccordionSection>

          <AccordionSection
            title="Medications"
            icon={<Pill size={20} className="text-primary" />}
            isExpanded={expandedSections.has("medications")}
            onToggle={() => toggleSection("medications")}
          >
            <View className="gap-4">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setMedicationTab("active")}
                  className={`px-3 py-1.5 rounded-full border ${medicationTab === "active" ? "bg-primary border-primary" : "bg-card border-border"}`}
                >
                  <Text className={`text-xs ${medicationTab === "active" ? "text-primary-foreground" : "text-foreground"}`}>Active</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMedicationTab("history")}
                  className={`px-3 py-1.5 rounded-full border ${medicationTab === "history" ? "bg-primary border-primary" : "bg-card border-border"}`}
                >
                  <Text className={`text-xs ${medicationTab === "history" ? "text-primary-foreground" : "text-foreground"}`}>History</Text>
                </TouchableOpacity>

                <View className="flex-1" />
                <TouchableOpacity onPress={openAddMedicationModal} className="flex-row items-center gap-1">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add</Text>
                </TouchableOpacity>
              </View>

              {medications.filter((m) => m.status === medicationTab).map((m) => (
                <View key={m.id} className="bg-muted/50 border border-border rounded-xl p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-medium">{m.name}</Text>
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity onPress={() => openEditMedicationModal(m)}>
                        <Edit size={16} className="text-muted-foreground" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteMedication(m.id)}>
                        <Trash size={16} className="text-muted-foreground" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text className="text-xs text-muted-foreground">{m.dosage} • {m.frequency}</Text>
                  <Text className="text-xs text-muted-foreground">{formatDateLabel(m.startDate, "Start date not set")}</Text>

                  {m.status === "active" ? (
                    <TouchableOpacity onPress={() => moveToHistory(m)} className="mt-2 flex-row items-center gap-1">
                      <Archive size={14} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">Move to history</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => moveToActive(m)} className="mt-2 flex-row items-center gap-1">
                      <Clock size={14} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">Move to active</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </AccordionSection>

          <AccordionSection
            title="Service Providers"
            icon={<Shield size={20} className="text-primary" />}
            isExpanded={expandedSections.has("providers")}
            onToggle={() => toggleSection("providers")}
          >
            <View className="gap-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-foreground">Providers</Text>
                <TouchableOpacity onPress={openAddProviderModal} className="flex-row items-center gap-1">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add</Text>
                </TouchableOpacity>
              </View>

              {serviceProviders.map((p) => (
                <View key={p.id} className="bg-muted/50 border border-border rounded-xl p-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-foreground font-medium">{p.name}</Text>
                      <Text className="text-xs text-muted-foreground">{p.type}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity onPress={() => openEditProviderModal(p)}>
                        <Edit size={16} className="text-muted-foreground" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteProvider(p.id)}>
                        <Trash size={16} className="text-muted-foreground" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">{p.phone}</Text>
                  {!!p.notes && <Text className="text-xs text-muted-foreground mt-1">{p.notes}</Text>}
                </View>
              ))}
            </View>
          </AccordionSection>

          <AccordionSection
            title="Insurance"
            icon={<Shield size={20} className="text-primary" />}
            isExpanded={expandedSections.has("insurance")}
            onToggle={() => toggleSection("insurance")}
          >
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Provider</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Insurance provider"
                  placeholderTextColor="rgb(113 113 122)"
                  value={insuranceProvider}
                  onChangeText={setInsuranceProvider}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Policy Number</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Policy number"
                  placeholderTextColor="rgb(113 113 122)"
                  value={policyNumber}
                  onChangeText={setPolicyNumber}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Additional notes"
                  placeholderTextColor="rgb(113 113 122)"
                  value={insuranceNotes}
                  onChangeText={setInsuranceNotes}
                  multiline
                />
              </View>
            </View>
          </AccordionSection>

          <AccordionSection
            title="Emergency Instructions"
            icon={<AlertCircle size={20} className="text-primary" />}
            isExpanded={expandedSections.has("emergency")}
            onToggle={() => toggleSection("emergency")}
          >
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Add emergency instructions"
              placeholderTextColor="rgb(113 113 122)"
              value={emergencyInstructions}
              onChangeText={setEmergencyInstructions}
              multiline
            />
          </AccordionSection>

          <AccordionSection
            title="Checklist"
            icon={<Check size={20} className="text-primary" />}
            isExpanded={expandedSections.has("checklist")}
            onToggle={() => toggleSection("checklist")}
          >
            <View className="gap-3">
              {checklistItems.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between">
                  <TouchableOpacity onPress={() => toggleChecklistItem(item.id)} className="flex-row items-center gap-3">
                    <View className={`w-5 h-5 rounded border ${item.isChecked ? "bg-primary border-primary" : "border-border"}`} />
                    <Text className={`text-sm ${item.isChecked ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteChecklistItem(item.id)}>
                    <Trash size={14} className="text-muted-foreground" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity onPress={() => setShowAddItemModal(true)} className="flex-row items-center gap-2 mt-2">
                <Plus size={16} className="text-primary" />
                <Text className="text-primary font-medium">Add custom item</Text>
              </TouchableOpacity>
            </View>
          </AccordionSection>
        </ScrollView>

        {/* Modals */}
        <VaccinationModal
          visible={showVaccinationModal}
          value={newVaccination}
          onChange={setNewVaccination}
          onClose={() => setShowVaccinationModal(false)}
          onSave={addVaccination}
          openDatePicker={openDatePicker}
        />

        <ServiceDocumentModal
          visible={showServiceDocModal}
          value={newServiceDoc}
          onChange={setNewServiceDoc}
          onClose={() => setShowServiceDocModal(false)}
          onSave={addServiceDocument}
          openDatePicker={openDatePicker}
        />

        <MedicationModal
          visible={showMedicationModal}
          title={editingMedication ? "Edit Medication" : "Add Medication"}
          value={newMedication}
          onChange={setNewMedication}
          onClose={() => setShowMedicationModal(false)}
          onSave={saveMedication}
          openDatePicker={openDatePicker}
        />

        <ProviderModal
          visible={showProviderModal}
          title={editingProvider ? "Edit Provider" : "Add Provider"}
          value={newProvider}
          onChange={setNewProvider}
          onClose={() => setShowProviderModal(false)}
          onSave={saveProvider}
        />

        <ChecklistAddItemModal
          visible={showAddItemModal}
          value={newItemText}
          onChange={setNewItemText}
          onClose={() => setShowAddItemModal(false)}
          onAdd={addCustomItem}
        />

        <DatePickerModal
          visible={datePickerState.visible}
          value={datePickerState.value}
          title={datePickerState.title}
          onConfirm={handleDateConfirm}
          onCancel={closeDatePicker}
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
