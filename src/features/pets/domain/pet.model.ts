export type ChecklistCategory = "general" | "dog_optional" | "cat_optional";

export interface ChecklistItem {
  id: string;
  label: string;
  isChecked: boolean;
  isSuggested: boolean;
  category: ChecklistCategory;
}

export interface VaccinationRecord {
  id: string;
  name: string;
  date: Date | null;
  notes: string;
  documentId?: string;
}

export interface ServiceDocument {
  id: string;
  type: "ESA Letter" | "Service Animal Certification" | "Other";
  documentId?: string;
  expiryDate?: Date | null;
}

export interface ServiceProvider {
  id: string;
  name: string;
  type: "Walker" | "Sitter" | "Daycare" | "Groomer" | "Trainer" | "Boarding" | "Other";
  phone: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date | null;
  endDate?: Date | null;
  notes?: string;
  status: "active" | "history";
}

export type Dateish = Date | string | null | undefined;