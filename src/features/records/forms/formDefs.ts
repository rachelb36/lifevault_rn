import { RecordType } from "@/domain/records/recordTypes";
import { getRecordMeta } from "@/lib/records/getRecordMeta";

export type FieldType = "text" | "multiline" | "document";
export type FieldDef = { key: string; label: string; placeholder?: string; type?: FieldType };

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
    { key: "restrictions", label: "Restrictions (comma separated)", placeholder: "e.g. A, B, corrective lenses" },
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
    { key: "primaryDoctorName", label: "Primary doctor name" },
    { key: "primaryDoctorClinicName", label: "Clinic / practice name" },
    { key: "primaryDoctorPhone", label: "Doctor phone" },
    { key: "bloodType", label: "Blood type" },
    { key: "allergies", label: "Allergies (comma separated)", placeholder: "e.g. peanuts, penicillin" },
    { key: "conditions", label: "Conditions (comma separated)", placeholder: "e.g. asthma, diabetes" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  MEDICAL_PROCEDURES: [
    { key: "procedures", label: "Procedures (one per line: name — date — provider)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PRESCRIPTIONS: [
    { key: "prescriptions", label: "Prescriptions (one per line: medication — dose — frequency)", type: "multiline" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  VACCINATIONS: [
    { key: "vaccinations", label: "Vaccinations (one per line: vaccine — date — provider)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  VISION_PRESCRIPTION: [
    { key: "provider", label: "Eye care provider" },
    { key: "examDate", label: "Exam date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "rightEye", label: "Right eye details" },
    { key: "leftEye", label: "Left eye details" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PRIVATE_HEALTH_PROFILE: [
    { key: "privateNotes", label: "Private health notes", type: "multiline" },
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
  AUTHORIZED_PICKUP: [
    { key: "contacts", label: "Authorized contacts (one per line: Name — Relationship — Phone)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  EDUCATION_RECORD: [
    { key: "institutionName", label: "Institution name" },
    { key: "programOrDegree", label: "Program or degree" },
    { key: "fieldOfStudy", label: "Field of study" },
    { key: "startDate", label: "Start date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "endDate", label: "End date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "studentId", label: "Student ID (optional)" },
    { key: "educationDocument", label: "Education document", type: "document" },
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
  PET_VET_RECORDS: [
    { key: "visitDate", label: "Visit date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "clinicName", label: "Clinic name" },
    { key: "providerName", label: "Provider name" },
    { key: "reason", label: "Reason for visit" },
    { key: "diagnosis", label: "Diagnosis / outcome", type: "multiline" },
    { key: "attachment", label: "Vet document", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PET_SERVICE_DOCS: [
    { key: "serviceType", label: "Service type" },
    { key: "issuer", label: "Issuer / organization" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
    { key: "attachment", label: "Service document", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PREFERENCES: [
    { key: "favorites", label: "Favorites (foods, activities, brands, etc.)", type: "multiline" },
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
    { key: "travelIds", label: "Travel IDs (one per line: Type — Number — Expiration YYYY-MM-DD)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  LOYALTY_ACCOUNTS: [
    { key: "accounts", label: "Accounts (one per line: Program — Provider — Member #)", type: "multiline" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  LEGAL_PROPERTY_DOCUMENT: [
    { key: "documentType", label: "Document type" },
    { key: "title", label: "Title" },
    { key: "ownerEntityId", label: "Owner entity ID (optional)" },
    { key: "issueDate", label: "Issue date (YYYY-MM-DD)" },
    { key: "expirationDate", label: "Expiration date (YYYY-MM-DD, optional)" },
    { key: "attachment", label: "Document attachment", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  OTHER_DOCUMENT: [
    { key: "title", label: "Title" },
    { key: "attachment", label: "Document attachment", type: "document" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
};

export function getFieldsForRecordType(recordType: RecordType): FieldDef[] {
  return FORM_DEFS[recordType] ?? [];
}

export function buildInitialData(recordType: RecordType) {
  const fields = getFieldsForRecordType(recordType);
  const obj: Record<string, unknown> = {};
  for (const field of fields) obj[field.key] = field.type === "document" ? null : "";
  return obj;
}

export function defaultTitleForRecordType(recordType: RecordType, data: any) {
  if (recordType === "PASSPORT") {
    const full = [data?.firstName, data?.lastName].filter(Boolean).join(" ");
    return full ? `Passport — ${full}` : "Passport";
  }
  if (recordType === "DRIVERS_LICENSE") {
    return data?.fullName ? `Driver’s License — ${data.fullName}` : "Driver’s License";
  }
  if (recordType === "SCHOOL_INFO") {
    return data?.schoolName ? `School — ${data.schoolName}` : "School Info";
  }
  if (recordType === "EDUCATION_RECORD") {
    return data?.institutionName ? `Education — ${data.institutionName}` : "Education Record";
  }
  if (recordType === "PET_PROFILE") {
    return data?.kind ? `Pet Profile — ${data.kind}` : "Pet Profile";
  }
  return getRecordMeta(recordType)?.label ?? String(recordType);
}

export function buildDisplayRows(recordType: RecordType, data: Record<string, unknown> | null | undefined) {
  const fields = getFieldsForRecordType(recordType);
  const source = data ?? {};
  const seen = new Set<string>();

  const rows: Array<{ label: string; value: string }> = [];
  for (const field of fields) {
    seen.add(field.key);
    const raw = (source as any)[field.key];
    const value = formatValue(raw, field.type);
    if (!value) continue;
    rows.push({ label: field.label, value });
  }

  for (const [key, value] of Object.entries(source)) {
    if (seen.has(key)) continue;
    const formatted = formatValue(value, "text");
    if (!formatted) continue;
    rows.push({ label: humanizeKey(key), value: formatted });
  }

  return rows;
}

function formatValue(value: unknown, type: FieldType | undefined) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "document" && typeof value === "object") {
    const name = (value as any)?.name;
    const uri = (value as any)?.uri;
    if (name) return String(name);
    if (uri) return String(uri);
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" && isDateLike(value)) return formatMMDDYYYY(value);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${humanizeKey(k)}: ${String(v ?? "")}`)
      .join(", ");
  }
  return String(value);
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatMMDDYYYY(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}
