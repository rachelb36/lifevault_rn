import { RecordType, RECORD_TYPES } from "./recordTypes";
import { RecordCategory, RECORD_CATEGORIES } from "./recordCategories";

export type RecordCardinality = "SINGLE" | "MULTI";

export type RecordTypeMeta = {
  type: RecordType;
  category: RecordCategory;
  label: string;
  iconKey: string;
  cardinality: RecordCardinality;
  sort: number;
  isPrivate?: boolean;
  premium?: boolean;
};

export const RECORD_TYPE_REGISTRY: RecordTypeMeta[] = [
  // PEOPLE: Identification
  {
    type: RECORD_TYPES.DRIVERS_LICENSE,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Driver's License",
    iconKey: "drivers-license",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.BIRTH_CERTIFICATE,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Birth Certificate",
    iconKey: "certificate",
    cardinality: "SINGLE",
    sort: 20,
  },
  {
    type: RECORD_TYPES.SOCIAL_SECURITY_CARD,
    category: RECORD_CATEGORIES.IDENTIFICATION,
    label: "Social Security Card",
    iconKey: "ssn",
    cardinality: "SINGLE",
    sort: 30,
  },

  // PEOPLE: Medical
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
    label: "Medical Procedures",
    iconKey: "stethoscope",
    cardinality: "MULTI",
    sort: 30,
  },
  {
    type: RECORD_TYPES.PRESCRIPTIONS,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Prescriptions",
    iconKey: "pill",
    cardinality: "MULTI",
    sort: 40,
  },
  {
    type: RECORD_TYPES.VACCINATIONS,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Vaccinations",
    iconKey: "syringe",
    cardinality: "MULTI",
    sort: 50,
  },
  {
    type: RECORD_TYPES.VISION_PRESCRIPTION,
    category: RECORD_CATEGORIES.MEDICAL,
    label: "Vision Prescription",
    iconKey: "eye",
    cardinality: "SINGLE",
    sort: 60,
  },
  // PEOPLE: Private health
  {
    type: RECORD_TYPES.PRIVATE_HEALTH_PROFILE,
    category: RECORD_CATEGORIES.PRIVATE_HEALTH,
    label: "Support Profile",
    iconKey: "lock",
    cardinality: "SINGLE",
    sort: 10,
    isPrivate: true,
  },

  // PEOPLE: School
  {
    type: RECORD_TYPES.SCHOOL_INFO,
    category: RECORD_CATEGORIES.SCHOOL,
    label: "School Info",
    iconKey: "school",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.AUTHORIZED_PICKUP,
    category: RECORD_CATEGORIES.SCHOOL,
    label: "Authorized Pickup",
    iconKey: "users",
    cardinality: "SINGLE",
    sort: 20,
  },
  {
    type: RECORD_TYPES.EDUCATION_RECORD,
    category: RECORD_CATEGORIES.SCHOOL,
    label: "Education Record",
    iconKey: "graduation-cap",
    cardinality: "MULTI",
    sort: 30,
  },

  // PEOPLE: Preferences + Sizes + Travel + Legal + Docs
  {
    type: RECORD_TYPES.PREFERENCES,
    category: RECORD_CATEGORIES.PREFERENCES,
    label: "Preferences",
    iconKey: "star",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.SIZES,
    category: RECORD_CATEGORIES.SIZES,
    label: "Sizes",
    iconKey: "ruler",
    cardinality: "SINGLE",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PASSPORT,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Passport",
    iconKey: "passport",
    cardinality: "MULTI",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PASSPORT_CARD,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Passport Card",
    iconKey: "id-card",
    cardinality: "MULTI",
    sort: 20,
  },
  {
    type: RECORD_TYPES.TRAVEL_IDS,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Travel IDs",
    iconKey: "airplane",
    cardinality: "MULTI",
    sort: 30,
  },
  {
    type: RECORD_TYPES.LOYALTY_ACCOUNTS,
    category: RECORD_CATEGORIES.TRAVEL,
    label: "Loyalty Accounts",
    iconKey: "barcode",
    cardinality: "MULTI",
    sort: 40,
  },
  {
    type: RECORD_TYPES.LEGAL_PROPERTY_DOCUMENT,
    category: RECORD_CATEGORIES.LEGAL,
    label: "Legal / Property",
    iconKey: "scale",
    cardinality: "MULTI",
    sort: 10,
  },
  {
    type: RECORD_TYPES.OTHER_DOCUMENT,
    category: RECORD_CATEGORIES.DOCUMENTS,
    label: "Other Document",
    iconKey: "folder",
    cardinality: "MULTI",
    sort: 10,
  },

  // PET: Basics
  {
    type: RECORD_TYPES.PET_BASICS,
    category: RECORD_CATEGORIES.PET_BASICS,
    label: "Pet Basics",
    iconKey: "paw",
    cardinality: "SINGLE",
    sort: 10,
  },

  // PET: Medical
  {
    type: RECORD_TYPES.PET_VACCINATIONS,
    category: RECORD_CATEGORIES.PET_MEDICAL,
    label: "Pet Vaccinations",
    iconKey: "syringe",
    cardinality: "MULTI",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PET_SURGERIES,
    category: RECORD_CATEGORIES.PET_MEDICAL,
    label: "Surgeries",
    iconKey: "stethoscope",
    cardinality: "MULTI",
    sort: 20,
  },
  {
    type: RECORD_TYPES.PET_INSURANCE,
    category: RECORD_CATEGORIES.PET_MEDICAL,
    label: "Pet Insurance",
    iconKey: "shield",
    cardinality: "SINGLE",
    sort: 30,
  },

  // PET: Care
  {
    type: RECORD_TYPES.PET_CARE_PROVIDERS,
    category: RECORD_CATEGORIES.PET_CARE,
    label: "Care Providers",
    iconKey: "users",
    cardinality: "MULTI",
    sort: 10,
  },
  {
    type: RECORD_TYPES.PET_FLEA_PREVENTION,
    category: RECORD_CATEGORIES.PET_CARE,
    label: "Flea Prevention",
    iconKey: "shield-check",
    cardinality: "MULTI",
    sort: 20,
  },

  // PET: Documents
  {
    type: RECORD_TYPES.PET_DOCUMENT,
    category: RECORD_CATEGORIES.PET_DOCUMENTS,
    label: "Pet Document",
    iconKey: "file",
    cardinality: "MULTI",
    sort: 10,
  },

  // Legacy kept in code but hidden from UI category order.
  {
    type: RECORD_TYPES.PET_PROFILE,
    category: RECORD_CATEGORIES.HIDDEN_LEGACY,
    label: "Pet Profile (Legacy)",
    iconKey: "archive",
    cardinality: "SINGLE",
    sort: 999,
  },
];

export const RECORD_META_BY_TYPE = Object.fromEntries(RECORD_TYPE_REGISTRY.map((m) => [m.type, m] as const)) as Record<RecordType, RecordTypeMeta>;

export const TYPES_BY_CATEGORY: Record<RecordCategory, RecordType[]> = RECORD_TYPE_REGISTRY.reduce(
  (acc, meta) => {
    (acc[meta.category] ??= []).push(meta.type);
    acc[meta.category].sort((a, b) => RECORD_META_BY_TYPE[a].sort - RECORD_META_BY_TYPE[b].sort);
    return acc;
  },
  {} as Record<RecordCategory, RecordType[]>
);
