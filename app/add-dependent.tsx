import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, User as UserIcon } from "lucide-react-native";
import DatePickerModal from "@/shared/ui/DatePickerModal";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import KeyboardDismiss from "@/shared/ui/KeyboardDismiss";
import NameFields from "@/shared/ui/NameFields";
import { getLocalOnlyMode } from "@/shared/utils/localStorage";
import { toIsoDateOnly, formatDateLabel } from "@/shared/utils/date";

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

const DEPENDENT_RELATIONSHIPS = [
  "Spouse",
  "Partner",
  "Child",
  "Mother",
  "Father",
  "Parent",
  "Grandparent",
  "Caregiver",
  "Other",
];

const formatDobLabel = (value?: Date | null) => formatDateLabel(value, "Select date of birth");

export default function AddDependentScreen() {
  const router = useRouter();
  const { primary, id } = useLocalSearchParams();
  const editId = Array.isArray(id) ? id[0] : id;
  const primaryValue = Array.isArray(primary) ? primary[0] : primary;
  const isPrimaryFlow = primaryValue === "true" || primaryValue === "1";
  const apolloClient = useApolloClient();
  const [createEntity, { loading: saving }] = useMutation(CREATE_ENTITY);
  const DEPENDENTS_STORAGE_KEY = "dependents_v1";
  const didPrefill = useRef(false);
  const isEditing = !!editId;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [relationship, setRelationship] = useState(
    isPrimaryFlow ? "Self" : "Child"
  );
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isPrimary = useMemo(
    () => (isPrimaryFlow ? true : relationship === "Self"),
    [isPrimaryFlow, relationship]
  );
  const screenTitle = isPrimaryFlow
    ? "Complete Your Profile"
    : isEditing
      ? "Edit Loved One"
      : "Add Loved One";
  const saveLabel = isPrimaryFlow ? "Save Profile" : isEditing ? "Save Changes" : "Save Loved One";

  const getRelationshipInput = () => {
    const normalized = relationship.trim().toLowerCase();
    if (isPrimaryFlow || normalized === "self") return { type: "PRIMARY" as const };
    if (normalized === "spouse") return { type: "SPOUSE" as const };
    if (normalized === "partner") return { type: "PARTNER" as const };
    if (normalized === "child") return { type: "CHILD" as const };
    if (normalized === "mother" || normalized === "father" || normalized === "parent") {
      return { type: "PARENT" as const };
    }
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
    Alert.alert(
      "Photo Upload Disabled",
      "Photo upload is temporarily disabled until dependencies are installed."
    );
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
          if (Number.isFinite(parsed.getTime())) {
            setDobDate(parsed);
          }
        }
        if (!avatarUri && avatar) setAvatarUri(avatar);
        didPrefill.current = true;
      } catch {
        // Prefill is optional; ignore failures.
      }
    };

    loadPrefill();
    return () => {
      cancelled = true;
    };
  }, [isPrimaryFlow, firstName, lastName, preferredName, dobDate, avatarUri]);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;

    const loadEdit = async () => {
      const raw = await SecureStore.getItemAsync(DEPENDENTS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(list) ? list.find((d: any) => d.id === editId) : null;
      if (!found || cancelled) return;

      setFirstName(found.firstName || "");
      setLastName(found.lastName || "");
      setPreferredName(found.preferredName || "");
      setRelationship(found.relationship || "Child");
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
    if (!relationship.trim()) {
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
      const raw = await SecureStore.getItemAsync(DEPENDENTS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const baseItem = {
        id: editId || `dep-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || "",
        relationship: isPrimaryFlow ? "Self" : relationship,
        dob: dobDate ? toIsoDateOnly(dobDate) : "",
        avatar: avatarUri || "",
        isPrimary,
        hasCompletedProfile: false,
        moduleNotes: {
          medical: "",
          vaccinations: "",
          insurance: "",
          documents: "",
          emergency: "",
          travel: "",
          education: "",
          academic: "",
          activities: "",
        },
        travel: { passports: [], loyaltyPrograms: [], notes: "", hideEmptyRows: false },
      };

      if (isEditing) {
        const next = Array.isArray(list)
          ? list.map((d: any) => (d.id === editId ? { ...d, ...baseItem } : d))
          : [baseItem];
        await SecureStore.setItemAsync(DEPENDENTS_STORAGE_KEY, JSON.stringify(next));
      } else {
        const localOnly = await getLocalOnlyMode();
        let createdId = baseItem.id;
        if (!localOnly) {
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
                dateOfBirth: baseItem.dob || null,
              },
            },
          });

          const created = res.data?.createEntity;
          createdId = created?.id || baseItem.id;
        }

        const next = [
          {
            ...baseItem,
            id: createdId,
            isPrimary: baseItem.isPrimary,
          },
          ...(Array.isArray(list) ? list : []),
        ];
        await SecureStore.setItemAsync(DEPENDENTS_STORAGE_KEY, JSON.stringify(next));
        baseItem.id = createdId;
      }

      router.replace(`/profile-saved?type=dependent&id=${editId || baseItem.id}`);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  return (
    <KeyboardDismiss>
      <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          disabled={saving}
        >
          <ArrowLeft size={22} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">{screenTitle}</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo (disabled until image picker is installed) */}
        <View className="items-center">
          <TouchableOpacity className="relative" activeOpacity={0.85} onPress={openPhotoActions}>
            <View className="w-28 h-28 rounded-full bg-muted overflow-hidden border-4 border-background">
              <View className="flex-1 items-center justify-center">
                <UserIcon className="text-muted-foreground" size={48} />
              </View>
            </View>
          </TouchableOpacity>

          <Text className="text-sm text-muted-foreground mt-3">
            Photo upload temporarily unavailable
          </Text>
        </View>

        {/* Name fields */}
        <NameFields
          firstName={firstName}
          lastName={lastName}
          preferredName={preferredName}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPreferredNameChange={setPreferredName}
        />

        {/* Relationship */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">
            Relationship
          </Text>
          {isPrimaryFlow ? (
            <View className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <Text className="text-muted-foreground text-base">Self</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {DEPENDENT_RELATIONSHIPS.map((r) => {
                const selected = relationship === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRelationship(r)}
                    className={`px-4 py-2 rounded-full border ${
                      selected
                        ? "bg-primary border-primary"
                        : "bg-card border-border"
                    }`}
                    activeOpacity={0.85}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {(relationship === "Self" || isPrimaryFlow) && (
            <View className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <View className="flex-row items-center gap-2">
                <UserIcon size={18} className="text-primary" />
                <Text className="text-sm text-primary leading-relaxed">
                  Selecting “Self” will mark this dependent as your Primary profile.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* DOB */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">
            Date of Birth *
          </Text>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between"
            activeOpacity={0.85}
          >
            <Text
              className={
                dobDate
                  ? "text-foreground text-base"
                  : "text-muted-foreground text-base"
              }
            >
              {formatDobLabel(dobDate)}
            </Text>
            <Calendar size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <DatePickerModal
            visible={showDatePicker}
            value={dobDate}
            title="Select date of birth"
            onConfirm={(selected) => {
              setDobDate(selected);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
          />
        </View>

        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Text className="text-sm text-primary leading-relaxed">
            You can add medical details, emergency contacts, documents, and more after creating the loved one.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-area-pb">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-primary rounded-xl py-4 items-center"
          activeOpacity={0.85}
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {saving ? "Saving..." : saveLabel}
          </Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </KeyboardDismiss>
  );
}
