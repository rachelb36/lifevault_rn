import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  ChevronDown,
  ChevronUp,
  PawPrint,
  Calendar,
  Check,
  Plus,
  Trash,
  X,
  Search,
  Phone,
  FileText,
  Upload,
  AlertCircle,
  Edit,
  Pill,
  Clock,
  Archive,
  Shield,
} from "lucide-react-native";
import { useRouter } from "expo-router";

// Constants
const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Reptile", "Fish", "Small Animal", "Other"];

const DOG_BREEDS = [
  "Akita",
  "Alaskan Malamute",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Beagle",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Bulldog",
  "Cane Corso",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chow Chow",
  "Cocker Spaniel",
  "Dachshund",
  "Doberman Pinscher",
  "English Setter",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Husky (Siberian Husky)",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltese",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Mixed / Unknown",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Pit Bull / American Pit Bull Terrier",
  "Pomeranian",
  "Poodle (Miniature)",
  "Poodle (Standard)",
  "Poodle (Toy)",
  "Pug",
  "Rottweiler",
  "Samoyed",
  "Shiba Inu",
  "Shih Tzu",
  "Staffordshire Bull Terrier",
  "Vizsla",
  "Weimaraner",
  "West Highland White Terrier",
  "Yorkshire Terrier",
  "Other",
];

const CAT_BREEDS = [
  "Abyssinian",
  "American Curl",
  "American Shorthair",
  "Balinese",
  "Bengal",
  "Birman",
  "British Shorthair",
  "Burmese",
  "Cornish Rex",
  "Devon Rex",
  "Domestic Long Hair",
  "Domestic Medium Hair",
  "Domestic Short Hair",
  "Egyptian Mau",
  "Maine Coon",
  "Mixed / Unknown",
  "Norwegian Forest Cat",
  "Oriental Shorthair",
  "Persian",
  "Ragdoll",
  "Russian Blue",
  "Scottish Fold",
  "Siamese",
  "Siberian",
  "Sphynx",
  "Turkish Angora",
  "Other",
];

// Types
type ChecklistCategory = "general" | "dog_optional" | "cat_optional";

interface ChecklistItem {
  id: string;
  label: string;
  isChecked: boolean;
  isSuggested: boolean;
  category: ChecklistCategory;
}

interface VaccinationRecord {
  id: string;
  name: string;
  date: string;
  notes: string;
  documentId?: string;
}

interface ServiceDocument {
  id: string;
  type: "ESA Letter" | "Service Animal Certification" | "Other";
  documentId?: string;
  expiryDate?: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  type: "Walker" | "Sitter" | "Daycare" | "Groomer" | "Trainer" | "Boarding" | "Other";
  phone: string;
  notes?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  status: "active" | "history";
}

// Custom Select Component
type SelectProps = {
  label: React.ReactNode;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder?: string;
};

const CustomSelect: React.FC<SelectProps> = ({ label, value, options, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} className="text-muted-foreground" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center mb-4">
              <Search size={18} className="text-muted-foreground mr-2" />
              <TextInput
                className="flex-1 text-foreground"
                placeholder="Search..."
                placeholderTextColor="rgb(168 162 158)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} className="text-muted-foreground" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView className="max-h-[80%]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="py-3 border-b border-border flex-row justify-between items-center"
                  >
                    <Text className="text-foreground">{option}</Text>
                    {value === option && <Check size={18} className="text-primary" />}
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-muted-foreground">No results found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Accordion Section Component
type AccordionSectionProps = {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}) => (
  <View className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center justify-between p-4 bg-card/50"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
      </View>
      {isExpanded ? (
        <ChevronUp size={20} className="text-muted-foreground" />
      ) : (
        <ChevronDown size={20} className="text-muted-foreground" />
      )}
    </TouchableOpacity>
    {isExpanded && <View className="p-4 border-t border-border bg-card">{children}</View>}
  </View>
);

export default function AddPetScreen() {
  const router = useRouter();

  // State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basics"]));

  // Section A: Basics
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [speciesOtherText, setSpeciesOtherText] = useState("");
  const [dob, setDob] = useState("");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [breed, setBreed] = useState("");
  const [breedOtherText, setBreedOtherText] = useState("");
  const [breedOptionalText, setBreedOptionalText] = useState(""); // used as "Specifics" for non-dog/cat

  // Section B: Vet & Microchip
  const [vetContact, setVetContact] = useState<{ name: string; phone: string } | null>(null);
  const [microchipId, setMicrochipId] = useState("");

  // Section C: Records & Uploads
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [serviceDocuments, setServiceDocuments] = useState<ServiceDocument[]>([]);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showServiceDocModal, setShowServiceDocModal] = useState(false);
  const [newVaccination, setNewVaccination] = useState({ name: "", date: "", notes: "" });
  const [newServiceDoc, setNewServiceDoc] = useState({ type: "ESA Letter" as const, expiryDate: "" });

  // Section D: Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [medicationTab, setMedicationTab] = useState<"active" | "history">("active");
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  // Section E: Service Providers
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: "",
    type: "Walker" as const,
    phone: "",
    notes: "",
  });

  // Section F: Insurance
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [insuranceNotes, setInsuranceNotes] = useState("");

  // Section G: Emergency Instructions
  const [emergencyInstructions, setEmergencyInstructions] = useState("");

  // Section H: Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Helpers for conditional UI
  const isDog = species === "Dog";
  const isCat = species === "Cat";
  const showBreedDropdown = isDog || isCat;
  const showSpeciesOther = species === "Other";
  const showSpecificsField = !!species && !showBreedDropdown && species !== "Other";
  const showBreedOtherText = showBreedDropdown && breed === "Other";

  const toggleSection = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) newSet.delete(sectionId);
    else newSet.add(sectionId);
    setExpandedSections(newSet);
  };

  const getBreedOptions = () => {
    if (isDog) return DOG_BREEDS;
    if (isCat) return CAT_BREEDS;
    return [];
  };

  // Seed checklist items when species changes
  useEffect(() => {
    const generalItems: ChecklistItem[] = [
      { id: "g1", label: "Vet contact added", isChecked: false, isSuggested: true, category: "general" },
      { id: "g2", label: "Vaccination records uploaded", isChecked: false, isSuggested: true, category: "general" },
      { id: "g3", label: "Microchip ID saved", isChecked: false, isSuggested: true, category: "general" },
      { id: "g4", label: "Medications reviewed/added", isChecked: false, isSuggested: true, category: "general" },
      { id: "g5", label: "Pet insurance info added", isChecked: false, isSuggested: true, category: "general" },
      { id: "g6", label: "Emergency instructions added", isChecked: false, isSuggested: true, category: "general" },
      { id: "g7", label: "Caregiver/sitter added", isChecked: false, isSuggested: true, category: "general" },
    ];

    let optionalItems: ChecklistItem[] = [];

    if (species === "Dog") {
      optionalItems = [
        { id: "d1", label: "Rabies tag / proof saved", isChecked: false, isSuggested: true, category: "dog_optional" },
        { id: "d2", label: "Heartworm prevention noted", isChecked: false, isSuggested: true, category: "dog_optional" },
        { id: "d3", label: "Flea/tick prevention noted", isChecked: false, isSuggested: true, category: "dog_optional" },
        { id: "d4", label: "Leash/harness size noted", isChecked: false, isSuggested: true, category: "dog_optional" },
        { id: "d5", label: "Boarding/daycare contact added", isChecked: false, isSuggested: true, category: "dog_optional" },
      ];
    } else if (species === "Cat") {
      optionalItems = [
        { id: "c1", label: "Rabies tag / proof saved", isChecked: false, isSuggested: true, category: "cat_optional" },
        { id: "c2", label: "Flea/tick prevention noted", isChecked: false, isSuggested: true, category: "cat_optional" },
        { id: "c3", label: "Carrier location noted", isChecked: false, isSuggested: true, category: "cat_optional" },
        { id: "c4", label: "Litter preference noted", isChecked: false, isSuggested: true, category: "cat_optional" },
        { id: "c5", label: "Boarding/sitter contact added", isChecked: false, isSuggested: true, category: "cat_optional" },
      ];
    }

    const updatedItems = [...generalItems, ...optionalItems].map((newItem) => {
      const existing = checklistItems.find((old) => old.id === newItem.id);
      return existing ? { ...newItem, isChecked: existing.isChecked } : newItem;
    });

    const relevantItems = updatedItems.filter((item) => {
      if (item.category === "general") return true;
      if (item.category === "dog_optional") return species === "Dog";
      if (item.category === "cat_optional") return species === "Cat";
      return true;
    });

    setChecklistItems(relevantItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  // Vaccination Handlers
  const addVaccination = () => {
    if (!newVaccination.name.trim()) return;
    const record: VaccinationRecord = {
      id: `vac-${Date.now()}`,
      name: newVaccination.name.trim(),
      date: newVaccination.date,
      notes: newVaccination.notes,
    };
    setVaccinations((prev) => [...prev, record]);
    setNewVaccination({ name: "", date: "", notes: "" });
    setShowVaccinationModal(false);
  };

  const deleteVaccination = (id: string) => {
    Alert.alert("Delete Record", "Remove this vaccination record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setVaccinations((prev) => prev.filter((v) => v.id !== id)),
      },
    ]);
  };

  // Service Document Handlers
  const addServiceDocument = () => {
    const doc: ServiceDocument = {
      id: `svc-${Date.now()}`,
      type: newServiceDoc.type,
      expiryDate: newServiceDoc.expiryDate,
    };
    setServiceDocuments((prev) => [...prev, doc]);
    setNewServiceDoc({ type: "ESA Letter", expiryDate: "" });
    setShowServiceDocModal(false);
  };

  const deleteServiceDocument = (id: string) => {
    Alert.alert("Delete Document", "Remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setServiceDocuments((prev) => prev.filter((d) => d.id !== id)),
      },
    ]);
  };

  // Medication Handlers
  const openAddMedicationModal = () => {
    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "", startDate: "", endDate: "", notes: "" });
    setShowMedicationModal(true);
  };

  const openEditMedicationModal = (medication: Medication) => {
    setEditingMedication(medication);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate || "",
      notes: medication.notes || "",
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
                endDate: newMedication.endDate || undefined,
                notes: newMedication.notes.trim() || undefined,
              }
            : m
        )
      );
    } else {
      const medication: Medication = {
        id: `med-${Date.now()}`,
        name: newMedication.name.trim(),
        dosage: newMedication.dosage.trim(),
        frequency: newMedication.frequency.trim(),
        startDate: newMedication.startDate,
        endDate: newMedication.endDate || undefined,
        notes: newMedication.notes.trim() || undefined,
        status: "active",
      };
      setMedications((prev) => [...prev, medication]);
    }

    setShowMedicationModal(false);
    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "", startDate: "", endDate: "", notes: "" });
  };

  const deleteMedication = (id: string) => {
    Alert.alert("Delete Medication", "Remove this medication?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setMedications((prev) => prev.filter((m) => m.id !== id)),
      },
    ]);
  };

  const moveToHistory = (medication: Medication) => {
    Alert.alert("Move to History", "Move this medication to history? You can reactivate it later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Move",
        onPress: () =>
          setMedications((prev) => prev.map((m) => (m.id === medication.id ? { ...m, status: "history" } : m))),
      },
    ]);
  };

  const moveToActive = (medication: Medication) => {
    setMedications((prev) => prev.map((m) => (m.id === medication.id ? { ...m, status: "active" } : m)));
  };

  // Service Provider Handlers
  const openAddProviderModal = () => {
    setEditingProvider(null);
    setNewProvider({ name: "", type: "Walker", phone: "", notes: "" });
    setShowProviderModal(true);
  };

  const openEditProviderModal = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setNewProvider({
      name: provider.name,
      type: provider.type,
      phone: provider.phone,
      notes: provider.notes || "",
    });
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
            ? {
                ...p,
                name: newProvider.name.trim(),
                type: newProvider.type,
                phone: newProvider.phone.trim(),
                notes: newProvider.notes.trim() || undefined,
              }
            : p
        )
      );
    } else {
      const provider: ServiceProvider = {
        id: `prov-${Date.now()}`,
        name: newProvider.name.trim(),
        type: newProvider.type,
        phone: newProvider.phone.trim(),
        notes: newProvider.notes.trim() || undefined,
      };
      setServiceProviders((prev) => [...prev, provider]);
    }

    setShowProviderModal(false);
    setEditingProvider(null);
    setNewProvider({ name: "", type: "Walker", phone: "", notes: "" });
  };

  const deleteProvider = (id: string) => {
    Alert.alert("Delete Provider", "Remove this service provider?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setServiceProviders((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  // Checklist Handlers
  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item)));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      label: newItemText.trim(),
      isChecked: false,
      isSuggested: false,
      category: "general",
    };
    setChecklistItems((prev) => [...prev, newItem]);
    setNewItemText("");
    setShowAddItemModal(false);
  };

  const deleteChecklistItem = (id: string) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setChecklistItems((prev) => prev.filter((item) => item.id !== id)),
      },
    ]);
  };

  const updateChecklistLabel = (id: string, newLabel: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, label: newLabel } : item)));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-muted-foreground">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Add Pet</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 128 }}>
        {/* Section A: Basics */}
        <AccordionSection
          title="Basics"
          icon={<PawPrint size={20} className="text-primary" />}
          isExpanded={expandedSections.has("basics")}
          onToggle={() => toggleSection("basics")}
        >
          <View className="gap-2">
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Pet Name <Text className="text-destructive">*</Text>
              </Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Enter pet name"
                value={petName}
                onChangeText={setPetName}
              />
            </View>

            <CustomSelect
              label={
                <Text className="text-sm font-medium text-foreground">
                  Type <Text className="text-destructive">*</Text>
                </Text>
              }
              value={species}
              options={SPECIES_OPTIONS}
              onSelect={(val) => {
                setSpecies(val);

                // reset dependent fields
                setSpeciesOtherText("");
                setBreed("");
                setBreedOtherText("");
                setBreedOptionalText("");
              }}
              placeholder="Select type"
            />

            {showSpeciesOther && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Type (Other) <Text className="text-destructive">*</Text>
                </Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="e.g. Hamster, Turtle"
                  value={speciesOtherText}
                  onChangeText={setSpeciesOtherText}
                />
              </View>
            )}

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">Date of Birth</Text>
                <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center">
                  <Calendar size={16} className="text-muted-foreground mr-2" />
                  <TextInput
                    className="flex-1 text-foreground"
                    placeholder="MM/DD/YYYY"
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">Adoption Date</Text>
                <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center">
                  <Calendar size={16} className="text-muted-foreground mr-2" />
                  <TextInput
                    className="flex-1 text-foreground"
                    placeholder="MM/DD/YYYY"
                    value={adoptionDate}
                    onChangeText={setAdoptionDate}
                  />
                </View>
              </View>
            </View>

            {showBreedDropdown && (
              <CustomSelect
                label={
                  <Text className="text-sm font-medium text-foreground">
                    {isDog ? "Dog Breed" : "Cat Breed"} <Text className="text-destructive">*</Text>
                  </Text>
                }
                value={breed}
                options={getBreedOptions()}
                onSelect={(val) => {
                  setBreed(val);
                  setBreedOtherText("");
                }}
                placeholder={isDog ? "Select dog breed" : "Select cat breed"}
              />
            )}

            {showBreedOtherText && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Specify Breed <Text className="text-destructive">*</Text>
                </Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter breed"
                  value={breedOtherText}
                  onChangeText={setBreedOtherText}
                />
              </View>
            )}

            {showSpecificsField && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Specifics (Optional)</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="e.g. Parakeet, Goldfish, Ball Python"
                  value={breedOptionalText}
                  onChangeText={setBreedOptionalText}
                />
              </View>
            )}
          </View>
        </AccordionSection>

        {/* Section B: Vet & Microchip */}
        <AccordionSection
          title="Vet & Microchip"
          icon={<PawPrint size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("vet")}
          onToggle={() => toggleSection("vet")}
        >
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Veterinarian</Text>
              {!vetContact ? (
                <TouchableOpacity
                  onPress={() =>
                    setVetContact({
                      name: "Dr. Smith",
                      phone: "(555) 123-4567",
                    })
                  }
                  className="border-2 border-dashed border-border rounded-xl p-4 items-center justify-center bg-input/30"
                >
                  <Plus size={20} className="text-muted-foreground mb-2" />
                  <Text className="text-muted-foreground font-medium">Add Vet Contact</Text>
                </TouchableOpacity>
              ) : (
                <View className="bg-card border border-border rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-semibold text-foreground">{vetContact.name}</Text>
                    <TouchableOpacity onPress={() => setVetContact(null)}>
                      <Text className="text-destructive text-sm font-medium">Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <Text className="text-muted-foreground">{vetContact.phone}</Text>
                  </View>
                </View>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Microchip Number / ID</Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Enter microchip ID"
                value={microchipId}
                onChangeText={setMicrochipId}
              />
            </View>
          </View>
        </AccordionSection>

        {/* Section C: Records & Uploads */}
        <AccordionSection
          title="Records & Uploads"
          icon={<FileText size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("records")}
          onToggle={() => toggleSection("records")}
        >
          <View className="gap-4">
            {/* Vaccinations */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-foreground">Vaccinations</Text>
                <TouchableOpacity onPress={() => setShowVaccinationModal(true)} className="flex-row items-center gap-1">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium text-sm">Add</Text>
                </TouchableOpacity>
              </View>

              {vaccinations.length === 0 ? (
                <View className="bg-input/30 rounded-xl p-4 items-center">
                  <FileText size={32} className="text-muted-foreground mb-2" />
                  <Text className="text-muted-foreground text-sm">No vaccinations recorded</Text>
                </View>
              ) : (
                <View className="gap-2">
                  {vaccinations.map((v) => (
                    <View key={v.id} className="bg-card border border-border rounded-xl p-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{v.name}</Text>
                          {v.date && <Text className="text-sm text-muted-foreground mt-1">{v.date}</Text>}
                          {v.notes && <Text className="text-sm text-muted-foreground mt-1">{v.notes}</Text>}
                        </View>
                        <TouchableOpacity onPress={() => deleteVaccination(v.id)} className="p-1">
                          <Trash size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                      {v.documentId && (
                        <View className="mt-2 pt-2 border-t border-border">
                          <TouchableOpacity className="flex-row items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            <Text className="text-primary text-sm">View Document</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ESA/Service Documents */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-foreground">ESA / Service Documents</Text>
                <TouchableOpacity onPress={() => setShowServiceDocModal(true)} className="flex-row items-center gap-1">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium text-sm">Add</Text>
                </TouchableOpacity>
              </View>

              {serviceDocuments.length === 0 ? (
                <View className="bg-input/30 rounded-xl p-4 items-center">
                  <Upload size={32} className="text-muted-foreground mb-2" />
                  <Text className="text-muted-foreground text-sm">No service documents</Text>
                </View>
              ) : (
                <View className="gap-2">
                  {serviceDocuments.map((doc) => (
                    <View key={doc.id} className="bg-card border border-border rounded-xl p-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <AlertCircle size={16} className="text-primary" />
                            <Text className="font-semibold text-foreground">{doc.type}</Text>
                          </View>
                          {doc.expiryDate && <Text className="text-sm text-muted-foreground mt-1">Expires: {doc.expiryDate}</Text>}
                        </View>
                        <TouchableOpacity onPress={() => deleteServiceDocument(doc.id)} className="p-1">
                          <Trash size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity className="mt-2 pt-2 border-t border-border flex-row items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        <Text className="text-primary text-sm">View Document</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </AccordionSection>

        {/* Section D: Medications */}
        <AccordionSection
          title="Medications"
          icon={<Pill size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("medications")}
          onToggle={() => toggleSection("medications")}
        >
          <View className="gap-4">
            {/* Tab Toggle */}
            <View className="flex-row bg-input rounded-xl p-1">
              <TouchableOpacity
                onPress={() => setMedicationTab("active")}
                className={`flex-1 py-2 rounded-lg items-center ${medicationTab === "active" ? "bg-primary" : ""}`}
              >
                <Text className={`font-medium ${medicationTab === "active" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMedicationTab("history")}
                className={`flex-1 py-2 rounded-lg items-center ${medicationTab === "history" ? "bg-primary" : ""}`}
              >
                <Text className={`font-medium ${medicationTab === "history" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  History
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-foreground">
                {medicationTab === "active" ? "Active Medications" : "Medication History"}
              </Text>
              {medicationTab === "active" && (
                <TouchableOpacity onPress={openAddMedicationModal} className="flex-row items-center gap-1">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium text-sm">Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {medications.filter((m) => m.status === medicationTab).length === 0 ? (
              <View className="bg-input/30 rounded-xl p-4 items-center">
                <Pill size={32} className="text-muted-foreground mb-2" />
                <Text className="text-muted-foreground text-sm">
                  {medicationTab === "active" ? "No active medications" : "No medication history"}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {medications
                  .filter((m) => m.status === medicationTab)
                  .map((med) => (
                    <View key={med.id} className="bg-card border border-border rounded-xl p-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Pill size={16} className="text-primary" />
                            <Text className="font-semibold text-foreground">{med.name}</Text>
                          </View>
                          {med.dosage && <Text className="text-sm text-muted-foreground">{med.dosage}</Text>}
                          {med.frequency && <Text className="text-sm text-muted-foreground">{med.frequency}</Text>}
                          {med.startDate && (
                            <Text className="text-sm text-muted-foreground">
                              Started: {med.startDate}
                              {med.endDate && ` - ${med.endDate}`}
                            </Text>
                          )}
                          {med.notes && <Text className="text-sm text-muted-foreground mt-1">{med.notes}</Text>}
                        </View>

                        <View className="flex-row gap-1">
                          {medicationTab === "active" && (
                            <>
                              <TouchableOpacity onPress={() => openEditMedicationModal(med)} className="p-1">
                                <Edit size={16} className="text-muted-foreground" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => moveToHistory(med)} className="p-1">
                                <Archive size={16} className="text-muted-foreground" />
                              </TouchableOpacity>
                            </>
                          )}
                          {medicationTab === "history" && (
                            <TouchableOpacity onPress={() => moveToActive(med)} className="p-1">
                              <Archive size={16} className="text-primary" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => deleteMedication(med.id)} className="p-1">
                            <Trash size={16} className="text-destructive" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </AccordionSection>

        {/* Section E: Service Providers */}
        <AccordionSection
          title="Service Providers"
          icon={<PawPrint size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("providers")}
          onToggle={() => toggleSection("providers")}
        >
          <View className="gap-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-foreground">Service Providers</Text>
              <TouchableOpacity onPress={openAddProviderModal} className="flex-row items-center gap-1">
                <Plus size={16} className="text-primary" />
                <Text className="text-primary font-medium text-sm">Add</Text>
              </TouchableOpacity>
            </View>

            {serviceProviders.length === 0 ? (
              <View className="bg-input/30 rounded-xl p-4 items-center">
                <PawPrint size={32} className="text-muted-foreground mb-2" />
                <Text className="text-muted-foreground text-sm">No service providers added</Text>
              </View>
            ) : (
              <View className="gap-2">
                {serviceProviders.map((provider) => (
                  <View key={provider.id} className="bg-card border border-border rounded-xl p-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="font-semibold text-foreground">{provider.name}</Text>
                          <View className="px-2 py-0.5 bg-primary/10 rounded-full">
                            <Text className="text-xs text-primary font-medium">{provider.type}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Phone size={14} className="text-muted-foreground" />
                          <Text className="text-sm text-muted-foreground">{provider.phone}</Text>
                        </View>
                        {provider.notes && <Text className="text-sm text-muted-foreground mt-2">{provider.notes}</Text>}
                      </View>
                      <View className="flex-row gap-1">
                        <TouchableOpacity onPress={() => openEditProviderModal(provider)} className="p-1">
                          <Edit size={16} className="text-muted-foreground" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteProvider(provider.id)} className="p-1">
                          <Trash size={16} className="text-destructive" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </AccordionSection>

        {/* Section F: Insurance */}
        <AccordionSection
          title="Insurance"
          icon={<Shield size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("insurance")}
          onToggle={() => toggleSection("insurance")}
        >
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Insurance Provider</Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g., Petplan, Trupanion"
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Policy Number</Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Enter policy number"
                value={policyNumber}
                onChangeText={setPolicyNumber}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground min-h-[100px] text-base"
                placeholder="Add notes about coverage, deductibles, claim process..."
                value={insuranceNotes}
                onChangeText={setInsuranceNotes}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
          </View>
        </AccordionSection>

        {/* Section G: Emergency Instructions (Placeholder) */}
        <AccordionSection
          title="Emergency Instructions"
          icon={<AlertCircle size={20} className="text-muted-foreground" />}
          isExpanded={expandedSections.has("emergency")}
          onToggle={() => toggleSection("emergency")}
        >
          <View className="gap-4">
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground min-h-[120px] text-base"
              placeholder="Emergency instructions, allergies, behaviors, where supplies are kept..."
              value={emergencyInstructions}
              onChangeText={setEmergencyInstructions}
              multiline
              textAlignVertical="top"
              numberOfLines={5}
            />
          </View>
        </AccordionSection>
      </ScrollView>

      {/* Medication Modal */}
      <Modal
        visible={showMedicationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">
                {editingMedication ? "Edit Medication" : "Add Medication"}
              </Text>
              <TouchableOpacity onPress={() => setShowMedicationModal(false)}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60%]">
              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Medication Name <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. Apoquel"
                    value={newMedication.name}
                    onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Dosage</Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. 16mg"
                    value={newMedication.dosage}
                    onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Frequency</Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. Twice daily"
                    value={newMedication.frequency}
                    onChangeText={(text) => setNewMedication({ ...newMedication, frequency: text })}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground mb-2">Start Date</Text>
                    <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center">
                      <Calendar size={16} className="text-muted-foreground mr-2" />
                      <TextInput
                        className="flex-1 text-foreground"
                        placeholder="MM/DD/YYYY"
                        value={newMedication.startDate}
                        onChangeText={(text) => setNewMedication({ ...newMedication, startDate: text })}
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground mb-2">End Date</Text>
                    <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center">
                      <Calendar size={16} className="text-muted-foreground mr-2" />
                      <TextInput
                        className="flex-1 text-foreground"
                        placeholder="Optional"
                        value={newMedication.endDate}
                        onChangeText={(text) => setNewMedication({ ...newMedication, endDate: text })}
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground min-h-[80px]"
                    placeholder="Any special instructions..."
                    value={newMedication.notes}
                    onChangeText={(text) => setNewMedication({ ...newMedication, notes: text })}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity onPress={saveMedication} className="bg-primary rounded-xl py-4 items-center mt-4">
              <Text className="text-primary-foreground font-semibold text-base">
                {editingMedication ? "Update Medication" : "Add Medication"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Provider Modal placeholder (kept as-is if you add later) */}
      <Modal
        visible={showProviderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProviderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">
                {editingProvider ? "Edit Provider" : "Add Provider"}
              </Text>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60%]">
              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Provider Name <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. Happy Tails Daycare"
                    value={newProvider.name}
                    onChangeText={(text) => setNewProvider({ ...newProvider, name: text })}
                  />
                </View>

                <CustomSelect
                  label={<Text className="text-sm font-medium text-foreground">Type</Text>}
                  value={newProvider.type}
                  options={["Walker", "Sitter", "Daycare", "Groomer", "Trainer", "Boarding", "Other"]}
                  onSelect={(val) => setNewProvider({ ...newProvider, type: val as ServiceProvider["type"] })}
                  placeholder="Select type"
                />

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Phone <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="(555) 123-4567"
                    value={newProvider.phone}
                    onChangeText={(text) => setNewProvider({ ...newProvider, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
                  <TextInput
                    className="bg-input border border-border rounded-xl px-4 py-3 text-foreground min-h-[80px]"
                    placeholder="Any notes..."
                    value={newProvider.notes}
                    onChangeText={(text) => setNewProvider({ ...newProvider, notes: text })}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity onPress={saveProvider} className="bg-primary rounded-xl py-4 items-center mt-4">
              <Text className="text-primary-foreground font-semibold text-base">
                {editingProvider ? "Update Provider" : "Add Provider"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Vaccination Modal placeholder (simple) */}
      <Modal
        visible={showVaccinationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVaccinationModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">Add Vaccination</Text>
              <TouchableOpacity onPress={() => setShowVaccinationModal(false)}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Name <Text className="text-destructive">*</Text>
                </Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="e.g. Rabies"
                  value={newVaccination.name}
                  onChangeText={(text) => setNewVaccination({ ...newVaccination, name: text })}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Date</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="MM/DD/YYYY"
                  value={newVaccination.date}
                  onChangeText={(text) => setNewVaccination({ ...newVaccination, date: text })}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground min-h-[80px]"
                  placeholder="Optional notes..."
                  value={newVaccination.notes}
                  onChangeText={(text) => setNewVaccination({ ...newVaccination, notes: text })}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity onPress={addVaccination} className="bg-primary rounded-xl py-4 items-center">
                <Text className="text-primary-foreground font-semibold text-base">Add Vaccination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Service Doc Modal placeholder (simple) */}
      <Modal
        visible={showServiceDocModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceDocModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">Add Service Document</Text>
              <TouchableOpacity onPress={() => setShowServiceDocModal(false)}>
                <X size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <CustomSelect
                label={<Text className="text-sm font-medium text-foreground">Type</Text>}
                value={newServiceDoc.type}
                options={["ESA Letter", "Service Animal Certification", "Other"]}
                onSelect={(val) => setNewServiceDoc({ ...newServiceDoc, type: val as ServiceDocument["type"] })}
                placeholder="Select document type"
              />

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Expiry Date</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="MM/DD/YYYY"
                  value={newServiceDoc.expiryDate}
                  onChangeText={(text) => setNewServiceDoc({ ...newServiceDoc, expiryDate: text })}
                />
              </View>

              <TouchableOpacity onPress={addServiceDocument} className="bg-primary rounded-xl py-4 items-center">
                <Text className="text-primary-foreground font-semibold text-base">Add Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}