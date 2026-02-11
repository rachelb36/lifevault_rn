import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { User, Smartphone, ArrowRight, ArrowLeft, Share2 } from "lucide-react-native";
import { gql, useQuery } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import KeyboardDismiss from "@/components/KeyboardDismiss";
import NameFields from "@/components/forms/NameFields";
import { getLocalOnlyMode, getLocalUser, setLocalUser } from "@/lib/storage/local";
import ProfileShareModal from "@/components/share/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/lib/share/profilePdf";

const ME = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;

export default function UserSetupScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const isCompleteMode = mode === "complete";
  const { data, loading } = useQuery(ME, { fetchPolicy: "network-only", skip: false });
  const [localUser, setLocalUserState] = useState<any>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const user = localOnly ? localUser : data?.me;
  const [isEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [preferredName, setPreferredName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const displayName = useMemo(() => {
    if (isEditing) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
  }, [user, isEditing, firstName, lastName]);

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [
          `Name: ${displayName || "—"}`,
          `Email: ${user?.email || "—"}`,
          preferredName ? `Preferred Name: ${preferredName}` : "Preferred Name: —",
        ].join("\n"),
      },
    ];
  }, [displayName, user?.email, preferredName]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const local = await getLocalOnlyMode();
      if (cancelled) return;
      setLocalOnly(local);
      if (local) {
        const u = await getLocalUser();
        if (!cancelled) setLocalUserState(u);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || isEditing) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
  }, [user, isEditing]);

  if (loading) {
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

  if (user) {
    return (
      <KeyboardDismiss>
        <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.85}
          >
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Primary Profile</Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => setShowShareModal(true)} className="w-10 h-10 items-center justify-center">
              <Share2 size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 32,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isCompleteMode && (
            <View className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3">
              <Text className="text-primary font-semibold text-sm">Finish setting up this profile</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Complete additional details to keep everything organized.
              </Text>
            </View>
          )}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <User className="text-primary" size={40} />
            </View>

            {isEditing ? (
              <View className="w-full">
                <NameFields
                  firstName={firstName}
                  lastName={lastName}
                  preferredName={preferredName}
                  onFirstNameChange={(text) => {
                    setFirstName(text);
                    setDirty(true);
                  }}
                  onLastNameChange={(text) => {
                    setLastName(text);
                    setDirty(true);
                  }}
                  onPreferredNameChange={(text) => {
                    setPreferredName(text);
                    setDirty(true);
                  }}
                  preferredNamePlaceholder="Preferred name (optional)"
                />
              </View>
            ) : (
              <Text className="text-3xl font-bold text-foreground text-center mb-2">
                {displayName || "Your Profile"}
              </Text>
            )}
            <Text className="text-muted-foreground text-center text-base leading-relaxed max-w-xs">
              {user.email}
            </Text>
          </View>

          {isEditing && dirty && (
            <TouchableOpacity
              onPress={async () => {
                await Promise.allSettled([
                  SecureStore.setItemAsync("userFirstName", firstName.trim()),
                  SecureStore.setItemAsync("userLastName", lastName.trim()),
                  SecureStore.setItemAsync("userPreferredName", preferredName.trim()),
                ]);
                if (localOnly) {
                  await setLocalUser({
                    id: localUser?.id || `local-${Date.now()}`,
                    email: localUser?.email || "",
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    preferredName: preferredName.trim(),
                    hasOnboarded: true,
                  });
                  const nextLocal = await getLocalUser();
                  setLocalUserState(nextLocal);
                }
                Alert.alert("Saved", "Your profile changes were saved locally.");
                setDirty(false);
              }}
              className="bg-primary rounded-xl py-4 items-center mb-6"
            >
              <Text className="text-primary-foreground font-semibold">Save Profile</Text>
            </TouchableOpacity>
          )}

          <View className="gap-4">
            <TouchableOpacity
              onPress={() => router.push("/add-user")}
              className="bg-card border border-border rounded-2xl p-6 active:opacity-80"
              activeOpacity={0.85}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center">
                    <User className="text-primary" size={24} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground mb-1">Edit Profile</Text>
                    <Text className="text-sm text-muted-foreground">Update your info</Text>
                  </View>
                </View>
                <ArrowRight className="text-muted-foreground" size={20} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/")}
              className="items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary font-semibold">Sign in with a different account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "This will remove your local profile data and sign you out. This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        await Promise.allSettled([
                          SecureStore.deleteItemAsync("accessToken"),
                          SecureStore.deleteItemAsync("refreshToken"),
                          SecureStore.deleteItemAsync("userProfileCreated"),
                          SecureStore.deleteItemAsync("primaryProfileCreated"),
                          SecureStore.deleteItemAsync("userFirstName"),
                          SecureStore.deleteItemAsync("userLastName"),
                          SecureStore.deleteItemAsync("userPreferredName"),
                          SecureStore.deleteItemAsync("userDob"),
                          SecureStore.deleteItemAsync("userPhotoUri"),
                        ]);
                        router.replace("/");
                      },
                    },
                  ]
                );
              }}
              className="items-center"
              activeOpacity={0.8}
            >
              <Text className="text-destructive font-semibold">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ProfileShareModal
          visible={showShareModal}
          profileName={displayName || "Primary Profile"}
          sections={shareSections}
          onClose={() => setShowShareModal(false)}
          onShare={async (sections) => {
            await shareProfilePdf(displayName || "Primary Profile", sections);
            setShowShareModal(false);
          }}
        />
        </SafeAreaView>
      </KeyboardDismiss>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.85}
        >
          <ArrowLeft size={22} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Set up your profile</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: 32,
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
            <User className="text-primary" size={40} />
          </View>

          <Text className="text-3xl font-bold text-foreground text-center mb-3">
            Create your profile
          </Text>

          <Text className="text-muted-foreground text-center text-base leading-relaxed max-w-xs">
            This is your account profile (you). You can add loved ones and pets separately later.
          </Text>
        </View>

        {/* Actions */}
        <View className="gap-4">
          {/* Manual entry */}
          <TouchableOpacity
            onPress={() => router.push("/add-user")}
            className="bg-card border border-border rounded-2xl p-6 active:opacity-80"
            activeOpacity={0.85}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center">
                  <User className="text-primary" size={24} />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground mb-1">Enter info manually</Text>
                  <Text className="text-sm text-muted-foreground">Name, DOB, and basics</Text>
                </View>
              </View>

              <ArrowRight className="text-muted-foreground" size={20} />
            </View>
          </TouchableOpacity>

          {/* Import */}
          <TouchableOpacity
            onPress={() => {
              // TODO: wire iOS contacts import later
            }}
            className="bg-card border border-border rounded-2xl p-6 active:opacity-80"
            activeOpacity={0.85}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-secondary rounded-xl items-center justify-center">
                  <Smartphone className="text-secondary-foreground" size={24} />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground mb-1">Import from iOS Contacts</Text>
                  <Text className="text-sm text-muted-foreground">Pull name + photo (coming soon)</Text>
                </View>
              </View>

              <ArrowRight className="text-muted-foreground" size={20} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-primary font-semibold">Skip for now</Text>
        </TouchableOpacity>

        {/* Existing account */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="mt-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-muted-foreground">Already have an account? Sign in</Text>
        </TouchableOpacity>

        {/* Note */}
        <View className="mt-8 bg-muted/50 rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground text-center leading-relaxed">
            Your profile unlocks personalized dashboards and lets you attach documents and records to the right person or pet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
