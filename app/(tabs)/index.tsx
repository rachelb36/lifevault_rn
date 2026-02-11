import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { Plus, User, FileText, Users, Bell, PawPrint, Share2 } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useRouter } from 'expo-router';
import { gql, useQuery } from '@apollo/client';

// Enable className styling for icons
cssInterop(Plus, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(User, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileText, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Users, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Bell, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(PawPrint, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Share2, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const ME = gql`
  query Me {
    me {
      user {
        id
        email
        firstName
        lastName
        hasOnboarded
      }
    }
  }
`;

export default function DashboardScreen() {
  const router = useRouter();
  const { data, loading } = useQuery(ME, { fetchPolicy: 'network-only' });
  const user = data?.me?.user;
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-muted-foreground text-sm">Hello,</Text>
          <Text className="text-2xl font-bold text-foreground">
            {loading ? 'Loading…' : (displayName || 'Welcome')}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Bell className="text-foreground" size={24} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      <View className="px-6 pb-8">
        <View className="mt-2">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between gap-4">
            <TouchableOpacity
              onPress={() => router.push('/add-profile')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Plus className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Add Person</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/add-pet')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <PawPrint className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Add Pet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/dependents')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Users className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Household</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/user-detail?primary=true')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <User className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Profiles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/documents')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <FileText className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/documents')}
              className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center"
              activeOpacity={0.85}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Share2 className="text-primary" size={22} />
              </View>
              <Text className="text-foreground font-semibold">Share Document</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
