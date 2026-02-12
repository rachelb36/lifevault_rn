import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/lib/records/getRecordMeta";
import {
  StoredRecord,
  deleteRecordForEntity,
  listRecordsForEntity,
  upsertRecordForEntity,
} from "@/features/records/data/storage";

type FieldType = "text" | "multiline";
type FieldDef = { key: string; label: string; placeholder?: string; type?: FieldType };

const FORM_DEFS: Partial<Record<RecordType, FieldDef[]>> = {
  PASSPORT: [
    { key: "firstName", label: "First name" },
    { key: "middleName", label: "Middle name" },
    { key: "lastName", label: "Last name" },
    { key: "passportNumber", label: "Passport number" },
    { key: "nationality", label: "Nationality" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "sex", label: "Sex" },
    { key: "placeOfBirth", label: "Place of birth" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "issuingCountry", label: "Issuing country" },
    { key: "issuingAuthority", label: "Issuing authority" },
    { key: "mrzRaw", label: "MRZ raw", type: "multiline" },
  ],
  PASSPORT_CARD: [
    { key: "fullName", label: "Full name" },
    { key: "passportCardNumber", label: "Passport card number" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)" },
    { key: "issuingCountry", label: "Issuing country" },
    { key: "mrzRaw", label: "MRZ raw", type: "multiline" },
  ],
  DRIVERS_LICENSE: [
    { key: "fullName", label: "Full name" },
    { key: "dlNumber", label: "License number" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)" },
    { key: "issuingRegion", label: "Issuing state/region" },
    { key: "licenseClass", label: "Class" },
    { key: "restrictions", label: "Restrictions (comma separated)" },
    { key: "addressLine1", label: "Address line 1" },
    { key: "addressLine2", label: "Address line 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "Postal code" },
    { key: "country", label: "Country" },
  ],
  BIRTH_CERTIFICATE: [
    { key: "childFullName", label: "Child full name" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)" },
    { key: "placeOfBirthCity", label: "Place of birth: city" },
    { key: "placeOfBirthCounty", label: "Place of birth: county" },
    { key: "placeOfBirthState", label: "Place of birth: state" },
    { key: "placeOfBirthCountry", label: "Place of birth: country" },
    { key: "certificateNumber", label: "Certificate number" },
    { key: "parent1Name", label: "Parent 1 name (optional)" },
    { key: "parent2Name", label: "Parent 2 name (optional)" },
  ],
  SOCIAL_SECURITY_CARD: [
    { key: "fullName", label: "Full name" },
    { key: "ssn", label: "SSN" },
  ],
  INSURANCE_POLICY: [
    { key: "insuranceType", label: "Insurance type" },
    { key: "insurerName", label: "Insurer name" },
    { key: "memberName", label: "Member name" },
    { key: "memberId", label: "Member ID" },
    { key: "groupNumber", label: "Group number" },
    { key: "planName", label: "Plan name" },
    { key: "rxBin", label: "RX BIN" },
    { key: "rxPcn", label: "RX PCN" },
    { key: "rxGroup", label: "RX Group" },
    { key: "customerServicePhone", label: "Customer service phone" },
    { key: "website", label: "Website" },
    { key: "effectiveDate", label: "Effective date (YYYY-MM-DD)" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  MEDICAL_PROFILE: [
    { key: "bloodType", label: "Blood type" },
    { key: "allergies", label: "Allergies (comma separated)" },
    { key: "conditions", label: "Conditions (comma separated)" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  SCHOOL_INFO: [
    { key: "schoolName", label: "School name" },
    { key: "mainOfficePhone", label: "Main office phone" },
    { key: "nurseContactId", label: "Nurse contactId (optional)" },
    { key: "counselorContactId", label: "Counselor contactId (optional)" },
    { key: "addressLine1", label: "Address line 1" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "Postal code" },
    { key: "country", label: "Country" },
    { key: "pickupList", label: "Authorized pickup (one per line: Name — Relationship — Phone)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  PET_PROFILE: [
    { key: "kind", label: "Kind (Dog, Cat, etc)" },
    { key: "breed", label: "Breed" },
    { key: "dobOrAdoptionDate", label: "DOB or adoption date (YYYY-MM-DD)" },
    { key: "microchipId", label: "Microchip ID" },
    { key: "emergencyInstructions", label: "Emergency instructions", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  TRAVEL_IDS: [
    { key: "travelIds", label: "Travel IDs (one per line: Type — Number — Expiration YYYY-MM-DD)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  LOYALTY_ACCOUNTS: [
    { key: "accounts", label: "Accounts (one per line: Program — Provider — Member #)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  OTHER_DOCUMENT: [
    { key: "title", label: "Title" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  LEGAL_PROPERTY_DOCUMENT: [
    { key: "documentType", label: "Document type" },
    { key: "title", label: "Title" },
    { key: "ownerEntityId", label: "Owner entity ID (optional)" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD, optional)" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
};

export default function EditPersonRecordScreen() {
  const router = useRouter();
  const { personId, recordId } = useLocalSearchParams<{ personId?: string; recordId?: string }>();

  const pid = personId ? String(personId) : "";
  const rid = recordId ? String(recordId) : "";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<any>({});
  const [jsonDraft, setJsonDraft] = useState("");

  const rtype = record?.recordType as RecordType | undefined;

  const meta = useMemo(() => {
    if (!rtype) return null;
    try {
      return getRecordMeta(rtype);
    } catch {
      return null;
    }
  }, [rtype]);

  const fields = rtype ? FORM_DEFS[rtype] : undefined;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!pid || !rid) return;

        const list = await listRecordsForEntity(pid);
        const found = list.find((r) => r.id === rid) ?? null;

        if (!found) {
          Alert.alert("Not found", "This record could not be loaded.");
          router.back();
          return;
        }

        if (!cancelled) {
          setRecord(found);
          setTitle(found.title ?? "");
          setData(found.data ?? {});
          setJsonDraft(JSON.stringify(found.data ?? {}, null, 2));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pid, rid, router]);

  const setField = (key: string, value: string) => {
    setData((prev: any) => {
      const next = { ...(prev ?? {}), [key]: value };
      setJsonDraft(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleSave = async () => {
    if (!record || !pid) return;

    let finalData = data;
    if (!fields) {
      try {
        finalData = JSON.parse(jsonDraft || "{}");
      } catch {
        Alert.alert("Invalid JSON", "Please fix the JSON and try again.");
        return;
      }
    }

    const next: StoredRecord = {
      ...record,
      title: (title || "").trim() || record.title || meta?.label || String(record.recordType),
      data: finalData,
      updatedAt: new Date().toISOString(),
    };

    await upsertRecordForEntity(pid, next);

    Alert.alert("Saved", "Record updated.");
    router.back();
  };

  const handleDelete = async () => {
    if (!record || !pid) return;

    Alert.alert("Delete record?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecordForEntity(pid, record.id);
          Alert.alert("Deleted", "Record removed.");
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Edit Record</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-semibold text-foreground">Edit Record</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={22} className="text-foreground" />
          </TouchableOpacity>

          <View className="ml-2 flex-1">
            <Text className="text-lg font-semibold text-foreground">Edit {meta?.label ?? "Record"}</Text>
            <Text className="text-xs text-muted-foreground">Type: {String(record.recordType)}</Text>
          </View>

          <TouchableOpacity onPress={handleDelete} className="w-10 h-10 items-center justify-center" hitSlop={10}>
            <Trash2 size={20} className="text-destructive" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}>
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Title</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Optional"
            placeholderTextColor="rgb(148 163 184)"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {fields ? (
          <View className="gap-4">
            {fields.map((f) => (
              <View key={f.key}>
                <Text className="text-sm font-medium text-foreground mb-2">{f.label}</Text>
                <TextInput
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder={f.placeholder ?? ""}
                  placeholderTextColor="rgb(148 163 184)"
                  value={String(data?.[f.key] ?? "")}
                  onChangeText={(t) => setField(f.key, t)}
                  multiline={f.type === "multiline"}
                  style={f.type === "multiline" ? { minHeight: 110, textAlignVertical: "top" as any } : undefined}
                />
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Data (JSON)</Text>
            <Text className="text-xs text-muted-foreground mb-2">No custom form yet. Edit the record JSON.</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
              value={jsonDraft}
              onChangeText={setJsonDraft}
              multiline
              style={{ minHeight: 220, textAlignVertical: "top" as any }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <View className="mt-8 gap-3">
          <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center" activeOpacity={0.85}>
            <Text className="text-primary-foreground font-semibold">Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="border border-border rounded-xl py-4 items-center" activeOpacity={0.85}>
            <Text className="text-foreground font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
