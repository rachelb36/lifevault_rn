import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, Alert, Linking, Share, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, Camera, Upload, Shield, Lock, FileText, Calendar, User, X,
  ChevronRight, Share2, ArrowLeft, CreditCard, HeartPulse, Plane, Syringe,
  ShieldCheck, HeartHandshake, GraduationCap, BadgeCheck, FileHeart,
  ClipboardList, Cpu, Home, Zap, Users, KeyRound, Landmark, Scale,
  DollarSign, BookOpen, Briefcase,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import KeyboardDismiss from '@/shared/ui/KeyboardDismiss';
import {
  createDocument,
  listDocuments,
  listLinkedRecordsForDocument,
  openDocumentUri,
  shareDocument as shareStoredDocument,
  type VaultDocument,
} from '@/features/documents/data/documentsStorage';
import { getProfiles } from '@/features/profiles/data/storage';

// ---------------------------------------------------------------------------
// Category definitions by entity type
// ---------------------------------------------------------------------------

type DocCategoryDef = { label: string; value: string; icon: LucideIcon };

const PERSON_DOC_CATEGORIES: DocCategoryDef[] = [
  { label: 'Insurance', value: 'insurance', icon: Shield },
  { label: 'ID', value: 'id', icon: CreditCard },
  { label: 'Medical', value: 'medical', icon: HeartPulse },
  { label: 'Legal', value: 'legal', icon: Scale },
  { label: 'Financial', value: 'financial', icon: DollarSign },
  { label: 'Education', value: 'education', icon: BookOpen },
  { label: 'Employment', value: 'employment', icon: Briefcase },
  { label: 'Travel', value: 'travel', icon: Plane },
  { label: 'Other', value: 'other', icon: FileText },
];

const PET_DOC_CATEGORIES: DocCategoryDef[] = [
  { label: 'Vaccination Record', value: 'vaccination_record', icon: Syringe },
  { label: 'Rabies Certificate', value: 'rabies_certificate', icon: ShieldCheck },
  { label: 'ESA Letter', value: 'esa_letter', icon: HeartHandshake },
  { label: 'Training Certificate', value: 'training_certificate', icon: GraduationCap },
  { label: 'Service Animal ID', value: 'service_animal_id', icon: BadgeCheck },
  { label: 'Adoption Papers', value: 'adoption_papers', icon: FileHeart },
  { label: 'Registration / License', value: 'registration_license', icon: ClipboardList },
  { label: 'Microchip Registration', value: 'microchip_registration', icon: Cpu },
  { label: 'Other', value: 'other', icon: FileText },
];

const HOUSEHOLD_DOC_CATEGORIES: DocCategoryDef[] = [
  { label: 'Property', value: 'property', icon: Home },
  { label: 'Insurance', value: 'insurance', icon: Shield },
  { label: 'Utilities', value: 'utilities', icon: Zap },
  { label: 'Warranties', value: 'warranties', icon: ShieldCheck },
  { label: 'Community', value: 'community', icon: Users },
  { label: 'Access / Emergency', value: 'access_emergency', icon: KeyRound },
  { label: 'Community / HOA', value: 'community_hoa', icon: Landmark },
  { label: 'Other', value: 'other', icon: FileText },
];

const DOC_CATEGORIES_BY_TYPE: Record<string, DocCategoryDef[]> = {
  PERSON: PERSON_DOC_CATEGORIES,
  PET: PET_DOC_CATEGORIES,
  HOUSEHOLD: HOUSEHOLD_DOC_CATEGORIES,
};

// Flat de-duped list (first occurrence wins) for filter bar + lookups
const ALL_DOC_CATEGORIES: DocCategoryDef[] = (() => {
  const seen = new Set<string>();
  const result: DocCategoryDef[] = [];
  for (const list of [PERSON_DOC_CATEGORIES, PET_DOC_CATEGORIES, HOUSEHOLD_DOC_CATEGORIES]) {
    for (const cat of list) {
      if (!seen.has(cat.value)) {
        seen.add(cat.value);
        result.push(cat);
      }
    }
  }
  return result;
})();

const categoryIconMap: Record<string, LucideIcon> = Object.fromEntries(
  ALL_DOC_CATEGORIES.map((c) => [c.value, c.icon]),
);

const categoryLabelMap: Record<string, string> = Object.fromEntries(
  ALL_DOC_CATEGORIES.map((c) => [c.value, c.label]),
);

const categoryColorMap: Record<string, string> = {
  insurance: 'text-blue-500 bg-blue-500/10',
  id: 'text-purple-500 bg-purple-500/10',
  medical: 'text-red-500 bg-red-500/10',
  travel: 'text-cyan-500 bg-cyan-500/10',
  vaccination_record: 'text-green-500 bg-green-500/10',
  rabies_certificate: 'text-green-600 bg-green-600/10',
  esa_letter: 'text-pink-500 bg-pink-500/10',
  training_certificate: 'text-indigo-500 bg-indigo-500/10',
  service_animal_id: 'text-violet-500 bg-violet-500/10',
  adoption_papers: 'text-rose-500 bg-rose-500/10',
  registration_license: 'text-teal-500 bg-teal-500/10',
  microchip_registration: 'text-slate-500 bg-slate-500/10',
  property: 'text-amber-600 bg-amber-600/10',
  utilities: 'text-yellow-500 bg-yellow-500/10',
  warranties: 'text-emerald-500 bg-emerald-500/10',
  community: 'text-sky-500 bg-sky-500/10',
  access_emergency: 'text-orange-500 bg-orange-500/10',
  community_hoa: 'text-lime-600 bg-lime-600/10',
  legal: 'text-stone-600 bg-stone-600/10',
  financial: 'text-emerald-600 bg-emerald-600/10',
  education: 'text-indigo-600 bg-indigo-600/10',
  employment: 'text-blue-600 bg-blue-600/10',
  other: 'text-gray-500 bg-gray-500/10',
};

const DEFAULT_COLOR = 'text-gray-500 bg-gray-500/10';

// ---------------------------------------------------------------------------
// Filter bar options (All + de-duped categories)
// ---------------------------------------------------------------------------

const filterOptions: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  ...ALL_DOC_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ProfileOption {
  id: string;
  name: string;
  type: 'PERSON' | 'PET' | 'HOUSEHOLD';
}

interface Document {
  id: string;
  title: string;
  category: string;
  date: string;
  linkedProfile: string;
  isSensitive: boolean;
  uri?: string;
  mimeType?: string | null;
  size?: number | null;
}

const ALL_CATEGORY_VALUES = new Set(ALL_DOC_CATEGORIES.map((c) => c.value));

function inferDocumentCategory(doc: VaultDocument): string {
  const tags = (doc.tags || []).map((t) => t.toLowerCase());
  // Direct match against known category values stored as tags
  for (const tag of tags) {
    if (ALL_CATEGORY_VALUES.has(tag)) return tag;
  }
  // Fallback heuristic on title/filename
  const title = `${doc.title || ''} ${doc.fileName || ''}`.toLowerCase();
  if (tags.some((t) => t.includes('insurance')) || title.includes('insurance')) return 'insurance';
  if (tags.some((t) => t.includes('passport') || t.includes('license') || t.includes('id')) || title.includes('passport') || title.includes('license')) return 'id';
  if (tags.some((t) => t.includes('medical')) || title.includes('medical')) return 'medical';
  if (tags.some((t) => t.includes('vaccine')) || title.includes('vaccine')) return 'vaccination_record';
  if (tags.some((t) => t.includes('travel')) || title.includes('travel')) return 'travel';
  return 'other';
}

async function toScreenDocument(
  doc: VaultDocument,
  profileNames: Map<string, string>,
): Promise<Document> {
  const links = await listLinkedRecordsForDocument(doc.id);
  const tagProfileIds = (doc.tags || [])
    .filter((t) => t.startsWith('profile:'))
    .map((t) => t.slice('profile:'.length));

  const entityIds = new Set([
    ...links.map((l) => l.entityId),
    ...tagProfileIds,
  ]);

  const names = [...entityIds]
    .map((id) => profileNames.get(id))
    .filter(Boolean) as string[];

  return {
    id: doc.id,
    title: doc.title || doc.fileName || 'Document',
    category: inferDocumentCategory(doc),
    date: doc.createdAt,
    linkedProfile: names.length > 0 ? `Linked to ${names.join(', ')}` : 'Unlinked',
    isSensitive: (doc.tags || []).includes('sensitive'),
    uri: doc.uri,
    mimeType: doc.mimeType,
    size: doc.sizeBytes,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DocumentsScreen() {
  const router = useRouter();
  const handleBack = () => {
    if ((router as any).canGoBack?.()) router.back();
    else router.replace('/(tabs)');
  };

  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Add-document form state
  const [allProfiles, setAllProfiles] = useState<ProfileOption[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProfileId, setUploadProfileId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('other');
  const [uploadCategoryOther, setUploadCategoryOther] = useState('');
  const [uploadSensitive, setUploadSensitive] = useState(false);

  // Derive the selected profile's type so we can show the right categories
  const selectedProfileType = useMemo(() => {
    if (!uploadProfileId) return null;
    return allProfiles.find((p) => p.id === uploadProfileId)?.type ?? null;
  }, [uploadProfileId, allProfiles]);

  const activeCategoryList = useMemo(() => {
    if (!selectedProfileType) return [];
    return DOC_CATEGORIES_BY_TYPE[selectedProfileType] ?? [];
  }, [selectedProfileType]);

  useEffect(() => {
    const load = async () => {
      const [list, profiles] = await Promise.all([listDocuments(), getProfiles()]);
      const profileNames = new Map<string, string>();
      const opts: ProfileOption[] = [];
      for (const p of profiles) {
        let name: string;
        if (p.profileType === 'HOUSEHOLD') {
          name = p.name;
        } else if (p.profileType === 'PET') {
          name = p.petName;
        } else {
          name = p.preferredName || p.firstName;
        }
        profileNames.set(p.id, name);
        opts.push({ id: p.id, name, type: p.profileType });
      }
      setAllProfiles(opts);
      const mapped = await Promise.all(list.map((doc) => toScreenDocument(doc, profileNames)));
      setDocuments(mapped);
    };
    load();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.linkedProfile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shareDocument = async (document: Document) => {
    try {
      await shareStoredDocument(document.id);
    } catch {
      const message = `LifeVault document: ${document.title}\nLinked profile: ${document.linkedProfile}`;
      await Share.share({ message, title: `LifeVault: ${document.title}` });
    }
  };

  const resetUploadState = () => {
    setUploadTitle('');
    setUploadProfileId(null);
    setUploadCategory('other');
    setUploadCategoryOther('');
    setUploadSensitive(false);
  };

  const handleProfileSelect = (profileId: string) => {
    const isSame = uploadProfileId === profileId;
    if (isSame) {
      // Deselect
      setUploadProfileId(null);
      setUploadCategory('other');
      setUploadCategoryOther('');
      return;
    }
    setUploadProfileId(profileId);
    // Reset category to first option of the new profile type
    const profileType = allProfiles.find((p) => p.id === profileId)?.type;
    const cats = profileType ? (DOC_CATEGORIES_BY_TYPE[profileType] ?? []) : [];
    setUploadCategory(cats[0]?.value ?? 'other');
    setUploadCategoryOther('');
  };

  const savePickedFile = async (file: { uri: string; mimeType?: string | null; name?: string; size?: number | null }) => {
    if (!uploadProfileId) {
      Alert.alert('Profile required', 'Please select a linked profile before uploading.');
      return;
    }

    const tags: string[] = [
      uploadCategory,
      ...(uploadSensitive ? ['sensitive'] : []),
      `profile:${uploadProfileId}`,
    ];
    if (uploadCategory === 'other' && uploadCategoryOther.trim()) {
      tags.push(`category_other:${uploadCategoryOther.trim()}`);
    }

    const created = await createDocument({
      uri: file.uri,
      mimeType: file.mimeType || 'image/jpeg',
      fileName: file.name,
      sizeBytes: file.size ?? undefined,
      title: (uploadTitle || file.name || 'Document').trim(),
      tags,
    });

    const selectedName = allProfiles.find((p) => p.id === uploadProfileId)?.name;

    const nextDoc: Document = {
      id: created.id,
      title: created.title || created.fileName || 'Document',
      category: inferDocumentCategory(created),
      date: created.createdAt,
      linkedProfile: selectedName ? `Linked to ${selectedName}` : 'Unlinked',
      isSensitive: uploadSensitive,
      uri: created.uri,
      mimeType: created.mimeType,
      size: created.sizeBytes ?? null,
    };

    setDocuments([nextDoc, ...documents]);
    setShowAddModal(false);
    resetUploadState();
  };

  const handleCameraCapture = async () => {
    if (!uploadProfileId) {
      Alert.alert('Profile required', 'Please select a linked profile before uploading.');
      return;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) {
          Alert.alert(
            'Camera access needed',
            'Camera permission was denied. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert('Camera access needed', 'Please allow camera access to take a photo.');
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      await savePickedFile({
        uri: asset.uri,
        mimeType: asset.mimeType,
        name: asset.fileName ?? `scan_${Date.now()}.jpg`,
        size: asset.fileSize,
      });
    } catch (e: any) {
      Alert.alert('Capture failed', e?.message ?? 'Could not take photo.');
    }
  };

  const handleFilePick = async () => {
    if (!uploadProfileId) {
      Alert.alert('Profile required', 'Please select a linked profile before uploading.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) return;

      await savePickedFile({
        uri: file.uri,
        mimeType: file.mimeType,
        name: file.name,
        size: file.size,
      });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Could not select document.');
    }
  };

  // ---------------------------------------------------------------------------
  // Document card
  // ---------------------------------------------------------------------------

  const DocumentCard = ({ document }: { document: Document }) => {
    const Icon = categoryIconMap[document.category] ?? FileText;
    const colorClass = categoryColorMap[document.category] ?? DEFAULT_COLOR;
    const label = categoryLabelMap[document.category] ?? document.category;

    return (
      <Pressable className="bg-card border border-border rounded-2xl p-4 mb-3" onPress={() => setSelectedDocument(document)}>
        <View className="flex-row items-start">
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${colorClass.split(' ')[1]}`}>
            <Icon size={24} className={colorClass.split(' ')[0]} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                {document.title}
              </Text>
              {document.isSensitive && <Lock size={16} className="text-amber-500" />}
            </View>

            <Text className="text-muted-foreground text-sm mt-1">
              {label}
            </Text>

            <View className="flex-row items-center mt-3 gap-4">
              <View className="flex-row items-center">
                <User size={14} className="text-muted-foreground mr-1" />
                <Text className="text-muted-foreground text-xs">{document.linkedProfile}</Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={14} className="text-muted-foreground mr-1" />
                <Text className="text-muted-foreground text-xs">{formatDate(document.date)}</Text>
              </View>
            </View>
          </View>

          <ChevronRight size={20} className="text-muted-foreground ml-2" />
        </View>
      </Pressable>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center" hitSlop={8}>
              <ArrowLeft size={22} className="text-foreground" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Documents</Text>
            <Pressable onPress={() => setShowAddModal(true)} className="bg-primary rounded-full p-2.5">
              <Plus size={20} className="text-primary-foreground" />
            </Pressable>
          </View>

          <View className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3">
            <Search size={20} className="text-muted-foreground mr-3" />
            <TextInput
              className="flex-1 text-foreground text-base"
              placeholder="Search documents..."
              placeholderTextColor="rgb(168 162 158)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={20} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter bar */}
        <ScrollView
          horizontal
          style={{ flexGrow: 0 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10, gap: 6, alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {filterOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setActiveFilter(option.value)}
              className={`self-start px-4 py-1 rounded-full border ${
                activeFilter === option.value ? 'bg-primary border-primary' : 'bg-card border-border'
              }`}
            >
              <Text className={`text-xs font-medium ${activeFilter === option.value ? 'text-primary-foreground' : 'text-foreground'}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Document list */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredDocuments.length === 0 ? (
            <View className="items-center justify-center py-16">
              <FileText size={48} className="text-muted-foreground mb-4" />
              <Text className="text-foreground font-semibold text-lg mb-2">No Documents Found</Text>
              <Text className="text-muted-foreground text-center text-sm">
                {searchQuery || activeFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add your first document to get started'}
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-muted-foreground text-sm mb-3">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </Text>
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </>
          )}
        </ScrollView>

        {/* ----------------------------------------------------------------- */}
        {/* Add Document modal                                                 */}
        {/* ----------------------------------------------------------------- */}
        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl p-6" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View className="w-12 h-1 bg-muted rounded-full self-center mb-6" />
              <Text className="text-foreground font-bold text-xl mb-4">Add Document</Text>

              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="gap-3 mb-4">
                  {/* Title */}
                  <View>
                    <Text className="text-foreground text-sm font-medium mb-2">Title</Text>
                    <TextInput
                      className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="Document title"
                      placeholderTextColor="rgb(168 162 158)"
                      value={uploadTitle}
                      onChangeText={setUploadTitle}
                    />
                  </View>

                  {/* Linked Profile (required, single-select) */}
                  <View>
                    <Text className="text-foreground text-sm font-medium mb-2">
                      Linked Profile <Text className="text-red-500">*</Text>
                    </Text>
                    {allProfiles.length === 0 ? (
                      <Text className="text-muted-foreground text-sm">No profiles yet</Text>
                    ) : (
                      <ScrollView
                        horizontal
                        style={{ flexGrow: 0 }}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ alignItems: 'center' }}
                        keyboardShouldPersistTaps="handled"
                      >
                        <View className="flex-row gap-2">
                          {allProfiles.map((profile) => {
                            const selected = uploadProfileId === profile.id;
                            return (
                              <Pressable
                                key={profile.id}
                                onPress={() => handleProfileSelect(profile.id)}
                                className={`px-4 py-1 rounded-full border ${
                                  selected ? 'bg-primary border-primary' : 'bg-card border-border'
                                }`}
                              >
                                <Text className={`text-xs font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                  {profile.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    )}
                  </View>

                  {/* Category (dynamic based on profile type) */}
                  {activeCategoryList.length > 0 && (
                    <View>
                      <Text className="text-foreground text-sm font-medium mb-2">Category</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {activeCategoryList.map((cat) => (
                          <Pressable
                            key={cat.value}
                            onPress={() => {
                              setUploadCategory(cat.value);
                              if (cat.value !== 'other') setUploadCategoryOther('');
                            }}
                            className={`px-4 py-1 rounded-full border ${
                              uploadCategory === cat.value ? 'bg-primary border-primary' : 'bg-card border-border'
                            }`}
                          >
                            <Text className={`text-xs font-medium ${uploadCategory === cat.value ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {cat.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* "Other" text field */}
                      {uploadCategory === 'other' && (
                        <TextInput
                          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mt-2"
                          placeholder="Describe the category"
                          placeholderTextColor="rgb(168 162 158)"
                          value={uploadCategoryOther}
                          onChangeText={setUploadCategoryOther}
                        />
                      )}
                    </View>
                  )}

                  {/* Prompt to select profile if none chosen */}
                  {!uploadProfileId && allProfiles.length > 0 && (
                    <Text className="text-muted-foreground text-sm text-center">
                      Select a profile to see category options
                    </Text>
                  )}

                  {/* Sensitive toggle */}
                  <Pressable
                    onPress={() => setUploadSensitive((v) => !v)}
                    className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                      uploadSensitive ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-card'
                    }`}
                  >
                    <Text className="text-foreground font-medium">Mark as sensitive</Text>
                    <Text className={`text-xs font-semibold ${uploadSensitive ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {uploadSensitive ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </View>

                {/* Upload actions */}
                <View className={`gap-3 ${!uploadProfileId ? 'opacity-40' : ''}`} pointerEvents={uploadProfileId ? 'auto' : 'none'}>
                  <Pressable
                    onPress={handleCameraCapture}
                    className="flex-row items-center bg-card border border-border rounded-xl p-4"
                  >
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                      <Camera size={24} className="text-primary" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">Take Photo</Text>
                      <Text className="text-muted-foreground text-sm">Use camera to capture document</Text>
                    </View>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </Pressable>

                  <Pressable onPress={handleFilePick} className="flex-row items-center bg-card border border-border rounded-xl p-4">
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                      <Upload size={24} className="text-primary" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">Upload File</Text>
                      <Text className="text-muted-foreground text-sm">Select from device storage</Text>
                    </View>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </Pressable>
                </View>
              </ScrollView>

              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  resetUploadState();
                }}
                className="mt-4 py-4 items-center"
              >
                <Text className="text-muted-foreground font-medium">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ----------------------------------------------------------------- */}
        {/* Document detail modal                                              */}
        {/* ----------------------------------------------------------------- */}
        <Modal visible={!!selectedDocument} transparent animationType="fade" onRequestClose={() => setSelectedDocument(null)}>
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-background rounded-2xl p-6 w-full" style={{ borderRadius: 16 }}>
              {selectedDocument && (() => {
                const DetailIcon = categoryIconMap[selectedDocument.category] ?? FileText;
                const detailColor = categoryColorMap[selectedDocument.category] ?? DEFAULT_COLOR;
                const detailLabel = categoryLabelMap[selectedDocument.category] ?? selectedDocument.category;

                return (
                  <>
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${detailColor.split(' ')[1]}`}>
                          <DetailIcon size={20} className={detailColor.split(' ')[0]} />
                        </View>
                        <Text className="text-foreground font-bold text-lg flex-1" numberOfLines={2}>{selectedDocument.title}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {selectedDocument.isSensitive && (
                          <View className="flex-row items-center bg-amber-500/10 px-2 py-1 rounded-full">
                            <Lock size={12} className="text-amber-500 mr-1" />
                            <Text className="text-amber-500 text-xs font-medium">Sensitive</Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => shareDocument(selectedDocument)}
                          className="w-9 h-9 rounded-full bg-card border border-border items-center justify-center"
                        >
                          <Share2 size={16} className="text-foreground" />
                        </Pressable>
                      </View>
                    </View>

                    <View className="bg-muted/50 rounded-xl p-4 mb-4 space-y-3">
                      <View className="flex-row justify-between">
                        <Text className="text-muted-foreground text-sm">Category</Text>
                        <Text className="text-foreground font-medium">{detailLabel}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-muted-foreground text-sm">Date Added</Text>
                        <Text className="text-foreground font-medium">{formatDate(selectedDocument.date)}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-muted-foreground text-sm">Linked Profile</Text>
                        <Text className="text-foreground font-medium">{selectedDocument.linkedProfile}</Text>
                      </View>
                    </View>

                    <View className="flex-row gap-3 mb-3">
                      <Pressable
                        onPress={async () => {
                          if (!selectedDocument.uri) {
                            Alert.alert('View Document', 'No file is attached to this document.');
                            setSelectedDocument(null);
                            return;
                          }
                          try {
                            await openDocumentUri(selectedDocument.uri, selectedDocument.mimeType || undefined);
                          } catch (error: any) {
                            Alert.alert('Cannot open file', error?.message ?? 'This document cannot be opened.');
                          } finally {
                            setSelectedDocument(null);
                          }
                        }}
                        className="flex-1 bg-primary rounded-xl py-3 items-center"
                      >
                        <Text className="text-primary-foreground font-semibold">View Document</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => selectedDocument && shareDocument(selectedDocument)}
                      className="bg-card border border-border rounded-xl py-3 items-center flex-row justify-center gap-2"
                    >
                      <Share2 size={16} className="text-foreground" />
                      <Text className="text-foreground font-semibold">Share</Text>
                    </Pressable>

                    <Pressable onPress={() => setSelectedDocument(null)} className="mt-3 py-3 items-center">
                      <Text className="text-muted-foreground font-medium">Close</Text>
                    </Pressable>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
