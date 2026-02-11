import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Calendar, Share2, User as UserIcon } from 'lucide-react-native'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import KeyboardDismiss from '@/shared/ui/KeyboardDismiss';
import TravelModule from '@/features/profiles/ui/modules/TravelModule';
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";
import { Module, ModuleType, DependentProfile, TravelData, PassportItem, LoyaltyProgram } from "@/features/profiles/domain/types";
import { parseDate, toIsoDateOnly, formatDateLabel } from "@/shared/utils/date";
import { COUNTRY_OPTIONS } from "@/shared/constants/options";
import { CORE_MODULES, ALL_MODULES } from "@/shared/constants/modules";
import { findDependent, updateDependent } from "@/features/profiles/data/storage";
import ModuleAccordion from "@/shared/ui/ModuleAccordion";
import MedicalModule from "@/features/profiles/ui/modules/MedicalModule";
import VaccinationsModule from "@/features/profiles/ui/modules/VaccinationsModule";
import InsuranceModule from "@/features/profiles/ui/modules/InsuranceModule";
import EmergencyContactsModule from "@/features/profiles/ui/modules/EmergencyContactsModule";
import DocumentsModule from "@/features/profiles/ui/modules/DocumentsModule";
import EducationModule from "@/features/profiles/ui/modules/EducationModule";
import ActivitiesModule from "@/features/profiles/ui/modules/ActivitiesModule";
import AcademicModule from "@/features/profiles/ui/modules/AcademicModule";

const MODULE_DEFAULTS = {
  medical: "",
  vaccinations: "",
  insurance: "",
  documents: "",
  emergency: "",
  travel: "",
  education: "",
  academic: "",
  activities: "",
};

export default function DependentDetailScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const depId = Array.isArray(id) ? id[0] : id;
  const isCompleteMode = mode === "complete";
  const [person, setPerson] = useState<DependentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());
  const [moduleNotes, setModuleNotes] = useState<Record<string, string>>(MODULE_DEFAULTS);
  const [modules, setModules] = useState<Module[]>(isCompleteMode ? ALL_MODULES : CORE_MODULES);
  const [expandedSections, setExpandedSections] = useState<Set<ModuleType>>(new Set(isCompleteMode ? [] : ['medical']));
  const [travelPassports, setTravelPassports] = useState<PassportItem[]>([]);
  const [travelLoyalty, setTravelLoyalty] = useState<LoyaltyProgram[]>([]);
  const [travelNotes, setTravelNotes] = useState("");
  const [hideEmptyTravelRows, setHideEmptyTravelRows] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const travelSnapshotRef = useRef<TravelData>({
    passports: [],
    loyaltyPrograms: [],
    notes: "",
    hideEmptyRows: false,
  });

  const displayName = useMemo(() => {
    if (!person) return '';
    return person.preferredName || `${person.firstName} ${person.lastName}`.trim();
  }, [person]);

  const ageLabel = useMemo(() => {
    if (!person?.dob) return '';
    const d = new Date(person.dob);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? `Age ${age}` : '';
  }, [person?.dob]);

  const isUnder18 = useMemo(() => {
    if (!person?.dob) return false;
    const d = new Date(person.dob);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? age < 18 : false;
  }, [person?.dob]);

  useEffect(() => {
    const base = isCompleteMode ? ALL_MODULES : CORE_MODULES;
    const normalized = base.filter((m) => !(isUnder18 && m.id === "education"));
    if (isUnder18 && !normalized.find((m) => m.id === "academic")) {
      const academic = ALL_MODULES.find((m) => m.id === "academic");
      if (academic) normalized.push(academic);
    }
    setModules(normalized);
    setExpandedSections(new Set(isCompleteMode ? [] : ["medical"]));
  }, [isCompleteMode, isUnder18]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const found = await findDependent(depId);
      if (!found || cancelled) return;
      setPerson(found);
      if (found.moduleNotes && typeof found.moduleNotes === "object") {
        setModuleNotes({ ...MODULE_DEFAULTS, ...found.moduleNotes });
      }
      const travel: TravelData = found.travel || {
        passports: [],
        loyaltyPrograms: [],
        notes: "",
        hideEmptyRows: false,
      };
      setTravelPassports(
        (travel.passports || []).map((p: any) => ({
          ...p,
          issueDate: p.issueDate ? parseDate(p.issueDate) : null,
          expiryDate: p.expiryDate ? parseDate(p.expiryDate) : null,
        }))
      );
      setTravelLoyalty(travel.loyaltyPrograms || []);
      setTravelNotes(travel.notes || "");
      setHideEmptyTravelRows(!!travel.hideEmptyRows);
      travelSnapshotRef.current = {
        passports: (travel.passports || []).map((p: any) => ({
          ...p,
          issueDate: p.issueDate ? parseDate(p.issueDate) : null,
          expiryDate: p.expiryDate ? parseDate(p.expiryDate) : null,
        })),
        loyaltyPrograms: travel.loyaltyPrograms || [],
        notes: travel.notes || "",
        hideEmptyRows: !!travel.hideEmptyRows,
      };
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [depId]);

  const markDirty = (key: string) => {
    setDirtySections((prev) => new Set(prev).add(key));
  };

  const saveSection = async (key: string) => {
    await updateDependent(depId, (d) => ({
      ...d,
      moduleNotes: { ...(d.moduleNotes || {}), [key]: moduleNotes[key] },
      hasCompletedProfile: true,
    }));
    setDirtySections((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(key);
      return nextSet;
    });
  };

  const markTravelDirty = () => {
    markDirty("travel");
  };

  const saveTravelSection = async () => {
    await updateDependent(depId, (d) => ({
      ...d,
      travel: {
        passports: travelPassports.map((p) => ({
          ...p,
          issueDate: p.issueDate ? toIsoDateOnly(p.issueDate) : "",
          expiryDate: p.expiryDate ? toIsoDateOnly(p.expiryDate) : "",
        })),
        loyaltyPrograms: travelLoyalty,
        notes: travelNotes,
        hideEmptyRows: hideEmptyTravelRows,
      },
      hasCompletedProfile: true,
    }));
    travelSnapshotRef.current = {
      passports: travelPassports,
      loyaltyPrograms: travelLoyalty,
      notes: travelNotes,
      hideEmptyRows: hideEmptyTravelRows,
    };
    setDirtySections((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete("travel");
      return nextSet;
    });
    Alert.alert("Saved", "Travel details updated.");
    setIsEditing(false);
  };

  const cancelTravelEdits = () => {
    const snapshot = travelSnapshotRef.current;
    setTravelPassports(snapshot.passports);
    setTravelLoyalty(snapshot.loyaltyPrograms);
    setTravelNotes(snapshot.notes);
    setHideEmptyTravelRows(snapshot.hideEmptyRows);
    setDirtySections((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete("travel");
      return nextSet;
    });
    setIsEditing(false);
  };

  const travelSummary = useMemo(() => {
    const passportLines = travelPassports.length
      ? travelPassports.map(
          (p) =>
            `${p.isCard ? "Passport Card" : "Passport"} (${p.country || "—"}) · ${p.fullName || "—"} · ${
              p.passportNumber || "No #"
            } · Expires ${formatDateLabel(p.expiryDate)}`
        )
      : ["No passports added"];
    const loyaltyLines = travelLoyalty.length
      ? travelLoyalty.map(
          (l) =>
            `${l.programType.toUpperCase()} · ${l.providerName || "Provider"} · ${l.memberNumber || "Member #"}`
        )
      : ["No loyalty programs added"];
    const notesLine = travelNotes?.trim() ? travelNotes.trim() : "No travel notes.";
    return ["Passports:", ...passportLines, "", "Loyalty Programs:", ...loyaltyLines, "", "Notes:", notesLine].join(
      "\n"
    );
  }, [travelPassports, travelLoyalty, travelNotes]);

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "—"}`,
          `Relationship: ${person?.relationship || "—"}`,
          `Date of Birth: ${person?.dob || "—"}`,
          ageLabel ? `Age: ${ageLabel.replace("Age ", "")}` : "Age: —",
        ].join("\n"),
      },
      { id: "medical", title: "Medical", content: moduleNotes.medical || "" },
      { id: "vaccinations", title: "Vaccinations", content: moduleNotes.vaccinations || "" },
      { id: "insurance", title: "Insurance", content: moduleNotes.insurance || "" },
      { id: "documents", title: "Documents", content: moduleNotes.documents || "" },
      { id: "emergency", title: "Emergency Contacts", content: moduleNotes.emergency || "" },
      { id: "travel", title: "Travel", content: travelSummary },
      { id: isUnder18 ? "academic" : "education", title: isUnder18 ? "Academic" : "Education", content: isUnder18 ? (moduleNotes.academic || "") : (moduleNotes.education || "") },
      { id: "activities", title: "Activities & Interests", content: moduleNotes.activities || "" },
    ];
  }, [displayName, person?.relationship, person?.dob, ageLabel, moduleNotes, travelSummary, isUnder18]);

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
  const renderContent = (id: ModuleType) => {
    switch (id) {
      case "medical":
        return (
          <MedicalModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.medical}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, medical: next }))}
            dirty={dirtySections.has("medical")}
            markDirty={() => markDirty("medical")}
            onSave={() => saveSection("medical")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "medical")));
              setIsEditing(false);
            }}
          />
        );
      case "vaccinations":
        return (
          <VaccinationsModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.vaccinations}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, vaccinations: next }))}
            dirty={dirtySections.has("vaccinations")}
            markDirty={() => markDirty("vaccinations")}
            onSave={() => saveSection("vaccinations")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "vaccinations")));
              setIsEditing(false);
            }}
          />
        );
      case "insurance":
        return (
          <InsuranceModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.insurance}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, insurance: next }))}
            dirty={dirtySections.has("insurance")}
            markDirty={() => markDirty("insurance")}
            onSave={() => saveSection("insurance")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "insurance")));
              setIsEditing(false);
            }}
          />
        );
      case "documents":
        return (
          <DocumentsModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.documents}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, documents: next }))}
            dirty={dirtySections.has("documents")}
            markDirty={() => markDirty("documents")}
            onSave={() => saveSection("documents")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "documents")));
              setIsEditing(false);
            }}
          />
        );
      case "emergency":
        return (
          <EmergencyContactsModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.emergency}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, emergency: next }))}
            dirty={dirtySections.has("emergency")}
            markDirty={() => markDirty("emergency")}
            onSave={() => saveSection("emergency")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "emergency")));
              setIsEditing(false);
            }}
          />
        );
      case "travel":
        return (
          <TravelModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            passports={travelPassports}
            setPassports={setTravelPassports}
            loyaltyPrograms={travelLoyalty}
            setLoyaltyPrograms={setTravelLoyalty}
            notes={travelNotes}
            setNotes={setTravelNotes}
            hideEmptyRows={hideEmptyTravelRows}
            setHideEmptyRows={setHideEmptyTravelRows}
            markDirty={markTravelDirty}
            dirty={dirtySections.has("travel")}
            onSave={saveTravelSection}
            onCancel={cancelTravelEdits}
            countryOptions={COUNTRY_OPTIONS}
          />
        );
      case "education":
        return (
          <EducationModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.education}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, education: next }))}
            dirty={dirtySections.has("education")}
            markDirty={() => markDirty("education")}
            onSave={() => saveSection("education")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "education")));
              setIsEditing(false);
            }}
          />
        );
      case "academic":
        return (
          <AcademicModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.academic}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, academic: next }))}
            dirty={dirtySections.has("academic")}
            markDirty={() => markDirty("academic")}
            onSave={() => saveSection("academic")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "academic")));
              setIsEditing(false);
            }}
          />
        );
      case "activities":
        return (
          <ActivitiesModule
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            value={moduleNotes.activities}
            setValue={(next) => setModuleNotes((prev) => ({ ...prev, activities: next }))}
            dirty={dirtySections.has("activities")}
            markDirty={() => markDirty("activities")}
            onSave={() => saveSection("activities")}
            onCancel={() => {
              setDirtySections((prev) => new Set([...prev].filter((k) => k !== "activities")));
              setIsEditing(false);
            }}
          />
        );
      default:
        return null;
    }
  };

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
        {isCompleteMode && (
          <View className="mx-6 mt-4 mb-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Text className="text-primary font-semibold text-sm">Finish setting up this profile</Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Complete additional details to keep everything organized.
            </Text>
          </View>
        )}
        {/* Dependent Card */}
        <View className="p-6">
          <View className="bg-card rounded-2xl p-6 items-center shadow-sm">
            {person?.avatar ? (
              <Image
                source={{ uri: person.avatar }}
                className="w-24 h-24 rounded-full mb-4"
                style={{ borderWidth: 3, borderColor: 'rgb(244 244 245)' }}
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full mb-4 bg-muted items-center justify-center"
                style={{ borderWidth: 3, borderColor: 'rgb(244 244 245)' }}
              >
                <UserIcon size={36} className="text-muted-foreground" />
              </View>
            )}
            <Text className="text-2xl font-bold text-foreground mb-1">{displayName}</Text>
            <Text className="text-muted-foreground mb-1">{person?.relationship}</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              {person?.dob ? `Born: ${person.dob}` : 'DOB not set'}
            </Text>
            
            <View className="flex-row gap-2">
              <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                <Heart size={14} className="text-primary" fill="rgb(20 184 166)" />
                <Text className="text-sm text-primary font-medium">Profile</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                <Calendar size={14} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">{ageLabel || 'Age N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Relationship */}
        <View className="px-6 mb-2">
          <Text className="text-lg font-semibold text-foreground mb-2">Relationship</Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Choose how this person is related to you.
          </Text>
          {isEditing ? (
            <View className="bg-card border border-border rounded-xl px-4 py-3">
              <TextInput
                className="text-foreground"
                value={person?.relationship || ""}
                onChangeText={(text) => {
                  setPerson((prev) => (prev ? { ...prev, relationship: text } : prev));
                  markDirty("relationship");
                }}
              />
            </View>
          ) : (
            <Text className="text-foreground">{person?.relationship || "Not set"}</Text>
          )}
            {isEditing && dirtySections.has("relationship") && (
            <TouchableOpacity
              onPress={async () => {
                await updateDependent(depId, (d) => ({
                  ...d,
                  relationship: person?.relationship || "",
                  hasCompletedProfile: true,
                }));
                setDirtySections((prev) => {
                  const nextSet = new Set(prev);
                  nextSet.delete("relationship");
                  return nextSet;
                });
              }}
              className="mt-3 bg-primary rounded-xl py-2 items-center"
            >
              <Text className="text-primary-foreground font-semibold">Save Relationship</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modules Section */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Information Modules</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Toggle modules to show/hide sections. Track all important information for your dependent.
          </Text>
          
          <ModuleAccordion
            modules={modules}
            expanded={expandedSections}
            onToggleExpanded={toggleSection}
            renderContent={renderContent}
          />
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
