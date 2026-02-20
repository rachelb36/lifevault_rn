export type ProfileType = "PERSON" | "PET";

type ProfileBase = {
  id: string;
  profileType: ProfileType;
  createdAt: string;
  updatedAt: string;
};

export type PersonProfile = ProfileBase & {
  profileType: "PERSON";
  isPrimary?: boolean;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  dob?: string;
  avatarUri?: string;
};

// ── Pet sub-types ──

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

export type PetProfile = ProfileBase & {
  profileType: "PET";
  petName: string;
  kind: string;
  kindOtherText?: string;
  dob?: string;
  adoptionDate?: string;
  breed?: string;
  breedOtherText?: string;
  avatarUri?: string;
  microchipId?: string;

  // Weight
  weightValue?: string;
  weightUnit?: PetWeightUnit;

  // Daily care
  foodBrand?: string;
  foodType?: string;
  portionAmount?: string;
  portionUnit?: string;
  feedingTimes?: string[];
  treatAllowed?: string;
  treatRulesNotes?: string;

  // Bathroom / Walk
  pottyTimesPerDay?: string;
  pottyTimes?: string[];
  leashHarnessNotes?: string;
  avoidTriggers?: string[];
  avoidTriggersNotes?: string;

  // Sleep
  sleepLocation?: string;
  crateRule?: string;
  bedtimeRoutine?: string;

  // Behavior & Safety
  fears?: string[];
  separationAnxietyLevel?: string;
  separationAnxietyNotes?: string;

  // Medications & Vaccinations
  medications?: PetMedication[];
  vaccinations?: PetVaccination[];
};

export type Profile = PersonProfile | PetProfile;
