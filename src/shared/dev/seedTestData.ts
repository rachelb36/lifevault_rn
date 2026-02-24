import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { RECORD_TYPES, type RecordType } from "@/domain/records/recordTypes";
import type { StoredRecord } from "@/features/records/data/storage";
import type { PersonProfileV1 } from "@/features/people/domain/person.schema";
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";
import { PEOPLE_KEY } from "@/features/people/data/peopleStorage";
import { PETS_KEY } from "@/features/pets/data/petsStorage";

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

type SeedContact = {
  id: string;
  firstName: string;
  lastName: string;
  organization?: string;
  phone: string;
  email?: string;
  categories: string[];
  linkedProfiles?: {
    id: string;
    name: string;
    type: "person" | "pet";
    role?: string;
  }[];
  isFavorite: boolean;
};

function buildPeopleSeed(): PersonProfileV1[] {
  const now = nowIso();
  return [
    {
      schemaVersion: 1,
      id: "person_primary",
      firstName: "Olivia",
      lastName: "Hart",
      preferredName: "Olivia",
      relationship: "Self",
      dob: isoDateOnly(1982, 2, 14),
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: "person_child_1",
      firstName: "Mason",
      lastName: "Hart",
      preferredName: "Mason",
      relationship: "Child",
      dob: isoDateOnly(2006, 10, 5),
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: "person_partner_1",
      firstName: "Elena",
      lastName: "Hart",
      preferredName: "Elena",
      relationship: "Partner",
      dob: isoDateOnly(1984, 6, 8),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function buildPetsSeed(): PetProfileV1[] {
  const now = nowIso();
  return [
    {
      schemaVersion: 1,
      id: "pet_1",
      petName: "Atlas",
      kind: "Dog",
      breed: "Labrador Retriever",
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: "pet_2",
      petName: "Nori",
      kind: "Cat",
      breed: "Maine Coon",
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: "pet_3",
      petName: "Pico",
      kind: "Bird",
      breed: "Cockatiel",
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
      linkedProfiles: [{ id: "person_primary", name: "Olivia Hart", type: "person", role: "Primary Care" }],
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
      linkedProfiles: [{ id: "person_child_1", name: "Mason Hart", type: "person", role: "Counselor" }],
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
      linkedProfiles: [
        { id: "pet_1", name: "Atlas", type: "pet", role: "Veterinarian" },
        { id: "pet_2", name: "Nori", type: "pet", role: "Veterinarian" },
        { id: "pet_3", name: "Pico", type: "pet", role: "Veterinarian" },
      ],
      isFavorite: true,
    },
    {
      id: "contact_emergency_1",
      firstName: "Elena",
      lastName: "Hart",
      phone: "512-555-4404",
      email: "chris.burgos@example.com",
      categories: ["Emergency", "Family"],
      linkedProfiles: [
        { id: "person_primary", name: "Olivia Hart", type: "person", role: "Emergency Contact" },
        { id: "person_partner_1", name: "Elena Hart", type: "person", role: "Emergency Contact" },
        { id: "pet_1", name: "Atlas", type: "pet", role: "Emergency Contact" },
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
        fullName: "Olivia Hart",
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
        firstName: "Olivia",
        middleName: "Ann",
        lastName: "Hart",
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
        fullName: "Olivia Ann Hart",
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
        childFullName: "Olivia Ann Hart",
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
          parent1Name: "Maria Hart",
          parent2Name: "Carlos Hart",
        },
      },
      nowMinusDays(4)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.SOCIAL_SECURITY_CARD,
      "Social Security Card",
      {
        fullName: "Olivia Ann Hart",
        ssn: "123-45-6789",
      },
      nowMinusDays(5)
    ),
    makeRecord(
      primaryId,
      RECORD_TYPES.MEDICAL_INSURANCE,
      "Health Insurance",
      {
        insuranceType: "Health",
        insurerName: "Blue Cross",
        memberName: "Olivia Hart",
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

function buildRecordsForChild(childId: string): StoredRecord[] {
  return [
    // IDENTIFICATION
    makeRecord(childId, RECORD_TYPES.DRIVERS_LICENSE, "TX Driver's License", {
      fullName: "Mason Hart",
      dlNumber: "87654321",
      address: {
        line1: "123 Main St",
        line2: "",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "United States",
      },
      licenseClass: "C",
      restrictions: ["Corrective lenses"],
      issuingRegion: "TX",
      dateOfBirth: isoDateOnly(2006, 10, 5),
      issueDate: isoDateOnly(2024, 10, 5),
      expirationDate: isoDateOnly(2030, 10, 5),
    }, nowMinusDays(1)),
    makeRecord(childId, RECORD_TYPES.BIRTH_CERTIFICATE, "Birth Certificate", {
      childFullName: "Mason Jordan Hart",
      dateOfBirth: isoDateOnly(2006, 10, 5),
      placeOfBirth: {
        city: "Austin",
        county: "Travis",
        state: "TX",
        country: "United States",
      },
      certificateNumber: "BC-55667788",
      parents: {
        includeParents: true,
        parent1Name: "Olivia Hart",
        parent2Name: "Elena Hart",
      },
    }, nowMinusDays(2)),
    makeRecord(childId, RECORD_TYPES.SOCIAL_SECURITY_CARD, "Social Security Card", {
      fullName: "Mason Jordan Hart",
      ssn: "987-65-4321",
    }, nowMinusDays(3)),

    // MEDICAL
    makeRecord(childId, RECORD_TYPES.MEDICAL_INSURANCE, "Health Insurance", {
      insuranceType: "Health",
      insurerName: "Blue Cross",
      memberName: "Mason Hart",
      memberId: "MEM-002",
      groupNumber: "GRP-123",
      planName: "PPO Gold",
      rx: { bin: "610014", pcn: "BCBS", rxGroup: "RX100" },
      customerServicePhone: "800-555-1000",
      website: "https://example-insurance.com",
      effectiveDate: isoDateOnly(2024, 1, 1),
    }, nowMinusDays(4)),
    makeRecord(childId, RECORD_TYPES.MEDICAL_PROFILE, "Medical Profile", {
      bloodType: "A+",
      allergies: [
        seededItem("child_allergy_1", { label: "Tree nuts", severity: "High", isActive: true }),
      ],
      conditions: [
        seededItem("child_cond_1", { label: "ADHD", severity: "Moderate", isActive: true }),
      ],
    }, nowMinusDays(5)),
    makeRecord(childId, RECORD_TYPES.MEDICAL_PROCEDURES, "Medical Procedures", {
      procedures: [
        seededItem("child_proc_1", {
          procedureName: "Wisdom teeth extraction",
          monthYear: "2025-06",
          reasonNotes: "All four impacted wisdom teeth",
          providerOrHospital: "Austin Oral Surgery",
          complications: "None",
        }),
      ],
    }, nowMinusDays(6)),
    makeRecord(childId, RECORD_TYPES.PRESCRIPTIONS, "Prescriptions", {
      prescriptions: [
        seededItem("child_rx_1", {
          medicationName: "Adderall XR",
          dosage: "20mg",
          frequency: "Daily, morning",
          indication: "ADHD",
          prescribingProviderContactId: "contact_pcp_1",
          pharmacyContactId: "",
          startDate: isoDateOnly(2022, 9, 1),
          endDate: null,
          discontinued: false,
          privacy: "PRIVATE",
          isActive: true,
        }),
      ],
    }, nowMinusDays(7)),
    makeRecord(childId, RECORD_TYPES.VACCINATIONS, "Vaccinations", {
      vaccinations: [
        seededItem("child_vacc_1", {
          vaccineName: "Tdap",
          doseNumber: "1",
          dateAdministered: isoDateOnly(2022, 8, 15),
          expirationDate: null,
          providerContactId: "contact_pcp_1",
        }),
        seededItem("child_vacc_2", {
          vaccineName: "HPV (Gardasil 9)",
          doseNumber: "3",
          dateAdministered: isoDateOnly(2021, 4, 10),
          expirationDate: null,
          providerContactId: "contact_pcp_1",
        }),
        seededItem("child_vacc_3", {
          vaccineName: "Meningococcal (MenACWY)",
          doseNumber: "2",
          dateAdministered: isoDateOnly(2023, 9, 5),
          expirationDate: null,
          providerContactId: "contact_pcp_1",
        }),
      ],
    }, nowMinusDays(8)),
    makeRecord(childId, RECORD_TYPES.VISION_PRESCRIPTION, "Vision Prescription", {
      rxDate: isoDateOnly(2025, 8, 10),
      doctorContactId: "contact_pcp_1",
    }, nowMinusDays(9)),

    // PRIVATE HEALTH
    makeRecord(childId, RECORD_TYPES.PRIVATE_HEALTH_PROFILE, "Support Profile", {
      advocacyNeeds: ["Extended test time", "Preferential seating"],
      stressors: ["Homework deadlines", "Social pressure"],
      triggers: ["Being rushed", "Unexpected schedule changes"],
      copingStrategies: ["Music with headphones", "Fidget tools", "Short breaks"],
      avoids: ["Public call-outs", "Removing headphones without warning"],
      sensorySensitivities: ["Fluorescent lighting"],
      sensorySeeking: ["Music", "Movement breaks"],
      sensorySupports: ["Noise-canceling headphones", "Fidget cube"],
      transitionSupports: ["5-minute warnings", "Written schedule"],
      safetyRisks: [],
    }, nowMinusDays(10)),

    // SCHOOL
    makeRecord(childId, RECORD_TYPES.SCHOOL_INFO, "School Information", {
      schoolName: "Westview High School",
      address: {
        line1: "4200 Westview Blvd",
        city: "Austin",
        state: "TX",
        postalCode: "78731",
        country: "United States",
      },
      mainOfficePhone: "512-555-2200",
      nurseContactId: "",
      counselorContactId: "contact_school_1",
      authorizedPickup: [
        seededItem("child_pickup_1", {
          contactId: "contact_emergency_1",
          relationship: "Father",
          rules: ["Photo ID required"],
        }),
      ],
    }, nowMinusDays(11)),
    makeRecord(childId, RECORD_TYPES.AUTHORIZED_PICKUP, "Authorized Pickup", {
      authorizedPickup: [
        seededItem("child_pickup_ap_1", {
          contactId: "contact_emergency_1",
          relationship: "Father",
          rules: ["Photo ID required"],
        }),
      ],
    }, nowMinusDays(12)),
    makeRecord(childId, RECORD_TYPES.EDUCATION_RECORD, "Education Record", {
      title: "High School Transcript",
      schoolName: "Westview High School",
      gradeOrLevel: "12th Grade",
      year: "2025",
    }, nowMinusDays(13)),

    // PREFERENCES & SIZES
    makeRecord(childId, RECORD_TYPES.PREFERENCES, "Preferences", {
      likes: ["Video games", "Anime", "Skateboarding"],
      dislikes: ["Early mornings", "Spicy food"],
      hobbies: ["Skateboarding", "Drawing", "Coding"],
      favoriteSports: ["Basketball", "Skateboarding"],
      favoriteColors: ["Black", "Purple"],
    }, nowMinusDays(14)),
    makeRecord(childId, RECORD_TYPES.SIZES, "Sizes", {
      clothingSizes: [
        seededItem("child_size_c_1", { label: "L", brand: "Nike" }),
        seededItem("child_size_c_2", { label: "M", brand: "H&M" }),
      ],
      shoeSizes: [
        seededItem("child_size_s_1", { label: "10.5", brand: "Vans" }),
      ],
    }, nowMinusDays(15)),

    // TRAVEL
    makeRecord(childId, RECORD_TYPES.PASSPORT, "U.S. Passport", {
      firstName: "Mason",
      middleName: "Jordan",
      lastName: "Hart",
      passportNumber: "Y98765432",
      nationality: "United States",
      dateOfBirth: isoDateOnly(2006, 10, 5),
      sex: "M",
      placeOfBirth: "Austin, TX",
      issueDate: isoDateOnly(2023, 6, 15),
      expirationDate: isoDateOnly(2028, 6, 14),
      issuingCountry: "United States",
      issuingAuthority: "U.S. Department of State",
      mrzRaw: "P<USABURGOS<<ALEX<JORDAN<<<<<<<<<<<<<<<<<<<",
    }, nowMinusDays(16)),

    // LEGAL / DOCUMENTS
    makeRecord(childId, RECORD_TYPES.OTHER_DOCUMENT, "School Records", {
      title: "IEP Documentation",
    }, nowMinusDays(17)),

    // CARE PROVIDERS
    makeRecord(childId, RECORD_TYPES.PEOPLE_CARE_PROVIDERS, "Pediatrician", {
      providerType: "Primary Care",
      contactId: "contact_pcp_1",
    }, nowMinusDays(18)),
  ];
}

function buildRecordsForPartner(personId: string): StoredRecord[] {
  return [
    makeRecord(personId, RECORD_TYPES.DRIVERS_LICENSE, "TX Driver's License", {
      fullName: "Elena Hart",
      dlNumber: "55443322",
      address: {
        line1: "123 Main St",
        line2: "Unit 4",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "United States",
      },
      licenseClass: "C",
      restrictions: [],
      issuingRegion: "TX",
      dateOfBirth: isoDateOnly(1984, 6, 8),
      issueDate: isoDateOnly(2022, 6, 1),
      expirationDate: isoDateOnly(2030, 6, 8),
    }, nowMinusDays(2)),
    makeRecord(personId, RECORD_TYPES.MEDICAL_INSURANCE, "Health Insurance", {
      insuranceType: "Health",
      insurerName: "Blue Cross",
      memberName: "Elena Hart",
      memberId: "MEM-003",
      groupNumber: "GRP-123",
      planName: "PPO Gold",
      rx: { bin: "610014", pcn: "BCBS", rxGroup: "RX100" },
      customerServicePhone: "800-555-1000",
      website: "https://example-insurance.com",
      effectiveDate: isoDateOnly(2024, 1, 1),
    }, nowMinusDays(3)),
    makeRecord(personId, RECORD_TYPES.PREFERENCES, "Preferences", {
      likes: ["Cycling", "BBQ"],
      dislikes: ["Cold weather"],
      hobbies: ["Cycling", "Woodworking"],
      favoriteSports: ["Soccer"],
      favoriteColors: ["Green"],
    }, nowMinusDays(4)),
    makeRecord(personId, RECORD_TYPES.OTHER_DOCUMENT, "Other Document", {
      title: "Home Inventory PDF",
    }, nowMinusDays(5)),
  ];
}

function buildWeightEntries(petId: string, baseWeight: number, unit: string, count: number): StoredRecord[] {
  const entries: StoredRecord[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const daysAgo = i * 14; // every ~2 weeks
    const variation = (Math.sin(i * 0.7) * 1.5) + (i * -0.1); // slight trend
    const weight = (baseWeight + variation).toFixed(1);
    const measuredDate = new Date();
    measuredDate.setDate(measuredDate.getDate() - daysAgo);
    const measuredAt = measuredDate.toISOString().split("T")[0];
    const ts = measuredDate.toISOString();
    entries.push(
      makeRecord(petId, RECORD_TYPES.PET_WEIGHT_ENTRY, `Weight: ${weight} ${unit}`, {
        weightValue: weight,
        weightUnit: unit,
        measuredAt,
      }, ts)
    );
  }
  return entries;
}

function buildRecordsForPet(petId: string, isDog: boolean): StoredRecord[] {
  const name = isDog ? "Atlas" : "Nori";
  const dob = isDog ? isoDateOnly(2019, 3, 12) : isoDateOnly(2021, 7, 20);
  const baseWeight = isDog ? 68 : 12;
  const unit = "lb";

  return [
    // PET_OVERVIEW (singleton)
    makeRecord(petId, RECORD_TYPES.PET_OVERVIEW, "Overview", {
      gender: isDog ? "Male" : "Female",
      dob,
      adoptionDate: isDog ? isoDateOnly(2019, 6, 1) : isoDateOnly(2021, 10, 15),
      notes: isDog
        ? "Atlas is a friendly lab who loves fetch and swimming."
        : "Nori is a gentle indoor cat who enjoys window watching.",
    }, nowMinusDays(1)),

    // PET_BASICS (singleton)
    makeRecord(petId, RECORD_TYPES.PET_BASICS, "Basics", {
      isNeutered: "Yes",
      microchipId: isDog ? "MC-001122" : "MC-334455",
      currentWeightValue: String(baseWeight),
      currentWeightUnit: unit,
      notes: isDog ? "Up to date on all checkups." : "Indoor only. Annual wellness visit in March.",
    }, nowMinusDays(2)),

    // PET_WEIGHT_ENTRY (repeatable — multiple for chart)
    ...buildWeightEntries(petId, baseWeight, unit, isDog ? 10 : 8),

    // PET_FEEDING_ROUTINE (singleton)
    makeRecord(petId, RECORD_TYPES.PET_FEEDING_ROUTINE, "Feeding Routine", isDog ? {
      foodBrand: "Purina Pro Plan",
      foodType: "Dry",
      portionAmount: "2",
      portionUnit: "Cups",
      feedingTimes: "7:00 AM, 5:30 PM",
      treatAllowed: "Yes",
      treatRulesNotes: "Atlas gets one dental chew after dinner. Training treats OK during walks.",
    } : {
      foodBrand: "Royal Canin",
      foodType: "Wet",
      portionAmount: "1",
      portionUnit: "Cups",
      feedingTimes: "7:30 AM, 6:00 PM",
      treatAllowed: "Only for training",
      treatRulesNotes: "Greenies dental treats only. No human food.",
    }, nowMinusDays(3)),

    // PET_BATHROOM_ROUTINE (singleton)
    makeRecord(petId, RECORD_TYPES.PET_BATHROOM_ROUTINE, "Bathroom Routine", isDog ? {
      pottyTimesPerDay: "4",
      leashHarnessNotes: "Uses front-clip harness (Easy Walk). Leash hangs by front door.",
      avoidTriggers: ["Bikes", "Skateboards"],
      avoidTriggersNotes: "Gets reactive on leash around fast-moving wheeled objects. Cross the street if possible.",
    } : {
      pottyTimesPerDay: "3",
      leashHarnessNotes: "Litter box in laundry room. Uses clumping clay litter.",
      avoidTriggers: [],
      avoidTriggersNotes: "Scoop daily. Full change weekly.",
    }, nowMinusDays(4)),

    // PET_SLEEP_ROUTINE (singleton)
    makeRecord(petId, RECORD_TYPES.PET_SLEEP_ROUTINE, "Sleep Routine", isDog ? {
      sleepLocation: "Dog bed",
      crateRule: "Door open",
      bedtimeRoutine: "Last potty at 9:30 PM. Settles on his bed in the bedroom. Likes a blanket over his back.",
    } : {
      sleepLocation: "Other",
      crateRule: "No crate",
      bedtimeRoutine: "Sleeps wherever she wants — usually the cat tree or foot of the bed.",
    }, nowMinusDays(5)),

    // PET_BEHAVIOR_PROFILE (singleton)
    makeRecord(petId, RECORD_TYPES.PET_BEHAVIOR_PROFILE, "Behavior Profile", isDog ? {
      fears: ["Thunder", "Fireworks", "Vacuum"],
      separationAnxietyLevel: "Mild – Whines or paces briefly",
      separationAnxietyNotes: "Whines for ~5 min after owner leaves, then settles. Leave Kong with peanut butter.",
    } : {
      fears: ["Vacuum", "Strangers entering home"],
      separationAnxietyLevel: "None – Completely calm",
      separationAnxietyNotes: "Independent. Hides under bed when strangers visit but comes out after 10 min.",
    }, nowMinusDays(6)),

    // PET_MEDICATIONS (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_MEDICATIONS, isDog ? "Heartgard Plus" : "Revolution Plus", isDog ? {
      medicationName: "Heartgard Plus",
      dosage: "1 chewable",
      adminMethod: "With food",
      scheduleNotes: "1st of every month",
      missedDoseNotes: "Give as soon as remembered. Do not double.",
      sideEffectsNotes: "Rare: vomiting, diarrhea.",
    } : {
      medicationName: "Revolution Plus",
      dosage: "1 topical dose",
      adminMethod: "Topical",
      scheduleNotes: "1st of every month, between shoulder blades",
      missedDoseNotes: "Apply as soon as remembered.",
      sideEffectsNotes: "Temporary hair loss at application site.",
    }, nowMinusDays(7)),

    // PET_VACCINATIONS (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_VACCINATIONS, "Rabies", {
      vaccineName: "Rabies",
      dateAdministered: isoDateOnly(2025, 6, 1),
      doseNumber: isDog ? "3" : "2",
      doseTotal: "3",
      providerContactId: "contact_vet_1",
    }, nowMinusDays(8)),
    makeRecord(petId, RECORD_TYPES.PET_VACCINATIONS, isDog ? "DHPP" : "FVRCP", {
      vaccineName: isDog ? "DHPP" : "FVRCP",
      dateAdministered: isoDateOnly(2025, 6, 1),
      doseNumber: isDog ? "4" : "3",
      doseTotal: isDog ? "4" : "3",
      providerContactId: "contact_vet_1",
    }, nowMinusDays(9)),

    // PET_SURGERIES (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_SURGERIES, isDog ? "Dental Cleaning" : "Spay", {
      procedureName: isDog ? "Dental Cleaning" : "Spay",
      date: isDog ? isoDateOnly(2024, 11, 20) : isoDateOnly(2022, 1, 10),
      clinicOrHospital: "Paws & Claws Veterinary",
      surgeonOrVetContactId: "contact_vet_1",
    }, nowMinusDays(10)),

    // PET_DIAGNOSES (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_DIAGNOSES, isDog ? "Hip Dysplasia (mild)" : "Hairball issues", {
      diagnosisName: isDog ? "Hip Dysplasia (mild)" : "Chronic hairball issues",
      date: isDog ? isoDateOnly(2023, 9, 5) : isoDateOnly(2024, 3, 1),
      notes: isDog
        ? "Mild bilateral. Vet recommends joint supplement and controlled exercise."
        : "Recommended daily hairball remedy paste and regular brushing.",
    }, nowMinusDays(11)),

    // PET_INSURANCE (singleton)
    makeRecord(petId, RECORD_TYPES.PET_INSURANCE, "Pet Insurance", {
      providerName: isDog ? "Trupanion" : "Lemonade Pet",
      policyNumber: isDog ? "TP-445566" : "LP-778899",
      memberId: isDog ? "PET-MAX-1" : "PET-LUNA-1",
      customerServicePhone: isDog ? "866-555-1212" : "844-555-3434",
    }, nowMinusDays(12)),

    // PET_FLEA_PREVENTION (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_FLEA_PREVENTION, "Flea Prevention", {
      productName: isDog ? "NexGard" : "Revolution Plus",
      dateGiven: isoDateOnly(2026, 2, 1),
      nextDueDate: isoDateOnly(2026, 3, 1),
    }, nowMinusDays(13)),

    // PET_CARE_PROVIDERS (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_CARE_PROVIDERS, "Primary Vet", {
      providerType: "Primary Vet",
      contactId: "contact_vet_1",
    }, nowMinusDays(14)),

    // PET_DOCUMENT (repeatable)
    makeRecord(petId, RECORD_TYPES.PET_DOCUMENT, "Vaccination Record", {
      label: "Annual vaccination certificate",
      documentType: "Vaccination Record",
    }, nowMinusDays(15)),
    makeRecord(petId, RECORD_TYPES.PET_DOCUMENT, "Rabies Certificate", {
      label: `${name} rabies certificate 2025`,
      documentType: "Rabies Certificate",
    }, nowMinusDays(16)),
    ...(isDog ? [makeRecord(petId, RECORD_TYPES.PET_DOCUMENT, "Adoption Papers", {
      label: "Atlas adoption agreement – Austin Pets Alive",
      documentType: "Adoption Papers",
    }, nowMinusDays(17))] : []),
  ];
}

export async function seedTestData() {
  const people = buildPeopleSeed();
  const pets = buildPetsSeed();
  const contacts = buildContactsSeed();

  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
  await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));

  const primaryId = people.find((p) => p.isPrimary)?.id ?? "person_primary";

  await AsyncStorage.setItem(keyForEntity(primaryId), JSON.stringify(buildRecordsForPrimary(primaryId)));

  // Seed records for child
  const childId = people.find((p) => !p.isPrimary)?.id ?? "person_child_1";
  await AsyncStorage.setItem(keyForEntity(childId), JSON.stringify(buildRecordsForChild(childId)));

  // Seed records for third person
  const partnerId = people.find((p) => p.id === "person_partner_1")?.id ?? "person_partner_1";
  await AsyncStorage.setItem(keyForEntity(partnerId), JSON.stringify(buildRecordsForPartner(partnerId)));

  // Seed records for each pet
  for (const pet of pets) {
    const isDog = pet.kind === "Dog";
    await AsyncStorage.setItem(keyForEntity(pet.id), JSON.stringify(buildRecordsForPet(pet.id, isDog)));
  }

  await SecureStore.setItemAsync("primaryProfileCreated", "true");
  await SecureStore.setItemAsync("hasOnboarded", "true");
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Copies seeded record payloads into current canonical record keys
 * (records_v1:<entityId>) using the profiles that already exist in storage.
 *
 * This does not overwrite people/pets/contact lists; it only rewrites records.
 */
export async function copySeededRecordsToCurrentStorage() {
  const [peopleRaw, petsRaw] = await Promise.all([
    AsyncStorage.getItem(PEOPLE_KEY),
    AsyncStorage.getItem(PETS_KEY),
  ]);

  const people = safeParseArray<PersonProfileV1>(peopleRaw);
  const pets = safeParseArray<PetProfileV1>(petsRaw);

  if (people.length === 0 && pets.length === 0) {
    return;
  }

  const primary = people.find(
    (p) => p.isPrimary || p.relationship?.toLowerCase() === "self",
  );

  const remainingPeople = people.filter((p) => p.id !== primary?.id);
  const child = remainingPeople[0];
  const partner = remainingPeople[1];

  if (primary?.id) {
    await AsyncStorage.setItem(
      keyForEntity(primary.id),
      JSON.stringify(buildRecordsForPrimary(primary.id)),
    );
  }

  if (child?.id) {
    await AsyncStorage.setItem(
      keyForEntity(child.id),
      JSON.stringify(buildRecordsForChild(child.id)),
    );
  }

  if (partner?.id) {
    await AsyncStorage.setItem(
      keyForEntity(partner.id),
      JSON.stringify(buildRecordsForPartner(partner.id)),
    );
  }

  for (const pet of pets) {
    await AsyncStorage.setItem(
      keyForEntity(pet.id),
      JSON.stringify(buildRecordsForPet(pet.id, pet.kind === "Dog")),
    );
  }

  await SecureStore.setItemAsync("primaryProfileCreated", "true");
  await SecureStore.setItemAsync("hasOnboarded", "true");
}

export async function resetSeedData() {
  await AsyncStorage.removeItem(PEOPLE_KEY);
  await AsyncStorage.removeItem(PETS_KEY);
  await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);

  const ids = ["person_primary", "person_child_1", "person_partner_1", "pet_1", "pet_2", "pet_3"];
  await Promise.all(ids.map((id) => AsyncStorage.removeItem(keyForEntity(id))));

  await SecureStore.deleteItemAsync("primaryProfileCreated");
  await SecureStore.deleteItemAsync("hasOnboarded");
}
