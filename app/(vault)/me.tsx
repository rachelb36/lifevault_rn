// app/(vault)/me.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { User, Smartphone, ArrowRight, ArrowLeft, Share2 } from "lucide-react-native";
import { gql, useQuery } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";

import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import { getLocalOnlyMode, getLocalUser } from "@/shared/utils/localStorage";
import ProfileShareModal from "@/shared/ui/ProfileShareModal";
import { ShareSection, shareProfilePdf } from "@/shared/share/profilePdf";
import { listPeople } from "@/features/people/data/peopleStorage";

import RecordSection from "@/features/records/ui/RecordSection";
import { PERSON_CATEGORY_ORDER, RecordCategory } from "@/domain/records/recordCategories";
import type { LifeVaultRecord } from "@/domain/records/record.model";
import { listRecordsForEntity } from "@/features/records/data/storage";
import type { Attachment } from "@/shared/attachments/attachment.model";

const ME = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;

async function listUserRecords(personId: string): Promise<LifeVaultRecord[]> {
  return listRecordsForEntity(personId);
}

export default function UserDetailScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const isCompleteMode = mode === "complete";

  const { data, loading } = useQuery(ME, { fetchPolicy: "network-only" });

  const [localUser, setLocalUserState] = useState<any>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [primaryDependentId, setPrimaryDependentId] = useState<string | null>(null);

  // Records
  const [records, setRecords] = useState<LifeVaultRecord[]>([]);

  const user = localOnly ? localUser : data?.me;

  // Determine local-only mode + pull local user
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

  // Resolve the personId we should use for record routes/storage
  const personId = useMemo(() => {
    const id = user?.id;
    return id ? String(id) : "";
  }, [user?.id]);

  // Load/refresh records
  const refreshRecords = useCallback(async () => {
    if (!personId) return;
    const next = await listUserRecords(personId);
    setRecords(next);
  }, [personId]);

  // Refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadPrimaryDependent = async () => {
        const list = await listPeople();
        if (cancelled) return;
        const primary = list.find((d) => !!d.isPrimary || String(d.relationship || "").toLowerCase() === "self");
        setPrimaryDependentId(primary?.id ? String(primary.id) : null);
      };
      loadPrimaryDependent();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Display name helper (server has `name`; local-only uses first/last/preferredName)
  const displayName = useMemo(() => {
    if (!user) return "";

    const localFull =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      (user.preferredName ? String(user.preferredName) : "");

    const serverName = typeof user.name === "string" ? user.name.trim() : "";

    return localOnly ? localFull : serverName;
  }, [user, localOnly]);

  const shareSections: ShareSection[] = useMemo(() => {
    return [
      {
        id: "basic",
        title: "Basic Information",
        content: [`Name: ${displayName || "—"}`, `Email: ${user?.email || "—"}`].join("\n"),
      },
    ];
  }, [displayName, user?.email]);

  // ---------- Render helpers ----------
  const Header = (
    <View className="flex-row items-center justify-between px-6 py-4">
      <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center" activeOpacity={0.85}>
        <ArrowLeft size={22} className="text-foreground" />
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-foreground">Primary Profile</Text>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={() => setShowShareModal(true)} className="w-10 h-10 items-center justify-center">
          <Share2 size={20} className="text-foreground" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
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

  // If we have a user, show detail view
  if (user) {
    return (
      <KeyboardDismiss>
        <SafeAreaView className="flex-1 bg-background">
          {Header}

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
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

            {/* Hero */}
            <View className="items-center mb-8 mt-2">
              <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-5">
                <User className="text-primary" size={40} />
              </View>

              <Text className="text-3xl font-bold text-foreground text-center mb-2">
                {displayName || "Your Profile"}
              </Text>

              <Text className="text-muted-foreground text-center text-base leading-relaxed max-w-xs">
                {user.email}
              </Text>

              <View className="mt-3 bg-primary/10 rounded-full px-3 py-1.5">
                <Text className="text-primary text-sm font-medium">Self (Primary user)</Text>
              </View>
            </View>

            {/* Actions */}
            <View className="gap-4">
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    primaryDependentId
                      ? `/(vault)/people/add?primary=true&id=${primaryDependentId}`
                      : "/(vault)/people/add?primary=true"
                  )
                }
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
                onPress={() => {
                  Alert.alert("Coming soon", "iOS Contacts import will be added here.");
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

              <TouchableOpacity onPress={() => router.replace("/")} className="items-center" activeOpacity={0.8}>
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

            {/* Records */}
            {!!personId && (
              <View className="mt-10">
                <Text className="text-lg font-semibold text-foreground mb-2">Information</Text>
                <Text className="text-sm text-muted-foreground mb-4">
                  Add and edit your records by category (medical, travel, documents, etc).
                </Text>

                {PERSON_CATEGORY_ORDER.map((category) => (
                  <RecordSection
                    key={category}
                    category={category as RecordCategory}
                    records={records}
                    onAdd={(recordType, initialAttachment?: Attachment) => {
                      router.push({
                        pathname: "/(vault)/people/[personId]/records/add",
                        params: {
                          personId,
                          recordType,
                          ...(initialAttachment
                            ? {
                                initialAttachmentUri: initialAttachment.uri,
                                initialAttachmentName: initialAttachment.fileName,
                                initialAttachmentMime: initialAttachment.mimeType,
                                initialAttachmentSource: initialAttachment.source,
                              }
                            : {}),
                        },
                      } as any);
                    }}
                    onEdit={(record) => {
                      router.push({
                        pathname: "/(vault)/people/[personId]/records/[recordId]/edit",
                        params: { personId, recordId: record.id },
                      } as any);
                    }}
                    onOpen={(record, initialAttachment?: Attachment, replaceExistingAttachment?: boolean) => {
                      if (initialAttachment) {
                        router.push({
                          pathname: "/(vault)/people/[personId]/records/[recordId]/edit",
                          params: {
                            personId,
                            recordId: record.id,
                            initialAttachmentUri: initialAttachment.uri,
                            initialAttachmentName: initialAttachment.fileName,
                            initialAttachmentMime: initialAttachment.mimeType,
                            initialAttachmentSource: initialAttachment.source,
                            replaceAttachment: replaceExistingAttachment ? "true" : "false",
                          },
                        } as any);
                        return;
                      }
                      router.push({
                        pathname: "/(vault)/people/[personId]/records/[recordId]",
                        params: { personId, recordId: record.id },
                      } as any);
                    }}
                  />
                ))}
              </View>
            )}
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

  // If user is null (not logged in / query failed), show the setup CTA
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center" activeOpacity={0.85}>
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
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
            <User className="text-primary" size={40} />
          </View>

          <Text className="text-3xl font-bold text-foreground text-center mb-3">Create your profile</Text>

          <Text className="text-muted-foreground text-center text-base leading-relaxed max-w-xs">
           This is your account profile (you). You can add family members and pets later.
          </Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity
            onPress={() => router.push("/(vault)/people/add?primary=true")}
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
        </View>

        <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="mt-6 items-center" activeOpacity={0.8}>
          <Text className="text-primary font-semibold">Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/")} className="mt-4 items-center" activeOpacity={0.8}>
          <Text className="text-muted-foreground">Already have an account? Sign in</Text>
        </TouchableOpacity>

        <View className="mt-8 bg-muted/50 rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground text-center leading-relaxed">
            Your profile unlocks personalized dashboards and lets you attach documents and records to the right person or pet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
