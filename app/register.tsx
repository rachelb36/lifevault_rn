import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { gql, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [register, { loading }] = useMutation(REGISTER);

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      const { data } = await register({
        variables: {
          input: {
            email: trimmedEmail,
            password,
            name: trimmedName || null,
          },
        },
      });

      const token = data?.register?.token;
      if (!token) {
        Alert.alert("Registration failed", "No token received from server.");
        return;
      }

      await SecureStore.setItemAsync("accessToken", token);

      if (trimmedName) {
        const parts = trimmedName.split(" ");
        await Promise.allSettled([
          SecureStore.setItemAsync("userFirstName", parts[0] || ""),
          SecureStore.setItemAsync("userLastName", parts.slice(1).join(" ") || ""),
        ]);
      }

      // New user → always go through onboarding
      router.replace("/onboarding");
    } catch (e: any) {
      const msg = e?.message || "Something went wrong. Please try again.";
      Alert.alert("Registration failed", msg);
    }
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 justify-center">
          <Text className="text-3xl font-bold text-foreground text-center mb-2">
            Create your account
          </Text>
          <Text className="text-base text-muted-foreground text-center mb-10">
            Start organizing what matters most
          </Text>

          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Full Name (optional)
              </Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Your name"
                placeholderTextColor="rgb(162 162 168)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="you@example.com"
                placeholderTextColor="rgb(162 162 168)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="At least 8 characters"
                placeholderTextColor="rgb(162 162 168)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Confirm Password
              </Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Re-enter password"
                placeholderTextColor="rgb(162 162 168)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-4"
            activeOpacity={0.85}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="items-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-primary font-semibold">
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/onboarding")}
            className="items-center"
            activeOpacity={0.8}
          >
            <Text className="text-muted-foreground">
              Continue without an account
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
