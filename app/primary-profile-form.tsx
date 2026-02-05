import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Camera, ArrowLeft, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PrimaryProfileFormScreen() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [dob, setDob] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter your first and last name.');
      return;
    }
    if (!dob) {
      Alert.alert('Required Fields', 'Please enter your date of birth.');
      return;
    }
    
    // Save profile (mock - would save to state/API)
    console.log('Saving profile:', {
      firstName,
      lastName,
      preferredName,
      relationship: 'self',
      dob: dob.toISOString(),
      photoUri,
    });
    
    // Navigate to dashboard or profile detail
    router.replace('/(tabs)');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft className="text-foreground" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Create Primary Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          padding: 24, 
          paddingBottom: 128,
          gap: 24,
        }}
      >
        {/* Photo Upload */}
        <View className="items-center">
          <TouchableOpacity className="relative">
            <View className="w-28 h-28 rounded-full bg-muted overflow-hidden border-4 border-background">
              {photoUri ? (
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                <Image 
                  source={{ uri: photoUri }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <User className="text-muted-foreground" size={48} />
                </View>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-background">
              <Camera className="text-primary-foreground" size={16} />
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-muted-foreground mt-3">Tap to add photo</Text>
        </View>

        {/* Form Fields */}
        <View className="gap-5">
          {/* First Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">First Name *</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Enter first name"
              placeholderTextColor="text-muted-foreground"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          {/* Last Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Last Name *</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="Enter last name"
              placeholderTextColor="text-muted-foreground"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          {/* Preferred Name */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Preferred Name (optional)</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholder="What should we call you?"
              placeholderTextColor="text-muted-foreground"
              value={preferredName}
              onChangeText={setPreferredName}
              autoCapitalize="words"
            />
          </View>

          {/* Relationship - Read only for primary */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Relationship</Text>
            <View className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <Text className="text-muted-foreground text-base">Self</Text>
            </View>
          </View>

          {/* Date of Birth */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Date of Birth *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={dob ? "text-foreground text-base" : "text-muted-foreground text-base"}>
                {dob ? formatDate(dob) : "Select date of birth"}
              </Text>
              <Calendar className="text-muted-foreground" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Note */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Text className="text-sm text-primary leading-relaxed">
            You can add additional information like medical details, emergency contacts, and documents after creating your profile.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-area-pb">
        <TouchableOpacity
          onPress={handleSave}
          className="bg-primary rounded-xl py-4 items-center"
        >
          <Text className="text-primary-foreground font-semibold text-base">Create Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDob(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}