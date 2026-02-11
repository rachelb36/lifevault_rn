// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Mail, Fingerprint } from "lucide-react-native";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "expo-router";
import { gql, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import KeyboardDismiss from "@/components/KeyboardDismiss";
import { getLocalAuth, getLocalOnlyMode, seedLocalData, setLocalAuth, setLocalUser } from "@/lib/storage/local";

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user { id email name }
    }
  }
`;

export default function IndexGateAndLogin() {
  const router = useRouter();

  const [checkingExistingSession, setCheckingExistingSession] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading: loggingIn }] = useMutation(LOGIN);

  const isLoading = checkingExistingSession || loggingIn;

  // Boot check: if token exists, route user forward
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) return;

        const primaryCreated = await SecureStore.getItemAsync("primaryProfileCreated");
        if (primaryCreated === "true") {
          router.replace("/(tabs)");
        } else {
          router.replace({ pathname: "/add-dependent", params: { primary: "true" } });
        }
      } catch {
        // Bad/expired token or backend unreachable → clear and stay on login
        await Promise.allSettled([
          SecureStore.deleteItemAsync("accessToken"),
          SecureStore.deleteItemAsync("refreshToken"),
        ]);
      } finally {
        if (!cancelled) setCheckingExistingSession(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      Alert.alert("Required Fields", "Please enter both email and password.");
      return;
    }

    try {
      const localOnly = await getLocalOnlyMode();
      if (localOnly) {
        const existingAuth = await getLocalAuth();
        if (existingAuth && (existingAuth.email !== cleanEmail || existingAuth.password !== password)) {
          throw new Error("Invalid credentials");
        }
        if (!existingAuth) {
          await setLocalAuth({ email: cleanEmail, password });
          await setLocalUser({
            id: `local-${Date.now()}`,
            email: cleanEmail,
            firstName: "",
            lastName: "",
            hasOnboarded: false,
          });
        }
        await SecureStore.setItemAsync("accessToken", "local");
      } else {
        const res = await login({ variables: { email: cleanEmail, password } });
        const payload = res.data?.login;

        if (!payload?.token) {
          throw new Error("Login did not return token.");
        }

        await SecureStore.setItemAsync("accessToken", payload.token);
      }

      const primaryCreated = await SecureStore.getItemAsync("primaryProfileCreated");
      if (primaryCreated === "true") {
        router.replace("/(tabs)");
      } else {
        router.replace({ pathname: "/add-dependent", params: { primary: "true" } });
      }
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Unknown error");
    }
  };

  const handleBiometricAuth = () => {
    Alert.alert("Biometric Authentication", "Face ID / Touch ID would be triggered here.");
  };

  // While checking an existing session, show a loader (prevents flash)
  if (checkingExistingSession) {
    return (
      <KeyboardDismiss>
        <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-muted-foreground mt-3">Loading…</Text>
        </View>
        </SafeAreaView>
      </KeyboardDismiss>
    );
  }

  // Otherwise show Login UI
  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Lock size={40} className="text-primary" />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">LifeVault</Text>
          <Text className="text-muted-foreground text-center">A calmer way to keep what matters</Text>
        </View>

        <View className="absolute top-4 right-6">
          <ThemeToggle />
        </View>

        <View className="gap-5">
          {/* Email */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
              <Mail size={20} className="text-muted-foreground" style={{ marginRight: 12 }} />
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

          {/* Password */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className="flex-row items-center bg-input rounded-xl px-4 border border-border">
              {/* spacing issue fix: explicit marginRight */}
              <Lock size={20} className="text-muted-foreground" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 py-4 text-foreground"
                placeholder="••••••••"
                placeholderTextColor="rgb(168 162 158)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <Text className="text-primary text-sm font-medium">{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>
          </View>

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

          <Pressable onPress={handleBiometricAuth} className="flex-row items-center justify-center gap-2 py-4">
            <Fingerprint size={20} className="text-primary" />
            <Text className="text-primary font-medium">Sign in with Face ID / Touch ID</Text>
          </Pressable>

          {__DEV__ && (
            <Pressable
              onPress={async () => {
                const localOnly = await getLocalOnlyMode();
                if (!localOnly) {
                  Alert.alert("Local-only off", "Enable local-only mode to use dev seed data.");
                  return;
                }
                await seedLocalData();
                Alert.alert("Seeded", "Local demo data added. Login with demo@lifevault.app / demo1234");
              }}
              className="items-center py-2"
            >
              <Text className="text-xs text-muted-foreground">Dev Seed Data</Text>
            </Pressable>
          )}
        </View>
      </View>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
