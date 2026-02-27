import type { FieldDef } from "../formTypes";
import { COUNTRY_OPTIONS } from "@/shared/constants/options";

export const IDENTIFICATION_DEFS: Partial<Record<string, FieldDef[]>> = {
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
};
