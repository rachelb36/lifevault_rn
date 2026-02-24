/**
 * Add / Edit Person Screen — /(vault)/people/add
 *
 * Creates or edits a person's header-level profile fields: name (first,
 * last, preferred), relationship, date of birth, and avatar photo. When
 * an `id` param is present, loads the existing profile for editing;
 * otherwise starts a blank form. For the primary user (self), relationship
 * is locked to "Self" and name may be pre-filled from SecureStore.
 *
 * All other person data (identification, medical, etc.) is managed via
 * record forms on the person detail page.
 *
 * Route: /(vault)/people/add?id=<optional>
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Camera, User as UserIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";

import DatePickerModal from "@/shared/ui/DatePickerModal";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import NameFields from "@/shared/ui/NameFields";
import { toIsoDateOnly, formatDateLabel } from "@/shared/utils/date";
import { RELATIONSHIP_OPTIONS, type RelationshipOption } from "@/features/people/constants/options";
import { getLocalOnlyMode } from "@/shared/utils/localStorage";
import { listPeople, upsertPerson } from "@/features/people/data/peopleStorage";
import type { PersonProfileV1 } from "@/features/people/domain/person.schema";

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
  const isEditing = !!editId;
  const [hasAnyPeople, setHasAnyPeople] = useState<boolean | null>(null);

  const isPrimaryFromParam = primaryValue === "true" || primaryValue === "1";
  const shouldForcePrimaryForFirstProfile =
    !isEditing && hasAnyPeople === false;
  const isPrimaryFlow =
    isPrimaryFromParam || shouldForcePrimaryForFirstProfile;

  const apolloClient = useApolloClient();
  const [createEntity, { loading: saving }] = useMutation(CREATE_ENTITY);
  const didPrefill = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [relationship, setRelationship] = useState<RelationshipOption | "Self">(isPrimaryFlow ? "Self" : "Other");
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    relationship?: string;
    dob?: string;
  }>({});
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const isPrimary = useMemo(() => (isPrimaryFlow ? true : relationship === "Self"), [isPrimaryFlow, relationship]);

  const screenTitle = isPrimaryFlow ? "Complete Your Profile" : isEditing ? "Edit" : "Add";
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        firstName,
        lastName,
        preferredName,
        avatarUri,
        relationship,
        dobDate: dobDate ? toIsoDateOnly(dobDate) : "",
      }),
    [firstName, lastName, preferredName, avatarUri, relationship, dobDate],
  );
  const hasUnsavedChanges =
    initialSnapshot.length > 0 && initialSnapshot !== currentSnapshot;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const all = await listPeople();
      if (!cancelled) setHasAnyPeople(all.length > 0);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasAnyPeople !== null && !isEditing && initialSnapshot.length === 0) {
      setInitialSnapshot(
        JSON.stringify({
          firstName: "",
          lastName: "",
          preferredName: "",
          avatarUri: null,
          relationship: isPrimaryFlow ? "Self" : "Other",
          dobDate: "",
        }),
      );
    }
  }, [hasAnyPeople, isEditing, initialSnapshot.length, isPrimaryFlow]);

  useEffect(() => {
    if (isPrimaryFlow && relationship !== "Self") {
      setRelationship("Self");
    }
  }, [isPrimaryFlow, relationship]);

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
    const fromLibrary = async () => {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setAvatarUri(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open photo library.");
      }
    };

    const fromCamera = async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Camera access needed", "Please allow camera access in Settings.");
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setAvatarUri(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to open camera.");
      }
    };

    const buttons: any[] = [
      { text: "Choose from Library", onPress: fromLibrary },
      { text: "Take Photo", onPress: fromCamera },
    ];
    if (avatarUri) {
      buttons.push({ text: "Remove Photo", style: "destructive", onPress: () => setAvatarUri(null) });
    }
    buttons.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Photo", undefined, buttons);
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
      const all = await listPeople();
      const found = all.find((d) => d.id === editId);
      if (!found || cancelled) return;

      setFirstName(found.firstName || "");
      setLastName(found.lastName || "");
      setPreferredName(found.preferredName || "");
      setRelationship((found.relationship as RelationshipOption | "Self") || "Other");
      setDobDate(found.dob ? new Date(found.dob) : null);
      setAvatarUri(found.avatarUri || null);
      setInitialSnapshot(
        JSON.stringify({
          firstName: found.firstName || "",
          lastName: found.lastName || "",
          preferredName: found.preferredName || "",
          avatarUri: found.avatarUri || null,
          relationship: (found.relationship as RelationshipOption | "Self") || "Other",
          dobDate: found.dob || "",
        }),
      );
    };

    loadEdit();
    return () => {
      cancelled = true;
    };
  }, [isEditing, editId]);

  const validate = () => {
    const nextErrors: typeof fieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!isPrimaryFlow && !relationship.trim()) {
      nextErrors.relationship = "Relationship is required.";
    }
    if (!dobDate) nextErrors.dob = "Date of birth is required.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      let savedWithNetworkFallback = false;
      const timestamp = new Date().toISOString();

      const person: PersonProfileV1 = {
        schemaVersion: 1,
        id: editId || `person_${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || undefined,
        relationship: isPrimaryFlow ? "Self" : relationship,
        dob: dobDate ? toIsoDateOnly(dobDate) : undefined,
        avatarUri: avatarUri || undefined,
        isPrimary: isPrimaryFlow ? true : isPrimary,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      if (!isEditing) {
        const localOnly = await getLocalOnlyMode();

        if (!localOnly) {
          try {
            const vaultId = await getOrCreateVaultId();
            const rel = getRelationshipInput();
            const res = await createEntity({
              variables: {
                input: {
                  vaultId,
                  entityType: "PERSON",
                  displayName: `${person.firstName} ${person.lastName}`.trim(),
                  relationshipType: rel.type,
                  relationshipOtherLabel: (rel as any).other ?? null,
                  dateOfBirth: dobDate ? toUtcMidnightIso(dobDate) : null,
                },
              },
            });

            const created = res.data?.createEntity;
            if (created?.id) person.id = created.id;
          } catch {
            savedWithNetworkFallback = true;
          }
        }
      }

      await upsertPerson(person);

      if (isPrimaryFlow) {
        await Promise.allSettled([
          SecureStore.setItemAsync("primaryProfileCreated", "true"),
          SecureStore.setItemAsync("userFirstName", person.firstName),
          SecureStore.setItemAsync("userLastName", person.lastName),
          SecureStore.setItemAsync("userPreferredName", person.preferredName || ""),
          SecureStore.setItemAsync("userDob", person.dob || ""),
        ]);
      }

      const destination = `/profile-saved?type=dependent&id=${person.id}`;
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

  const handleBack = () => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }
    Alert.alert(
      "Discard changes?",
      "You have unsaved changes. Leave without saving?",
      [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ],
    );
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center" disabled={saving}>
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{screenTitle}</Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="items-center">
            <TouchableOpacity className="relative" activeOpacity={0.85} onPress={openPhotoActions}>
              <View className="w-28 h-28 rounded-full bg-muted overflow-hidden border-4 border-background items-center justify-center">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-28 h-28" />
                ) : (
                  <UserIcon className="text-muted-foreground" size={48} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                <Camera size={14} className="text-primary-foreground" />
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground mt-3">Tap to add photo</Text>
          </View>

          <NameFields
            firstName={firstName}
            lastName={lastName}
            preferredName={preferredName}
            onFirstNameChange={(value) => {
              setFirstName(value);
              setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            onLastNameChange={(value) => {
              setLastName(value);
              setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
            }}
            onPreferredNameChange={setPreferredName}
            firstNameError={fieldErrors.firstName}
            lastNameError={fieldErrors.lastName}
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
                      onPress={() => {
                        setRelationship(option);
                        setFieldErrors((prev) => ({ ...prev, relationship: undefined }));
                      }}
                      className={`px-3 py-2 rounded-full border ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
                    >
                      <Text className={active ? "text-primary-foreground text-xs font-semibold" : "text-foreground text-xs"}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {fieldErrors.relationship ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.relationship}</Text>
            ) : null}
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between" activeOpacity={0.85}>
              <Text className={dobDate ? "text-foreground" : "text-muted-foreground"}>{formatDateLabel(dobDate, "Select date of birth")}</Text>
              <Calendar size={18} className="text-muted-foreground" />
            </TouchableOpacity>
            {fieldErrors.dob ? (
              <Text className="mt-1 text-xs text-destructive">{fieldErrors.dob}</Text>
            ) : null}
          </View>

          <View className="mt-6 gap-3">
            <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-primary-foreground font-semibold">{isPrimaryFlow ? "Save Profile" : isEditing ? "Save Changes" : "Save Person"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBack} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <DatePickerModal
          visible={showDatePicker}
          value={dobDate}
          onConfirm={(date) => {
            setDobDate(date);
            setFieldErrors((prev) => ({ ...prev, dob: undefined }));
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
          title="Date of Birth"
        />
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
