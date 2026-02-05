import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Mail, Fingerprint } from 'lucide-react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    
    // Simulate login - in real app, this would validate credentials
    setTimeout(() => {
      setIsLoading(false);
      // Check if user has seen onboarding (mock - would be stored in AsyncStorage)
      const hasSeenOnboarding = false;
      
      if (hasSeenOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }, 1000);
  };

  const handleBiometricAuth = () => {
    Alert.alert('Biometric Authentication', 'Face ID / Touch ID would be triggered here.');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Lock size={40} className="text-primary" />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">LifeVault</Text>
          <Text className="text-muted-foreground text-center">
            A calmer way to keep what matters
          </Text>
        </View>

        {/* Theme Toggle */}
        <View className="absolute top-4 right-6">
          <ThemeToggle />
        </View>

        {/* Login Form */}
        <View className="gap-5">
          {/* Email Input */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
              <Mail size={20} className="text-muted-foreground mr-3" />
              <TextInput
                className="flex-1 py-4 text-foreground"
                placeholder="your@email.com"
                placeholderTextColor="rgb(168 162 158)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
              <Lock size={20} className="text-muted-foreground mr-3" />
              <TextInput
                className="flex-1 py-4 text-foreground"
                placeholder="••••••••"
                placeholderTextColor="rgb(168 162 158)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text className="text-primary text-sm font-medium">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary rounded-xl py-4 items-center mt-4"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">Sign In</Text>
            )}
          </Pressable>

          {/* Biometric Auth */}
          <Pressable
            onPress={handleBiometricAuth}
            className="flex-row items-center justify-center gap-2 py-4"
          >
            <Fingerprint size={20} className="text-primary" />
            <Text className="text-primary font-medium">Sign in with Face ID / Touch ID</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <Text className="text-muted-foreground text-sm text-center">
            Stored on your device. Protected by Face ID.
            {'\n'}No accounts. No data selling.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}