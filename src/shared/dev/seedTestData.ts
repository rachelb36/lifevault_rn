import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { RECORD_TYPES, type RecordType } from "@/domain/records/recordTypes";
import type { StoredRecord } from "@/features/records/data/storage";
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";

const DEPENDENTS_STORAGE_KEY = "dependents_v1";
const PETS_STORAGE_KEY = "pets_v1";
const CONTACTS_STORAGE_KEY = "contacts_v1";

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

function nowIso() {
  return new Date().toISOString();
}

export function maskLast4(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

type DependentLike = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  dob: string;
  avatar?: string;
  isPrimary?: boolean;
  hasCompletedProfile?: boolean;
};

type SeedContact = {
  id: string;
  firstName: string;
  lastName: string;
  organization?: string;
  phone: string;
  email?: string;
  categories: string[];
  linkedProfiles?: Array<{
    id: string;
    name: string;
    type: "person" | "pet";
    role?: string;
  }>;
  isFavorite: boolean;
};

function buildPeopleSeed(): DependentLike[] {
  return [
    {
      id: "person_primary",
      firstName: "Rachel",
      lastName: "Burgos",
      preferredName: "Rachel",
      relationship: "Self",
      dob: isoDateOnly(1982, 2, 14),
      isPrimary: true,
      hasCompletedProfile: true,
    },
    {
      id: "person_child_1",
      firstName: "Alex",
      lastName: "Burgos",
      preferredName: "Alex",
      relationship: "Child",
      dob: isoDateOnly(2006, 10, 5),
      hasCompletedProfile: true,
    },
  ];
}

function buildPetsSeed(): PetProfileV1[] {
  const now = nowIso();
  return [
    {
      schemaVersion: 1,
      id: "pet_1",
      petName: "Max",
      kind: "Dog",
      breed: "Labrador",
      dobOrAdoptionDate: isoDateOnly(2019, 3, 12),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function buildContactsSeed(): SeedContact[] {
  return [
    {
      id: "contact_pcp_1",
      firstName: "Nina",
      lastName: "Patel",
      organization: "Austin Family Health",
      phone: "512-555-1101",
      email: "n.patel@familyhealth.example",
      categories: ["Medical"],
      linkedProfiles: [{ id: "person_primary", name: "Rachel Burgos", type: "person", role: "Primary Care" }],
      isFavorite: true,
    },
    {
      id: "contact_school_1",
      firstName: "Jordan",
      lastName: "Lee",
      organization: "Westview High School",
      phone: "512-555-2202",
      email: "j.lee@westview.example",
      categories: ["School"],
      linkedProfiles: [{ id: "person_child_1", name: "Alex Burgos", type: "person", role: "Counselor" }],
      isFavorite: false,
    },
    {
      id: "contact_vet_1",
      firstName: "Maria",
      lastName: "Santos",
      organization: "Paws & Claws Veterinary",
      phone: "512-555-3303",
      email: "m.santos@paws.example",
      categories: ["Medical", "Service Provider"],
      linkedProfiles: [{ id: "pet_1", name: "Max", type: "pet", role: "Veterinarian" }],
      isFavorite: true,
    },
    {
      id: "contact_emergency_1",
      firstName: "Chris",
      lastName: "Burgos",
      phone: "512-555-4404",
      email: "chris.burgos@example.com",
      categories: ["Emergency", "Family"],
      linkedProfiles: [
        { id: "person_primary", name: "Rachel Burgos", type: "person", role: "Emergency Contact" },
        { id: "pet_1", name: "Max", type: "pet", role: "Emergency Contact" },
      ],
      isFavorite: true,
    },
  ];
}

function seededItem(
  id: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const now = nowIso();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

function makeRecord(entityId: string, recordType: RecordType, title: string, data: Record<string, unknown>, updatedAt?: string): StoredRecord {
  return {
    id: recId(),
    entityId,
    recordType,
    title,
    isPrivate: false,
    data,
    payload: data,
    attachments: [],
    createdAt: updatedAt ?? nowIso(),
    updatedAt: updatedAt ?? nowIso(),
  };
}

function buildRecordsForPrimary(primaryId: string): StoredRecord[] {
  return [
    makeRecord(
      primaryId,
      RECORD_TYPES.DRIVERS_LICENSE,
      "TX Driver's License",
      {
        fullName: "Rachel Burgos",
        dlNumber: "12345678",
        address: {
          line1: "123 Main St",
          line2: "",
          city: "Austin",
          state: "TX",
          postalCode: "78701",
          country: "USA",
        },
        licenseClass: "C",
        restrictions: [],
        issuingRegion: "TX",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        issueDate: isoDateOnly(2020, 3, 10),
        expirationDate: isoDateOnly(2028, 2, 14),
      },
      nowMinusDays(1)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PASSPORT,
      "U.S. Passport",
      {
        firstName: "Rachel",
        middleName: "Ann",
        lastName: "Burgos",
        passportNumber: "X12345678",
        nationality: "United States",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        sex: "F",
        placeOfBirth: "San Antonio, TX",
        issueDate: isoDateOnly(2020, 5, 1),
        expirationDate: isoDateOnly(2030, 4, 30),
        issuingCountry: "United States",
        issuingAuthority: "U.S. Department of State",
        mrzRaw: "P<USABURGOS<<RACHEL<ANN<<<<<<<<<<<<<<<<<<<",
      },
      nowMinusDays(2)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PASSPORT_CARD,
      "U.S. Passport Card",
      {
        fullName: "Rachel Ann Burgos",
        passportCardNumber: "C987654321",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        expirationDate: isoDateOnly(2030, 4, 30),
        issuingCountry: "United States",
        mrzRaw: "I<USA123456789<<<<<<<<<<<<<<<<<<<",
      },
      nowMinusDays(3)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.BIRTH_CERTIFICATE,
      "Birth Certificate",
      {
        childFullName: "Rachel Ann Burgos",
        dateOfBirth: isoDateOnly(1982, 2, 14),
        placeOfBirth: {
          city: "San Antonio",
          county: "Bexar",
          state: "TX",
          country: "United States",
        },
        certificateNumber: "BC-77889911",
        parents: {
          includeParents: true,
          parent1Name: "Maria Burgos",
          parent2Name: "Carlos Burgos",
        },
      },
      nowMinusDays(4)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.SOCIAL_SECURITY_CARD,
      "Social Security Card",
      {
        fullName: "Rachel Ann Burgos",
        ssn: "123-45-6789",
      },
      nowMinusDays(5)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.INSURANCE_POLICY,
      "Health Insurance",
      {
        insuranceType: "Health",
        insurerName: "Blue Cross",
        memberName: "Rachel Burgos",
        memberId: "MEM-001",
        groupNumber: "GRP-123",
        planName: "PPO Gold",
        rx: {
          bin: "610014",
          pcn: "BCBS",
          rxGroup: "RX100",
        },
        customerServicePhone: "800-555-1000",
        website: "https://example-insurance.com",
        effectiveDate: isoDateOnly(2024, 1, 1),
      },
      nowMinusDays(6)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.MEDICAL_PROFILE,
      "Medical Profile",
      {
        bloodType: "O+",
        allergies: [
          seededItem("allergy_1", { label: "Penicillin", severity: "High", isActive: true }),
          seededItem("allergy_2", { label: "Peanuts", severity: "Moderate", isActive: true }),
        ],
        conditions: [
          seededItem("condition_1", { label: "Asthma", severity: "Mild", isActive: true }),
        ],
      },
      nowMinusDays(7)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.MEDICAL_PROCEDURES,
      "Medical Procedures",
      {
        procedures: [
          seededItem("procedure_1", {
            procedureName: "Appendectomy",
            monthYear: "2018-07",
            reasonNotes: "Acute appendicitis",
            providerOrHospital: "St. David's Medical Center",
            complications: "None",
          }),
        ],
      },
      nowMinusDays(8)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PRESCRIPTIONS,
      "Prescriptions",
      {
        prescriptions: [
          seededItem("rx_1", {
            medicationName: "Albuterol Inhaler",
            dosage: "90 mcg",
            frequency: "As needed",
            indication: "Asthma",
            prescribingProviderContactId: "contact_pcp_1",
            pharmacyContactId: "contact_emergency_1",
            startDate: isoDateOnly(2023, 3, 1),
            endDate: null,
            discontinued: false,
            privacy: "STANDARD",
            isActive: true,
          }),
        ],
      },
      nowMinusDays(9)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.VACCINATIONS,
      "Vaccinations",
      {
        vaccinations: [
          seededItem("vacc_1", {
            vaccineName: "Influenza",
            doseNumber: "1",
            dateAdministered: isoDateOnly(2025, 10, 2),
            expirationDate: null,
            providerContactId: "contact_pcp_1",
          }),
          seededItem("vacc_2", {
            vaccineName: "COVID-19 Booster",
            doseNumber: "5",
            dateAdministered: isoDateOnly(2025, 9, 10),
            expirationDate: null,
            providerContactId: "contact_pcp_1",
          }),
        ],
      },
      nowMinusDays(10)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.VISION_PRESCRIPTION,
      "Vision Prescription",
      {
        rxDate: isoDateOnly(2025, 1, 22),
        doctorContactId: "contact_pcp_1",
      },
      nowMinusDays(11)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PRIVATE_HEALTH_PROFILE,
      "Private Health",
      {
        privacyEnforced: true,
        mentalHealthProviders: [
          seededItem("mhp_1", {
            contactId: "contact_pcp_1",
            specialty: "Therapy",
            isActive: true,
          }),
        ],
        mentalHealthMeds: [
          seededItem("mhm_1", {
            medicationName: "Sertraline",
            dosage: "25mg",
            frequency: "Daily",
            startDate: isoDateOnly(2024, 4, 1),
            endDate: null,
            isActive: true,
          }),
        ],
        stressors: [
          seededItem("stress_1", {
            title: "Workload",
            category: "Work",
            severity: "Moderate",
            isActive: true,
          }),
        ],
        copingStrategies: [
          seededItem("coping_1", {
            title: "Breathing Exercises",
            whenToUse: "When overwhelmed",
            helpfulContactId: "contact_emergency_1",
            isActive: true,
          }),
        ],
        advocacyNeeds: ["Quiet space"],
        triggers: ["Loud crowds"],
        avoids: ["Strobe lights"],
        sensorySensitivities: ["Loud noise"],
        sensorySeeking: ["Deep pressure"],
        sensorySupports: ["Noise-canceling headphones"],
        transitionSupports: ["10-minute reminders"],
        safetyRisks: ["Wandering"],
        crisisPlan: {
          warningSigns: ["Pacing", "Rapid breathing"],
          preferredActions: ["Take a walk", "Call support person"],
          emergencyContactIds: ["contact_emergency_1"],
          providerToContactFirstId: "contact_pcp_1",
        },
      },
      nowMinusDays(12)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.SCHOOL_INFO,
      "School Information",
      {
        schoolName: "Austin Community College",
        address: {
          line1: "6101 Highland Campus Dr",
          city: "Austin",
          state: "TX",
          postalCode: "78752",
          country: "United States",
        },
        mainOfficePhone: "512-555-7700",
        nurseContactId: "contact_pcp_1",
        counselorContactId: "contact_school_1",
      },
      nowMinusDays(13)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.AUTHORIZED_PICKUP,
      "Authorized Pickup",
      {
        authorizedPickup: [
          seededItem("pickup_1", {
            contactId: "contact_emergency_1",
            relationship: "Spouse",
            rules: ["Photo ID required", "Only weekdays"],
          }),
        ],
      },
      nowMinusDays(14)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.EDUCATION_RECORD,
      "Education Record",
      {
        title: "Transcript Request",
        schoolName: "Austin Community College",
        gradeOrLevel: "Undergraduate",
        year: "2025",
      },
      nowMinusDays(15)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PREFERENCES,
      "Preferences",
      {
        likes: ["Tea", "Morning runs"],
        dislikes: ["Heavy traffic"],
        hobbies: ["Photography", "Hiking"],
        favoriteSports: ["Tennis"],
        favoriteColors: ["Teal", "Navy"],
      },
      nowMinusDays(16)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.SIZES,
      "Sizes",
      {
        clothingSizes: [
          seededItem("size_c_1", { label: "M", brand: "Uniqlo" }),
        ],
        shoeSizes: [
          seededItem("size_s_1", { label: "8.5", brand: "Nike" }),
        ],
      },
      nowMinusDays(17)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.TRAVEL_IDS,
      "Travel IDs",
      {
        travelIds: [
          seededItem("travel_1", {
            type: "Known Traveler Number",
            number: "KTN1234567",
            expirationDate: isoDateOnly(2028, 2, 14),
            isActive: true,
          }),
        ],
      },
      nowMinusDays(18)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.LOYALTY_ACCOUNTS,
      "Loyalty Accounts",
      {
        accounts: [
          seededItem("loyalty_1", {
            programType: "Airline",
            providerName: "Delta",
            memberNumber: "DL-889900",
            isActive: true,
          }),
          seededItem("loyalty_2", {
            programType: "Hotel",
            providerName: "Marriott",
            memberNumber: "MR-123456",
            isActive: true,
          }),
        ],
      },
      nowMinusDays(19)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.LEGAL_PROPERTY_DOCUMENT,
      "Legal / Property",
      {
        documentType: "Will",
        title: "Last Will and Testament",
        ownerEntityId: primaryId,
        issueDate: isoDateOnly(2022, 9, 1),
        expirationDate: null,
      },
      nowMinusDays(20)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.OTHER_DOCUMENT,
      "Other Document",
      {
        title: "General Record",
      },
      nowMinusDays(21)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.PEOPLE_CARE_PROVIDERS,
      "Care Provider",
      {
        providerType: "Primary Care",
        contactId: "contact_pcp_1",
      },
      nowMinusDays(22)
    ),
  ];
}

function buildRecordsForPet(petId: string): StoredRecord[] {
  return [
    makeRecord(
      petId,
      RECORD_TYPES.PET_PROFILE,
      "Pet Profile",
      {
        kind: "Dog",
        breed: "Labrador",
        dobOrAdoptionDate: isoDateOnly(2019, 3, 12),
        microchipId: "MC-001122",
        emergencyInstructions: "Call vet immediately if lethargic for more than 24h.",
        notes: "",
      },
      nowMinusDays(1)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_SERVICE_DOCS,
      "Boarding Certificate",
      {
        label: "Boarding vaccination certificate",
      },
      nowMinusDays(3)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_VET_RECORDS,
      "Annual Vet Checkup",
      {
        label: "Annual wellness exam",
      },
      nowMinusDays(4)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_BASICS,
      "Pet Basics",
      {
        kind: "Dog",
        breed: "Labrador",
        dobOrAdoptionDate: isoDateOnly(2019, 3, 12),
        microchipId: "MC-001122",
        neutered: "Yes",
      },
      nowMinusDays(5)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_CARE_PROVIDERS,
      "Pet Care Provider",
      {
        providerType: "Veterinarian",
        contactId: "contact_vet_1",
      },
      nowMinusDays(6)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_VACCINATIONS,
      "Pet Vaccination",
      {
        vaccineName: "Rabies",
        dateAdministered: isoDateOnly(2025, 6, 1),
        doseNumber: "2",
        doseTotal: "3",
        providerContactId: "contact_vet_1",
      },
      nowMinusDays(7)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_FLEA_PREVENTION,
      "Flea Prevention",
      {
        productName: "NexGard",
        dateGiven: isoDateOnly(2026, 1, 15),
        nextDueDate: isoDateOnly(2026, 2, 15),
      },
      nowMinusDays(8)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_SURGERIES,
      "Pet Surgery",
      {
        procedureName: "Dental Cleaning",
        date: isoDateOnly(2024, 11, 20),
        clinicOrHospital: "Paws & Claws Veterinary",
        surgeonOrVetContactId: "contact_vet_1",
      },
      nowMinusDays(9)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_INSURANCE,
      "Pet Insurance",
      {
        providerName: "Trupanion",
        policyNumber: "TP-445566",
        memberId: "PET-MAX-1",
        customerServicePhone: "866-555-1212",
      },
      nowMinusDays(10)
    ),
    makeRecord(
      petId,
      RECORD_TYPES.PET_DOCUMENT,
      "Pet Document",
      {
        label: "Rabies Certificate",
        documentType: "Medical",
      },
      nowMinusDays(11)
    ),
  ];
}

export async function seedTestData() {
  const people = buildPeopleSeed();
  const pets = buildPetsSeed();
  const contacts = buildContactsSeed();

  await AsyncStorage.setItem(DEPENDENTS_STORAGE_KEY, JSON.stringify(people));
  await AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
  await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));

  const primaryId = people.find((p) => p.isPrimary)?.id ?? "person_primary";
  const petId = pets[0]?.id ?? "pet_1";

  await AsyncStorage.setItem(keyForEntity(primaryId), JSON.stringify(buildRecordsForPrimary(primaryId)));
  await AsyncStorage.setItem(keyForEntity(petId), JSON.stringify(buildRecordsForPet(petId)));

  await SecureStore.setItemAsync("primaryProfileCreated", "true");
}

export async function resetSeedData() {
  await AsyncStorage.removeItem(DEPENDENTS_STORAGE_KEY);
  await AsyncStorage.removeItem(PETS_STORAGE_KEY);
  await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);

  const ids = ["person_primary", "person_child_1", "pet_1"];
  await Promise.all(ids.map((id) => AsyncStorage.removeItem(keyForEntity(id))));

  await SecureStore.deleteItemAsync("primaryProfileCreated");
}
