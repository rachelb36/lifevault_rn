import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Heart, FileText, Phone, Shield, Calendar, Activity, AlertCircle, Plus, PawPrint, Share2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import KeyboardDismiss from '@/shared/ui/KeyboardDismiss';
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";

// Types
type ModuleType = 'medical' | 'vaccinations' | 'insurance' | 'documents' | 'emergency';

interface Module {
  id: ModuleType;
  name: string;
  icon: any;
  enabled: boolean;
}

interface PetProfile {
  id: string;
  petName: string;
  kind: string;
  kindOtherText?: string;
  dob?: string;
  breed?: string;
  avatar?: string;
}

const PETS_STORAGE_KEY = 'pets_v1';
const MODULE_DEFAULTS = {
  medical:
    "Last Vet Visit: Dr. Sarah Johnson - Paws & Claws Vet | January 15, 2024 | Annual checkup - all healthy!\nCurrent Medications: None",
  vaccinations:
    "Rabies | Last: Jan 10, 2024 | Next: Jan 10, 2027\nRHDV2 | Last: Dec 5, 2023 | Next: Dec 5, 2024",
  insurance: "No insurance policy added",
  documents: "Adoption Certificate: Uploaded March 15, 2023\nMicrochip Registration: ID 982000123456789",
  emergency: "Paws & Claws Emergency: (555) 911-PETS\nPet Sitter - Jenny: (555) 123-7890",
};

const initialModules: Module[] = [
  { id: 'medical', name: 'Medical Records', icon: Activity, enabled: true },
  { id: 'vaccinations', name: 'Vaccinations', icon: AlertCircle, enabled: true },
  { id: 'insurance', name: 'Pet Insurance', icon: Shield, enabled: false },
  { id: 'documents', name: 'Documents', icon: FileText, enabled: true },
  { id: 'emergency', name: 'Emergency Contacts', icon: Phone, enabled: true },
];

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const petId = Array.isArray(id) ? id[0] : id;
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isEditing] = useState(false);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());
  const [moduleNotes, setModuleNotes] = useState<Record<string, string>>(MODULE_DEFAULTS);
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedSections, setExpandedSections] = useState<Set<ModuleType>>(new Set(['medical', 'vaccinations']));
  const [showShareModal, setShowShareModal] = useState(false);

  const ageLabel = useMemo(() => {
    if (!pet?.dob) return '';
    const d = new Date(pet.dob);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? `Age ${age}` : '';
  }, [pet?.dob]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(list) ? list.find((p: any) => p.id === petId) : null;
      if (!found || cancelled) return;
      setPet(found);
      if (found.moduleNotes && typeof found.moduleNotes === "object") {
        setModuleNotes({ ...MODULE_DEFAULTS, ...found.moduleNotes });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [petId]);

  const markDirty = (key: string) => {
    setDirtySections((prev) => new Set(prev).add(key));
  };

  const saveSection = async (key: string) => {
    const raw = await AsyncStorage.getItem(PETS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list)
      ? list.map((p: any) =>
          p.id === petId ? { ...p, moduleNotes: { ...(p.moduleNotes || {}), [key]: moduleNotes[key] } } : p
        )
      : [];
    await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(next));
    setDirtySections((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(key);
      return nextSet;
    });
  };

  const toggleModule = (moduleId: ModuleType) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    ));
    // Close section if disabling
    if (expandedSections.has(moduleId)) {
      setExpandedSections(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  const toggleSection = (moduleId: ModuleType) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${pet?.petName || "—"}`,
          `Kind: ${pet?.kind || "—"}`,
          `Breed: ${pet?.breed || "—"}`,
          `Date of Birth: ${pet?.dob || "—"}`,
          ageLabel ? `Age: ${ageLabel.replace("Age ", "")}` : "Age: —",
        ].join("\n"),
      },
      { id: "medical", title: "Medical Records", content: moduleNotes.medical || "" },
      { id: "vaccinations", title: "Vaccinations", content: moduleNotes.vaccinations || "" },
      { id: "insurance", title: "Pet Insurance", content: moduleNotes.insurance || "" },
      { id: "documents", title: "Documents", content: moduleNotes.documents || "" },
      { id: "emergency", title: "Emergency Contacts", content: moduleNotes.emergency || "" },
    ];
  }, [pet?.petName, pet?.kind, pet?.breed, pet?.dob, ageLabel, moduleNotes]);

  const AccordionSection = ({ module }: { module: Module }) => {
    const isExpanded = expandedSections.has(module.id);
    const Icon = module.icon;

    return (
      <View className="mb-3 overflow-hidden">
        {/* Header */}
        <Pressable
          onPress={() => toggleSection(module.id)}
          className={`flex-row items-center justify-between p-4 ${module.enabled ? 'bg-card' : 'bg-muted/50'}`}
          style={{ borderRadius: 12 }}
        >
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${module.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
              <Icon size={20} className={module.enabled ? 'text-primary' : 'text-muted-foreground'} />
            </View>
            <Text className={`font-semibold ${module.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
              {module.name}
            </Text>
          </View>
          
          <View className="flex-row items-center gap-3">
            {/* Toggle Switch */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleModule(module.id);
              }}
              className={`w-12 h-7 rounded-full p-1 ${module.enabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white shadow-sm ${module.enabled ? 'ml-auto' : ''}`}
              />
            </Pressable>
            
            {/* Chevron */}
            {module.enabled && (
              isExpanded ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={20} className="text-muted-foreground" />
              )
            )}
          </View>
        </Pressable>

        {/* Content */}
        {module.enabled && isExpanded && (
          <View className="bg-card mt-1 mx-2 px-4 pb-4" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            {module.id === 'medical' && (
              <View className="gap-3 pt-3">
                {isEditing && (
                  <>
                    <TextInput
                      className="bg-muted/50 rounded-lg p-3 text-foreground"
                      multiline
                      value={moduleNotes.medical}
                      onChangeText={(text) => {
                        setModuleNotes((prev) => ({ ...prev, medical: text }));
                        markDirty("medical");
                      }}
                    />
                    {dirtySections.has("medical") && (
                      <TouchableOpacity
                        onPress={() => saveSection("medical")}
                        className="bg-primary rounded-xl py-2 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">Save Medical</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-2">Last Vet Visit</Text>
                  <Text className="text-sm text-muted-foreground">Dr. Sarah Johnson - Paws & Claws Vet</Text>
                  <Text className="text-sm text-muted-foreground">January 15, 2024</Text>
                  <Text className="text-sm text-foreground mt-2">Annual checkup - all healthy!</Text>
                </View>
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-2">Current Medications</Text>
                  <Text className="text-sm text-muted-foreground">None</Text>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Medical Record</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'vaccinations' && (
              <View className="gap-3 pt-3">
                {isEditing && (
                  <>
                    <TextInput
                      className="bg-muted/50 rounded-lg p-3 text-foreground"
                      multiline
                      value={moduleNotes.vaccinations}
                      onChangeText={(text) => {
                        setModuleNotes((prev) => ({ ...prev, vaccinations: text }));
                        markDirty("vaccinations");
                      }}
                    />
                    {dirtySections.has("vaccinations") && (
                      <TouchableOpacity
                        onPress={() => saveSection("vaccinations")}
                        className="bg-primary rounded-xl py-2 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">Save Vaccinations</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <View className="p-3 bg-muted/50 rounded-lg">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-semibold text-foreground">Rabies</Text>
                    <View className="bg-green-500/10 px-2 py-1 rounded-full">
                      <Text className="text-xs text-green-600 font-medium">Current</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted-foreground">Last: Jan 10, 2024</Text>
                  <Text className="text-sm text-muted-foreground">Next: Jan 10, 2027</Text>
                </View>
                <View className="p-3 bg-muted/50 rounded-lg">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-semibold text-foreground">RHDV2</Text>
                    <View className="bg-green-500/10 px-2 py-1 rounded-full">
                      <Text className="text-xs text-green-600 font-medium">Current</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted-foreground">Last: Dec 5, 2023</Text>
                  <Text className="text-sm text-muted-foreground">Next: Dec 5, 2024</Text>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Vaccination</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'insurance' && (
              <View className="gap-3 pt-3">
                {isEditing && (
                  <>
                    <TextInput
                      className="bg-muted/50 rounded-lg p-3 text-foreground"
                      multiline
                      value={moduleNotes.insurance}
                      onChangeText={(text) => {
                        setModuleNotes((prev) => ({ ...prev, insurance: text }));
                        markDirty("insurance");
                      }}
                    />
                    {dirtySections.has("insurance") && (
                      <TouchableOpacity
                        onPress={() => saveSection("insurance")}
                        className="bg-primary rounded-xl py-2 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">Save Insurance</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <Text className="text-muted-foreground text-center py-4">No insurance policy added</Text>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Insurance Policy</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'documents' && (
              <View className="gap-3 pt-3">
                {isEditing && (
                  <>
                    <TextInput
                      className="bg-muted/50 rounded-lg p-3 text-foreground"
                      multiline
                      value={moduleNotes.documents}
                      onChangeText={(text) => {
                        setModuleNotes((prev) => ({ ...prev, documents: text }));
                        markDirty("documents");
                      }}
                    />
                    {dirtySections.has("documents") && (
                      <TouchableOpacity
                        onPress={() => saveSection("documents")}
                        className="bg-primary rounded-xl py-2 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">Save Documents</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-1">Adoption Certificate</Text>
                  <Text className="text-sm text-muted-foreground">Uploaded: March 15, 2023</Text>
                </View>
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-1">Microchip Registration</Text>
                  <Text className="text-sm text-muted-foreground">ID: 982000123456789</Text>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Document</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'emergency' && (
              <View className="gap-3 pt-3">
                {isEditing && (
                  <>
                    <TextInput
                      className="bg-muted/50 rounded-lg p-3 text-foreground"
                      multiline
                      value={moduleNotes.emergency}
                      onChangeText={(text) => {
                        setModuleNotes((prev) => ({ ...prev, emergency: text }));
                        markDirty("emergency");
                      }}
                    />
                    {dirtySections.has("emergency") && (
                      <TouchableOpacity
                        onPress={() => saveSection("emergency")}
                        className="bg-primary rounded-xl py-2 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">Save Emergency</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <View className="p-3 bg-muted/50 rounded-lg flex-row items-center">
                  <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                    <Phone size={18} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">Paws & Claws Emergency</Text>
                    <Text className="text-sm text-muted-foreground">(555) 911-PETS</Text>
                  </View>
                </View>
                <View className="p-3 bg-muted/50 rounded-lg flex-row items-center">
                  <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                    <Phone size={18} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">Pet Sitter - Jenny</Text>
                    <Text className="text-sm text-muted-foreground">(555) 123-7890</Text>
                  </View>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Emergency Contact</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
            <View className="w-24 h-24 rounded-full mb-4 bg-muted items-center justify-center overflow-hidden" style={{ borderWidth: 3, borderColor: 'rgb(244 244 245)' }}>
              {pet?.avatar ? (
                <Image source={{ uri: pet.avatar }} className="w-full h-full" />
              ) : (
                <PawPrint size={32} className="text-muted-foreground" />
              )}
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">{pet?.petName || 'Pet'}</Text>
            <Text className="text-muted-foreground mb-1">{pet?.breed || 'Breed not set'}</Text>
            <Text className="text-sm text-muted-foreground mb-4">Kind: {pet?.kind || pet?.kindOtherText || 'Pet'}</Text>
            
            <View className="flex-row gap-2">
              <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                <Heart size={14} className="text-primary" fill="rgb(251 113 133)" />
                <Text className="text-sm text-primary font-medium">Beloved Pet</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                <Calendar size={14} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">{ageLabel || 'Age N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modules Section */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Pet Information</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Toggle modules to show/hide sections. Keep track of your pet&apos;s health and care.
          </Text>
          
          {modules.map(module => (
            <AccordionSection key={module.id} module={module} />
          ))}
        </View>
      </ScrollView>
      <ProfileShareModal
        visible={showShareModal}
        profileName={pet?.petName || "Pet Profile"}
        sections={shareSections}
        onClose={() => setShowShareModal(false)}
        onShare={async (sections) => {
          await shareProfilePdf(pet?.petName || "Pet Profile", sections);
          setShowShareModal(false);
        }}
      />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
