import { RecordType, RECORD_TYPES } from "./recordTypes";
import { RecordCategory, RECORD_CATEGORIES } from "./recordCategories";

export type RecordCardinality = "SINGLE" | "MULTI";

export type RecordTypeMeta = {
  type: RecordType;
  category: RecordCategory;
  label: string;
  iconKey: string;        // UI decides actual icon component
  cardinality: RecordCardinality;
  sort: number;           // within category
  isPrivate?: boolean;    // helpful for PRIVATE_HEALTH_PROFILE
  premium?: boolean;      // optional if you want paywall flags later
};

export const RECORD_TYPE_REGISTRY: RecordTypeMeta[] = [
  // IDENTIFICATION
  {
    type: RECORD_TYPES.PASSPORT,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Passport",
    iconKey: "passport",
    cardinality: "MULTI",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PASSPORT_CARD,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Passport Card",
    iconKey: "id-card",
    cardinality: "MULTI",
    sort: 20,
  },
  {
    type: RECORD_TYPES.DRIVERS_LICENSE,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Driver’s License",
    iconKey: "drivers-license",
    cardinality: "SINGLE",
    sort: 30,
  },
  {
    type: RECORD_TYPES.BIRTH_CERTIFICATE,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Birth Certificate",
    iconKey: "certificate",
    cardinality: "SINGLE",
    sort: 40,
  },
  {
    type: RECORD_TYPES.SOCIAL_SECURITY_CARD,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Social Security",
    iconKey: "ssn",
    cardinality: "SINGLE",
    sort: 50,
  },

  // MEDICAL
  {
    type: RECORD_TYPES.INSURANCE_POLICY,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Insurance Policy",
    iconKey: "shield",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.MEDICAL_PROFILE,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Medical Profile",
    iconKey: "heart",
    cardinality: "SINGLE",
    sort: 20,
  },
  {
    type: RECORD_TYPES.MEDICAL_PROCEDURES,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Procedures",
    iconKey: "stethoscope",
    cardinality: "SINGLE", // you store multiple procedures inside the one record
    sort: 30,
  },
  {
    type: RECORD_TYPES.PRESCRIPTIONS,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Prescriptions",
    iconKey: "pill",
    cardinality: "SINGLE", // you store many prescriptions inside
    sort: 40,
  },
  {
    type: RECORD_TYPES.VACCINATIONS,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Vaccinations",
    iconKey: "syringe",
    cardinality: "SINGLE", // many doses inside
    sort: 50,
  },
  {
    type: RECORD_TYPES.VISION_PRESCRIPTION,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Vision Rx",
    iconKey: "eye",
    cardinality: "SINGLE",
    sort: 60,
  },

  // PRIVATE HEALTH
  {
    type: RECORD_TYPES.PRIVATE_HEALTH_PROFILE,
    category: RECORD_CATEGORIES.PRIVATE_HEALTH,
    label: "Private Health",
    iconKey: "lock",
    cardinality: "SINGLE",
    sort: 10,
    isPrivate: true,
  },

  // SCHOOL (IF DEPENDENT IS 18 OR UNDER)
  {
    type: RECORD_TYPES.SCHOOL_INFO,
    category: RECORD_CATEGORIES.SCHOOL_INFO,
    label: "School Info",
    iconKey: "school",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.AUTHORIZED_PICKUP,
    category: RECORD_CATEGORIES.SCHOOL_INFO,
    label: "Authorized Pickup",
    iconKey: "users",
    cardinality: "SINGLE", // list of pickup people inside
    sort: 20,
  },

  // EDUCATION
  {
    type: RECORD_TYPES.EDUCATION_RECORD,
    category: RECORD_CATEGORIES.EDUCATION,
    label: "Education Record",
    iconKey: "graduation-cap",
    cardinality: "MULTI",
    sort: 10,
  },

  // PETS
  {
    type: RECORD_TYPES.PET_PROFILE,
    category: RECORD_CATEGORIES.PETS,
    label: "Pet Profile",
    iconKey: "paw",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PET_VET_RECORDS,
    category: RECORD_CATEGORIES.PETS,
    label: "Vet Records",
    iconKey: "clipboard",
    cardinality: "MULTI", // these are document-like records (repeatable)
    sort: 20,
  },
  {
    type: RECORD_TYPES.PET_SERVICE_DOCS,
    category: RECORD_CATEGORIES.PETS,
    label: "Service Docs",
    iconKey: "file",
    cardinality: "MULTI", // repeatable
    sort: 30,
  },

  // PREFERENCES
  {
    type: RECORD_TYPES.PREFERENCES,
    category: RECORD_CATEGORIES.PREFERENCES,
    label: "Favorites",
    iconKey: "star",
    cardinality: "SINGLE",
    sort: 10,
  },

  // SIZES
  {
    type: RECORD_TYPES.SIZES,
    category: RECORD_CATEGORIES.SIZES,
    label: "Sizes",
    iconKey: "ruler",
    cardinality: "SINGLE", // lists inside
    sort: 10,
  },

  // TRAVEL
  {
    type: RECORD_TYPES.TRAVEL_IDS,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Travel IDs",
    iconKey: "airplane",
    cardinality: "SINGLE", // many IDs inside (KTN, Global Entry, etc.)
    sort: 10,
  },

  // LOYALTY
  {
    type: RECORD_TYPES.LOYALTY_ACCOUNTS,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Loyalty Accounts",
    iconKey: "barcode",
    cardinality: "SINGLE", // many accounts inside
    sort: 10,
  },

  // LEGAL / PROPERTY
  {
    type: RECORD_TYPES.LEGAL_PROPERTY_DOCUMENT,
    category: RECORD_CATEGORIES.LEGAL_PROPERTY,
    label: "Legal / Property",
    iconKey: "scale",
    cardinality: "MULTI",
    sort: 10,
  },

  // DOCUMENTS
  {
    type: RECORD_TYPES.OTHER_DOCUMENT,
    category: RECORD_CATEGORIES.DOCUMENTS,
    label: "Other Document",
    iconKey: "folder",
    cardinality: "MULTI",
    sort: 10,
  },
];

// Fast lookups
export const RECORD_META_BY_TYPE: Record<RecordType, RecordTypeMeta> =
  Object.fromEntries(RECORD_TYPE_REGISTRY.map((m) => [m.type, m])) as any;

export const TYPES_BY_CATEGORY: Record<RecordCategory, RecordType[]> =
  RECORD_TYPE_REGISTRY.reduce((acc, meta) => {
    (acc[meta.category] ??= []).push(meta.type);
    acc[meta.category].sort((a, b) => {
      const ma = RECORD_META_BY_TYPE[a].sort;
      const mb = RECORD_META_BY_TYPE[b].sort;
      return ma - mb;
    });
    return acc;
  }, {} as Record<RecordCategory, RecordType[]>);
