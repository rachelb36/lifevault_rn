import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, User as UserIcon } from "lucide-react-native";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";

import DatePickerModal from "@/shared/ui/DatePickerModal";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import NameFields from "@/shared/ui/NameFields";
import { toIsoDateOnly, formatDateLabel } from "@/shared/utils/date";
import { RELATIONSHIP_OPTIONS } from "@/features/profiles/constants/options";
import { getLocalOnlyMode } from "@/shared/utils/localStorage";
import { getDependents, saveDependents } from "@/features/profiles/data/storage";

const MY_VAULTS = gql`
  query MyVaults {
    myVaults {
      id
    }
  }
`;

const CREATE_VAULT = gql`
  mutation CreateVault($input: CreateVaultInput!) {
    createVault(input: $input) {
      id
    }
  }
`;

const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
      id
      displayName
      relationshipType
      relationshipOtherLabel
      dateOfBirth
    }
  }
`;

const toUtcMidnightIso = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();

export default function AddDependentScreen() {
  const router = useRouter();
  const { primary, id } = useLocalSearchParams<{ primary?: string; id?: string }>();
  const editId = Array.isArray(id) ? id[0] : id;
  const primaryValue = Array.isArray(primary) ? primary[0] : primary;
  const isPrimaryFlow = primaryValue === "true" || primaryValue === "1";
  const isEditing = !!editId;

  const apolloClient = useApolloClient();
  const [createEntity, { loading: saving }] = useMutation(CREATE_ENTITY);
  const didPrefill = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [relationship, setRelationship] = useState(isPrimaryFlow ? "Self" : "");
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isPrimary = useMemo(() => (isPrimaryFlow ? true : relationship.trim().toLowerCase() === "self"), [isPrimaryFlow, relationship]);

  const screenTitle = isPrimaryFlow ? "Complete Your Profile" : isEditing ? "Edit" : "Add";

  const getRelationshipInput = () => {
    const normalized = relationship.trim().toLowerCase();
    if (isPrimaryFlow || normalized === "self") return { type: "PRIMARY" as const };
    if (normalized === "spouse") return { type: "SPOUSE" as const };
    if (normalized === "partner") return { type: "PARTNER" as const };
    if (normalized === "child") return { type: "CHILD" as const };
    if (normalized === "mother" || normalized === "father" || normalized === "parent") return { type: "PARENT" as const };
    if (normalized === "grandparent") return { type: "GRANDPARENT" as const };
    if (normalized === "sibling") return { type: "SIBLING" as const };
    return { type: "OTHER" as const, other: relationship.trim() || "Other" };
  };

  const getOrCreateVaultId = async () => {
    const res = await apolloClient.query({ query: MY_VAULTS, fetchPolicy: "network-only" });
    const existing = res.data?.myVaults?.[0]?.id;
    if (existing) return existing;

    const created = await apolloClient.mutate({
      mutation: CREATE_VAULT,
      variables: { input: { name: "My Family Vault" } },
    });
    return created.data?.createVault?.id as string;
  };

  const openPhotoActions = () => {
    Alert.alert("Photo Upload Disabled", "Photo upload is temporarily disabled until dependencies are installed.");
  };

  useEffect(() => {
    if (!isPrimaryFlow || didPrefill.current) return;
    let cancelled = false;

    const loadPrefill = async () => {
      try {
        const [fn, ln, pn, dob, avatar] = await Promise.all([
          SecureStore.getItemAsync("userFirstName"),
          SecureStore.getItemAsync("userLastName"),
          SecureStore.getItemAsync("userPreferredName"),
          SecureStore.getItemAsync("userDob"),
          SecureStore.getItemAsync("userPhotoUri"),
        ]);

        if (cancelled) return;

        if (!firstName && fn) setFirstName(fn);
        if (!lastName && ln) setLastName(ln);
        if (!preferredName && pn) setPreferredName(pn);
        if (!dobDate && dob) {
          const parsed = new Date(dob);
          if (Number.isFinite(parsed.getTime())) setDobDate(parsed);
        }
        if (!avatarUri && avatar) setAvatarUri(avatar);
        didPrefill.current = true;
      } catch {
        // Prefill optional.
      }
    };

    loadPrefill();
    return () => {
      cancelled = true;
    };
  }, [isPrimaryFlow, firstName, lastName, preferredName, dobDate, avatarUri]);

  useEffect(() => {
    if (!isEditing || !editId) return;
    let cancelled = false;

    const loadEdit = async () => {
      const list = await getDependents();
      const found = Array.isArray(list) ? list.find((d: any) => d.id === editId) : null;
      if (!found || cancelled) return;

      setFirstName(found.firstName || "");
      setLastName(found.lastName || "");
      setPreferredName(found.preferredName || "");
      setRelationship(found.relationship || "");
      setDobDate(found.dob ? new Date(found.dob) : null);
      setAvatarUri(found.avatar || null);
    };

    loadEdit();
    return () => {
      cancelled = true;
    };
  }, [isEditing, editId]);

  const validate = () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "Please enter a first name.");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Please enter a last name.");
      return false;
    }
    if (!isPrimaryFlow && !relationship.trim()) {
      Alert.alert("Required", "Please select a relationship.");
      return false;
    }
    if (!dobDate) {
      Alert.alert("Required", "Please select a date of birth.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      let savedWithNetworkFallback = false;
      const list = await getDependents();

      const baseItem = {
        id: editId || `dep-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || "",
        relationship: isPrimaryFlow ? "Self" : relationship.trim(),
        dob: dobDate ? toIsoDateOnly(dobDate) : "",
        avatar: avatarUri || "",
        isPrimary: isPrimaryFlow ? true : isPrimary,
        hasCompletedProfile: true,
      };

      if (isEditing) {
        const next = Array.isArray(list) ? list.map((d: any) => (d.id === editId ? { ...d, ...baseItem } : d)) : [baseItem];
        await saveDependents(next as any);
      } else {
        const localOnly = await getLocalOnlyMode();
        let createdId = baseItem.id;

        if (!localOnly) {
          try {
            const vaultId = await getOrCreateVaultId();
            const rel = getRelationshipInput();
            const res = await createEntity({
              variables: {
                input: {
                  vaultId,
                  entityType: "PERSON",
                  displayName: `${baseItem.firstName} ${baseItem.lastName}`.trim(),
                  relationshipType: rel.type,
                  relationshipOtherLabel: rel.other ?? null,
                  dateOfBirth: dobDate ? toUtcMidnightIso(dobDate) : null,
                },
              },
            });

            const created = res.data?.createEntity;
            createdId = created?.id || baseItem.id;
          } catch {
            savedWithNetworkFallback = true;
          }
        }

        const next = [{ ...baseItem, id: createdId }, ...(Array.isArray(list) ? list : [])];
        await saveDependents(next as any);
        baseItem.id = createdId;
      }

      if (isPrimaryFlow) {
        await Promise.allSettled([
          SecureStore.setItemAsync("primaryProfileCreated", "true"),
          SecureStore.setItemAsync("userFirstName", baseItem.firstName),
          SecureStore.setItemAsync("userLastName", baseItem.lastName),
          SecureStore.setItemAsync("userPreferredName", baseItem.preferredName || ""),
          SecureStore.setItemAsync("userDob", baseItem.dob || ""),
        ]);
      }

      const destination = `/profile-saved?type=dependent&id=${editId || baseItem.id}`;
      if (savedWithNetworkFallback) {
        Alert.alert("Saved locally", "Couldn't reach the server, but your person was saved on this device.", [
          { text: "OK", onPress: () => router.replace(destination as any) },
        ]);
        return;
      }

      router.replace(destination as any);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center" disabled={saving}>
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{screenTitle}</Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="items-center">
            <TouchableOpacity className="relative" activeOpacity={0.85} onPress={openPhotoActions}>
              <View className="w-28 h-28 rounded-full bg-muted overflow-hidden border-4 border-background">
                <View className="flex-1 items-center justify-center">
                  <UserIcon className="text-muted-foreground" size={48} />
                </View>
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-muted-foreground mt-3">Photo upload temporarily unavailable</Text>
          </View>

          <NameFields
            firstName={firstName}
            lastName={lastName}
            preferredName={preferredName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onPreferredNameChange={setPreferredName}
          />

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Relationship</Text>
            {isPrimaryFlow ? (
              <View className="bg-card border border-border rounded-xl px-4 py-3">
                <Text className="text-foreground">Self</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.map((option) => {
                  const active = relationship === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setRelationship(option)}
                      className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
                    >
                      <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between" activeOpacity={0.85}>
              <Text className={dobDate ? "text-foreground" : "text-muted-foreground"}>{formatDateLabel(dobDate, "Select date of birth")}</Text>
              <Calendar size={18} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="mt-6 gap-3">
            <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-primary-foreground font-semibold">{isPrimaryFlow ? "Save Profile" : isEditing ? "Save Changes" : "Save PERSON"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <DatePickerModal
          visible={showDatePicker}
          value={dobDate}
          onConfirm={(date) => {
            setDobDate(date);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
          title="Date of Birth"
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
