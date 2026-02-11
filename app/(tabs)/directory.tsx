import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Phone, Mail, X, Edit, Trash, User, Star, ChevronRight, MapPin } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useFocusEffect, useRouter } from 'expo-router';
import KeyboardDismiss from '@/components/KeyboardDismiss';
import {
  Contact,
  ContactCategory,
  deleteContact as deleteContactStorage,
  getContacts,
  saveContacts,
} from '@/lib/storage/contacts';

// Enable className styling for icons
cssInterop(Search, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Plus, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Phone, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Mail, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(X, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Edit, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Trash, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Star, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronRight, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(MapPin, { className: { target: 'style', nativeStyleToProp: { color: true } } });

// Types
type CategoryType = 'All' | ContactCategory;

// Categories for filtering
const CATEGORIES: CategoryType[] = [
  'All',
  'Medical',
  'Service Provider',
  'Emergency',
  'Family',
  'School',
  'Work',
  'Insurance',
  'Legal',
  'Other',
];
const DEFAULT_CONTACT_CATEGORIES: ContactCategory[] = ['Other'];

// Mock Data
const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Dr. Emily Smith',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=60',
    phone: '(555) 123-4567',
    email: 'dr.smith@vetclinic.com',
    categories: ['Medical'],
    linkedProfiles: [{ id: 'pet-buddy', name: 'Buddy (Dog)', type: 'dependent', role: 'Primary Vet' }],
    isFavorite: true,
  },
  {
    id: '2',
    name: 'Mom (Emergency)',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60',
    phone: '(555) 987-6543',
    email: 'mom@email.com',
    categories: ['Family', 'Emergency'],
    linkedProfiles: [{ id: 'dep-sarah', name: 'Sarah Johnson', type: 'dependent', role: 'Emergency Contact' }],
    isFavorite: true,
  },
  {
    id: '3',
    name: 'City Pet Hospital',
    phone: '(555) 456-7890',
    categories: ['Medical', 'Emergency'],
    linkedProfiles: [{ id: 'pet-whiskers', name: 'Whiskers (Cat)', type: 'dependent', role: 'After Hours Care' }],
    isFavorite: false,
  },
  {
    id: '4',
    name: 'John Anderson',
    photo: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=200&auto=format&fit=crop&q=60',
    phone: '(555) 321-0987',
    email: 'john.work@company.com',
    categories: ['Work'],
    isFavorite: false,
  },
  {
    id: '5',
    name: 'Lincoln Elementary',
    phone: '(555) 654-3210',
    categories: ['School'],
    linkedProfiles: [{ id: 'dep-tommy', name: 'Tommy Johnson', type: 'dependent', role: 'School Pickup' }],
    isFavorite: false,
  },
  {
    id: '6',
    name: 'Pet Grooming Pro',
    phone: '(555) 789-0123',
    categories: ['Service Provider'],
    linkedProfiles: [{ id: 'pet-buddy', name: 'Buddy (Dog)', type: 'dependent', role: 'Groomer' }],
    isFavorite: false,
  },
];

export default function DirectoryScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    categories: ContactCategory[];
  }>({
    name: '',
    phone: '',
    email: '',
    categories: [],
  });

  const reload = useCallback(async () => {
    const list = await getContacts();
    if (list.length === 0) {
      await saveContacts(INITIAL_CONTACTS);
      setContacts(INITIAL_CONTACTS);
      return;
    }
    setContacts(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || contact.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAddContact = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      categories: formData.categories.length > 0 ? formData.categories : DEFAULT_CONTACT_CATEGORIES,
      isFavorite: false,
    };

    const next = [newContact, ...contacts];
    setContacts(next);
    saveContacts(next);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateContact = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }

    const next = contacts.map(c => 
      c.id === editingContact?.id 
        ? { 
            ...c, 
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            categories: formData.categories.length > 0 ? formData.categories : DEFAULT_CONTACT_CATEGORIES,
          }
        : c
    );
    setContacts(next);
    saveContacts(next);
    setShowAddModal(false);
    setEditingContact(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', categories: [] });
  };

  const toggleFavorite = (id: string) => {
    const next = contacts.map(c => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setContacts(next);
    saveContacts(next);
  };

  const deleteContact = (id: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteContactStorage(id);
            setContacts(contacts.filter(c => c.id !== id));
          }
        }
      ]
    );
  };

  const toggleCategoryInForm = (cat: CategoryType) => {
    if (cat === 'All') return;
    const category = cat as ContactCategory;
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const ContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity 
      className="bg-card rounded-2xl p-4 mb-3 border border-border active:bg-muted/50"
      onLongPress={() => deleteContact(item.id)}
      onPress={() => router.push(`/add-contact?id=${item.id}`)}
    >
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="w-14 h-14 rounded-full bg-muted items-center justify-center mr-4 overflow-hidden">
          {item.photo ? (
            <Image source={{ uri: item.photo }} className="w-full h-full" />
          ) : (
            <User size={24} className="text-muted-foreground" />
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)} className="p-1">
              <Star 
                size={18} 
                className={item.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} 
              />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View className="flex-row flex-wrap gap-2 mt-1 mb-2">
            {item.categories.map((cat, index) => (
              <View 
                key={index} 
                className={`px-2 py-0.5 rounded-full ${
                  cat === 'Emergency'
                    ? 'bg-destructive/10'
                    : cat === 'Medical' || cat === 'Service Provider'
                      ? 'bg-blue-500/10'
                      : 'bg-muted'
                }`}
              >
                <Text 
                  className={`text-xs ${
                    cat === 'Emergency'
                      ? 'text-destructive'
                      : cat === 'Medical' || cat === 'Service Provider'
                        ? 'text-blue-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  {cat}
                </Text>
              </View>
            ))}
          </View>

          {/* Linked Profiles */}
          {item.linkedProfiles && item.linkedProfiles.length > 0 && (
            <View className="flex-row items-center gap-1 mb-2">
              <MapPin size={12} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                Linked to {item.linkedProfiles.map(p => p.name).join(', ')}
              </Text>
            </View>
          )}

          {/* Phone */}
          <TouchableOpacity className="flex-row items-center gap-2">
            <Phone size={14} className="text-primary" />
            <Text className="text-primary text-sm font-medium">{item.phone}</Text>
          </TouchableOpacity>
        </View>

        {/* Chevron */}
        <ChevronRight size={20} className="text-muted-foreground ml-2" />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-foreground mb-4">Directory</Text>
        
        {/* Search Bar */}
        <View className="bg-input border border-border rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Search size={20} className="text-muted-foreground mr-3" />
          <TextInput
            className="flex-1 text-foreground"
            placeholder="Search contacts..."
            placeholderTextColor="rgb(168 162 158)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full border ${
                selectedCategory === category
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
              }`}
            >
              <Text 
                className={`text-sm font-medium ${
                  selectedCategory === category
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        renderItem={ContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <User size={48} className="text-muted-foreground mb-4" />
            <Text className="text-foreground font-semibold mb-2">No Contacts Found</Text>
            <Text className="text-muted-foreground text-center">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Add your first contact to get started'}
            </Text>
          </View>
        }
      />

      {/* Add Contact FAB */}
      <TouchableOpacity
        onPress={() => {
          setEditingContact(null);
          resetForm();
          router.push("/add-contact");
        }}
        className="absolute bottom-24 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={28} className="text-primary-foreground" />
      </TouchableOpacity>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 border-t border-border" style={{ maxHeight: '90%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setEditingContact(null);
                resetForm();
              }}>
                <X size={24} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Name *</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Phone *</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
                <TextInput
                  className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Categories */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Categories</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleCategoryInForm(cat)}
                      className={`px-3 py-1.5 rounded-full border ${
                        formData.categories.includes(cat)
                          ? 'bg-primary border-primary'
                          : 'bg-card border-border'
                      }`}
                    >
                      <Text 
                        className={`text-xs ${
                          formData.categories.includes(cat)
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Link Profiles Placeholder */}
              <View className="mb-6 p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                <Text className="text-sm font-medium text-foreground mb-1">Link to Profiles</Text>
                <Text className="text-xs text-muted-foreground">
                  Select which profiles this contact is associated with (coming soon)
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={editingContact ? handleUpdateContact : handleAddContact}
                className="bg-primary rounded-xl py-4 items-center"
              >
                <Text className="text-primary-foreground font-semibold text-base">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
