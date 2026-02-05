import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Plus, User, FileText, Users, ChevronRight, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

// Enable className styling for icons
cssInterop(Plus, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileText, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Users, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronRight, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Bell, { className: { target: 'style', nativeStyleToProp: { color: true } } });

// Mock data for stats
const stats = {
  people: 3,
  pets: 1,
  documents: 12,
  contacts: 8,
};

// Mock primary profile data
const primaryProfile = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  preferredName: 'Sarah',
  relationship: 'Self',
  photo: null, // Would be actual photo URL
};

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-muted-foreground text-sm">Good morning,</Text>
          <Text className="text-2xl font-bold text-foreground">
            {primaryProfile.preferredName || primaryProfile.firstName}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Bell className="text-foreground" size={24} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Profile Card */}
        <TouchableOpacity className="active:opacity-80">
          <LinearGradient
            colors={['rgb(148 163 184)', 'rgb(100 116 139)']}
            style={{ borderRadius: 16, padding: 20 }}
          >
            <View className="flex-row items-center gap-4">
              {/* Avatar placeholder */}
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                <User className="text-white" size={32} />
              </View>
              
              <View className="flex-1">
                <Text className="text-white/80 text-sm font-medium">Primary Profile</Text>
                <Text className="text-white text-xl font-bold">
                  {primaryProfile.firstName} {primaryProfile.lastName}
                </Text>
                <Text className="text-white/70 text-sm mt-1">
                  {primaryProfile.relationship}
                </Text>
              </View>

              <ChevronRight className="text-white/80" size={24} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-3xl font-bold text-foreground">{stats.people}</Text>
            <Text className="text-muted-foreground text-sm mt-1">People</Text>
          </View>
          
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-3xl font-bold text-foreground">{stats.pets}</Text>
            <Text className="text-muted-foreground text-sm mt-1">Pets</Text>
          </View>
          
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-3xl font-bold text-foreground">{stats.documents}</Text>
            <Text className="text-muted-foreground text-sm mt-1">Documents</Text>
          </View>
          
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border">
            <Text className="text-3xl font-bold text-foreground">{stats.contacts}</Text>
            <Text className="text-muted-foreground text-sm mt-1">Contacts</Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View>
          <Text className="text-xl font-bold text-foreground mb-4">Quick Actions</Text>
          
          <View className="gap-3">
            {/* Add Person/Pet */}
            <TouchableOpacity className="bg-card rounded-2xl p-5 border border-border flex-row items-center active:bg-muted/50">
              <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mr-4">
                <Plus className="text-primary" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Add Person / Pet</Text>
                <Text className="text-muted-foreground text-sm mt-1">Create a new profile</Text>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {/* Primary Profile */}
            <TouchableOpacity className="bg-card rounded-2xl p-5 border border-border flex-row items-center active:bg-muted/50">
              <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center mr-4">
                <User className="text-blue-500" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Primary Profile</Text>
                <Text className="text-muted-foreground text-sm mt-1">View or edit your info</Text>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {/* Documents */}
            <TouchableOpacity className="bg-card rounded-2xl p-5 border border-border flex-row items-center active:bg-muted/50">
              <View className="w-12 h-12 bg-emerald-500/10 rounded-xl items-center justify-center mr-4">
                <FileText className="text-emerald-500" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Documents</Text>
                <Text className="text-muted-foreground text-sm mt-1">Insurance, IDs, medical records</Text>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {/* Directory */}
            <TouchableOpacity className="bg-card rounded-2xl p-5 border border-border flex-row items-center active:bg-muted/50">
              <View className="w-12 h-12 bg-purple-500/10 rounded-xl items-center justify-center mr-4">
                <Users className="text-purple-500" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Directory</Text>
                <Text className="text-muted-foreground text-sm mt-1">Contacts, doctors, services</Text>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-muted/50 rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold mb-2">💡 Quick Tip</Text>
          <Text className="text-muted-foreground text-sm leading-relaxed">
            Keep your important documents organized by linking them to specific profiles. 
            This makes it easy to find everything when you need it most.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}