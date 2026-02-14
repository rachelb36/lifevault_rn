// src/features/pets/domain/pet.schema.ts
export type PetKind =
  | "Dog"
  | "Cat"
  | "Bird"
  | "Reptile"
  | "Fish"
  | "Small Animal"
  | "Other";

export type VaccinationRecord = {
  id: string;
  name: string;
  date: string; // ISO date-only: YYYY-MM-DD (store as string)
  notes?: string;
};

export type ServiceDocumentType =
  | "ESA Letter"
  | "Vaccine Record"
  | "Rabies Certificate"
  | "Microchip Registration"
  | "Insurance"
  | "Other";

export type ServiceDocument = {
  id: string;
  type: ServiceDocumentType;
  expiryDate?: string; // YYYY-MM-DD
  attachment?: {
    uri: string;
    name?: string;
    mimeType?: string;
    size?: number | null;
  } | null;
};

export type MedicationStatus = "active" | "history";

export type Medication = {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  notes?: string;
  status: MedicationStatus;
};

export type ServiceProviderType =
  | "Vet"
  | "Walker"
  | "Groomer"
  | "Trainer"
  | "Boarding"
  | "Sitter"
  | "Other";

export type ServiceProvider = {
  id: string;
  name: string;
  type: ServiceProviderType;
  phone?: string; // formatted: (555) 123-4567
  notes?: string;
};

export type VetContact = {
  name?: string;
  clinicName?: string;
  phone?: string; // formatted
};

export type ChecklistItem = {
  id: string;
  label: string;
  isChecked: boolean;
  isSuggested: boolean;
  category?: string;
};

export type PetProfileV1 = {
  schemaVersion: 1;

  id: string;
  petName: string;

  kind: PetKind;
  kindOtherText?: string;

  // Breed is only meaningful for Dog/Cat, but safe to store for anything.
  breed?: string;
  breedOtherText?: string;

  // ONE canonical date in local storage
  dobOrAdoptionDate?: string; // YYYY-MM-DD

  microchipId?: string;

  vetContact?: VetContact | null;

  vaccinations?: VaccinationRecord[];
  documents?: ServiceDocument[];      // rename from serviceDocuments locally (cleaner)
  medications?: Medication[];
  providers?: ServiceProvider[];

  insuranceProvider?: string;
  policyNumber?: string;
  insuranceNotes?: string;

  emergencyInstructions?: string;

  checklistItems?: ChecklistItem[];

  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};