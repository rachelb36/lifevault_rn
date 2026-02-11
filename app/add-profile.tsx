import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, PawPrint, X } from 'lucide-react-native';

export default function AddProfileChooser() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black/50">
      <Pressable className="flex-1" onPress={() => router.back()}>
        <View className="flex-1 justify-center px-6">
          <Pressable
            onPress={() => {}}
            className="bg-background rounded-3xl p-6 border border-border shadow-lg"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">Add Profile</Text>
              <Pressable onPress={() => router.back()} className="p-2 -mr-2">
                <X size={20} className="text-muted-foreground" />
              </Pressable>
            </View>

            <Text className="text-sm text-muted-foreground mb-6">
              Choose who you’re adding
            </Text>

            <View className="gap-4">
              <Pressable
                onPress={() => router.push('/add-dependent')}
                className="bg-card rounded-2xl p-5 border border-border active:border-primary active:bg-primary/5"
              >
                <View className="items-center">
                  <View className="w-16 h-16 bg-sky-500 rounded-full items-center justify-center mb-3">
                    <User color="#fff" size={32} />
                  </View>
                  <Text className="text-lg font-semibold text-foreground">Add Person</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/add-pet')}
                className="bg-card rounded-2xl p-5 border border-border active:border-primary active:bg-primary/5"
              >
                <View className="items-center">
                  <View className="w-16 h-16 bg-emerald-500 rounded-full items-center justify-center mb-3">
                    <PawPrint color="#fff" size={32} />
                  </View>
                  <Text className="text-lg font-semibold text-foreground">Add Pet</Text>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
