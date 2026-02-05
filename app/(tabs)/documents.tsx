import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Camera, Upload, Shield, Lock, FileText, Calendar, User, X, ChevronRight, Filter } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Types
type DocumentType = 'insurance' | 'id' | 'medical' | 'vaccination' | 'other';

interface Document {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  linkedProfile: string;
  isSensitive: boolean;
}

// Mock data
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
    title: 'Driver\'s License',
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
  { label: 'Other', value: 'other' },
];

const documentTypeIcons: Record<DocumentType, any> = {
  insurance: Shield,
  id: FileText,
  medical: FileText,
  vaccination: Shield,
  other: FileText,
};

const documentTypeColors: Record<DocumentType, string> = {
  insurance: 'text-blue-500 bg-blue-500/10',
  id: 'text-purple-500 bg-purple-500/10',
  medical: 'text-red-500 bg-red-500/10',
  vaccination: 'text-green-500 bg-green-500/10',
  other: 'text-gray-500 bg-gray-500/10',
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DocumentType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.linkedProfile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAddDocument = () => {
    Alert.alert('Add Document', 'Choose how to add your document:', [
      { text: 'Camera', onPress: () => console.log('Open camera') },
      { text: 'File Picker', onPress: () => console.log('Open file picker') },
      { text: 'Cancel', style: 'cancel' },
    ]);
    setShowAddModal(false);
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const Icon = documentTypeIcons[document.type];
    const colorClass = documentTypeColors[document.type];

    return (
      <Pressable 
        className="bg-card border border-border rounded-2xl p-4 mb-3"
        onPress={() => setSelectedDocument(document)}
      >
        <View className="flex-row items-start">
          {/* Icon */}
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${colorClass.split(' ')[1]}`}>
            <Icon size={24} className={colorClass.split(' ')[0]} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                {document.title}
              </Text>
              {document.isSensitive && (
                <Lock size={16} className="text-amber-500" />
              )}
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

          {/* Chevron */}
          <ChevronRight size={20} className="text-muted-foreground ml-2" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">Documents</Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-full p-2.5"
          >
            <Plus size={20} className="text-primary-foreground" />
          </Pressable>
        </View>

        {/* Search Bar */}
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

      {/* Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}
      >
        {filterOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setActiveFilter(option.value)}
            className={`px-4 py-2 rounded-full border ${
              activeFilter === option.value
                ? 'bg-primary border-primary'
                : 'bg-card border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeFilter === option.value
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Documents List */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
      >
        {filteredDocuments.length === 0 ? (
          <View className="items-center justify-center py-16">
            <FileText size={48} className="text-muted-foreground mb-4" />
            <Text className="text-foreground font-semibold text-lg mb-2">No Documents Found</Text>
            <Text className="text-muted-foreground text-center text-sm">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Add your first document to get started'}
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

      {/* Add Document Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <View className="w-12 h-1 bg-muted rounded-full self-center mb-6" />
            
            <Text className="text-foreground font-bold text-xl mb-6">Add Document</Text>

            <View className="gap-3">
              <Pressable
                onPress={() => {
                  Alert.alert('Camera', 'Opening camera to capture document...');
                  setShowAddModal(false);
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

              <Pressable
                onPress={() => {
                  Alert.alert('File Picker', 'Opening file picker to select document...');
                  setShowAddModal(false);
                }}
                className="flex-row items-center bg-card border border-border rounded-xl p-4"
              >
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
              onPress={() => setShowAddModal(false)}
              className="mt-4 py-4 items-center"
            >
              <Text className="text-muted-foreground font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Document Detail Modal */}
      <Modal
        visible={!!selectedDocument}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDocument(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-background rounded-2xl p-6 w-full" style={{ borderRadius: 16 }}>
            {selectedDocument && (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${documentTypeColors[selectedDocument.type].split(' ')[1]}`}>
                      {React.createElement(documentTypeIcons[selectedDocument.type], { 
                        size: 20, 
                        className: documentTypeColors[selectedDocument.type].split(' ')[0] 
                      })}
                    </View>
                    <Text className="text-foreground font-bold text-lg">{selectedDocument.title}</Text>
                  </View>
                  {selectedDocument.isSensitive && (
                    <View className="flex-row items-center bg-amber-500/10 px-2 py-1 rounded-full">
                      <Lock size={12} className="text-amber-500 mr-1" />
                      <Text className="text-amber-500 text-xs font-medium">Sensitive</Text>
                    </View>
                  )}
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

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      Alert.alert('View Document', 'Opening document viewer...');
                      setSelectedDocument(null);
                    }}
                    className="flex-1 bg-primary rounded-xl py-3 items-center"
                  >
                    <Text className="text-primary-foreground font-semibold">View Document</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedDocument(null)}
                    className="flex-1 bg-card border border-border rounded-xl py-3 items-center"
                  >
                    <Text className="text-foreground font-semibold">Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}