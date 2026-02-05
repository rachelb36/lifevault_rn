import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Heart, FileText, Phone, Shield, Calendar, Activity, AlertCircle, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Types
type ModuleType = 'medical' | 'insurance' | 'documents' | 'emergency' | 'vaccinations';

interface Module {
  id: ModuleType;
  name: string;
  icon: any;
  enabled: boolean;
}

interface Profile {
  id: string;
  name: string;
  relationship: string;
  photo: string;
  type: 'person' | 'pet';
}

// Mock data
const mockProfile: Profile = {
  id: '1',
  name: 'John Anderson',
  relationship: 'Spouse',
  photo: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fE1hbiUyMG1hbGUlMjBnZW50bGVtYW4lMjBwcm9maWxlfGVufDB8fDB8fHww',
  type: 'person',
};

const initialModules: Module[] = [
  { id: 'medical', name: 'Medical Information', icon: Activity, enabled: true },
  { id: 'insurance', name: 'Insurance', icon: Shield, enabled: true },
  { id: 'documents', name: 'Documents', icon: FileText, enabled: false },
  { id: 'emergency', name: 'Emergency Contacts', icon: Phone, enabled: true },
  { id: 'vaccinations', name: 'Vaccinations', icon: AlertCircle, enabled: false },
];

export default function ProfileDetailScreen() {
  const router = useRouter();
  const [profile] = useState<Profile>(mockProfile);
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedSections, setExpandedSections] = useState<Set<ModuleType>>(new Set(['medical', 'insurance']));

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
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Blood Type</Text>
                  <Text className="text-foreground font-medium">A+</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Allergies</Text>
                  <Text className="text-destructive font-medium">Penicillin, Peanuts</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Organ Donor</Text>
                  <Text className="text-foreground font-medium">Yes</Text>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Medical Record</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'insurance' && (
              <View className="gap-3 pt-3">
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-1">Medical Insurance</Text>
                  <Text className="text-sm text-muted-foreground">Blue Cross Blue Shield</Text>
                  <Text className="text-sm text-muted-foreground">Member ID: XXX123456789</Text>
                </View>
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="font-semibold text-foreground mb-1">Dental Insurance</Text>
                  <Text className="text-sm text-muted-foreground">Delta Dental</Text>
                  <Text className="text-sm text-muted-foreground">Member ID: DNT987654321</Text>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Insurance Policy</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'documents' && (
              <View className="gap-3 pt-3">
                <Text className="text-muted-foreground text-center py-4">No documents added yet</Text>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Document</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'emergency' && (
              <View className="gap-3 pt-3">
                <View className="p-3 bg-muted/50 rounded-lg flex-row items-center">
                  <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                    <Phone size={18} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">Mom (Emergency)</Text>
                    <Text className="text-sm text-muted-foreground">(555) 123-4567</Text>
                  </View>
                </View>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 mt-2 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Emergency Contact</Text>
                </Pressable>
              </View>
            )}

            {module.id === 'vaccinations' && (
              <View className="gap-3 pt-3">
                <Text className="text-muted-foreground text-center py-4">No vaccinations recorded</Text>
                <Pressable className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg">
                  <Plus size={16} className="text-primary" />
                  <Text className="text-primary font-medium">Add Vaccination</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} className="text-foreground" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Profile Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        {/* Profile Card */}
        <View className="p-6">
          <View className="bg-card rounded-2xl p-6 items-center shadow-sm">
            <Image
              source={{ uri: profile.photo }}
              className="w-24 h-24 rounded-full mb-4"
              style={{ borderWidth: 3, borderColor: 'rgb(244 244 245)' }}
            />
            <Text className="text-2xl font-bold text-foreground mb-1">{profile.name}</Text>
            <Text className="text-muted-foreground mb-4">{profile.relationship}</Text>
            
            <View className="flex-row gap-2">
              <View className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                <Heart size={14} className="text-primary" fill="rgb(251 113 133)" />
                <Text className="text-sm text-primary font-medium">Primary</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                <Calendar size={14} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">Age 45</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modules Section */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Information Modules</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Toggle modules to show/hide sections. Multiple sections can be open at once.
          </Text>
          
          {modules.map(module => (
            <AccordionSection key={module.id} module={module} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}