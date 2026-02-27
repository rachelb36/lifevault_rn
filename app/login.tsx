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

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { loading }] = useMutation(LOGIN);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }

    try {
      const { data } = await login({
        variables: { input: { email: trimmedEmail, password } },
      });

      const token = data?.login?.token;
      if (!token) {
        Alert.alert("Login failed", "No token received from server.");
        return;
      }

      await SecureStore.setItemAsync("accessToken", token);

      const user = data.login.user;
      if (user?.name) {
        const parts = user.name.split(" ");
        await Promise.allSettled([
          SecureStore.setItemAsync("userFirstName", parts[0] || ""),
          SecureStore.setItemAsync("userLastName", parts.slice(1).join(" ") || ""),
        ]);
      }

      // Check if user has completed onboarding before
      const hasOnboarded = await SecureStore.getItemAsync("hasOnboarded");
      if (hasOnboarded === "true") {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch (e: any) {
      const msg = e?.message || "Something went wrong. Please try again.";
      Alert.alert("Login failed", msg);
    }
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 justify-center">
          <Text className="text-3xl font-bold text-foreground text-center mb-2">
            Welcome back
          </Text>
          <Text className="text-base text-muted-foreground text-center mb-10">
            Sign in to your LifeVault account
          </Text>

          <View className="gap-4 mb-6">
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
                placeholder="Enter password"
                placeholderTextColor="rgb(162 162 168)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-4"
            activeOpacity={0.85}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register" as any)}
            className="items-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-primary font-semibold">
              Don't have an account? Sign up
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
