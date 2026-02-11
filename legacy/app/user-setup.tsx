import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Smartphone, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function PrimarySetupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingHorizontal: 24, 
          paddingBottom: 32,
          justifyContent: 'center',
        }}
      >
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
            <User className="text-primary" size={40} />
          </View>
          
          <Text className="text-3xl font-bold text-foreground text-center mb-3">
            Set up your Profile
          </Text>
          
          <Text className="text-muted-foreground text-center text-base leading-relaxed max-w-xs">
          Create your profile to store essential information for yourself
          </Text>
        </View>

        {/* Action Cards */}
        <View className="gap-4">
          {/* Create New Button */}
          <TouchableOpacity
            onPress={() => router.push('/add-user')}
            className="bg-card border border-border rounded-2xl p-6 active:opacity-80"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center">
                  <User className="text-primary" size={24} />
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground mb-1">
                    Create New Profile
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Start from scratch with your details
                  </Text>
                </View>
              </View>
              
              <ArrowRight className="text-muted-foreground" size={20} />
            </View>
          </TouchableOpacity>

          {/* Import from Contacts Button */}
          <TouchableOpacity
            className="bg-card border border-border rounded-2xl p-6 active:opacity-80"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-secondary rounded-xl items-center justify-center">
                  <Smartphone className="text-secondary-foreground" size={24} />
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground mb-1">
                    Import from iOS Contacts
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Use existing contact info
                  </Text>
                </View>
              </View>
              
              <ArrowRight className="text-muted-foreground" size={20} />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
  onPress={() => router.replace("/(tabs)")}
  className="mt-6 items-center"
  activeOpacity={0.8}
>
  <Text className="text-primary font-semibold">Skip for now</Text>
</TouchableOpacity>

        {/* Info Note */}
        <View className="mt-8 bg-muted/50 rounded-xl p-4">
          <Text className="text-sm text-muted-foreground text-center leading-relaxed">
            Your primary profile is the foundation for storing medical records, documents, and emergency contacts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}