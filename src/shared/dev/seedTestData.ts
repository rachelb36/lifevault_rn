import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { RECORD_TYPES, type RecordType } from "@/domain/records/recordTypes";
import type { StoredRecord } from "@/features/records/data/storage";

// ----------------------
// Helpers
// ----------------------
const keyForEntity = (entityId: string) => `records_v1:${entityId}`;

function recId() {
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isoDateOnly(yyyy: number, mm: number, dd: number) {
  const m = String(mm).padStart(2, "0");
  const d = String(dd).padStart(2, "0");
  return `${yyyy}-${m}-${d}`;
}

function nowMinusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// Masks for “collapsed preview” use later (optional)
export function maskLast4(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

// ----------------------
// Seed People (SecureStore)
// ----------------------
const DEPENDENTS_STORAGE_KEY = "dependents_v1";

type DependentLike = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  dob: string; // YYYY-MM-DD
  avatar?: string; // optional
  isPrimary?: boolean;
  hasCompletedProfile?: boolean;
};

function buildPeopleSeed(): DependentLike[] {
  // Use stable IDs so records can reference them
  const primaryId = "person_primary";
  const childId = "person_child_1";
  const parentId = "person_parent_1";

  return [
    {
      id: primaryId,
      firstName: "Rachel",
      lastName: "Burgos",
      preferredName: "Rachel",
      relationship: "Self",
      dob: isoDateOnly(1982, 2, 14),
      isPrimary: true,
      hasCompletedProfile: true,
    },
    {
      id: childId,
      firstName: "Alex",
      lastName: "Burgos",
      preferredName: "Alex",
      relationship: "Child",
      dob: isoDateOnly(2006, 10, 5),
      hasCompletedProfile: true,
    },
    {
      id: parentId,
      firstName: "Lola",
      lastName: "Burgos",
      preferredName: "Lola",
      relationship: "Mother",
      dob: isoDateOnly(1958, 6, 2),
      hasCompletedProfile: true,
    },
  ];
}

// ----------------------
// Seed Records (AsyncStorage)
// ----------------------
function makeRecord(recordType: RecordType, title: string, data: Record<string, unknown>, updatedAt?: string): StoredRecord {
  return {
    id: recId(),
    recordType,
    title,
    data,
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

function buildRecordsForPrimary(primaryId: string): StoredRecord[] {
  return [
    makeRecord(
      RECORD_TYPES.DRIVERS_LICENSE,
      "TX Driver’s License",
      {
        firstName: "Rachel",
        lastName: "Burgos",
        dlNumber: "12345678",
        issuingRegion: "TX",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        issueDate: isoDateOnly(2020, 3, 10),
        expirationDate: isoDateOnly(2028, 2, 14),
        addressLine1: "123 Mockingbird Ln",
        city: "Houston",
        state: "TX",
        postalCode: "77002",
        country: "USA",
      },
      nowMinusDays(1)
    ),

    makeRecord(
      RECORD_TYPES.INSURANCE_POLICY,
      "Health Insurance",
      {
        insuranceType: "Medical",
        insurerName: "Blue Cross Blue Shield",
        memberName: "Rachel Burgos",
        memberId: "XKJ-9921-AB",
        groupNumber: "GRP-2218",
        planName: "PPO",
        rxBin: "004336",
        rxPcn: "ADV",
        rxGroup: "RX77",
        customerServicePhone: "(800) 555-0199",
        website: "bcbs.example.com",
        effectiveDate: isoDateOnly(2024, 1, 1),
        notes: "Call customer service for replacement card.",
      },
      nowMinusDays(3)
    ),

    makeRecord(
      RECORD_TYPES.TRAVEL_IDS,
      "Travel IDs",
      {
        travelIds:
          "Known Traveler Number (KTN): 123456789\nGlobal Entry: 987654321\nTSA PreCheck: Included with Global Entry",
        notes: "Keep this handy for flight bookings.",
      },
      nowMinusDays(7)
    ),

    // MULTI example: Passport
    makeRecord(
      RECORD_TYPES.PASSPORT,
      "Passport: US",
      {
        firstName: "Rachel",
        lastName: "Burgos",
        passportNumber: "123456789",
        nationality: "USA",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        issueDate: isoDateOnly(2019, 7, 10),
        expirationDate: isoDateOnly(2029, 7, 9),
        issuingCountry: "USA",
        issuingAuthority: "US Dept of State",
        mrzRaw: "P<USABURGOS<<RACHEL<<<<<<<<<<<<<<<<<<\n1234567890USA8202149F2907096<<<<<<<<<<<<<<04",
      },
      nowMinusDays(14)
    ),
  ];
}

function buildRecordsForChild(childId: string): StoredRecord[] {
  return [
    makeRecord(
      RECORD_TYPES.SCHOOL_INFO,
      "School Info",
      {
        schoolName: "St. Example Academy",
        grade: "11",
        counselor: "Ms. Smith",
        mainOfficePhone: "(713) 555-0123",
        notes: "Pickup requires ID.",
      },
      nowMinusDays(2)
    ),
    makeRecord(
      RECORD_TYPES.VACCINATIONS,
      "Vaccinations",
      {
        notes: "Up to date.",
      },
      nowMinusDays(20)
    ),
  ];
}

function buildRecordsForParent(parentId: string): StoredRecord[] {
  return [
    makeRecord(
      RECORD_TYPES.MEDICAL_PROFILE,
      "Medical Profile",
      {
        allergies: "Penicillin",
        conditions: "Hypertension",
        notes: "Prefers morning appointments.",
      },
      nowMinusDays(5)
    ),
  ];
}

// ----------------------
// Public API
// ----------------------
export async function seedTestData() {
  // 1) People list into SecureStore
  const people = buildPeopleSeed();
  await SecureStore.setItemAsync(DEPENDENTS_STORAGE_KEY, JSON.stringify(people));

  const primaryId = people.find(p => p.isPrimary)?.id ?? "person_primary";
  const childId = people.find(p => p.relationship === "Child")?.id ?? "person_child_1";
  const parentId = people.find(p => p.relationship === "Mother")?.id ?? "person_parent_1";

  // 2) Records per person into AsyncStorage
  await AsyncStorage.setItem(keyForEntity(primaryId), JSON.stringify(buildRecordsForPrimary(primaryId)));
  await AsyncStorage.setItem(keyForEntity(childId), JSON.stringify(buildRecordsForChild(childId)));
  await AsyncStorage.setItem(keyForEntity(parentId), JSON.stringify(buildRecordsForParent(parentId)));

  // Optional flags so onboarding doesn’t block you
  await SecureStore.setItemAsync("primaryProfileCreated", "true");
}

export async function resetSeedData() {
  // Clear dependents list
  await SecureStore.deleteItemAsync(DEPENDENTS_STORAGE_KEY);

  // Clear records for our known seed IDs
  const ids = ["person_primary", "person_child_1", "person_parent_1"];
  await Promise.all(ids.map((id) => AsyncStorage.removeItem(keyForEntity(id))));

  // Clear onboarding flags if you want a “fresh install” feeling
  await SecureStore.deleteItemAsync("primaryProfileCreated");
  await SecureStore.deleteItemAsync("userFirstName");
  await SecureStore.deleteItemAsync("userLastName");
  await SecureStore.deleteItemAsync("userPreferredName");
  await SecureStore.deleteItemAsync("userDob");
  await SecureStore.deleteItemAsync("userPhotoUri");
}