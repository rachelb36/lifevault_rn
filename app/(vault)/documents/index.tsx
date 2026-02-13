import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Camera, Upload, Shield, Lock, FileText, Calendar, User, X, ChevronRight, Share2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardDismiss from '@/shared/ui/KeyboardDismiss';

type DocumentType = 'insurance' | 'id' | 'medical' | 'vaccination' | 'travel' | 'other';

interface Document {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  linkedProfile: string;
  isSensitive: boolean;
  uri?: string;
  mimeType?: string | null;
  size?: number | null;
}

const DOCUMENTS_KEY = 'documents_tab_v1';

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Health Insurance Card',
    type: 'insurance',
    date: '2024-01-15',
    linkedProfile: 'John Anderson',
    isSensitive: true,
  },
  {
    id: '2',
    title: "Driver's License",
    type: 'id',
    date: '2024-02-20',
    linkedProfile: 'John Anderson',
    isSensitive: true,
  },
  {
    id: '3',
    title: 'Vaccination Record - Max',
    type: 'vaccination',
    date: '2024-03-10',
    linkedProfile: 'Max (Dog)',
    isSensitive: false,
  },
  {
    id: '4',
    title: 'Pet Insurance Policy',
    type: 'insurance',
    date: '2024-01-05',
    linkedProfile: 'Max (Dog)',
    isSensitive: true,
  },
  {
    id: '5',
    title: 'Blood Test Results',
    type: 'medical',
    date: '2024-02-28',
    linkedProfile: 'John Anderson',
    isSensitive: true,
  },
  {
    id: '6',
    title: 'Vaccination Record - Bella',
    type: 'vaccination',
    date: '2024-03-05',
    linkedProfile: 'Bella (Cat)',
    isSensitive: false,
  },
];

const filterOptions: { label: string; value: DocumentType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'ID', value: 'id' },
  { label: 'Medical', value: 'medical' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Travel', value: 'travel' },
  { label: 'Other', value: 'other' },
];

const documentTypeIcons: Record<DocumentType, any> = {
  insurance: Shield,
  id: FileText,
  medical: FileText,
  vaccination: Shield,
  travel: FileText,
  other: FileText,
};

const documentTypeColors: Record<DocumentType, string> = {
  insurance: 'text-blue-500 bg-blue-500/10',
  id: 'text-purple-500 bg-purple-500/10',
  medical: 'text-red-500 bg-red-500/10',
  vaccination: 'text-green-500 bg-green-500/10',
  travel: 'text-cyan-500 bg-cyan-500/10',
  other: 'text-gray-500 bg-gray-500/10',
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DocumentType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProfile, setUploadProfile] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentType>('other');
  const [uploadSensitive, setUploadSensitive] = useState(false);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(DOCUMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setDocuments(list.length > 0 ? list : mockDocuments);
    };
    load();
  }, []);

  const saveDocuments = async (next: Document[]) => {
    setDocuments(next);
    await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(next));
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.linkedProfile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shareByEmail = async (document: Document) => {
    const subject = encodeURIComponent(`LifeVault Document: ${document.title}`);
    const body = encodeURIComponent(
      `Here is the document from LifeVault:\n\n${document.title}\nLinked profile: ${document.linkedProfile}\n\nShared from LifeVault.`
    );
    const url = `mailto:?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Email not available', 'No email client is configured on this device.');
      return;
    }
    await Linking.openURL(url);
  };

  const shareByText = async (document: Document) => {
    const body = encodeURIComponent(`LifeVault document: ${document.title}\nLinked profile: ${document.linkedProfile}`);
    const url = `sms:&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Messaging not available', 'No messaging app is available on this device.');
      return;
    }
    await Linking.openURL(url);
  };

  const shareDocument = async (document: Document) => {
    const message = `LifeVault document: ${document.title}\nLinked profile: ${document.linkedProfile}`;
    await Share.share({ message, title: `LifeVault: ${document.title}` });
  };

  const resetUploadState = () => {
    setUploadTitle('');
    setUploadProfile('');
    setUploadCategory('other');
    setUploadSensitive(false);
  };

  const handlePickAndSave = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) return;

      const nextDoc: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title: (uploadTitle || file.name || 'Document').trim(),
        type: uploadCategory,
        date: new Date().toISOString().slice(0, 10),
        linkedProfile: uploadProfile.trim() || 'Unlinked',
        isSensitive: uploadSensitive,
        uri: file.uri,
        mimeType: file.mimeType ?? null,
        size: file.size ?? null,
      };

      await saveDocuments([nextDoc, ...documents]);
      setShowAddModal(false);
      resetUploadState();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Could not select document.');
    }
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const Icon = documentTypeIcons[document.type];
    const colorClass = documentTypeColors[document.type];

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
              {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
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

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {filterOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setActiveFilter(option.value)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === option.value ? 'bg-primary border-primary' : 'bg-card border-border'
              }`}
            >
              <Text className={`text-sm font-medium ${activeFilter === option.value ? 'text-primary-foreground' : 'text-foreground'}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }} keyboardShouldPersistTaps="handled">
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

        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl p-6" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View className="w-12 h-1 bg-muted rounded-full self-center mb-6" />
              <Text className="text-foreground font-bold text-xl mb-4">Add Document</Text>

              <View className="gap-3 mb-4">
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

                <View>
                  <Text className="text-foreground text-sm font-medium mb-2">Linked Profile (optional)</Text>
                  <TextInput
                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="e.g. John Anderson, Max (Dog)"
                    placeholderTextColor="rgb(168 162 158)"
                    value={uploadProfile}
                    onChangeText={setUploadProfile}
                  />
                </View>

                <View>
                  <Text className="text-foreground text-sm font-medium mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View className="flex-row gap-2">
                      {filterOptions
                        .filter((option) => option.value !== 'all')
                        .map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() => setUploadCategory(option.value as DocumentType)}
                            className={`px-3 py-2 rounded-full border ${
                              uploadCategory === option.value ? 'bg-primary border-primary' : 'bg-card border-border'
                            }`}
                          >
                            <Text className={`text-xs font-medium ${uploadCategory === option.value ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                    </View>
                  </ScrollView>
                </View>

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

              <View className="gap-3">
                <Pressable
                  onPress={() => {
                    Alert.alert('Camera', 'Camera capture is not wired yet. Use Upload File for now.');
                  }}
                  className="flex-row items-center bg-card border border-border rounded-xl p-4"
                >
                  <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                    <Camera size={24} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">Take Photo</Text>
                    <Text className="text-muted-foreground text-sm">Use camera to scan document</Text>
                  </View>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </Pressable>

                <Pressable onPress={handlePickAndSave} className="flex-row items-center bg-card border border-border rounded-xl p-4">
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

        <Modal visible={!!selectedDocument} transparent animationType="fade" onRequestClose={() => setSelectedDocument(null)}>
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-background rounded-2xl p-6 w-full" style={{ borderRadius: 16 }}>
              {selectedDocument && (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${documentTypeColors[selectedDocument.type].split(' ')[1]}`}>
                        {React.createElement(documentTypeIcons[selectedDocument.type], {
                          size: 20,
                          className: documentTypeColors[selectedDocument.type].split(' ')[0],
                        })}
                      </View>
                      <Text className="text-foreground font-bold text-lg">{selectedDocument.title}</Text>
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
                      <Text className="text-muted-foreground text-sm">Type</Text>
                      <Text className="text-foreground font-medium capitalize">{selectedDocument.type}</Text>
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
                      onPress={() => {
                        if (selectedDocument.uri) {
                          Linking.openURL(selectedDocument.uri);
                        } else {
                          Alert.alert('View Document', 'No file is attached to this document.');
                        }
                        setSelectedDocument(null);
                      }}
                      className="flex-1 bg-primary rounded-xl py-3 items-center"
                    >
                      <Text className="text-primary-foreground font-semibold">View Document</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable onPress={() => selectedDocument && shareByEmail(selectedDocument)} className="flex-1 bg-card border border-border rounded-xl py-3 items-center">
                      <Text className="text-foreground font-semibold">Email</Text>
                    </Pressable>
                    <Pressable onPress={() => selectedDocument && shareByText(selectedDocument)} className="flex-1 bg-card border border-border rounded-xl py-3 items-center">
                      <Text className="text-foreground font-semibold">Text</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => setSelectedDocument(null)} className="mt-3 py-3 items-center">
                    <Text className="text-muted-foreground font-medium">Close</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
