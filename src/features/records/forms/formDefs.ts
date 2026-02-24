import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import {
  ADVOCACY_NEED_OPTIONS,
  AVOID_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  COPING_STRATEGY_OPTIONS,
  GENERAL_SIZE_OPTIONS,
  PEOPLE_CARE_PROVIDER_TYPE_OPTIONS,
  PRIVACY_LEVEL_OPTIONS,
  SEVERITY_OPTIONS,
  SHOE_CATEGORY_OPTIONS,
  SHOE_SYSTEM_OPTIONS,
  SHOE_WIDTH_OPTIONS,
  TRAVEL_ID_OPTIONS,
  TRAVEL_LOYALTY_TYPE_OPTIONS,
  SAFETY_RISK_OPTIONS,
  SENSORY_SEEKING_OPTIONS,
  SENSORY_SENSITIVITY_OPTIONS,
  SENSORY_SUPPORT_OPTIONS,
  STRESSOR_OPTIONS,
  TRANSITION_SUPPORT_OPTIONS,
  TRIGGER_OPTIONS,
  VACCINE_DOSE_OPTIONS,
  HUMAN_VACCINATION_OPTIONS,
  PERSON_SIZING_REFERENCE_OPTIONS,
  PERSON_MEASUREMENT_UNIT_OPTIONS,
  LEGAL_DOCUMENT_TYPE_OPTIONS,
  OTHER_DOCUMENT_CATEGORY_OPTIONS,
} from "@/features/people/constants/options";
import {
  PET_AGGRESSION_TRIGGER_OPTIONS,
  PET_AVOID_TRIGGER_OPTIONS,
  PET_CRATE_RULE_OPTIONS,
  PET_DOCUMENT_TYPE_OPTIONS,
  PET_ESCAPE_TENDENCY_OPTIONS,
  PET_FEAR_OPTIONS,
  PET_FOOD_TYPE_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_MED_ADMIN_METHOD_OPTIONS,
  PET_MISSED_DOSE_INSTRUCTION_OPTIONS,
  PET_NEUTERED_OPTIONS,
  PET_PORTION_UNIT_OPTIONS,
  PET_POTTY_TIMES_PER_DAY_OPTIONS,
  PET_PROVIDER_TYPE_OPTIONS,
  PET_RESOURCE_GUARDING_OPTIONS,
  PET_SEPARATION_ANXIETY_LEVEL_OPTIONS,
  PET_SIDE_EFFECT_SEVERITY_OPTIONS,
  PET_SLEEP_LOCATION_OPTIONS,
  PET_STRANGER_INTRODUCTION_OPTIONS,
  PET_TOUCH_SENSITIVITY_AREA_OPTIONS,
  PET_TREAT_ALLOWED_OPTIONS,
  PET_TREAT_PURPOSE_OPTIONS,
  PET_WEIGHT_UNIT_OPTIONS,
} from "@/features/pets/constants/options";
import { COUNTRY_OPTIONS } from "@/shared/constants/options";
import { formatDateLabel } from "@/shared/utils/date";

export type FieldType =
  | "text"
  | "multiline"
  | "document"
  | "select"
  | "date"
  | "list"
  | "toggle"
  | "objectList"
  | "description";

export type ShowWhen = { key: string; equals: string };

export type LabelFn = (values: Record<string, unknown>) => string;

export type ObjectListItemField = {
  key: string;
  label: string | LabelFn;
  placeholder?: string;
  type?: Exclude<FieldType, "objectList">;
  options?: readonly string[];
  showWhen?: ShowWhen;
};

export function resolveLabel(
  label: string | LabelFn,
  values: Record<string, unknown> = {},
): string {
  return typeof label === "function" ? label(values) : label;
}

export type FieldDef = {
  key: string;
  label: string | LabelFn;
  placeholder?: string;
  type?: FieldType;
  content?: string;
  required?: boolean;
  options?: readonly string[];
  showWhen?: ShowWhen;
  itemFields?: ObjectListItemField[];
  addLabel?: string;
};

type RecordData = Record<string, unknown> | null | undefined;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const direct = (obj as Record<string, unknown>)[path];
  if (direct !== undefined) return direct;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
}

export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return obj;
}

function toString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => toString(v).trim()).filter(Boolean);
  }

  const raw = toString(value).trim();
  if (!raw) return [];

  if (raw.includes("\n")) {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toBoolString(value: unknown, fallback = "false"): string {
  const text = toString(value).trim().toLowerCase();
  if (["true", "yes", "1"].includes(text)) return "true";
  if (["false", "no", "0"].includes(text)) return "false";
  return fallback;
}

const CANONICAL_DEFAULTS: Partial<Record<RecordType, Record<string, unknown>>> =
  {
    PASSPORT: {
      firstName: "",
      middleName: "",
      lastName: "",
      passportNumber: "",
      nationality: "",
      dateOfBirth: "",
      sex: "",
      placeOfBirth: "",
      issueDate: "",
      expirationDate: "",
      issuingCountry: "",
      issuingAuthority: "",
      mrzRaw: "",
    },
    PASSPORT_CARD: {
      fullName: "",
      passportCardNumber: "",
      dateOfBirth: "",
      expirationDate: "",
      issuingCountry: "",
      mrzRaw: "",
    },
    DRIVERS_LICENSE: {
      fullName: "",
      dlNumber: "",
      dateOfBirth: "",
      expirationDate: "",
      issueDate: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      licenseClass: "",
      restrictions: [],
      issuingRegion: "",
    },
    BIRTH_CERTIFICATE: {
      childFullName: "",
      dateOfBirth: "",
      placeOfBirth: {
        city: "",
        county: "",
        state: "",
        country: "",
      },
      certificateNumber: "",
      parents: {
        includeParents: false,
        parent1Name: null,
        parent2Name: null,
      },
    },
    SOCIAL_SECURITY_CARD: {
      fullName: "",
      ssn: "",
    },
    MEDICAL_INSURANCE: {
      insuranceType: "",
      insurerName: "",
      memberName: "",
      memberId: "",
      groupNumber: "",
      planName: "",
      rx: {
        bin: "",
        pcn: "",
        rxGroup: "",
      },
      customerServicePhone: "",
      website: "",
      effectiveDate: "",
    },
    MEDICAL_PROFILE: {
      bloodType: "",
      allergies: [],
      conditions: [],
    },
    MEDICAL_PROCEDURES: {
      procedures: [],
    },
    PRESCRIPTIONS: {
      prescriptions: [],
    },
    VACCINATIONS: {
      vaccinations: [],
    },
    VISION_PRESCRIPTION: {
      rxDate: "",
      doctorContactId: "",
    },
    PRIVATE_HEALTH_PROFILE: {
      advocacyNeeds: [],
      stressors: [],
      triggers: [],
      copingStrategies: [],
      avoids: [],
      sensorySensitivities: [],
      sensorySeeking: [],
      sensorySupports: [],
      transitionSupports: [],
      safetyRisks: [],
    },
    SCHOOL_INFO: {
      schoolName: "",
      address: {
        line1: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      mainOfficePhone: "",
      nurseContactId: "",
      counselorContactId: "",

      // moved in from AUTHORIZED_PICKUP for better organization, but keep defaults here for backward compatibility
      authorizedPickup: [],
    },

    PEOPLE_CARE_PROVIDERS: {
      providerType: "",
      contactId: "",
    },
    EDUCATION_RECORD: {
      title: "",
      schoolName: "",
      gradeOrLevel: "",
      year: "",
    },
    PET_BASICS: {
      isNeutered: "Unknown",
      microchipId: "",
      currentWeightValue: "",
      currentWeightUnit: "lb",
      notes: "",
    },
    PET_CARE_PROVIDERS: {
      providerType: "",
      contactId: "",
    },
    PET_VACCINATIONS: {
      vaccineName: "",
      dateAdministered: "",
      doseNumber: "",
      doseTotal: "",
      providerContactId: "",
    },
    PET_FLEA_PREVENTION: {
      productName: "",
      dateGiven: "",
      nextDueDate: "",
    },
    PET_SURGERIES: {
      procedureName: "",
      date: "",
      clinicOrHospital: "",
      surgeonOrVetContactId: "",
    },
    PET_INSURANCE: {
      providerName: "",
      policyNumber: "",
      memberId: "",
      customerServicePhone: "",
    },
    PERSON_SIZING_PROFILE: {
      sizingReference: "",
      measurementUnit: "",
      generalSize: "",
      notes: "",
    },
    PREFERENCES: {
      likes: [],
      dislikes: [],
      hobbies: [],
      favoriteSports: [],
      favoriteColors: [],
    },
    SIZES: {
      clothingSizes: [],
      shoeSizes: [],
    },
    TRAVEL_IDS: {
      travelIds: [],
    },
    LOYALTY_ACCOUNTS: {
      accounts: [],
    },
    LEGAL_PROPERTY_DOCUMENT: {
      documentType: "",
      title: "",
      ownerEntityId: "",
      issueDate: "",
      expirationDate: null,
    },
    OTHER_DOCUMENT: {
      category: "",
      title: "",
    },

    PET_OVERVIEW: {
      gender: "",
      dob: "",
      adoptionDate: "",
      notes: "",
    },
    PET_WEIGHT_ENTRY: {
      weightValue: "",
      weightUnit: "lb",
      measuredAt: "",
    },
    PET_MEDICATIONS: {
      medicationName: "",
      dosage: "",
      adminMethod: "",
      scheduleNotes: "",
      missedDoseAction: "",
      missedDoseNotes: "",
      sideEffectSeverity: "",
      sideEffectsNotes: "",
    },
    PET_DIAGNOSES: {
      diagnosisName: "",
      date: "",
      notes: "",
    },
    PET_FEEDING_ROUTINE: {
      foodBrand: "",
      foodType: "",
      portionAmount: "",
      portionUnit: "",
      feedingTimes: "",
      treatAllowed: "",
      treatPurpose: "",
      treatRulesNotes: "",
    },
    PET_BATHROOM_ROUTINE: {
      pottyTimesPerDay: "",
      leashHarnessNotes: "",
      avoidTriggers: [],
      avoidTriggersNotes: "",
    },
    PET_SLEEP_ROUTINE: {
      sleepLocation: "",
      crateRule: "",
      bedtimeRoutine: "",
    },
    PET_BEHAVIOR_PROFILE: {
      fears: [],
      separationAnxietyLevel: "",
      separationAnxietyNotes: "",
      resourceGuarding: "",
      escapeTendency: "",
      aggressionTriggers: [],
      strangerIntro: "",
      touchSensitivities: [],
    },
    PET_DOCUMENT: {
      label: "",
      documentType: "",
    },
  };

export const FORM_DEFS: Partial<Record<RecordType, FieldDef[]>> = {
  PASSPORT: [
    { key: "firstName", label: "First name" },
    { key: "middleName", label: "Middle name" },
    { key: "lastName", label: "Last name" },
    { key: "passportNumber", label: "Passport number" },
    {
      key: "nationality",
      label: "Nationality",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "dateOfBirth", label: "Date of birth", type: "date" },
    { key: "sex", label: "Sex", type: "select", options: ["Male", "Female", "X"] as const },
    { key: "placeOfBirth", label: "Place of birth" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expirationDate", label: "Expiration date", type: "date" },
    {
      key: "issuingCountry",
      label: "Issuing country",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "issuingAuthority", label: "Issuing authority" },
    { key: "mrzRaw", label: "MRZ raw", type: "multiline" },
  ],

  PASSPORT_CARD: [
    { key: "fullName", label: "Full name" },
    { key: "passportCardNumber", label: "Passport card number" },
    { key: "dateOfBirth", label: "Date of birth", type: "date" },
    { key: "expirationDate", label: "Expiration date", type: "date" },
    {
      key: "issuingCountry",
      label: "Issuing country",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "mrzRaw", label: "MRZ raw", type: "multiline" },
  ],

  DRIVERS_LICENSE: [
    { key: "fullName", label: "Full name" },
    { key: "dlNumber", label: "License number" },
    { key: "dateOfBirth", label: "Date of birth", type: "date" },
    { key: "expirationDate", label: "Expiration date", type: "date" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "address.line1", label: "Address line 1" },
    { key: "address.line2", label: "Address line 2" },
    { key: "address.city", label: "City" },
    { key: "address.state", label: "State" },
    { key: "address.postalCode", label: "Postal code" },
    {
      key: "address.country",
      label: "Country",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "licenseClass", label: "License class" },
    {
      key: "restrictions",
      label: "Restrictions",
      type: "list",
      placeholder: "Add a restriction",
    },
    { key: "issuingRegion", label: "Issuing region" },
  ],

  BIRTH_CERTIFICATE: [
    { key: "childFullName", label: "Child full name" },
    { key: "dateOfBirth", label: "Date of birth", type: "date" },
    { key: "placeOfBirth.city", label: "Birth city" },
    { key: "placeOfBirth.county", label: "Birth county" },
    { key: "placeOfBirth.state", label: "Birth state" },
    {
      key: "placeOfBirth.country",
      label: "Birth country",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "certificateNumber", label: "Certificate number" },
    {
      key: "parents.includeParents",
      label: "Include parents",
      type: "select",
      options: ["true", "false"],
    },
    { key: "parents.parent1Name", label: "Parent 1 name" },
    { key: "parents.parent2Name", label: "Parent 2 name" },
  ],

  SOCIAL_SECURITY_CARD: [
    { key: "fullName", label: "Full name" },
    { key: "ssn", label: "SSN" },
  ],

  MEDICAL_INSURANCE: [
    { key: "insuranceType", label: "Insurance type" },
    { key: "insurerName", label: "Insurer name" },
    { key: "memberName", label: "Member name" },
    { key: "memberId", label: "Member ID" },
    { key: "groupNumber", label: "Group number" },
    { key: "planName", label: "Plan name" },
    { key: "rx.bin", label: "RX BIN" },
    { key: "rx.pcn", label: "RX PCN" },
    { key: "rx.rxGroup", label: "RX Group" },
    { key: "customerServicePhone", label: "Customer service phone" },
    { key: "website", label: "Website" },
    { key: "effectiveDate", label: "Effective date", type: "date" },
  ],

  MEDICAL_PROFILE: [
    { key: "bloodType", label: "Blood type", type: "select", options: BLOOD_TYPE_OPTIONS },
    {
      key: "allergies",
      label: "Allergies",
      type: "objectList",
      addLabel: "Add Allergy",
      itemFields: [
        { key: "label", label: "Allergy" },
        { key: "severity", label: "Severity", type: "select", options: SEVERITY_OPTIONS },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
    {
      key: "conditions",
      label: "Conditions",
      type: "objectList",
      addLabel: "Add Condition",
      itemFields: [
        { key: "label", label: "Condition" },
        { key: "severity", label: "Severity", type: "select", options: SEVERITY_OPTIONS },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
  ],

  MEDICAL_PROCEDURES: [
    {
      key: "procedures",
      label: "Procedures",
      type: "objectList",
      addLabel: "Add Procedure",
      itemFields: [
        { key: "procedureName", label: "Procedure name" },
        { key: "monthYear", label: "Date", type: "date" },
        { key: "reasonNotes", label: "Reason / Notes", type: "multiline" },
        { key: "providerOrHospital", label: "Provider / Hospital" },
        { key: "complications", label: "Complications" },
      ],
    },
  ],

  PRESCRIPTIONS: [
    {
      key: "prescriptions",
      label: "Prescriptions",
      type: "objectList",
      addLabel: "Add Prescription",
      itemFields: [
        { key: "medicationName", label: "Medication name" },
        { key: "dosage", label: "Dosage" },
        { key: "frequency", label: "Frequency" },
        { key: "indication", label: "Indication" },
        {
          key: "prescribingProviderContactId",
          label: "Prescribing provider contact ID",
        },
        { key: "pharmacyContactId", label: "Pharmacy contact ID" },
        { key: "startDate", label: "Start date", type: "date" },
        { key: "endDate", label: "End date", type: "date" },
        { key: "discontinued", label: "Discontinued", type: "toggle" },
        {
          key: "privacy",
          label: "Privacy",
          type: "select",
          options: PRIVACY_LEVEL_OPTIONS,
        },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
  ],

  VACCINATIONS: [
    {
      key: "vaccinations",
      label: "Vaccinations",
      type: "objectList",
      addLabel: "Add Vaccination",
      itemFields: [
        { key: "vaccineName", label: "Vaccine name", type: "select", options: [...HUMAN_VACCINATION_OPTIONS] },
        { key: "doseNumber", label: "Dose number", type: "select", options: VACCINE_DOSE_OPTIONS },
        { key: "dateAdministered", label: "Date administered", type: "date" },
        { key: "expirationDate", label: "Expiration date", type: "date" },
        { key: "providerContactId", label: "Provider contact ID" },
      ],
    },
  ],

  VISION_PRESCRIPTION: [
    { key: "rxDate", label: "RX date", type: "date" },
    { key: "doctorContactId", label: "Doctor contact ID" },
  ],

  PRIVATE_HEALTH_PROFILE: [
    {
      key: "_intro",
      label: "",
      type: "description",
      content:
        "This section helps others understand how to support this person in stressful, medical, or high-demand situations.\n\nAdd triggers, stressors, sensory needs, and strategies that help them feel safe, regulated, and understood.\n\nOnly visible to you unless shared.",
    },
    {
      key: "advocacyNeeds",
      label:
        "What accommodations or supports help this person succeed in school, social, or medical settings?",
      type: "list",
      options: ADVOCACY_NEED_OPTIONS,
    },
    {
      key: "stressors",
      label:
        "What situations or environments commonly increase stress or overwhelm?",
      type: "list",
      options: STRESSOR_OPTIONS,
    },
    {
      key: "triggers",
      label:
        "What specific experiences or interactions may cause immediate distress or escalation?",
      type: "list",
      options: TRIGGER_OPTIONS,
    },
    {
      key: "copingStrategies",
      label:
        "What helps this person calm, regulate, or feel safe when overwhelmed?",
      type: "list",
      options: COPING_STRATEGY_OPTIONS,
    },
    {
      key: "avoids",
      label: "What approaches should be avoided during stress or escalation?",
      type: "list",
      options: AVOID_OPTIONS,
    },
    {
      key: "sensorySensitivities",
      label:
        "Are there sensory inputs that are especially uncomfortable or overwhelming?",
      type: "list",
      options: SENSORY_SENSITIVITY_OPTIONS,
    },
    {
      key: "sensorySeeking",
      label: "Does this person actively seek certain sensory input?",
      type: "list",
      options: SENSORY_SEEKING_OPTIONS,
    },
    {
      key: "sensorySupports",
      label:
        "What tools or environmental supports help regulate sensory needs?",
      type: "list",
      options: SENSORY_SUPPORT_OPTIONS,
    },
    {
      key: "transitionSupports",
      label:
        "What helps during transitions between activities or environments?",
      type: "list",
      options: TRANSITION_SUPPORT_OPTIONS,
    },
    {
      key: "safetyRisks",
      label: "Are there safety considerations caregivers should be aware of?",
      type: "list",
      options: SAFETY_RISK_OPTIONS,
    },
  ],

  SCHOOL_INFO: [
    { key: "schoolName", label: "School name" },
    { key: "address.line1", label: "Address line 1" },
    { key: "address.city", label: "City" },
    { key: "address.state", label: "State" },
    { key: "address.postalCode", label: "Postal code" },
    {
      key: "address.country",
      label: "Country",
      type: "select",
      options: COUNTRY_OPTIONS,
    },
    { key: "mainOfficePhone", label: "Main office phone" },
    { key: "nurseContactId", label: "Nurse contact ID" },
    { key: "counselorContactId", label: "Counselor contact ID" },
  ],

  AUTHORIZED_PICKUP: [
    {
      key: "authorizedPickup",
      label: "Authorized Pickup",
      type: "objectList",
      addLabel: "Add Pickup Contact",
      itemFields: [
        { key: "contactId", label: "Contact ID" },
        { key: "relationship", label: "Relationship" },
        { key: "rules", label: "Rules (comma separated)" },
      ],
    },
  ],

  PEOPLE_CARE_PROVIDERS: [
    {
      key: "providerType",
      label: "Provider type",
      type: "select",
      options: PEOPLE_CARE_PROVIDER_TYPE_OPTIONS,
    },
    { key: "contactId", label: "Contact ID" },
  ],
  EDUCATION_RECORD: [
    { key: "title", label: "Title" },
    { key: "schoolName", label: "School name" },
    { key: "gradeOrLevel", label: "Grade or level" },
    { key: "year", label: "Year" },
  ],

  PET_BASICS: [
    {
      key: "isNeutered",
      label: "Neutered / Spayed",
      type: "select",
      options: PET_NEUTERED_OPTIONS,
    },
    { key: "microchipId", label: "Microchip ID" },
    { key: "currentWeightValue", label: "Weight" },
    {
      key: "currentWeightUnit",
      label: "Unit",
      type: "select",
      options: PET_WEIGHT_UNIT_OPTIONS,
    },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PET_CARE_PROVIDERS: [
    {
      key: "providerType",
      label: "Provider type",
      type: "select",
      options: PET_PROVIDER_TYPE_OPTIONS,
    },
    { key: "contactId", label: "Contact ID" },
  ],
  PET_VACCINATIONS: [
    { key: "vaccineName", label: "Vaccine name" },
    { key: "dateAdministered", label: "Date administered", type: "date" },
    { key: "doseNumber", label: "Dose number" },
    { key: "doseTotal", label: "Dose total" },
    { key: "providerContactId", label: "Provider contact ID" },
  ],
  PET_FLEA_PREVENTION: [
    { key: "productName", label: "Product name" },
    { key: "dateGiven", label: "Date given", type: "date" },
    { key: "nextDueDate", label: "Next due date", type: "date" },
  ],
  PET_SURGERIES: [
    { key: "procedureName", label: "Procedure name" },
    { key: "date", label: "Date", type: "date" },
    { key: "clinicOrHospital", label: "Clinic or hospital" },
    { key: "surgeonOrVetContactId", label: "Surgeon/Vet contact ID" },
  ],
  PET_INSURANCE: [
    { key: "providerName", label: "Provider name" },
    { key: "policyNumber", label: "Policy number" },
    { key: "memberId", label: "Member ID" },
    { key: "customerServicePhone", label: "Customer service phone" },
  ],

  PERSON_SIZING_PROFILE: [
    {
      key: "sizingReference",
      label: "Sizing reference",
      type: "select",
      options: PERSON_SIZING_REFERENCE_OPTIONS,
    },
    {
      key: "measurementUnit",
      label: "Measurement unit",
      type: "select",
      options: PERSON_MEASUREMENT_UNIT_OPTIONS,
    },
    {
      key: "generalSize",
      label: "General size",
      type: "select",
      options: GENERAL_SIZE_OPTIONS,
    },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  PREFERENCES: [
    { key: "likes", label: "Likes", type: "list", placeholder: "Enter a like" },
    {
      key: "dislikes",
      label: "Dislikes",
      type: "list",
      placeholder: "Enter a dislike",
    },
    {
      key: "hobbies",
      label: "Hobbies",
      type: "list",
      placeholder: "Enter a hobby",
    },
    {
      key: "favoriteSports",
      label: "Favorite sports",
      type: "list",
      placeholder: "Enter a sport",
    },
    {
      key: "favoriteColors",
      label: "Favorite colors",
      type: "list",
      placeholder: "Enter a color",
    },
  ],

  SIZES: [
    {
      key: "clothingSizes",
      label: "Clothing Sizes",
      type: "objectList",
      addLabel: "Add Clothing Size",
      itemFields: [
        { key: "label", label: "Size", type: "select", options: GENERAL_SIZE_OPTIONS },
        { key: "brand", label: "Brand" },
      ],
    },
    {
      key: "shoeSizes",
      label: "Shoe Sizes",
      type: "objectList",
      addLabel: "Add Shoe Size",
      itemFields: [
        { key: "label", label: "Size" },
        { key: "category", label: "Category", type: "select", options: SHOE_CATEGORY_OPTIONS },
        { key: "system", label: "System", type: "select", options: SHOE_SYSTEM_OPTIONS },
        { key: "width", label: "Width", type: "select", options: SHOE_WIDTH_OPTIONS },
        { key: "brand", label: "Brand" },
      ],
    },
  ],

  TRAVEL_IDS: [
    {
      key: "travelIds",
      label: "Travel IDs",
      type: "objectList",
      addLabel: "Add Travel ID",
      itemFields: [
        {
          key: "type",
          label: "Program type",
          type: "select",
          options: TRAVEL_ID_OPTIONS,
        },
        {
          key: "otherProgramName",
          label: "Other program name",
          showWhen: { key: "type", equals: "Other Trusted Traveler Program" },
        },
        {
          key: "number",
          label: ((values: Record<string, unknown>) => {
            const t = String(values.type ?? "");
            if (t === "TSA PreCheck") return "Known Traveler Number (KTN)";
            if (["Global Entry", "NEXUS", "SENTRI", "FAST"].includes(t))
              return "PASSID / Known Traveler Number";
            return "Program Number";
          }) as (values: Record<string, unknown>) => string,
        },
        { key: "expirationDate", label: "Expiration date", type: "date" },
        { key: "loginEmail", label: "Login email", placeholder: "Optional" },
        {
          key: "notes",
          label: "Notes",
          type: "multiline",
          placeholder: "Optional",
        },
      ],
    },
  ],

  LOYALTY_ACCOUNTS: [
    {
      key: "accounts",
      label: "Loyalty Accounts",
      type: "objectList",
      addLabel: "Add Loyalty Account",
      itemFields: [
        {
          key: "programType",
          label: "Program type",
          type: "select",
          options: TRAVEL_LOYALTY_TYPE_OPTIONS,
        },
        { key: "providerName", label: "Provider name" },
        { key: "memberNumber", label: "Member number" },
        {
          key: "loginEmailOrUsername",
          label: "Login email or username",
          placeholder: "Optional",
        },
        { key: "statusTier", label: "Status / tier", placeholder: "Optional" },
        {
          key: "notes",
          label: "Notes",
          type: "multiline",
          placeholder: "Optional",
        },
      ],
    },
  ],

  LEGAL_PROPERTY_DOCUMENT: [
    { key: "documentType", label: "Document type", type: "select", options: LEGAL_DOCUMENT_TYPE_OPTIONS },
    { key: "title", label: "Title" },
    { key: "ownerEntityId", label: "Owner entity ID" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expirationDate", label: "Expiration date", type: "date" },
  ],

  OTHER_DOCUMENT: [
    { key: "category", label: "Category", type: "select", options: OTHER_DOCUMENT_CATEGORY_OPTIONS },
    { key: "title", label: "Title" },
  ],

  PET_OVERVIEW: [
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: PET_GENDER_OPTIONS,
    },
    { key: "dob", label: "Date of Birth", type: "date" },
    { key: "adoptionDate", label: "Adoption Date", type: "date" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PET_WEIGHT_ENTRY: [
    { key: "weightValue", label: "Weight" },
    {
      key: "weightUnit",
      label: "Unit",
      type: "select",
      options: PET_WEIGHT_UNIT_OPTIONS,
    },
    { key: "measuredAt", label: "Date measured", type: "date" },
  ],
  PET_MEDICATIONS: [
    { key: "medicationName", label: "Medication name" },
    { key: "dosage", label: "Dosage" },
    {
      key: "adminMethod",
      label: "How administered",
      type: "select",
      options: PET_MED_ADMIN_METHOD_OPTIONS,
    },
    { key: "scheduleNotes", label: "Schedule / notes", type: "multiline" },
    {
      key: "missedDoseAction",
      label: "If missed dose",
      type: "select",
      options: PET_MISSED_DOSE_INSTRUCTION_OPTIONS,
    },
    { key: "missedDoseNotes", label: "Missed dose notes", type: "multiline" },
    {
      key: "sideEffectSeverity",
      label: "Side effect severity",
      type: "select",
      options: PET_SIDE_EFFECT_SEVERITY_OPTIONS,
    },
    {
      key: "sideEffectsNotes",
      label: "Side effects to watch for",
      type: "multiline",
    },
  ],
  PET_DIAGNOSES: [
    { key: "diagnosisName", label: "Diagnosis" },
    { key: "date", label: "Date", type: "date" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PET_FEEDING_ROUTINE: [
    { key: "foodBrand", label: "Food brand" },
    {
      key: "foodType",
      label: "Food type",
      type: "select",
      options: PET_FOOD_TYPE_OPTIONS,
    },
    { key: "portionAmount", label: "Portion amount" },
    {
      key: "portionUnit",
      label: "Portion unit",
      type: "select",
      options: PET_PORTION_UNIT_OPTIONS,
    },
    {
      key: "feedingTimes",
      label: "Feeding times",
      type: "multiline",
      placeholder: "e.g., 7:00 AM, 5:00 PM",
    },
    {
      key: "treatAllowed",
      label: "Treats allowed",
      type: "select",
      options: PET_TREAT_ALLOWED_OPTIONS,
    },
    {
      key: "treatPurpose",
      label: "Treat purpose",
      type: "select",
      options: PET_TREAT_PURPOSE_OPTIONS,
    },
    { key: "treatRulesNotes", label: "Treat rules / notes", type: "multiline" },
  ],
  PET_BATHROOM_ROUTINE: [
    { key: "pottyTimesPerDay", label: "Times per day", type: "select", options: PET_POTTY_TIMES_PER_DAY_OPTIONS },
    {
      key: "leashHarnessNotes",
      label: "Leash / harness details",
      type: "multiline",
    },
    {
      key: "avoidTriggers",
      label: "Avoid triggers",
      type: "list",
      options: PET_AVOID_TRIGGER_OPTIONS,
    },
    { key: "avoidTriggersNotes", label: "Trigger notes", type: "multiline" },
  ],
  PET_SLEEP_ROUTINE: [
    {
      key: "sleepLocation",
      label: "Sleep location",
      type: "select",
      options: PET_SLEEP_LOCATION_OPTIONS,
    },
    {
      key: "crateRule",
      label: "Crate rules",
      type: "select",
      options: PET_CRATE_RULE_OPTIONS,
    },
    { key: "bedtimeRoutine", label: "Bedtime routine", type: "multiline" },
  ],
  PET_BEHAVIOR_PROFILE: [
    { key: "fears", label: "Fears", type: "list", options: PET_FEAR_OPTIONS },
    {
      key: "separationAnxietyLevel",
      label: "Separation anxiety",
      type: "select",
      options: PET_SEPARATION_ANXIETY_LEVEL_OPTIONS,
    },
    {
      key: "separationAnxietyNotes",
      label: "Anxiety notes",
      type: "multiline",
    },
    {
      key: "resourceGuarding",
      label: "Resource guarding",
      type: "select",
      options: PET_RESOURCE_GUARDING_OPTIONS,
    },
    {
      key: "escapeTendency",
      label: "Escape tendency",
      type: "select",
      options: PET_ESCAPE_TENDENCY_OPTIONS,
    },
    {
      key: "aggressionTriggers",
      label: "Aggression triggers",
      type: "list",
      options: PET_AGGRESSION_TRIGGER_OPTIONS,
    },
    {
      key: "strangerIntro",
      label: "Stranger introduction",
      type: "select",
      options: PET_STRANGER_INTRODUCTION_OPTIONS,
    },
    {
      key: "touchSensitivities",
      label: "Touch sensitivities",
      type: "list",
      options: PET_TOUCH_SENSITIVITY_AREA_OPTIONS,
    },
  ],
  PET_DOCUMENT: [
    { key: "label", label: "Label" },
    {
      key: "documentType",
      label: "Document type",
      type: "select",
      options: PET_DOCUMENT_TYPE_OPTIONS,
    },
  ],
};

function normalizeScalarValue(key: string, value: unknown): unknown {
  if (key === "parents.includeParents" || key === "privacyEnforced") {
    return toBoolString(value, "false") === "true";
  }

  if (key === "parents.parent1Name" || key === "parents.parent2Name") {
    const text = toString(value).trim();
    return text || null;
  }

  if (key === "expirationDate" && toString(value).trim() === "") {
    return null;
  }

  return toString(value);
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value))
    return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulValue(item),
    );
  }
  return false;
}

function normalizeObjectItemField(
  itemField: ObjectListItemField,
  value: unknown,
): unknown {
  if (itemField.type === "toggle") {
    if (typeof value === "boolean") return value;
    return toBoolString(value, "false") === "true";
  }

  if (itemField.key === "rules") {
    return toStringList(value);
  }

  if (
    (itemField.key === "endDate" || itemField.key === "expirationDate") &&
    toString(value).trim() === ""
  ) {
    return null;
  }

  return toString(value);
}

function normalizeObjectListValue(field: FieldDef, raw: unknown): unknown[] {
  if (!field.itemFields || field.itemFields.length === 0) return [];

  const coerceRows = (): Record<string, unknown>[] => {
    if (Array.isArray(raw)) {
      return raw.filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === "object",
      );
    }

    if (raw && typeof raw === "object") {
      return [raw as Record<string, unknown>];
    }

    return [];
  };

  return coerceRows()
    .map((row) => {
      const normalized: Record<string, unknown> = {
        id: toString(row.id) || makeId(field.key.toLowerCase()),
        createdAt: toString(row.createdAt) || nowIso(),
        updatedAt: nowIso(),
      };

      field.itemFields?.forEach((itemField) => {
        normalized[itemField.key] = normalizeObjectItemField(
          itemField,
          row[itemField.key],
        );
      });

      return normalized;
    })
    .filter((row) =>
      field.itemFields?.some((itemField) =>
        hasMeaningfulValue(row[itemField.key]),
      ),
    );
}

export function normalizeRecordDataForSave(
  recordType: RecordType,
  input: RecordData,
): Record<string, unknown> {
  const base = deepClone(CANONICAL_DEFAULTS[recordType] ?? {});
  if (!input || typeof input !== "object") return base;

  const fields = FORM_DEFS[recordType] ?? [];

  fields.forEach((field) => {
    const raw =
      (input as Record<string, unknown>)[field.key] ??
      getByPath(input, field.key);
    if (raw === undefined) return;

    if (field.type === "objectList") {
      setByPath(base, field.key, normalizeObjectListValue(field, raw));
      return;
    }

    if (field.type === "list") {
      setByPath(base, field.key, toStringList(raw));
      return;
    }

    setByPath(base, field.key, normalizeScalarValue(field.key, raw));
  });

  return base;
}

export function normalizeRecordDataForEdit(
  recordType: RecordType,
  input: RecordData,
): Record<string, unknown> {
  const canonical = normalizeRecordDataForSave(recordType, input ?? {});
  const result: Record<string, unknown> = { ...canonical };

  const fields = FORM_DEFS[recordType] ?? [];
  fields.forEach((field) => {
    const value = getByPath(canonical, field.key);

    if (field.type === "objectList" && Array.isArray(value)) {
      result[field.key] = value;
      return;
    }

    if (field.key.includes(".")) {
      result[field.key] = value ?? "";
    }
  });

  return result;
}

function normalizeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function isDateLikeField(field: FieldDef | ObjectListItemField): boolean {
  if (field.type === "date") return true;
  const text =
    `${field.key} ${resolveLabel(field.label)} ${field.placeholder ?? ""}`.toLowerCase();
  return (
    text.includes("yyyy-mm-dd") ||
    text.includes(" date") ||
    text.includes("dob")
  );
}

function stringifyFieldValue(
  field: FieldDef | ObjectListItemField,
  value: unknown,
): string {
  if (value == null) return "";

  if (field.type === "toggle") {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return toBoolString(value, "false") === "true" ? "Yes" : "No";
  }

  if (field.type === "objectList") {
    if (!Array.isArray(value) || value.length === 0) return "";
    return `${value.length} ${value.length === 1 ? "item" : "items"}`;
  }

  if (typeof value === "string") {
    if (isDateLikeField(field)) {
      return formatDateLabel(value, "");
    }
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object")
      return `${value.length} items`;
    return value
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const maybeFile = value as { name?: unknown; uri?: unknown };
    const fileName = normalizeString(maybeFile.name);
    if (fileName) return fileName;

    const uri = normalizeString(maybeFile.uri);
    if (uri) return uri;

    return "[object]";
  }

  return "";
}

export function getFieldsForRecordType(
  recordType: RecordType,
  data?: RecordData,
): FieldDef[] {
  const fields = FORM_DEFS[recordType] ?? [];
  if (!data) return fields;

  return fields.filter((field) => {
    if (!field.showWhen) return true;
    const actual = normalizeString(getByPath(data, field.showWhen.key));
    return actual === field.showWhen.equals;
  });
}

export function buildInitialData(
  recordType: RecordType,
): Record<string, unknown> {
  return deepClone(CANONICAL_DEFAULTS[recordType] ?? {});
}

export function defaultTitleForRecordType(
  recordType: RecordType,
  data?: RecordData,
): string {
  const metaLabel =
    getRecordMeta(recordType)?.label ?? recordType.replaceAll("_", " ");
  if (!data || typeof data !== "object") return metaLabel;

  const titleCandidates = [
    "title",
    "fullName",
    "childFullName",
    "memberName",
    "schoolName",
    "label",
    "documentType",
    "insuranceType",
    "petName",
    "address.line1",
  ];

  for (const key of titleCandidates) {
    const value = normalizeString(getByPath(data, key));
    if (value) return `${metaLabel}: ${value}`;
  }

  return metaLabel;
}

export function buildDisplayRows(
  recordType: RecordType,
  data?: RecordData,
): { label: string; value: string }[] {
  if (!data || typeof data !== "object") return [];

  const fields = getFieldsForRecordType(recordType, data);
  if (fields.length > 0) {
    const rows: { label: string; value: string }[] = [];

    fields.forEach((field) => {
      const fieldValue = getByPath(data, field.key);

      if (field.type === "objectList") {
        return;
      }

      const valueText = stringifyFieldValue(field, fieldValue);
      if (valueText.length > 0) {
        rows.push({
          label: resolveLabel(field.label, data as Record<string, unknown>),
          value: valueText,
        });
      }
    });

    return rows;
  }

  return Object.entries(data)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase()),
      value: stringifyFieldValue({ key, label: key }, value),
    }))
    .filter((row) => row.value.length > 0);
}

export type DisplayTable = {
  label: string;
  columns: string[];
  rows: string[][];
};

export type DisplayKV = { label: string; value: string };

export type DisplayCardTable = {
  label: string; // section title (e.g., "Prescriptions")
  items: {
    id: string; // stable row id
    title?: string; // optional short title for the card
    rows: DisplayKV[]; // stacked rows (no gridlines)
  }[];
};

/**
 * Mobile-friendly “tables”:
 * - objectList becomes a list of cards
 * - each card contains stacked label/value rows
 */
export function buildDisplayTables(
  recordType: RecordType,
  data?: RecordData,
): DisplayCardTable[] {
  if (!data || typeof data !== "object") return [];

  const fields = getFieldsForRecordType(recordType, data);
  if (fields.length === 0) return [];

  return fields
    .filter((field) => field.type === "objectList" && field.itemFields?.length)
    .map((field) => {
      const rawItems = getByPath(data, field.key);
      const items = Array.isArray(rawItems) ? rawItems : [];
      const itemFields = field.itemFields ?? [];

      const cardItems = items
        .map((item, idx) => {
          if (!item || typeof item !== "object") return null;

          const obj = item as Record<string, unknown>;

          const rows: DisplayKV[] = itemFields
            .map((itemField) => {
              // If your objectList supports showWhen on itemFields (you have it typed),
              // respect it here:
              if (itemField.showWhen) {
                const actual = normalizeString(obj[itemField.showWhen.key]);
                if (actual !== itemField.showWhen.equals) return null;
              }

              const label = resolveLabel(itemField.label, obj);
              const valueText = stringifyFieldValue(
                itemField,
                obj[itemField.key],
              );

              if (!valueText || valueText.trim().length === 0) return null;
              return { label, value: valueText };
            })
            .filter((r): r is DisplayKV => !!r);

          if (rows.length === 0) return null;

          // try to pick a short “title” for the card (nice in a list)
          const titleCandidateKeys = [
            "label",
            "title",
            "name",
            "providerName",
            "vaccineName",
            "medicationName",
          ];
          const title =
            titleCandidateKeys
              .map((k) => normalizeString(obj[k]))
              .find((v) => v.length > 0) || undefined;

          const id = normalizeString(obj.id) || `${field.key}_${idx}`;

          return { id, title, rows };
        })
        .filter((x): x is NonNullable<typeof x> => !!x);

      if (cardItems.length === 0) return null;

      return {
        label: resolveLabel(field.label, data as Record<string, unknown>),
        items: cardItems,
      };
    })
    .filter((t): t is NonNullable<typeof t> => !!t);
}
