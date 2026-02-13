import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/domain/records/selectors/getRecordMeta";
import { PET_DOCUMENT_TYPE_OPTIONS } from "@/shared/constants/options";
import { formatDateLabel } from "@/shared/utils/date";

export type FieldType = "text" | "multiline" | "document" | "select" | "date";

export type ShowWhen = { key: string; equals: string };

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
  required?: boolean;
  options?: readonly string[];
  showWhen?: ShowWhen;
};

export const FORM_DEFS: Partial<Record<RecordType, FieldDef[]>> = {
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
    { key: "firstName", label: "First name" },
    { key: "middleName", label: "Middle name" },
    { key: "lastName", label: "Last name" },
    { key: "passportCardNumber", label: "Passport card number" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "issuingCountry", label: "Issuing country" },
    { key: "mrzRaw", label: "MRZ raw", type: "multiline" },
  ],

  DRIVERS_LICENSE: [
    { key: "firstName", label: "First name" },
    { key: "middleName", label: "Middle name" },
    { key: "lastName", label: "Last name" },
    { key: "dlNumber", label: "License number" },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "issuingRegion", label: "Issuing state/region" },
    { key: "licenseClass", label: "Class" },
    { key: "restrictions", label: "Restrictions (comma separated)", placeholder: "e.g. A, B, corrective lenses" },
    { key: "addressLine1", label: "Address line 1" },
    { key: "addressLine2", label: "Address line 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "Postal code" },
    { key: "country", label: "Country" },
  ],

  BIRTH_CERTIFICATE: [
    { key: "attachment", label: "Upload birth certificate", type: "document", required: true },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  SOCIAL_SECURITY_CARD: [
    { key: "fullName", label: "Full name" },
    { key: "ssn", label: "SSN" },
  ],

  INSURANCE_POLICY: [
    { key: "insuranceType", label: "Insurance type" },
    { key: "insurerName", label: "Insurer name" },
    { key: "memberName", label: "Member name" },
    { key: "memberId", label: "Member ID / Policy #" },
    { key: "groupNumber", label: "Group number" },
    { key: "planName", label: "Plan name" },
    { key: "rxBin", label: "RX BIN" },
    { key: "rxPcn", label: "RX PCN" },
    { key: "rxGroup", label: "RX Group" },
    { key: "customerServicePhone", label: "Customer service phone" },
    { key: "website", label: "Website" },
    { key: "effectiveDate", label: "Effective date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  PREFERENCES: [
    { key: "favorites", label: "Favorites", type: "multiline" },
    { key: "dislikes", label: "Dislikes / avoid", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  SIZES: [
    { key: "shirtSize", label: "Shirt size" },
    { key: "pantSize", label: "Pant size" },
    { key: "shoeSize", label: "Shoe size" },
    { key: "dressSize", label: "Dress size (optional)" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  TRAVEL_IDS: [
    { key: "travelIds", label: "Travel IDs (KTN, Global Entry, etc.)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  LOYALTY_ACCOUNTS: [
    { key: "accounts", label: "Loyalty accounts", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  LEGAL_PROPERTY_DOCUMENT: [
    { key: "documentType", label: "Document type" },
    { key: "title", label: "Title" },
    { key: "ownerEntityId", label: "Owner entity ID (optional)" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD, optional)", placeholder: "YYYY-MM-DD" },
    { key: "attachment", label: "Document attachment", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  OTHER_DOCUMENT: [
    { key: "title", label: "Title" },
    { key: "attachment", label: "Document attachment", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

    // ✅ NEW: consolidated pet docs (MULTI record type)
  PET_DOCUMENT: [
    { key: "documentType", label: "Document type", type: "select", options: PET_DOCUMENT_TYPE_OPTIONS, required: true },
    { key: "documentTypeOther", label: "Please specify", showWhen: { key: "documentType", equals: "Other" } },
    { key: "expirationDate", label: "Expiration date (optional)", type: "date" },
    { key: "attachment", label: "Upload document", type: "document", required: true },
    { key: "notes", label: "Notes", type: "multiline" },
  ],

  PET_PROFILE: [
    { key: "kind", label: "Kind (Dog, Cat, etc)" },
    { key: "breed", label: "Breed" },
    { key: "dobOrAdoptionDate", label: "DOB or adoption date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "microchipId", label: "Microchip ID" },
    { key: "emergencyInstructions", label: "Emergency instructions", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
};

type RecordData = Record<string, unknown> | null | undefined;

function normalizeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function isDateLikeField(field: FieldDef): boolean {
  if (field.type === "date") return true;
  const text = `${field.key} ${field.label} ${field.placeholder ?? ""}`.toLowerCase();
  return text.includes("yyyy-mm-dd") || text.includes(" date") || text.includes("dob");
}

function stringifyFieldValue(field: FieldDef, value: unknown): string {
  if (value == null) return "";

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
    return value
      .map((item) => (typeof item === "string" ? item.trim() : JSON.stringify(item)))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const maybeFile = value as { name?: unknown; uri?: unknown };
    const fileName = normalizeString(maybeFile.name);
    if (fileName) return fileName;

    const uri = normalizeString(maybeFile.uri);
    if (uri) return uri;

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return "";
}

export function getFieldsForRecordType(recordType: RecordType, data?: RecordData): FieldDef[] {
  const fields = FORM_DEFS[recordType] ?? [];
  if (!data) return fields;

  return fields.filter((field) => {
    if (!field.showWhen) return true;
    const actual = normalizeString((data as Record<string, unknown>)[field.showWhen.key]);
    return actual === field.showWhen.equals;
  });
}

export function buildInitialData(recordType: RecordType): Record<string, unknown> {
  const fields = FORM_DEFS[recordType] ?? [];
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.key] = field.type === "document" ? null : "";
    return acc;
  }, {});
}

export function defaultTitleForRecordType(recordType: RecordType, data?: RecordData): string {
  const metaLabel = getRecordMeta(recordType)?.label ?? recordType.replaceAll("_", " ");
  if (!data) return metaLabel;

  const candidateKeys = ["title", "fullName", "name", "documentType", "insuranceType", "schoolName"];
  for (const key of candidateKeys) {
    const value = normalizeString((data as Record<string, unknown>)[key]);
    if (value) return `${metaLabel}: ${value}`;
  }

  return metaLabel;
}

export function buildDisplayRows(
  recordType: RecordType,
  data?: RecordData
): Array<{ label: string; value: string }> {
  if (!data || typeof data !== "object") return [];

  const fields = getFieldsForRecordType(recordType, data);
  if (fields.length > 0) {
    return fields
      .map((field) => ({
        label: field.label,
        value: stringifyFieldValue(field, (data as Record<string, unknown>)[field.key]),
      }))
      .filter((row) => row.value.length > 0);
  }

  return Object.entries(data)
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      const text = stringifyFieldValue({ key, label }, value);
      return { label, value: text };
    })
    .filter((row) => row.value.length > 0);
}
