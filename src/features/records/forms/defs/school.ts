import type { FieldDef } from "../formTypes";
import { COUNTRY_OPTIONS } from "@/shared/constants/options";

export const SCHOOL_DEFS: Partial<Record<string, FieldDef[]>> = {
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

  EDUCATION_RECORD: [
    { key: "title", label: "Title" },
    { key: "schoolName", label: "School name" },
    { key: "gradeOrLevel", label: "Grade or level" },
    { key: "year", label: "Year" },
  ],
};
