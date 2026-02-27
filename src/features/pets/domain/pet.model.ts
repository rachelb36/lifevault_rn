// Header-only: identity + avatar. All other pet data lives in records.
export type PetProfile = {
  id: string;
  profileType: "PET";
  petName: string;
  kind: string;
  kindOtherText?: string;
  breed?: string;
  breedOtherText?: string;
  dob?: string;
  dateType?: string;
  adoptionDate?: string;
  gender?: string;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetWeightUnit = "lb" | "kg";

export type PetMedication = {
  id: string;
  name: string;
  dosage?: string;
  adminMethod?: string;
  scheduleNotes?: string;
  missedDoseNotes?: string;
  sideEffectsNotes?: string;
};

export type PetVaccination = {
  id: string;
  name: string;
  date?: string;
  notes?: string;
};
