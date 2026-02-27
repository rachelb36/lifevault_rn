import type { FieldDef } from "../formTypes";
import {
  LEGAL_DOCUMENT_TYPE_OPTIONS,
  OTHER_DOCUMENT_CATEGORY_OPTIONS,
} from "@/features/people/constants/options";

export const LEGAL_DEFS: Partial<Record<string, FieldDef[]>> = {
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
};
